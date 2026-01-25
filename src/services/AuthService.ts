import axios from 'axios';
import { API_URL } from '../constants/config';
import { AuthResponse, User } from '../types';
import { Storage } from '../utils/storage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const AuthService = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        try {
            // TODO: Replace with actual API call
            // const response = await axios.post(`${API_URL}/auth/login`, { email, password });
            // return response.data;

            // Mock Response for development
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay

            if (email === 'admin@mainbranch.com' && password === 'admin') {
                return {
                    token: 'mock_admin_token',
                    user: { id: '1', name: 'Main Admin', email, role: 'Admin', branchId: 'main' },
                };
            } else if (email === 'user@subbranch.com' && password === 'user') {
                return {
                    token: 'mock_user_token',
                    user: { id: '2', name: 'Sub User', email, role: 'User', branchId: 'sub1' },
                };
            } else {
                throw new Error('Invalid credentials');
            }
        } catch (error) {
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
