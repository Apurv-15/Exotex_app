import { supabase } from '../config/supabase';
import { AuthResponse, User } from '../types';
import { Storage } from '../utils/storage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const AuthService = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        try {
            // Updated to use built-in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError || !authData.user) {
                console.error('Supabase Auth Login error:', authError);
                throw authError || new Error('No user data returned');
            }

            // Fetch user profile from public 'users' table using email for linking
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            // Construct user object
            // Use profile data if available, otherwise fall back to metadata or basic info
            const user: User = {
                id: authData.user.id,
                name: profile?.name || authData.user.user_metadata?.name || email.split('@')[0],
                email: email,
                role: profile?.role || (authData.user.user_metadata?.role as any) || 'User',
                branchId: profile?.branch_id || authData.user.user_metadata?.branch_id || 'default'
            };

            return {
                token: authData.session?.access_token || '',
                user
            };
        } catch (error: any) {
            console.error('AuthService.login error:', error);
            throw error;
        }
    },

    logout: async () => {
        await supabase.auth.signOut();
        await Storage.deleteItem(TOKEN_KEY);
        await Storage.deleteItem(USER_KEY);
    },

    getToken: async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || await Storage.getItem(TOKEN_KEY);
    },

    getUser: async (): Promise<User | null> => {
        // Try getting from active session first
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
            // Start with basic session info
            let user: User = {
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
                email: session.user.email || '',
                role: (session.user.user_metadata?.role as any) || 'User',
                branchId: session.user.user_metadata?.branch_id || 'default',
                region: session.user.user_metadata?.region || undefined
            };

            // Try to enrich with profile data if possible
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('email', session.user.email)
                .single();

            if (profile) {
                user = {
                    ...user,
                    name: profile.name,
                    role: profile.role,
                    branchId: profile.branch_id,
                    region: profile.region || undefined
                };
            }
            return user;
        }

        // Fallback to minimal storage check
        const userJson = await Storage.getItem(USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    },

    saveAuth: async (response: AuthResponse) => {
        await Storage.setItem(TOKEN_KEY, response.token);
        await Storage.setItem(USER_KEY, JSON.stringify(response.user));
    },

    registerUser: async (email: string, pass: string, name: string, role: string, branchId: string, region?: string): Promise<User> => {
        try {
            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password: pass,
                options: {
                    data: {
                        name,
                        role,
                        branch_id: branchId,
                        region: region || null
                    }
                }
            });

            if (authError || !authData.user) {
                console.error('Registration Auth error:', authError);
                throw authError || new Error('Registration failed');
            }

            // 2. Create Public Profile with retry logic
            // We store profile info in the public table for easy relational queries
            const maxRetries = 3;
            let profileCreated = false;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const { error: profileError } = await supabase
                        .from('users')
                        .insert([{
                            email,
                            name,
                            role,
                            branch_id: branchId,
                            region: region || null
                        }]);

                    if (!profileError) {
                        profileCreated = true;
                        console.log(`✅ Profile created successfully for ${email} with region: ${region}`);
                        break;
                    }

                    if (attempt < maxRetries) {
                        console.warn(`Profile creation attempt ${attempt} failed, retrying...`, profileError);
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
                    } else {
                        console.warn('Profile creation failed after retries:', profileError);
                    }
                } catch (retryError) {
                    console.warn(`Retry ${attempt} error:`, retryError);
                }
            }

            if (!profileCreated) {
                console.warn('⚠️ User created in Auth but profile sync may be delayed. Region can be updated later.');
            }

            return {
                id: authData.user.id,
                name,
                email,
                role: role as any,
                branchId,
                region
            };
        } catch (error: any) {
            console.error('AuthService.registerUser error:', error);
            throw error;
        }
    },

    updateProfile: async (userId: string, email: string, updates: { name?: string, region?: string }): Promise<void> => {
        try {
            // 1. Update Auth Metadata
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    name: updates.name,
                    region: updates.region
                }
            });

            if (authError) throw authError;

            // 2. Update Public Profile Table
            const { error: profileError } = await supabase
                .from('users')
                .update({
                    name: updates.name,
                    region: updates.region
                })
                .eq('email', email);

            if (profileError) throw profileError;

        } catch (error: any) {
            console.error('AuthService.updateProfile error:', error);
            throw error;
        }
    },

    updatePassword: async (newPassword: string): Promise<void> => {
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;
        } catch (error: any) {
            console.error('AuthService.updatePassword error:', error);
            throw error;
        }
    }
};
