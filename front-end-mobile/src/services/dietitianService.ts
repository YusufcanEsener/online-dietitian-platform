import api from './api';
import type { User } from './authService';

export interface Dietitian {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    title: string | null;
    specialization: string | null;
    experience_years: number;
    rating: number;
    bio: string | null;
    is_active: boolean;
}

export const getDietitians = async (): Promise<Dietitian[]> => {
    const response = await api.get<Dietitian[]>('/dietitians');
    return response.data;
};

export const getDietitian = async (id: string): Promise<Dietitian> => {
    const response = await api.get<Dietitian>(`/dietitians/${id}`);
    return response.data;
};

export const getMyProfile = async (): Promise<Dietitian> => {
    const response = await api.get<Dietitian>('/dietitians/me');
    return response.data;
};

export const updateProfile = async (data: Partial<Dietitian>): Promise<Dietitian> => {
    const response = await api.put<Dietitian>('/dietitians/me', data);
    return response.data;
};
