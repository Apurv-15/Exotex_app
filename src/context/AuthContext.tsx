import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import { AuthService } from '../services/AuthService';

interface AuthContextData {
    user: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoadingStorage: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [isLoadingStorage, setIsLoadingStorage] = useState<boolean>(true);

    useEffect(() => {
        loadStorageData();
    }, []);

    async function loadStorageData() {
        try {
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Storage load timeout')), 5000)
            );

            const loadPromise = (async () => {
                const storedUser = await AuthService.getUser();
                const token = await AuthService.getToken();

                if (storedUser && token) {
                    setUser(storedUser);
                }
            })();

            await Promise.race([loadPromise, timeoutPromise]);
        } catch (error) {
            console.log('Failed to load auth data', error);
            // Continue anyway - user can log in
        } finally {
            setIsLoadingStorage(false);
        }
    }

    async function login(email: string, pass: string) {
        setLoading(true);
        try {
            const response = await AuthService.login(email, pass);
            await AuthService.saveAuth(response);
            setUser(response.user);
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    }

    async function logout() {
        await AuthService.logout();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isLoadingStorage }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
