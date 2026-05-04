import { supabase } from '../config/supabase';
import { AuthResponse, User } from '../types';
import { Storage } from '../utils/storage';
import { logger } from '../core/logging/Logger';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const SUPABASE_TOKEN_KEY = 'supabase.auth.token';

// Helper to wrap promises with a timeout
const withTimeout = <T>(promise: PromiseLike<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
    return Promise.race([
        Promise.resolve(promise),
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
        )
    ]);
};

export const AuthService = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        try {
            logger.info('AuthService', 'Initiating login...', { email });

            // 1. Authenticate with Supabase Auth (15s timeout)
            const { data: authData, error: authError } = await withTimeout<any>(
                supabase.auth.signInWithPassword({
                    email,
                    password,
                }),
                15000,
                'Login request timed out. Please check your internet connection.'
            );

            if (authError || !authData.user) {
                logger.error('AuthService', 'Supabase Auth Login error', { details: authError });
                
                logger.trackEvent('user_login', { success: false, error: authError?.message });
                logger.captureException(authError || new Error('Auth Login Failed'), { email });

                if (authError?.message?.includes('Aborted') || authError?.message?.includes('failed to fetch')) {
                    throw new Error('Network error. Please check your internet connection and try again.');
                }
                throw authError || new Error('Invalid credentials or no user data returned');
            }

            // 2. Fetch user profile from public 'users' table (10s timeout)
            // We make this resilient - if profile fetch fails, we still allow login with metadata
            let profile = null;
            try {
                const { data: profileData, error: profileError } = await withTimeout<any>(
                    supabase
                        .from('users')
                        .select('*')
                        .eq('email', email)
                        .single(),
                    10000,
                    'Profile fetch timed out'
                );

                if (profileError) {
                    logger.warn('AuthService', 'Profile fetch error (non-fatal)', { details: profileError });
                } else {
                    profile = profileData;
                }
            } catch (pError) {
                logger.warn('AuthService', 'Profile fetch failed or timed out (non-fatal)', { details: pError });
            }

            // 3. Construct user object with fallbacks
            const user: User = {
                id: authData.user.id,
                name: profile?.name || authData.user.user_metadata?.name || email.split('@')[0],
                email: email,
                role: profile?.role || (authData.user.user_metadata?.role as any) || 'User',
                branchId: profile?.branch_id || authData.user.user_metadata?.branch_id || 'default'
            };

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
        logger.trackEvent('user_logout');
        try {
            await supabase.auth.signOut();
            // Thorough storage purge
            await Promise.all([
                Storage.deleteItem(TOKEN_KEY),
                Storage.deleteItem(USER_KEY),
                Storage.deleteItem(SUPABASE_TOKEN_KEY),
                Storage.deleteItem('supabase-auth-token') // Legacy key just in case
            ]);
            logger.info('AuthService', 'User logged out and storage cleared');
        } catch (error) {
            logger.error('AuthService', 'Logout error', { details: error });
            // Even if sign out fails, clear local storage
            await Storage.deleteItem(TOKEN_KEY);
            await Storage.deleteItem(USER_KEY);
            await Storage.deleteItem(SUPABASE_TOKEN_KEY);
        }
    },

    getToken: async () => {
        try {
            const { data } = await supabase.auth.getSession();
            return data.session?.access_token || await Storage.getItem(TOKEN_KEY);
        } catch (e) {
            return await Storage.getItem(TOKEN_KEY);
        }
    },

    getUser: async (): Promise<User | null> => {
        try {
            // Try getting from active session first
            const { data: { session } = { session: null } as any, error: sessionError } = await withTimeout<any>(
                supabase.auth.getSession(),
                8000,
                'Session check timed out'
            );

            if (sessionError) {
                logger.warn('AuthService', 'Get session error', { details: sessionError });
            }

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

                // Try to enrich with profile data if possible (5s timeout)
                try {
                    const { data: profile } = await withTimeout<any>(
                        supabase
                            .from('users')
                            .select('*')
                            .eq('email', session.user.email)
                            .single(),
                        5000,
                        'Enrichment timed out'
                    );

                    if (profile) {
                        user = {
                            ...user,
                            name: profile.name,
                            role: profile.role,
                            branchId: profile.branch_id,
                            region: profile.region || undefined
                        };
                    }
                } catch (e) {
                    logger.warn('AuthService', 'Profile enrichment failed or timed out', { details: e });
                }
                return user;
            }

            // Fallback to minimal storage check
            const userJson = await Storage.getItem(USER_KEY);
            if (userJson) {
                try {
                    return JSON.parse(userJson);
                } catch (e) {
                    logger.error('AuthService', 'Failed to parse user from storage', { details: e });
                    return null;
                }
            }
            return null;
        } catch (error) {
            logger.error('AuthService', 'getUser exception', { details: error });
            // Final fallback to storage
            const userJson = await Storage.getItem(USER_KEY);
            return userJson ? JSON.parse(userJson) : null;
        }
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
                logger.error('AuthService', 'Registration Auth error', { details: authError });
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
                        logger.success('AuthService', `Profile created successfully for ${email} with region: ${region}`);
                        break;
                    }

                    if (attempt < maxRetries) {
                        logger.warn('AuthService', `Profile creation attempt ${attempt} failed, retrying...`, { details: profileError });
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
                    } else {
                        logger.warn('AuthService', 'Profile creation failed after retries', { details: profileError });
                    }
                } catch (retryError) {
                    logger.warn('AuthService', `Retry ${attempt} error`, { details: retryError });
                }
            }

            if (!profileCreated) {
                logger.warn('AuthService', 'User created in Auth but profile sync may be delayed. Region can be updated later.');
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
            logger.error('AuthService', 'registerUser error', { details: error });
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
                logger.error('AuthService', 'Check email error', { details: error });
                return false;
            }
            return !!data;
        } catch (error) {
            logger.error('AuthService', 'Check email exception', { details: error });
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
            logger.error('AuthService', 'updateProfile error', { details: error });
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
            logger.error('AuthService', 'updatePassword error', { details: error });
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
            logger.error('AuthService', 'adminUpdateProfile error', { details: error });
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
            logger.error('AuthService', 'deleteUser error', { details: error });
            throw error;
        }
    }
};
