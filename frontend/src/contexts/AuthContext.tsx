import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Dietitian } from '@/types';
import * as authService from '@/services/authService';

interface AuthContextType {
    user: User | Dietitian | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string) => Promise<void>;

    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | Dietitian | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            if (authService.isAuthenticated()) {
                try {
                    const userData = await authService.getMeFull();
                    setUser(userData);
                    authService.storeUser(userData);
                } catch {
                    authService.logout();
                    setUser(null);
                }
            }
            setIsLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const tokenData = await authService.login(email, password);
        authService.storeToken(tokenData.access_token);
        const userData = await authService.getMeFull();
        setUser(userData);
        authService.storeUser(userData);
    };

    const register = async (email: string, password: string, fullName: string) => {
        await authService.register(email, password, fullName);
    };



    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const userData = await authService.getMeFull();
            setUser(userData);
            authService.storeUser(userData);
        } catch { logout(); }
    };

    return <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, refreshUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
