import { supabase } from '../config/supabase';
import { AuthResponse, User } from '../types';
import { Storage } from '../utils/storage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const AuthService = {
    // Login with Supabase
    login: async (email: string, password: string): Promise<AuthResponse> => {
        try {
            // For development: Keep mock login for demo accounts
            if (email === 'admin@mainbranch.com' && password === 'admin') {
                const mockResponse: AuthResponse = {
                    token: 'mock_admin_token',
                    user: { id: '1', name: 'Main Admin', email, role: 'Admin', branchId: 'main' },
                };
                await AuthService.saveAuth(mockResponse);
                return mockResponse;
            } else if (email === 'user@subbranch.com' && password === 'user') {
                const mockResponse: AuthResponse = {
                    token: 'mock_user_token',
                    user: { id: '2', name: 'Sub User', email, role: 'User', branchId: 'sub1' },
                };
                await AuthService.saveAuth(mockResponse);
                return mockResponse;
            }

            // Real Supabase authentication
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            if (!data.user) throw new Error('No user data returned');

            // Fetch user profile from users table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (userError) throw userError;

            const user: User = {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                role: userData.role as 'Admin' | 'User',
                branchId: userData.branch_id,
            };

            const response: AuthResponse = {
                token: data.session?.access_token || '',
                user,
            };

            await AuthService.saveAuth(response);
            return response;
        } catch (error: any) {
            console.error('Login error:', error);
            throw new Error(error.message || 'Login failed');
        }
    },

    // Logout
    logout: async () => {
        await supabase.auth.signOut();
        await Storage.deleteItem(TOKEN_KEY);
        await Storage.deleteItem(USER_KEY);
    },

    // Get stored token
    getToken: async () => {
        return await Storage.getItem(TOKEN_KEY);
    },

    // Get stored user
    getUser: async (): Promise<User | null> => {
        const userJson = await Storage.getItem(USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    },

    // Save auth data
    saveAuth: async (response: AuthResponse) => {
        await Storage.setItem(TOKEN_KEY, response.token);
        await Storage.setItem(USER_KEY, JSON.stringify(response.user));
    },

    // Check if user is authenticated
    isAuthenticated: async (): Promise<boolean> => {
        const { data } = await supabase.auth.getSession();
        return !!data.session;
    },

    // Get current session
    getSession: async () => {
        const { data } = await supabase.auth.getSession();
        return data.session;
    },
};
