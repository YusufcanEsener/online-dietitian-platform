import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as authService from '../services/authService';
import { storeToken, storeUser, getToken, getUser, clearAll } from '../utils/storage';
import { setUnauthorizedHandler } from '../services/api';

export type User = authService.User;

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string) => Promise<void>;
    registerDietitian: (data: {
        email: string;
        password: string;
        full_name: string;
        title?: string;
        specialization?: string;
        experience_years?: number;
        bio?: string;
    }) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 401 auto-logout handler
    useEffect(() => {
        setUnauthorizedHandler(() => {
            setUser(null);
        });
    }, []);

    // Uygulama açıldığında AsyncStorage'dan kullanıcıyı geri yükle
    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = await getToken();
                if (token) {
                    const userData = await authService.getMeFull();
                    setUser(userData);
                    await storeUser(userData);
                }
            } catch {
                await clearAll();
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const tokenData = await authService.login(email, password);
        await storeToken(tokenData.access_token);
        const userData = await authService.getMeFull();
        setUser(userData);
        await storeUser(userData);
    };

    const register = async (email: string, password: string, fullName: string) => {
        await authService.register(email, password, fullName);
    };

    const registerDietitian = async (data: {
        email: string;
        password: string;
        full_name: string;
        title?: string;
        specialization?: string;
        experience_years?: number;
        bio?: string;
    }) => {
        await authService.registerDietitian(data);
    };

    const logout = async () => {
        await clearAll();
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const userData = await authService.getMeFull();
            setUser(userData);
            await storeUser(userData);
        } catch {
            await logout();
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                registerDietitian,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
