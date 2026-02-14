import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useMemo } from 'react';
import { User, AuthResponse } from '../types';
import { AuthService } from '../services/AuthService';
import { supabase } from '../config/supabase';

interface AuthContextData {
    user: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (updates: { name?: string, region?: string }) => Promise<void>;
    updatePassword: (newPassword: string) => Promise<void>;
    refreshProfile: () => Promise<User | null>;
    isLoadingStorage: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [isLoadingStorage, setIsLoadingStorage] = useState<boolean>(true);

    useEffect(() => {
        // Initial session check
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const profile = await AuthService.getUser();
                    if (profile) setUser(profile);
                }
            } catch (err) {
                console.log('Initial auth check failed', err);
            } finally {
                setIsLoadingStorage(false);
            }
        };

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth State Changed:', event);
            if (session?.user) {
                const profile = await AuthService.getUser();
                setUser(profile);
            } else {
                setUser(null);
            }
            setIsLoadingStorage(false);
        });

        initAuth();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Helper to load profile data manually if needed (already handled by listener)
    async function loadStorageData() {
        setIsLoadingStorage(true);
        const profile = await AuthService.getUser();
        setUser(profile);
        setIsLoadingStorage(false);
    }

    const login = useCallback(async (email: string, pass: string) => {
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
    }, []);

    const logout = useCallback(async () => {
        await AuthService.logout();
        setUser(null);
    }, []);

    const updateProfile = useCallback(async (updates: { name?: string, region?: string }) => {
        if (!user) return;
        setLoading(true);
        try {
            await AuthService.updateProfile(user.id, user.email, updates);
            // Refresh user data
            const updatedUser = await AuthService.getUser();
            setUser(updatedUser);
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    }, [user]);

    const updatePassword = useCallback(async (newPassword: string) => {
        setLoading(true);
        try {
            await AuthService.updatePassword(newPassword);
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        const profile = await AuthService.getUser();
        if (profile) setUser(profile);
        return profile;
    }, []);

    const contextValue = useMemo(() => ({
        user,
        loading,
        login,
        logout,
        updateProfile,
        updatePassword,
        refreshProfile,
        isLoadingStorage
    }), [user, loading, login, logout, updateProfile, updatePassword, refreshProfile, isLoadingStorage]);

    return (
        <AuthContext.Provider value={contextValue}>
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
