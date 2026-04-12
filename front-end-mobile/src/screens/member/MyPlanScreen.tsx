import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/Widgets';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { Colors } from '../../constants/colors';
import { Spacing, Typography, Radius } from '../../constants/theme';
import { getMyPlan, type MyNutritionPlan } from '../../services/memberService';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '../../constants/colors';

const MEAL_ICONS: Record<string, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍎',
};
const MEAL_LABELS: Record<string, string> = {
    breakfast: 'Kahvaltı',
    lunch: 'Öğle',
    dinner: 'Akşam',
    snack: 'Ara Öğün',
};

export default function MyPlanScreen() {
    const insets = useSafeAreaInsets();
    const [plan, setPlan] = useState<MyNutritionPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const data = await getMyPlan();
            setPlan(data);
        } catch {
            setPlan(null);
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

    if (loading) return <LoadingScreen message="Program yükleniyor..." />;

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <Header title="Beslenme Programım" showBack />
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {!plan ? (
                    <EmptyState
                        icon="document-outline"
                        title="Henüz programınız yok"
                        description="Diyetisyeniniz size bir beslenme programı atamadığında burada görüntülenir."
                    />
                ) : (
                    <>
                        {/* Plan Başlık */}
                        <Card variant="bordered" style={styles.titleCard}>
                            <Text style={styles.planTitle}>{plan.title}</Text>
                            {plan.description && (
                                <Text style={styles.planDesc}>{plan.description}</Text>
                            )}
                            <Text style={styles.planDates}>
                                📅 {new Date(plan.start_date).toLocaleDateString('tr-TR')}
                                {plan.end_date && ` → ${new Date(plan.end_date).toLocaleDateString('tr-TR')}`}
                            </Text>
                        </Card>

                        {/* Günlük Hedefler */}
                        <View>
                            <Text style={styles.sectionTitle}>Günlük Hedefler</Text>
                            <View style={styles.targetsGrid}>
                                {[
                                    { label: 'Kalori', value: plan.daily_targets.calories, unit: 'kcal', icon: '🔥', color: Colors.primary },
                                    { label: 'Protein', value: plan.daily_targets.protein, unit: 'g', icon: '🥩', color: '#f59e0b' },
                                    { label: 'Karbonhidrat', value: plan.daily_targets.carbs, unit: 'g', icon: '🌾', color: '#3b82f6' },
                                    { label: 'Yağ', value: plan.daily_targets.fat, unit: 'g', icon: '🫙', color: '#8b5cf6' },
                                    { label: 'Su', value: plan.daily_targets.water, unit: 'bardak', icon: '💧', color: '#60a5fa' },
                                ].map((t) => (
                                    <View key={t.label} style={styles.targetItem}>
                                        <Text style={styles.targetIcon}>{t.icon}</Text>
                                        <Text style={[styles.targetValue, { color: t.color }]}>{t.value}</Text>
                                        <Text style={styles.targetUnit}>{t.unit}</Text>
                                        <Text style={styles.targetLabel}>{t.label}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Öğünler */}
                        <View>
                            <Text style={styles.sectionTitle}>Öğünler</Text>
                            {plan.meals.map((meal, idx) => (
                                <Card key={idx} style={styles.mealCard}>
                                    <View style={styles.mealHeader}>
                                        <Text style={styles.mealIcon}>{MEAL_ICONS[meal.meal_type] || '🍽️'}</Text>
                                        <View style={styles.mealInfo}>
                                            <Text style={styles.mealType}>{MEAL_LABELS[meal.meal_type] || meal.meal_type}</Text>
                                            {meal.time && <Text style={styles.mealTime}>{meal.time}</Text>}
                                        </View>
                                    </View>
                                    {meal.notes && (
                                        <Text style={styles.mealNotes}>📝 {meal.notes}</Text>
                                    )}
                                    <View style={styles.foodList}>
                                        {meal.foods.map((food, fi) => {
                                            const name = typeof food === 'string' ? food : food.name;
                                            const amount = typeof food === 'object' && food.amount ? food.amount : '';
                                            return (
                                                <View key={fi} style={styles.foodItem}>
                                                    <Ionicons name="checkmark-circle-outline" size={14} color={Colors.primary} />
                                                    <Text style={styles.foodName}>{name}</Text>
                                                    {amount ? <Text style={styles.foodAmount}>{amount}</Text> : null}
                                                </View>
                                            );
                                        })}
                                    </View>
                                </Card>
                            ))}
                        </View>

                        {plan.notes && (
                            <Card>
                                <Text style={styles.sectionTitle}>Notlar</Text>
                                <Text style={styles.planNotes}>{plan.notes}</Text>
                            </Card>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.base, gap: Spacing.lg, paddingBottom: Spacing['4xl'] },
    titleCard: { gap: Spacing.sm },
    planTitle: { fontSize: Typography.size.xl, fontWeight: '800', color: Colors.foreground },
    planDesc: { fontSize: Typography.size.sm, color: Colors.mutedForeground, lineHeight: 18 },
    planDates: { fontSize: Typography.size.xs, color: Colors.mutedForeground },
    sectionTitle: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground, marginBottom: Spacing.md },
    targetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    targetItem: {
        width: '30%', backgroundColor: Colors.card, borderRadius: Radius.xl,
        padding: Spacing.md, alignItems: 'center', gap: 2,
        borderWidth: 1, borderColor: Colors.border, flexGrow: 1,
    },
    targetIcon: { fontSize: 20 },
    targetValue: { fontSize: Typography.size.lg, fontWeight: '800' },
    targetUnit: { fontSize: 10, color: Colors.mutedForeground },
    targetLabel: { fontSize: Typography.size.xs, color: Colors.mutedForeground, textAlign: 'center' },
    mealCard: { gap: Spacing.sm },
    mealHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    mealIcon: { fontSize: 28 },
    mealInfo: {},
    mealType: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground },
    mealTime: { fontSize: Typography.size.xs, color: Colors.primary },
    mealNotes: { fontSize: Typography.size.sm, color: Colors.mutedForeground, fontStyle: 'italic' },
    foodList: { gap: Spacing.xs },
    foodItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    foodName: { flex: 1, fontSize: Typography.size.sm, color: Colors.foreground },
    foodAmount: { fontSize: Typography.size.xs, color: Colors.mutedForeground },
    planNotes: { fontSize: Typography.size.sm, color: Colors.mutedForeground, lineHeight: 20 },
});
