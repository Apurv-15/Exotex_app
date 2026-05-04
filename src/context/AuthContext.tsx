import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback, useMemo } from 'react';
import { User, AuthResponse } from '../types';
import { AuthService } from '../services/AuthService';
import { supabase } from '../config/supabase';
import { logger } from '../core/logging/Logger';

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
        logger.info('AuthContext', 'Initializing AuthProvider...');
        // This flag prevents the initAuth fallback from running if
        // onAuthStateChange already resolved the session (avoids double network call on cold start)
        let authStateChangeFired = false;

        // Listen for auth changes FIRST so we capture the initial session event
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            logger.info('AuthContext', `Auth state change event: ${event}`, { hasSession: !!session });
            authStateChangeFired = true;
            try {
                if (session?.user) {
                    const profile = await AuthService.getUser();
                    setUser(profile);
                } else {
                    setUser(null);
                }
            } catch (err) {
                logger.error('AuthContext', 'Auth state change handler error', { details: err });
                setUser(null);
            } finally {
                setIsLoadingStorage(false);
            }
        });

        // Fallback: if the auth state change listener didn't fire within 2.5s
        // (increased from 1.5s to allow for slower networks), resolve manually.
        const fallbackTimer = setTimeout(async () => {
            if (authStateChangeFired) return; 
            logger.info('AuthContext', 'Fallback auth check triggered');
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const profile = await AuthService.getUser();
                    setUser(profile);
                }
            } catch (err) {
                logger.warn('AuthContext', 'Fallback auth check failed', { details: err });
            } finally {
                setIsLoadingStorage(false);
            }
        }, 2500);

        return () => {
            clearTimeout(fallbackTimer);
            subscription.unsubscribe();
        };
    }, []);

    // FEATURE 1: Sync user identity with Sentry/Logger
    useEffect(() => {
        logger.setUser(user);
    }, [user]);

    // Helper to load profile data manually if needed (already handled by listener)
    async function loadStorageData() {
        setIsLoadingStorage(true);
        const profile = await AuthService.getUser();
        setUser(profile);
        setIsLoadingStorage(false);
    }

    const login = useCallback(async (email: string, pass: string) => {
        logger.info('AuthContext', 'Login attempt started', { email });
        setLoading(true);
        try {
            const response = await AuthService.login(email, pass);
            logger.info('AuthContext', 'AuthService.login succeeded, saving auth...');
            await AuthService.saveAuth(response);
            logger.info('AuthContext', 'Auth saved successfully, updating user state');
            setUser(response.user);
        } catch (error: any) {
            logger.error('AuthContext', 'Login failed', { details: error });
            throw error;
        } finally {
            logger.info('AuthContext', 'Login flow finished, clearing loading state');
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
