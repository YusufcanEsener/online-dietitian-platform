import api from './api';

export interface BackendNotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    is_read: boolean;
    sender_name?: string;
    created_at: string;
}

export const getNotifications = async (): Promise<{
    success: boolean;
    unread_count: number;
    notifications: BackendNotification[];
}> => {
    const response = await api.get('/notifications/');
    return response.data;
};

export const markAsRead = async (notificationId: string): Promise<void> => {
    await api.post(`/notifications/${notificationId}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
    await api.post('/notifications/read-all');
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
};

export const clearAllNotifications = async (): Promise<void> => {
    await api.delete('/notifications/');
};
