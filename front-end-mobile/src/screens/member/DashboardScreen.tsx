import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/Widgets';
import { Button } from '../../components/ui/Button';
import { Colors, Gradients } from '../../constants/colors';
import { Spacing, Typography, Radius } from '../../constants/theme';
import { getTodayLog } from '../../services/dailyLogService';
import { getMyPlan } from '../../services/memberService';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MemberStackParamList } from '../../navigation/MemberNavigator';

type Nav = NativeStackNavigationProp<MemberStackParamList>;

export default function MemberDashboardScreen() {
    const { user, logout } = useAuth();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<Nav>();

    const [todayLog, setTodayLog] = useState<any>(null);
    const [plan, setPlan] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [logLoading, setLogLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const [log, myPlan] = await Promise.allSettled([getTodayLog(), getMyPlan()]);
            if (log.status === 'fulfilled') setTodayLog(log.value);
            if (myPlan.status === 'fulfilled') setPlan(myPlan.value);
        } finally {
            setLogLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const calorieProgress = todayLog
        ? Math.min((todayLog.calories_consumed / todayLog.calories_target) * 100, 100)
        : 0;

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Günaydın';
        if (hour < 18) return 'İyi günler';
        return 'İyi akşamlar';
    };

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
                        <Text style={styles.greeting}>{greeting()} 👋</Text>
                        <Text style={styles.name}>{user?.full_name || user?.email}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('CalorieCalculator')}
                            style={styles.headerBtn}
                        >
                            <Ionicons name="calculator-outline" size={20} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* Günlük Özet */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Bugünkü Özet</Text>
                    {todayLog ? (
                        <>
                            {/* Kalori Bar */}
                            <Card style={styles.calorieCard}>
                                <View style={styles.calorieHeader}>
                                    <Ionicons name="flame-outline" size={20} color={Colors.primary} />
                                    <Text style={styles.calorieTitle}>Kalori Takibi</Text>
                                    <Text style={styles.calorieValue}>
                                        {todayLog.calories_consumed} / {todayLog.calories_target} kcal
                                    </Text>
                                </View>
                                <View style={styles.progressBar}>
                                    <LinearGradient
                                        colors={Gradients.primary}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[styles.progressFill, { width: `${calorieProgress}%` }]}
                                    />
                                </View>
                                <Text style={styles.progressLabel}>{calorieProgress.toFixed(0)}% tamamlandı</Text>
                            </Card>

                            {/* Makro Stats */}
                            <View style={styles.statsRow}>
                                <StatCard
                                    label="Protein"
                                    value={todayLog.protein}
                                    unit="g"
                                    icon="barbell-outline"
                                    color="#f59e0b"
                                />
                                <StatCard
                                    label="Karbonhidrat"
                                    value={todayLog.carbs}
                                    unit="g"
                                    icon="nutrition-outline"
                                    color="#3b82f6"
                                />
                                <StatCard
                                    label="Yağ"
                                    value={todayLog.fat}
                                    unit="g"
                                    icon="water-outline"
                                    color="#8b5cf6"
                                />
                            </View>

                            {/* Su */}
                            <Card style={styles.waterCard}>
                                <View style={styles.waterRow}>
                                    <Ionicons name="water" size={22} color="#60a5fa" />
                                    <Text style={styles.waterText}>
                                        Su: {todayLog.water_glasses} / {todayLog.water_target} bardak
                                    </Text>
                                </View>
                            </Card>
                        </>
                    ) : (
                        !logLoading && (
                            <Card>
                                <Text style={styles.emptyText}>Bugün için log kaydı bulunamadı.</Text>
                            </Card>
                        )
                    )}
                </View>

                {/* Beslenme Programı */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Beslenme Programım</Text>
                    {plan ? (
                        <Card variant="bordered">
                            <View style={styles.planHeader}>
                                <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
                                <Text style={styles.planTitle}>{plan.title}</Text>
                            </View>
                            {plan.description && (
                                <Text style={styles.planDesc} numberOfLines={2}>{plan.description}</Text>
                            )}
                            <View style={styles.planMeta}>
                                <Text style={styles.planMetaText}>
                                    🗓️ {new Date(plan.start_date).toLocaleDateString('tr-TR')}
                                    {plan.end_date && ` – ${new Date(plan.end_date).toLocaleDateString('tr-TR')}`}
                                </Text>
                            </View>
                            <Button
                                title="Programı Görüntüle"
                                variant="outline"
                                size="sm"
                                onPress={() => navigation.navigate('MyPlan')}
                                style={{ marginTop: Spacing.md }}
                            />
                        </Card>
                    ) : (
                        <Card>
                            <Text style={styles.emptyText}>Henüz bir beslenme programınız yok.</Text>
                            <Text style={styles.emptySubText}>Bir diyetisyen seçerek başlayın.</Text>
                        </Card>
                    )}
                </View>

                {/* Hızlı Eylemler */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
                    <View style={styles.quickActions}>
                        {[
                            { icon: 'calculator-outline', label: 'Kalori\nHesapla', onPress: () => navigation.navigate('CalorieCalculator') },
                            { icon: 'document-outline', label: 'Programım', onPress: () => navigation.navigate('MyPlan') },
                        ].map((item, i) => (
                            <TouchableOpacity
                                key={i}
                                style={styles.quickAction}
                                onPress={item.onPress}
                            >
                                <View style={styles.quickActionIcon}>
                                    <Ionicons name={item.icon as any} size={26} color={Colors.primary} />
                                </View>
                                <Text style={styles.quickActionLabel}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    content: { paddingBottom: Spacing['3xl'] },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.base,
        paddingBottom: Spacing.xl,
    },
    greeting: { fontSize: Typography.size.sm, color: Colors.mutedForeground },
    name: { fontSize: Typography.size.xl, fontWeight: '800', color: Colors.foreground, marginTop: 2 },
    headerRight: { flexDirection: 'row', gap: Spacing.sm },
    headerBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    },
    section: { padding: Spacing.base, gap: Spacing.md },
    sectionTitle: {
        fontSize: Typography.size.base, fontWeight: '700',
        color: Colors.foreground, letterSpacing: 0.3,
    },
    calorieCard: { gap: Spacing.sm },
    calorieHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    calorieTitle: { flex: 1, fontSize: Typography.size.base, fontWeight: '600', color: Colors.foreground },
    calorieValue: { fontSize: Typography.size.sm, color: Colors.primary, fontWeight: '700' },
    progressBar: {
        height: 8, backgroundColor: Colors.surface, borderRadius: Radius.full, overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: Radius.full },
    progressLabel: { fontSize: Typography.size.xs, color: Colors.mutedForeground, textAlign: 'right' },
    statsRow: { flexDirection: 'row', gap: Spacing.sm },
    waterCard: { flexDirection: 'row' },
    waterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    waterText: { fontSize: Typography.size.base, color: Colors.foreground, fontWeight: '600' },
    planHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    planTitle: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground, flex: 1 },
    planDesc: { fontSize: Typography.size.sm, color: Colors.mutedForeground, lineHeight: 18 },
    planMeta: { marginTop: Spacing.sm },
    planMetaText: { fontSize: Typography.size.xs, color: Colors.mutedForeground },
    emptyText: { fontSize: Typography.size.base, color: Colors.mutedForeground, textAlign: 'center' },
    emptySubText: { fontSize: Typography.size.sm, color: Colors.mutedForeground + '80', textAlign: 'center', marginTop: 4 },
    quickActions: { flexDirection: 'row', gap: Spacing.md },
    quickAction: {
        flex: 1, backgroundColor: Colors.card, borderRadius: Radius.xl,
        padding: Spacing.lg, alignItems: 'center', gap: Spacing.sm,
        borderWidth: 1, borderColor: Colors.border,
    },
    quickActionIcon: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center',
    },
    quickActionLabel: {
        fontSize: Typography.size.xs, fontWeight: '600',
        color: Colors.foreground, textAlign: 'center',
    },
});
