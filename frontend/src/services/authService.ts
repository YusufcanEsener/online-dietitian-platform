import api from '@/lib/api';
import type { User, AuthToken, Dietitian } from '@/types';

export const login = async (email: string, password: string): Promise<AuthToken> => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    const response = await api.post<AuthToken>('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
};

export const register = async (email: string, password: string, fullName: string): Promise<User> => {
    const response = await api.post<User>('/auth/register', { email, password, full_name: fullName });
    return response.data;
};

export const getMe = async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
};

export const getMeFull = async (): Promise<User | Dietitian> => {
    const response = await api.get('/auth/me/full');
    return response.data;
};

export const logout = (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
};

export const storeToken = (token: string): void => localStorage.setItem('access_token', token);
export const storeUser = (user: User): void => localStorage.setItem('user', JSON.stringify(user));
export const getStoredUser = (): User | null => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
};
export const isAuthenticated = (): boolean => !!localStorage.getItem('access_token');

export interface PasswordChangeRequest {
    current_password: string;
    new_password: string;
}

export interface PasswordChangeResponse {
    message: string;
    password_changed_at: string;
}

export const changePassword = async (data: PasswordChangeRequest): Promise<PasswordChangeResponse> => {
    const response = await api.put<PasswordChangeResponse>('/auth/change-password', data);
    return response.data;
};

