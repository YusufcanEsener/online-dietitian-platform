import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: '👥 Yeni Danışan Kaydı',
    message: 'Yeni bir danışan sizi seçti ve platforma katıldı.',
    type: 'success',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 20),
  },
  {
    id: '2',
    title: '📋 Program Güncellemesi',
    message: 'Danışanınız için oluşturduğunuz beslenme programı aktive edildi.',
    type: 'info',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
  },
  {
    id: '3',
    title: '⚠️ Kritik Uyarı',
    message: 'Bir danışanınız 5 gündür günlük takip girişi yapmadı.',
    type: 'warning',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
  },
  {
    id: '4',
    title: '✅ AI Analizi Tamamlandı',
    message: 'Danışan analiz raporu hazırlandı. İncelemek için tıklayın.',
    type: 'success',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
];

const getIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success': return { name: 'checkmark-circle', color: '#22c55e' };
    case 'warning': return { name: 'warning', color: '#f59e0b' };
    case 'error': return { name: 'alert-circle', color: '#ef4444' };
    default: return { name: 'information-circle', color: '#3b82f6' };
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
  return `${days} gün önce`;
};

export default function DietitianNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    Alert.alert('Tümünü Temizle', 'Tüm bildirimler silinsin mi?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => setNotifications([]) },
    ]);
  };

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
            <TouchableOpacity onPress={markAllAsRead} style={styles.actionBtn}>
              <Ionicons name="checkmark-done" size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={clearAll} style={styles.actionBtn}>
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
          <Text style={styles.emptyDesc}>Yeni bildirimler burada görünecek</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          renderItem={({ item }) => {
            const icon = getIcon(item.type);
            return (
              <TouchableOpacity
                style={[styles.card, !item.isRead && styles.cardUnread]}
                onPress={() => markAsRead(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrap, { backgroundColor: icon.color + '20' }]}>
                  <Ionicons name={icon.name as any} size={22} color={icon.color} />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.cardRow}>
                    <Text style={[styles.cardTitle, item.isRead && styles.cardTitleRead]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <TouchableOpacity onPress={() => removeNotification(item.id)}>
                      <Ionicons name="close" size={16} color={Colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cardMsg} numberOfLines={2}>{item.message}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardTime}>{formatTime(item.createdAt)}</Text>
                    {!item.isRead && (
                      <View style={styles.unreadDot} />
                    )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: Colors.foreground },
  headerSub: { fontSize: 13, color: Colors.primary, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.foreground },
  emptyDesc: { fontSize: 14, color: Colors.mutedForeground },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    marginHorizontal: 16, marginTop: 12, padding: 14,
    borderRadius: 14, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardUnread: { borderColor: Colors.primary + '40', backgroundColor: Colors.primary + '08' },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardContent: { flex: 1, gap: 4 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: Colors.foreground, flex: 1 },
  cardTitleRead: { color: Colors.mutedForeground, fontWeight: '500' },
  cardMsg: { fontSize: 13, color: Colors.mutedForeground, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  cardTime: { fontSize: 11, color: Colors.mutedForeground },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
});
