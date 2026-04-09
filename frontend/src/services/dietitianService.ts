import api from '@/lib/api';
import type { Dietitian } from '@/types';

export const getMyProfile = async (): Promise<Dietitian> => {
    const response = await api.get<Dietitian>('/dietitians/me');
    return response.data;
};

export const updateProfile = async (data: Partial<Dietitian>): Promise<Dietitian> => {
    const response = await api.put<Dietitian>('/dietitians/me', data);
    return response.data;
};
