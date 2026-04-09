import { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2, CheckCheck, X, Info, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { useNotifications, Notification } from "@/contexts/NotificationContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'success':
            return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'warning':
            return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
        case 'error':
            return <AlertCircle className="w-4 h-4 text-red-500" />;
        default:
            return <Info className="w-4 h-4 text-blue-500" />;
    }
};

const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Şimdi';
    if (minutes < 60) return `${minutes} dk önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    return date.toLocaleDateString('tr-TR');
};

const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Dışarı tıklayınca kapat
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-surface transition-colors"
            >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-hidden bg-background border border-border rounded-xl shadow-lg z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <h3 className="font-semibold text-foreground">Bildirimler</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                    title="Tümünü okundu işaretle"
                                >
                                    <CheckCheck className="w-3 h-3" />
                                    Tümü
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                    title="Tümünü temizle"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-8 text-center">
                                <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                                <p className="text-sm text-muted-foreground">Bildirim yok</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex items-start gap-3 px-4 py-3 hover:bg-surface/50 transition-colors border-b border-border/50 last:border-0",
                                        !notification.isRead && "bg-primary/5"
                                    )}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={cn(
                                                "text-sm font-medium truncate",
                                                notification.isRead ? "text-muted-foreground" : "text-foreground"
                                            )}>
                                                {notification.title}
                                            </p>
                                            <button
                                                onClick={() => removeNotification(notification.id)}
                                                className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-xs text-muted-foreground">
                                                {formatTime(notification.createdAt)}
                                            </span>
                                            {!notification.isRead && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                                >
                                                    <Check className="w-3 h-3" />
                                                    Oku
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
