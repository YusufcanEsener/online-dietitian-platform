import api from '@/lib/api';

export interface BackendNotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    is_read: boolean;
    sender_name?: string;
    created_at: string;
}

export interface NotificationsResponse {
    success: boolean;
    unread_count: number;
    notifications: BackendNotification[];
}

/** Giriş yapan kullanıcının bildirimlerini getir */
export const getNotifications = async (): Promise<NotificationsResponse> => {
    const response = await api.get<NotificationsResponse>('/notifications/');
    return response.data;
};

/** Belirli bir bildirimi okundu yap */
export const markAsRead = async (notificationId: string): Promise<void> => {
    await api.post(`/notifications/${notificationId}/read`);
};

/** Tümünü okundu yap */
export const markAllAsRead = async (): Promise<void> => {
    await api.post('/notifications/read-all');
};

/** Belirli bir bildirimi sil */
export const deleteNotification = async (notificationId: string): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
};

/** Tüm bildirimleri sil */
export const clearAllNotifications = async (): Promise<void> => {
    await api.delete('/notifications/');
};
