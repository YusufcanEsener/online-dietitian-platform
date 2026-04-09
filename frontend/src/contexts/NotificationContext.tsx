import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as notificationService from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    isRead: boolean;
    createdAt: Date;
    senderName?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    refresh: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    removeNotification: (id: string) => Promise<void>;
    clearAll: () => Promise<void>;
    // Geriye dönük uyumluluk: diyetisyen tarafı için localStorage fallback
    addNotification: (n: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// localStorage key - sadece diyetisyen tarafı bildirimler için
const STORAGE_KEY = 'dietplatform_notifications_local';

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth();

    // API'den gelen bildirimler (üyeler için gerçek bildirimler)
    const [apiNotifications, setApiNotifications] = useState<Notification[]>([]);
    // localStorage bildirimleri (diyetisyen için anlık bildirimler)
    const [localNotifications, setLocalNotifications] = useState<Notification[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.map((n: any) => ({ ...n, createdAt: new Date(n.createdAt) }));
            }
        } catch { /* ignore */ }
        return [];
    });
    const [isLoading, setIsLoading] = useState(false);

    // localStorage senkronizasyonu
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localNotifications));
    }, [localNotifications]);

    // API'den bildirimleri çek (sadece üyeler için)
    const refresh = useCallback(async () => {
        if (!isAuthenticated || !user || user.role !== 'member') return;
        setIsLoading(true);
        try {
            const resp = await notificationService.getNotifications();
            if (resp.success) {
                setApiNotifications(
                    resp.notifications.map(n => ({
                        id: n.id,
                        title: n.title,
                        message: n.message,
                        type: n.type,
                        isRead: n.is_read,
                        createdAt: new Date(n.created_at),
                        senderName: n.sender_name,
                    }))
                );
            }
        } catch {
            // Sessizce geç (ağ hatası)
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, user]);

    // Üye giriş yapınca ve her 60 saniyede bir yenile
    useEffect(() => {
        if (isAuthenticated && user?.role === 'member') {
            refresh();
            const interval = setInterval(refresh, 60_000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, user, refresh]);

    // Birleşik bildirim listesi: üye ise API, diğerleri localStorage
    const notifications: Notification[] = user?.role === 'member'
        ? apiNotifications
        : localNotifications;

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // --- API fonksiyonları (üye) ---
    const markAsRead = async (id: string) => {
        if (user?.role === 'member') {
            await notificationService.markAsRead(id);
            setApiNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } else {
            setLocalNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        }
    };

    const markAllAsRead = async () => {
        if (user?.role === 'member') {
            await notificationService.markAllAsRead();
            setApiNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } else {
            setLocalNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        }
    };

    const removeNotification = async (id: string) => {
        if (user?.role === 'member') {
            await notificationService.deleteNotification(id);
            setApiNotifications(prev => prev.filter(n => n.id !== id));
        } else {
            setLocalNotifications(prev => prev.filter(n => n.id !== id));
        }
    };

    const clearAll = async () => {
        if (user?.role === 'member') {
            await notificationService.clearAllNotifications();
            setApiNotifications([]);
        } else {
            setLocalNotifications([]);
        }
    };

    // Diyetisyen tarafı anlık bildirim ekleme (localStorage)
    const addNotification = (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
        const newNotification: Notification = {
            ...notification,
            id: Date.now().toString(),
            isRead: false,
            createdAt: new Date(),
        };
        setLocalNotifications(prev => [newNotification, ...prev.slice(0, 49)]);
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            isLoading,
            refresh,
            markAsRead,
            markAllAsRead,
            removeNotification,
            clearAll,
            addNotification,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
}
