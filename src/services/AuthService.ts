import { supabase } from '../config/supabase';
import { AuthResponse, User } from '../types';
import { Storage } from '../utils/storage';
import { logger } from '../core/logging/Logger';

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
                logger.error('AuthService', 'Supabase Auth Login error', { details: authError });
                
                // FEATURE 1 & 2: Track failure and capture exception
                logger.trackEvent('user_login', { success: false, error: authError?.message });
                logger.captureException(authError || new Error('Auth Login Failed'), { email });

                if (authError?.message?.includes('Aborted')) {
                    throw new Error('Login request aborted. Please check your internet connection or if the Supabase project is active.');
                }
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

            // FEATURE 2: Track successful login
            logger.trackEvent('user_login', { success: true, role: user.role, branchId: user.branchId });

            return {
                token: authData.session?.access_token || '',
                user
            };
        } catch (error: any) {
            logger.error('AuthService', 'Login exception', { details: error });
            throw error;
        }
    },

    logout: async () => {
        // FEATURE 2: Track logout
        logger.trackEvent('user_logout');
        
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
                    // Normalize branch and region for consistency
                    const normalizedBranch = branchId.trim();
                    const normalizedRegion = region?.trim() || null;

                    const { error: profileError } = await supabase
                        .from('users')
                        .insert([{
                            email,
                            name,
                            role,
                            branch_id: normalizedBranch,
                            region: normalizedRegion
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
                branchId: branchId.trim(),
                region: region?.trim()
            };
        } catch (error: any) {
            console.error('AuthService.registerUser error:', error);
            throw error;
        }
    },

    // Check if an email exists in the public users table
    checkEmailExists: async (email: string): Promise<boolean> => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('email')
                .eq('email', email.toLowerCase().trim())
                .maybeSingle();

            if (error) {
                console.error('Check email error:', error);
                return false;
            }
            return !!data;
        } catch (error) {
            console.error('Check email exception:', error);
            return false;
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

            // Trim region if provided
            const trimmedRegion = updates.region?.trim();

            // 2. Update Public Profile Table
            const { error: profileError } = await supabase
                .from('users')
                .update({
                    name: updates.name,
                    region: trimmedRegion
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
    },

    // Admin-only: Update any user profile fields
    adminUpdateProfile: async (email: string, updates: { name?: string, role?: string, branchId?: string, region?: string }): Promise<void> => {
        try {
            const { error: profileError } = await supabase
                .from('users')
                .update({
                    name: updates.name,
                    role: updates.role,
                    branch_id: updates.branchId?.trim(),
                    region: updates.region?.trim()
                })
                .eq('email', email);

            if (profileError) throw profileError;
        } catch (error: any) {
            console.error('AuthService.adminUpdateProfile error:', error);
            throw error;
        }
    },

    // Admin-only: Delete user from public profile table
    // Note: Full auth deletion typically requires service_role or admin API
    deleteUser: async (email: string): Promise<void> => {
        try {
            const { error: profileError } = await supabase
                .from('users')
                .delete()
                .eq('email', email);

            if (profileError) throw profileError;
        } catch (error: any) {
            console.error('AuthService.deleteUser error:', error);
            throw error;
        }
    }
};
