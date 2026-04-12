import api from './api';

export interface AdminStats {
    total_users: number;
    total_members: number;
    total_dietitians: number;
    active_subscriptions: number;
    total_chats: number;
    total_messages: number;
    total_plans: number;
}

export interface AdminUser {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    is_active: boolean;
}

export interface PendingDietitian {
    id: string;
    email: string;
    full_name: string | null;
    title: string | null;
    specialization: string | null;
}

export const getDashboardStats = async (): Promise<AdminStats> => {
    const response = await api.get<AdminStats>('/admin/dashboard');
    return response.data;
};

export const getAllUsers = async (): Promise<AdminUser[]> => {
    const response = await api.get<AdminUser[]>('/admin/users');
    return response.data;
};

export const getPendingDietitians = async (): Promise<PendingDietitian[]> => {
    const response = await api.get<PendingDietitian[]>('/admin/dietitians/pending');
    return response.data;
};

export const approveDietitian = async (dietitianId: string): Promise<void> => {
    await api.post(`/admin/dietitians/${dietitianId}/approve`);
};

export const rejectDietitian = async (dietitianId: string): Promise<void> => {
    await api.post(`/admin/dietitians/${dietitianId}/reject`);
};

export const toggleUserActive = async (userId: string): Promise<{ is_active: boolean }> => {
    const response = await api.put<{ is_active: boolean }>(`/admin/users/${userId}/toggle-active`);
    return response.data;
};

export const updateUser = async (
    userId: string,
    data: { email?: string; full_name?: string; password?: string }
): Promise<AdminUser> => {
    const response = await api.put<AdminUser>(`/admin/users/${userId}`, data);
    return response.data;
};
