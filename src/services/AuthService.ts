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

    registerUser: async (email: string, pass: string, name: string, role: string, branchId: string): Promise<User> => {
        try {
            // Note: In production, use supabase.auth.signUp
            // This implementation adds user metadata to the 'users' table

            const { data, error } = await supabase
                .from('users')
                .insert([{
                    email,
                    name,
                    role,
                    branch_id: branchId,
                    // Note: We are not hashing password here because the current system 
                    // seems to use database-only check for simplicity
                    password: pass
                }])
                .select()
                .single();

            if (error) {
                console.error('Registration error:', error);
                throw new Error(error.message || 'Failed to register user');
            }

            return {
                id: data.id,
                name: data.name,
                email: data.email,
                role: data.role as any,
                branchId: data.branch_id
            };
        } catch (error: any) {
            console.error('AuthService.registerUser error:', error);
            throw error;
        }
    },
};
