import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
            if (SECURE_KEYS.includes(key)) {
                return sessionStorage.getItem(key);
            }
            return localStorage.getItem(key);
        }

        // 1. If it's a forced secure key, check for sharded or single SecureStore value
        if (SECURE_KEYS.includes(key)) {
            const meta = await SecureStore.getItemAsync(`_secure_meta_${key}`);
            if (meta) {
                const count = parseInt(meta, 10);
                const parts = [];
                for (let i = 0; i < count; i++) {
                    const part = await SecureStore.getItemAsync(`_secure_part_${key}_${i}`);
                    if (part) parts.push(part);
                }
                return parts.join('');
            }
            return await SecureStore.getItemAsync(key);
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
            if (SECURE_KEYS.includes(key)) {
                sessionStorage.setItem(key, value);
            } else {
                localStorage.setItem(key, value);
            }
            return;
        }

        // 1. If it's a secure key, require SecureStore sharded as needed
        if (SECURE_KEYS.includes(key)) {
            // Clear any old metadata/parts first
            const oldMeta = await SecureStore.getItemAsync(`_secure_meta_${key}`);
            if (oldMeta) {
                const count = parseInt(oldMeta, 10);
                for (let i = 0; i < count; i++) {
                    await SecureStore.deleteItemAsync(`_secure_part_${key}_${i}`).catch(() => { });
                }
                await SecureStore.deleteItemAsync(`_secure_meta_${key}`).catch(() => { });
            }

            if (value.length <= 2000) {
                await SecureStore.setItemAsync(key, value);
            } else {
                // Sharding for values > 2KB
                const partsCount = Math.ceil(value.length / 2000);
                for (let i = 0; i < partsCount; i++) {
                    const part = value.substring(i * 2000, (i + 1) * 2000);
                    await SecureStore.setItemAsync(`_secure_part_${key}_${i}`, part);
                }
                await SecureStore.setItemAsync(`_secure_meta_${key}`, partsCount.toString());
                // Clear the main key to avoid confusion
                await SecureStore.deleteItemAsync(key).catch(() => { });
            }

            // Clean up fallbacks if they exist
            const fileUri = getFileUri(key);
            if (fileUri) await FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => { });
            await AsyncStorage.removeItem(key).catch(() => { });
            return;
        }

        // 2. For normal keys, use FileSystem (more reliable for > 2KB)
        try {
            const fileUri = getFileUri(key);
            if (!fileUri) {
                await AsyncStorage.setItem(key, value);
                return;
            }
            await FileSystem.writeAsStringAsync(fileUri, value);
        } catch (e) {
            console.error(`Storage: Failed to write ${key} to FS`, e);
            // Last resort fallback
            await AsyncStorage.setItem(key, value).catch(() => { });
        }
    },

    deleteItem: async (key: string): Promise<void> => {
        if (Platform.OS === 'web') {
            if (SECURE_KEYS.includes(key)) {
                sessionStorage.removeItem(key);
            } else {
                localStorage.removeItem(key);
            }
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
