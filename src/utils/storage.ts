import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';

// Keys that MUST be stored securely
const SECURE_KEYS = ['auth_token', 'supabase.auth.token', 'supabase-auth-token'];

// Helper to get safe filename
const getFileUri = (key: string) => {
    const safeKey = key.replace(/[^a-z0-9]/gi, '_');
    const directory = (FileSystem as any).documentDirectory;
    if (!directory) return null;
    return `${directory}storage_${safeKey}.json`;
};

// Cross-platform storage that works on both native and web
export const Storage = {
    getItem: async (key: string): Promise<string | null> => {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        }

        // 1. If it's a forced secure key, only check SecureStore
        if (SECURE_KEYS.includes(key)) {
            return await SecureStore.getItemAsync(key);
        }

        // 2. For other keys, try FileSystem first (new preferred location)
        try {
            const fileUri = getFileUri(key);
            if (!fileUri) return null;

            const info = await FileSystem.getInfoAsync(fileUri);
            if (info.exists) {
                return await FileSystem.readAsStringAsync(fileUri);
            }
        } catch (e) {
            console.warn(`Storage: Request to read ${key} from FS failed`, e);
        }

        // 3. Fallback: Check AsyncStorage first (safer for large data) then SecureStore
        try {
            const asyncValue = await AsyncStorage.getItem(key);
            if (asyncValue) return asyncValue;
            
            const secureValue = await SecureStore.getItemAsync(key);
            if (secureValue) return secureValue;
        } catch (e) {}

        return null;
    },

    setItem: async (key: string, value: string): Promise<void> => {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
            return;
        }

        // 1. If it's a secure key, use SecureStore
        if (SECURE_KEYS.includes(key)) {
            await SecureStore.setItemAsync(key, value);
            return;
        }

        // 2. For other keys, use FileSystem
        try {
            const fileUri = getFileUri(key);
            if (!fileUri) {
                // Fallback to AsyncStorage if FS is not available
                await AsyncStorage.setItem(key, value);
                return;
            }
            await FileSystem.writeAsStringAsync(fileUri, value);
        } catch (e) {
            console.error(`Storage: Failed to write ${key} to FS`, e);
            // Fallback to AsyncStorage (handles > 2KB reliably)
            await AsyncStorage.setItem(key, value).catch(() => { });
        }
    },

    deleteItem: async (key: string): Promise<void> => {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
            return;
        }

        if (SECURE_KEYS.includes(key)) {
            await SecureStore.deleteItemAsync(key).catch(() => { });
            return;
        }

        // Try deleting from both locations to be thorough
        try {
            const fileUri = getFileUri(key);
            if (fileUri) {
                await FileSystem.deleteAsync(fileUri, { idempotent: true });
            }
        } catch (e) { }

        // Cleanup both AsyncStorage and SecureStore
        await AsyncStorage.removeItem(key).catch(() => { });
        await SecureStore.deleteItemAsync(key).catch(() => { });
    },
};
