import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { Colors, Gradients } from '../../constants/colors';
import { Spacing, Typography, Radius } from '../../constants/theme';
import { getStats, getMyMembers, type DietitianStats, type DietitianMember } from '../../services/dietitianDashboardService';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DietitianStackParamList } from '../../navigation/DietitianNavigator';
import { TouchableOpacity } from 'react-native';

type Nav = NativeStackNavigationProp<DietitianStackParamList>;

export default function DietitianDashboardScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const navigation = useNavigation<Nav>();

    const [stats, setStats] = useState<DietitianStats | null>(null);
    const [members, setMembers] = useState<DietitianMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const [s, m] = await Promise.allSettled([getStats(), getMyMembers()]);
            if (s.status === 'fulfilled') setStats(s.value);
            if (m.status === 'fulfilled') setMembers(m.value.slice(0, 5));
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

    if (loading) return <LoadingScreen message="Panel yükleniyor..." />;

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                contentContainerStyle={styles.content}
            >
                {/* Header */}
                <LinearGradient colors={['#0c1a0c', '#172517']} style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hoş geldiniz 👨‍⚕️</Text>
                        <Text style={styles.name}>{user?.full_name || user?.email}</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('DailyReport')} style={styles.aiBtn}>
                        <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
                        <Text style={styles.aiBtnText}>Rapor</Text>
                    </TouchableOpacity>
                </LinearGradient>

                {/* Stats Grid */}
                {stats && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>İstatistiklerim</Text>
                        <View style={styles.statsGrid}>
                            {[
                                { label: 'Toplam Danışan', value: stats.total_members, icon: 'people-outline', color: Colors.primary },
                                { label: 'Aktif Danışan', value: stats.active_members, icon: 'person-circle-outline', color: '#22c55e' },
                                { label: 'Aktif Program', value: stats.active_plans, icon: 'document-outline', color: '#3b82f6' },
                                { label: 'Puan', value: stats.rating?.toFixed(1) || '–', icon: 'star-outline', color: '#f59e0b' },
                            ].map((s) => (
                                <View key={s.label} style={styles.statItem}>
                                    <View style={[styles.statIcon, { backgroundColor: s.color + '20' }]}>
                                        <Ionicons name={s.icon as any} size={22} color={s.color} />
                                    </View>
                                    <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                                    <Text style={styles.statLabel}>{s.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Son Danışanlar */}
                <View style={styles.section}>
                    <View style={styles.sectionRow}>
                        <Text style={styles.sectionTitle}>Son Danışanlar</Text>
                        <TouchableOpacity onPress={() => (navigation as any).navigate('MembersTab')}>
                            <Text style={styles.seeAll}>Tümünü Gör</Text>
                        </TouchableOpacity>
                    </View>
                    {members.length === 0 ? (
                        <Card><Text style={styles.empty}>Henüz danışanınız yok.</Text></Card>
                    ) : (
                        members.map((m) => (
                            <TouchableOpacity
                                key={m.id}
                                onPress={() => navigation.navigate('MemberDetail', { memberId: m.id })}
                                activeOpacity={0.8}
                            >
                                <Card style={styles.memberCard}>
                                    <View style={styles.memberRow}>
                                        <View style={styles.memberAvatar}>
                                            <Ionicons name="person" size={18} color={Colors.primary} />
                                        </View>
                                        <View style={styles.memberInfo}>
                                            <Text style={styles.memberName}>{m.full_name || m.email}</Text>
                                            <Text style={styles.memberSub}>
                                                {m.has_active_plan ? '✅ Aktif program' : '⚠️ Program yok'}
                                                {' · '}
                                                {m.subscription_status ? '💎 Abone' : '⭕ Abone değil'}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color={Colors.mutedForeground} />
                                    </View>
                                </Card>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    content: { paddingBottom: Spacing['3xl'] },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: Spacing.base, paddingBottom: Spacing.xl,
    },
    greeting: { fontSize: Typography.size.sm, color: Colors.mutedForeground },
    name: { fontSize: Typography.size.xl, fontWeight: '800', color: Colors.foreground, marginTop: 2 },
    aiBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: Colors.surface, borderRadius: Radius.lg,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    },
    aiBtnText: { fontSize: Typography.size.sm, color: Colors.primary, fontWeight: '600' },
    section: { padding: Spacing.base, gap: Spacing.md },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground },
    seeAll: { fontSize: Typography.size.sm, color: Colors.primary, fontWeight: '600' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    statItem: {
        flex: 1, minWidth: '45%', backgroundColor: Colors.card, borderRadius: Radius.xl,
        padding: Spacing.md, alignItems: 'center', gap: Spacing.xs,
        borderWidth: 1, borderColor: Colors.border,
    },
    statIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    statValue: { fontSize: Typography.size['2xl'], fontWeight: '800' },
    statLabel: { fontSize: Typography.size.xs, color: Colors.mutedForeground, textAlign: 'center' },
    memberCard: { padding: Spacing.md },
    memberRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    memberAvatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center',
    },
    memberInfo: { flex: 1 },
    memberName: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground },
    memberSub: { fontSize: Typography.size.xs, color: Colors.mutedForeground, marginTop: 2 },
    empty: { color: Colors.mutedForeground, textAlign: 'center' },
});
