import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

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

        // 1. If it's a forced secure key, check SecureStore then fallbacks
        if (SECURE_KEYS.includes(key)) {
            const secureValue = await SecureStore.getItemAsync(key);
            if (secureValue) return secureValue;
            // Fallback: Check if it was stored in FileSystem or AsyncStorage because it was too large
        }

        // 2. Try FileSystem (preferred for large data or fallbacks)
        try {
            const fileUri = getFileUri(key);
            if (fileUri) {
                const info = await FileSystem.getInfoAsync(fileUri);
                if (info.exists) {
                    return await FileSystem.readAsStringAsync(fileUri);
                }
            }
        } catch (e) {
            console.warn(`Storage: Request to read ${key} from FS failed`, e);
        }

        // 3. Last Fallback: Check AsyncStorage
        try {
            return await AsyncStorage.getItem(key);
        } catch (e) { }

        return null;
    },

    setItem: async (key: string, value: string): Promise<void> => {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
            return;
        }

        // 1. If it's a secure key AND small enough, use SecureStore
        if (SECURE_KEYS.includes(key) && value.length <= 2048) {
            await SecureStore.setItemAsync(key, value);
            // Clean up fallbacks if they exist
            const fileUri = getFileUri(key);
            if (fileUri) await FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => { });
            await AsyncStorage.removeItem(key).catch(() => { });
            return;
        }

        // 2. For large secure keys or normal keys, use FileSystem (more reliable for > 2KB)
        try {
            const fileUri = getFileUri(key);
            if (!fileUri) {
                await AsyncStorage.setItem(key, value);
                return;
            }
            await FileSystem.writeAsStringAsync(fileUri, value);
            
            // If it was a secure key, it was too large for SecureStore, so remove any old small version
            if (SECURE_KEYS.includes(key)) {
                await SecureStore.deleteItemAsync(key).catch(() => { });
            }
        } catch (e) {
            console.error(`Storage: Failed to write ${key} to FS`, e);
            // Last resort fallback
            await AsyncStorage.setItem(key, value).catch(() => { });
        }
    },

    deleteItem: async (key: string): Promise<void> => {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
            return;
        }

        // Try deleting from ALL locations to be thorough
        // 1. SecureStore
        await SecureStore.deleteItemAsync(key).catch(() => { });

        // 2. FileSystem
        try {
            const fileUri = getFileUri(key);
            if (fileUri) {
                await FileSystem.deleteAsync(fileUri, { idempotent: true });
            }
        } catch (e) { }

        // 3. AsyncStorage
        await AsyncStorage.removeItem(key).catch(() => { });
    },
};
