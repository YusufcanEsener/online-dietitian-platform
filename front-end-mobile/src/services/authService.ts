import api from './api';
import { storeToken, storeUser, clearAll } from '../utils/storage';

export interface AuthToken {
    access_token: string;
    token_type: string;
}

export interface User {
    id: string;
    email: string;
    full_name: string | null;
    role: 'admin' | 'dietitian' | 'member';
    is_active: boolean;
    // Member fields
    selected_dietitian_id?: string | null;
    subscription_status?: boolean;
    height?: number | null;
    weight?: number | null;
    target_weight?: number | null;
    birth_date?: string | null;
    gender?: 'male' | 'female' | 'other' | null;
    activity_level?: string | null;
    phone?: string | null;
    city?: string | null;
    // Dietitian fields
    title?: string | null;
    specialization?: string | null;
    experience_years?: number;
    rating?: number;
    bio?: string | null;
}

export const login = async (email: string, password: string): Promise<AuthToken> => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    const response = await api.post<AuthToken>('/auth/login', formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
};

export const register = async (email: string, password: string, fullName: string): Promise<User> => {
    const response = await api.post<User>('/auth/register', {
        email,
        password,
        full_name: fullName,
    });
    return response.data;
};

export const registerDietitian = async (data: {
    email: string;
    password: string;
    full_name: string;
    title?: string;
    specialization?: string;
    experience_years?: number;
    bio?: string;
}): Promise<User> => {
    const response = await api.post<User>('/auth/register-dietitian', data);
    return response.data;
};

export const getMe = async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
};

export const getMeFull = async (): Promise<User> => {
    const response = await api.get<User>('/auth/me/full');
    return response.data;
};

export const changePassword = async (data: {
    current_password: string;
    new_password: string;
}): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>('/auth/change-password', data);
    return response.data;
};

export const logout = async (): Promise<void> => {
    await clearAll();
};
