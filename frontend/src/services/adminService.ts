import api from '@/lib/api';
import type { AdminStats, User, Dietitian } from '@/types';

export const getDashboardStats = async (): Promise<AdminStats> => {
    const response = await api.get<AdminStats>('/admin/dashboard');
    return response.data;
};

export const getAllUsers = async (): Promise<User[]> => {
    const response = await api.get<User[]>('/admin/users');
    return response.data;
};

export const toggleUserActive = async (userId: string): Promise<{ is_active: boolean }> => {
    const response = await api.put<{ is_active: boolean }>(`/admin/users/${userId}/toggle-active`);
    return response.data;
};

export interface AdminUserUpdate {
    email?: string;
    full_name?: string;
    password?: string;
}

export const updateUser = async (userId: string, data: AdminUserUpdate): Promise<User> => {
    const response = await api.put<User>(`/admin/users/${userId}`, data);
    return response.data;
};

// ==========================================
// DİYETİSYEN YÖNETİMİ
// ==========================================

export interface DietitianInfo {
    exists: boolean;
    is_active?: boolean;
    dietitian: Dietitian | null;
}

export interface DietitianCreateData {
    email: string;
    password: string;
    full_name: string;
    title?: string;
    specialization?: string;
    experience_years?: number;
    bio?: string;
}

export const getDietitian = async (): Promise<DietitianInfo> => {
    const response = await api.get<DietitianInfo>('/admin/dietitian');
    return response.data;
};

export const createDietitian = async (data: DietitianCreateData): Promise<{ message: string; dietitian: Dietitian }> => {
    const response = await api.post<{ message: string; dietitian: Dietitian }>('/admin/create-dietitian', data);
    return response.data;
};

export const updateDietitian = async (id: string, data: DietitianCreateData): Promise<{ message: string; dietitian: Dietitian }> => {
    const response = await api.put<{ message: string; dietitian: Dietitian }>(`/admin/dietitian/${id}`, data);
    return response.data;
};

export const toggleDietitianActive = async (id: string): Promise<{ message: string; is_active: boolean }> => {
    const response = await api.put<{ message: string; is_active: boolean }>(`/admin/dietitian/${id}/toggle-active`);
    return response.data;
};

export const deleteDietitian = async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/admin/dietitian/${id}`);
    return response.data;
};
