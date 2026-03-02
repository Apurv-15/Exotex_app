import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
// @ts-ignore
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

        // 3. Fallback: Check SecureStore (migration path for existing data)
        // This ensures we don't lose data that was previously stored in SecureStore
        try {
            const secureValue = await SecureStore.getItemAsync(key);
            if (secureValue) {
                // Optional: We could migrate it now, but lazy migration on next save is safer
                return secureValue;
            }
        } catch (e) {
            // Ignore SecureStore errors (e.g. value too large during read? unlikely but possible)
        }

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
                // Fallback to SecureStore if FS is not available
                await SecureStore.setItemAsync(key, value);
                return;
            }
            await FileSystem.writeAsStringAsync(fileUri, value);
        } catch (e) {
            console.error(`Storage: Failed to write ${key} to FS`, e);
            // Fallback
            await SecureStore.setItemAsync(key, value).catch(() => { });
        }
    },

    deleteItem: async (key: string): Promise<void> => {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
            return;
        }

        if (SECURE_KEYS.includes(key)) {
            await SecureStore.deleteItemAsync(key);
            return;
        }

        // Try deleting from both locations to be thorough
        try {
            const fileUri = getFileUri(key);
            if (fileUri) {
                await FileSystem.deleteAsync(fileUri, { idempotent: true });
            }
        } catch (e) {
            // Check SecureStore fallback
            await SecureStore.deleteItemAsync(key).catch(() => { });
        }

        // Also cleanup SecureStore in case it was there
        await SecureStore.deleteItemAsync(key).catch(() => { });
    },
};
