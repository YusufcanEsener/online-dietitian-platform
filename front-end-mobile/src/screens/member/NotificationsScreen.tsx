import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import * as notificationService from '../../services/notificationService';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  sender_name?: string;
  created_at: string;
}

const getIcon = (type: NotificationItem['type']) => {
  switch (type) {
    case 'success': return { name: 'checkmark-circle', color: '#22c55e' };
    case 'warning': return { name: 'warning', color: '#f59e0b' };
    case 'error': return { name: 'alert-circle', color: '#ef4444' };
    default: return { name: 'information-circle', color: '#3b82f6' };
  }
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Şimdi';
  if (minutes < 60) return `${minutes} dk önce`;
  if (hours < 24) return `${hours} saat önce`;
  return `${days} gün önce`;
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getNotifications();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.error('Bildirimler yüklenemedi:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadNotifications();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* ignore */ }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { /* ignore */ }
  };

  const handleClearAll = () => {
    Alert.alert('Tümünü Temizle', 'Tüm bildirimler silinsin mi?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          try {
            await notificationService.clearAllNotifications();
            setNotifications([]);
          } catch { /* ignore */ }
        }
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bildirimler</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} okunmamış bildirim</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.actionBtn}>
              <Ionicons name="checkmark-done" size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={Colors.mutedForeground} />
          <Text style={styles.emptyTitle}>Bildirim Yok</Text>
          <Text style={styles.emptyDesc}>Diyetisyeninizden yeni bildirimler burada görünecek</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          renderItem={({ item }) => {
            const icon = getIcon(item.type);
            return (
              <TouchableOpacity
                style={[styles.card, !item.is_read && styles.cardUnread]}
                onPress={() => handleMarkAsRead(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrap, { backgroundColor: icon.color + '20' }]}>
                  <Ionicons name={icon.name as any} size={22} color={icon.color} />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.cardRow}>
                    <Text style={[styles.cardTitle, item.is_read && styles.cardTitleRead]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                      <Ionicons name="close" size={16} color={Colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                  {item.sender_name && (
                    <Text style={styles.senderName}>{item.sender_name}</Text>
                  )}
                  <Text style={styles.cardMsg} numberOfLines={2}>{item.message}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardTime}>{formatTime(item.created_at)}</Text>
                    {!item.is_read && <View style={styles.unreadDot} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: Colors.foreground },
  headerSub: { fontSize: 13, color: Colors.primary, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.foreground },
  emptyDesc: { fontSize: 14, color: Colors.mutedForeground, textAlign: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    marginHorizontal: 16, marginTop: 12, padding: 14,
    borderRadius: 14, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardUnread: { borderColor: Colors.primary + '50', backgroundColor: Colors.primary + '0A' },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardContent: { flex: 1, gap: 3 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: Colors.foreground, flex: 1 },
  cardTitleRead: { color: Colors.mutedForeground, fontWeight: '500' },
  senderName: { fontSize: 12, color: Colors.primary, fontWeight: '500' },
  cardMsg: { fontSize: 13, color: Colors.mutedForeground, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  cardTime: { fontSize: 11, color: Colors.mutedForeground },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
});
