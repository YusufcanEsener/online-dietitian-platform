import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, FlatList, RefreshControl, Alert, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { EmptyState, Badge, StatCard } from '../../components/ui/Widgets';
import { Button } from '../../components/ui/Button';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { Colors } from '../../constants/colors';
import { Spacing, Typography } from '../../constants/theme';
import {
    getDashboardStats, getAllUsers, getPendingDietitians, approveDietitian, rejectDietitian, toggleUserActive,
    type AdminStats, type AdminUser, type PendingDietitian,
} from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

type Tab = 'stats' | 'users' | 'pending';

export default function AdminDashboardScreen() {
    const insets = useSafeAreaInsets();
    const { logout } = useAuth();

    const [tab, setTab] = useState<Tab>('stats');
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [pending, setPending] = useState<PendingDietitian[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const [s, u, p] = await Promise.allSettled([getDashboardStats(), getAllUsers(), getPendingDietitians()]);
            if (s.status === 'fulfilled') setStats(s.value);
            if (u.status === 'fulfilled') setUsers(u.value);
            if (p.status === 'fulfilled') setPending(p.value);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const handleApprove = async (id: string, name: string) => {
        Alert.alert('Onayla', `${name || 'Diyetisyen'} onaylansın mı?`, [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Onayla', onPress: async () => {
                    try { await approveDietitian(id); await load(); Alert.alert('Onaylandı!'); }
                    catch (e: any) { Alert.alert('Hata', e?.response?.data?.detail); }
                },
            },
        ]);
    };

    const handleReject = async (id: string) => {
        Alert.alert('Reddet', 'Başvuru reddedilsin mi?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Reddet', style: 'destructive', onPress: async () => {
                    try { await rejectDietitian(id); await load(); }
                    catch (e: any) { Alert.alert('Hata', e?.response?.data?.detail); }
                },
            },
        ]);
    };

    const handleToggleActive = async (id: string, currentActive: boolean) => {
        try {
            await toggleUserActive(id);
            await load();
        } catch (e: any) { Alert.alert('Hata', e?.response?.data?.detail); }
    };

    if (loading) return <LoadingScreen message="Yönetici Paneli..." />;

    const TABS: { key: Tab; label: string; icon: string }[] = [
        { key: 'stats', label: 'Özet', icon: 'grid-outline' },
        { key: 'users', label: 'Kullanıcılar', icon: 'people-outline' },
        { key: 'pending', label: `Bekleyen (${pending.length})`, icon: 'hourglass-outline' },
    ];

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <Header
                title="Yönetici Paneli"
                rightAction={
                    <TouchableOpacity onPress={() => Alert.alert('Çıkış', '', [{ text: 'İptal' }, { text: 'Çık', onPress: logout, style: 'destructive' }])}>
                        <Ionicons name="log-out-outline" size={22} color={Colors.destructive} />
                    </TouchableOpacity>
                }
            />

            {/* Tabs */}
            <View style={styles.tabBar}>
                {TABS.map((t) => (
                    <TouchableOpacity
                        key={t.key}
                        style={[styles.tab, tab === t.key && styles.activeTab]}
                        onPress={() => setTab(t.key)}
                    >
                        <Ionicons name={t.icon as any} size={16} color={tab === t.key ? Colors.primary : Colors.mutedForeground} />
                        <Text style={[styles.tabText, tab === t.key && styles.activeTabText]}>{t.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {tab === 'stats' && stats && (
                    <>
                        <View style={styles.statsGrid}>
                            {[
                                { label: 'Toplam Kullanıcı', value: stats.total_users, icon: 'people-outline', color: Colors.primary },
                                { label: 'Üyeler', value: stats.total_members, icon: 'person-outline', color: '#3b82f6' },
                                { label: 'Diyetisyenler', value: stats.total_dietitians, icon: 'medical-outline', color: '#22c55e' },
                                { label: 'Aktif Abonelik', value: stats.active_subscriptions, icon: 'card-outline', color: '#f59e0b' },
                                { label: 'Toplam Sohbet', value: stats.total_chats, icon: 'chatbubbles-outline', color: '#8b5cf6' },
                                { label: 'Toplam Program', value: stats.total_plans, icon: 'document-outline', color: '#ec4899' },
                            ].map((s) => (
                                <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
                            ))}
                        </View>
                    </>
                )}

                {tab === 'users' && (
                    <>
                        {users.length === 0 ? (
                            <EmptyState icon="people-outline" title="Kullanıcı bulunamadı" />
                        ) : (
                            users.map((u) => (
                                <Card key={u.id} style={styles.userCard}>
                                    <View style={styles.userRow}>
                                        <View style={styles.userInfo}>
                                            <Text style={styles.userName}>{u.full_name || u.email}</Text>
                                            <Text style={styles.userEmail}>{u.email}</Text>
                                            <View style={styles.userBadges}>
                                                <Badge label={u.role} variant="info" />
                                                <Badge label={u.is_active ? 'Aktif' : 'Pasif'} variant={u.is_active ? 'success' : 'danger'} />
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            style={[styles.toggleBtn, u.is_active ? styles.deactivate : styles.activate]}
                                            onPress={() => handleToggleActive(u.id, u.is_active)}
                                        >
                                            <Ionicons name={u.is_active ? 'pause-circle-outline' : 'play-circle-outline'} size={22} color={u.is_active ? Colors.destructive : Colors.primary} />
                                        </TouchableOpacity>
                                    </View>
                                </Card>
                            ))
                        )}
                    </>
                )}

                {tab === 'pending' && (
                    <>
                        {pending.length === 0 ? (
                            <EmptyState icon="hourglass-outline" title="Bekleyen başvuru yok" />
                        ) : (
                            pending.map((d) => (
                                <Card key={d.id} style={{ gap: Spacing.md }}>
                                    <Text style={styles.userName}>{d.full_name || d.email}</Text>
                                    <Text style={styles.userEmail}>{d.email}</Text>
                                    {d.title && <Text style={styles.dietDetail}>{d.title}</Text>}
                                    {d.specialization && <Text style={styles.dietDetail}>{d.specialization}</Text>}
                                    <View style={styles.actionRow}>
                                        <Button title="Onayla" size="sm" onPress={() => handleApprove(d.id, d.full_name || '')} style={{ flex: 1 }} />
                                        <Button title="Reddet" size="sm" variant="destructive" onPress={() => handleReject(d.id)} style={{ flex: 1 }} />
                                    </View>
                                </Card>
                            ))
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    tabBar: { flexDirection: 'row', paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.sm },
    tab: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 4, paddingVertical: Spacing.sm, borderRadius: 8,
        backgroundColor: Colors.surface,
    },
    activeTab: { backgroundColor: Colors.primary + '20', borderWidth: 1, borderColor: Colors.primary + '60' },
    tabText: { fontSize: 11, color: Colors.mutedForeground, fontWeight: '600' },
    activeTabText: { color: Colors.primary },
    content: { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['4xl'] },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    userCard: { padding: Spacing.md },
    userRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    userInfo: { flex: 1, gap: 2 },
    userName: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground },
    userEmail: { fontSize: Typography.size.xs, color: Colors.mutedForeground },
    userBadges: { flexDirection: 'row', gap: 4, marginTop: 4 },
    toggleBtn: { padding: Spacing.sm, borderRadius: 8 },
    activate: { backgroundColor: Colors.primary + '15' },
    deactivate: { backgroundColor: Colors.destructive + '15' },
    dietDetail: { fontSize: Typography.size.sm, color: Colors.mutedForeground },
    actionRow: { flexDirection: 'row', gap: Spacing.sm },
});
