import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Supabase Configuration
// These values come from environment variables (.env file)
// The anon key is safe to expose in client-side code
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase credentials not found. Please check your .env file.');
}

// Custom storage adapter for Supabase to work with expo-secure-store/localStorage
// This is defined inline to avoid circular dependency issues
const supabaseStorage = {
    getItem: async (key: string) => {
        try {
            if (Platform.OS === 'web') {
                return localStorage.getItem(key);
            }
            return await SecureStore.getItemAsync(key);
        } catch (error) {
            console.error('Storage getItem error:', error);
            return null;
        }
    },
    setItem: async (key: string, value: string) => {
        try {
            if (Platform.OS === 'web') {
                localStorage.setItem(key, value);
                return;
            }
            await SecureStore.setItemAsync(key, value);
        } catch (error) {
            console.error('Storage setItem error:', error);
        }
    },
    removeItem: async (key: string) => {
        try {
            if (Platform.OS === 'web') {
                localStorage.removeItem(key);
                return;
            }
            await SecureStore.deleteItemAsync(key);
        } catch (error) {
            console.error('Storage removeItem error:', error);
        }
    },
};

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: supabaseStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Database Types (you can generate these from Supabase CLI)
export interface Database {
    public: {
        Tables: {
            sales: {
                Row: {
                    id: string;
                    customer_name: string;
                    phone: string;
                    email: string | null;
                    address: string;
                    city: string;
                    date: string;
                    water_testing_before: string | null;
                    water_testing_after: string | null;
                    executive_name: string | null;
                    designation: string | null;
                    plumber_name: string | null;
                    product_model: string;
                    serial_number: string;
                    product_details_confirmed: boolean;
                    sale_date: string;
                    branch_id: string;
                    warranty_id: string;
                    status: 'pending' | 'approved' | 'rejected';
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['sales']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['sales']['Insert']>;
            };
            users: {
                Row: {
                    id: string;
                    email: string;
                    name: string;
                    role: 'Admin' | 'User';
                    branch_id: string;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['users']['Insert']>;
            };
        };
    };
}
