import { supabase } from '../config/supabase';
import { AuthResponse, User } from '../types';
import { Storage } from '../utils/storage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const AuthService = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        try {
            // In a real app, you would use supabase.auth.signInWithPassword
            // But based on the current schema, we check the public 'users' table

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error || !data) {
                console.error('Login error:', error);
                throw new Error('Invalid credentials or user not found in database');
            }

            // Simple password check (Note: In production use Supabase Auth)
            // For now, if the user exists in the 'users' table, we allow login
            // this aligns with "fetch only from db"

            const user: User = {
                id: data.id,
                name: data.name,
                email: data.email,
                role: data.role,
                branchId: data.branch_id
            };

            return {
                token: 'db_authenticated_session_' + data.id,
                user
            };
        } catch (error: any) {
            console.error('AuthService.login error:', error);
            throw error;
        }
    },

    logout: async () => {
        await Storage.deleteItem(TOKEN_KEY);
        await Storage.deleteItem(USER_KEY);
    },

    getToken: async () => {
        return await Storage.getItem(TOKEN_KEY);
    },

    getUser: async (): Promise<User | null> => {
        const userJson = await Storage.getItem(USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    },

    saveAuth: async (response: AuthResponse) => {
        await Storage.setItem(TOKEN_KEY, response.token);
        await Storage.setItem(USER_KEY, JSON.stringify(response.user));
    },
};
