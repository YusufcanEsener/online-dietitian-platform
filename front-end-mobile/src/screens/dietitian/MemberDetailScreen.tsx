import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Widgets';
import { Button } from '../../components/ui/Button';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { Colors } from '../../constants/colors';
import { Spacing, Typography, Radius } from '../../constants/theme';
import {
    getMemberDetail, deleteNutritionPlan, type MemberFullDetail,
} from '../../services/dietitianDashboardService';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import type { DietitianStackParamList } from '../../navigation/DietitianNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Route = RouteProp<DietitianStackParamList, 'MemberDetail'>;
type Nav = NativeStackNavigationProp<DietitianStackParamList>;

export default function DietitianMemberDetailScreen() {
    const insets = useSafeAreaInsets();
    const route = useRoute<Route>();
    const navigation = useNavigation<Nav>();
    const { memberId } = route.params;

    const [member, setMember] = useState<MemberFullDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const data = await getMemberDetail(memberId);
            setMember(data);
        } finally {
            setLoading(false);
        }
    }, [memberId]);

    useEffect(() => { load(); }, [load]);

    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const handleDeletePlan = (planId: string) => {
        Alert.alert('Programı Sil', 'Bu beslenme programını silmek istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Sil', style: 'destructive', onPress: async () => {
                    try {
                        await deleteNutritionPlan(planId);
                        await load();
                        Alert.alert('Başarılı', 'Program silindi.');
                    } catch (e: any) {
                        Alert.alert('Hata', e?.response?.data?.detail || 'Silme başarısız.');
                    }
                },
            },
        ]);
    };

    if (loading) return <LoadingScreen message="Danışan yükleniyor..." />;
    if (!member) return <LoadingScreen message="Danışan bulunamadı" />;

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <Header title={member.full_name || member.email} showBack subtitle="Danışan Detayı" />
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Bilgi Kartı */}
                <Card>
                    <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
                    {[
                        { label: 'E-posta', value: member.email },
                        { label: 'Kilo', value: member.weight ? `${member.weight} kg` : '–' },
                        { label: 'Boy', value: member.height ? `${member.height} cm` : '–' },
                        { label: 'Hedef Kilo', value: member.target_weight ? `${member.target_weight} kg` : '–' },
                        { label: 'Cinsiyet', value: member.gender || '–' },
                        { label: 'Doğum Tarihi', value: member.birth_date || '–' },
                        { label: 'Aktivite', value: member.activity_level || '–' },
                    ].map((row) => (
                        <View key={row.label} style={styles.infoRow}>
                            <Text style={styles.infoLabel}>{row.label}</Text>
                            <Text style={styles.infoValue}>{row.value}</Text>
                        </View>
                    ))}
                    <View style={styles.badgeRow}>
                        <Badge
                            label={member.subscription_status ? '💎 Abone' : '⭕ Abone Değil'}
                            variant={member.subscription_status ? 'success' : 'default'}
                        />
                        <Badge
                            label={member.has_active_plan ? '✅ Aktif Program' : '⚠️ Program Yok'}
                            variant={member.has_active_plan ? 'success' : 'warning'}
                        />
                    </View>
                </Card>

                {/* Programlar */}
                <View>
                    <View style={styles.sectionRow}>
                        <Text style={styles.sectionTitle}>Beslenme Programları</Text>
                        <Button
                            title="+ Program"
                            size="sm"
                            onPress={() => navigation.navigate('CreatePlan', { memberId })}
                        />
                    </View>
                    {member.all_plans.length === 0 ? (
                        <Card><Text style={styles.empty}>Henüz program yok.</Text></Card>
                    ) : (
                        member.all_plans.map((plan) => (
                            <Card key={plan.id} variant={plan.is_active ? 'bordered' : 'default'} style={styles.planCard}>
                                <View style={styles.planHeader}>
                                    <Text style={styles.planTitle}>{plan.title}</Text>
                                    {plan.is_active && <Badge label="Aktif" variant="success" />}
                                </View>
                                <Text style={styles.planDate}>
                                    {new Date(plan.start_date).toLocaleDateString('tr-TR')}
                                    {plan.end_date && ` – ${new Date(plan.end_date).toLocaleDateString('tr-TR')}`}
                                </Text>
                                <View style={styles.macroRow}>
                                    {[
                                        { label: 'Kal', value: plan.daily_targets.calories },
                                        { label: 'Pr', value: `${plan.daily_targets.protein}g` },
                                        { label: 'Kbh', value: `${plan.daily_targets.carbs}g` },
                                        { label: 'Yağ', value: `${plan.daily_targets.fat}g` },
                                    ].map((m) => (
                                        <View key={m.label} style={styles.macroBadge}>
                                            <Text style={styles.macroValue}>{m.value}</Text>
                                            <Text style={styles.macroLabel}>{m.label}</Text>
                                        </View>
                                    ))}
                                </View>
                                <Button
                                    title="Sil"
                                    variant="destructive"
                                    size="sm"
                                    onPress={() => handleDeletePlan(plan.id)}
                                />
                            </Card>
                        ))
                    )}
                </View>

                {/* Son Günlük Loglar */}
                {member.daily_logs.length > 0 && (
                    <View>
                        <Text style={styles.sectionTitle}>Son Günlük Takip</Text>
                        {member.daily_logs.slice(0, 7).map((log, i) => (
                            <Card key={i} style={styles.logCard}>
                                <View style={styles.logRow}>
                                    <Text style={styles.logDate}>{log.date}</Text>
                                    <Text style={styles.logCal}>
                                        {log.calories_consumed}/{log.calories_target} kcal
                                    </Text>
                                </View>
                                <View style={styles.logBar}>
                                    <View style={[
                                        styles.logFill,
                                        {
                                            width: `${Math.min((log.calories_consumed / log.calories_target) * 100, 100)}%`,
                                            backgroundColor: log.calories_consumed >= log.calories_target ? Colors.primary : '#f59e0b',
                                        },
                                    ]} />
                                </View>
                            </Card>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.base, gap: Spacing.lg, paddingBottom: Spacing['4xl'] },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    sectionTitle: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground },
    infoRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    infoLabel: { fontSize: Typography.size.sm, color: Colors.mutedForeground },
    infoValue: { fontSize: Typography.size.sm, fontWeight: '600', color: Colors.foreground },
    badgeRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
    planCard: { gap: Spacing.sm },
    planHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    planTitle: { flex: 1, fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground },
    planDate: { fontSize: Typography.size.xs, color: Colors.mutedForeground },
    macroRow: { flexDirection: 'row', gap: Spacing.sm },
    macroBadge: {
        flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md,
        padding: Spacing.sm, alignItems: 'center',
    },
    macroValue: { fontSize: Typography.size.sm, fontWeight: '700', color: Colors.primary },
    macroLabel: { fontSize: 10, color: Colors.mutedForeground },
    logCard: { padding: Spacing.sm, gap: Spacing.xs },
    logRow: { flexDirection: 'row', justifyContent: 'space-between' },
    logDate: { fontSize: Typography.size.xs, color: Colors.mutedForeground },
    logCal: { fontSize: Typography.size.xs, color: Colors.foreground, fontWeight: '600' },
    logBar: { height: 4, backgroundColor: Colors.surface, borderRadius: Radius.full, overflow: 'hidden' },
    logFill: { height: '100%', borderRadius: Radius.full },
    empty: { color: Colors.mutedForeground, textAlign: 'center', fontSize: Typography.size.base },
});
