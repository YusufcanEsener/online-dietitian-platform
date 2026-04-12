import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Colors } from '../../constants/colors';
import { Spacing, Typography, Radius } from '../../constants/theme';
import { createNutritionPlan, type NutritionPlanCreate, type Meal, type Food } from '../../services/dietitianDashboardService';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import type { DietitianStackParamList } from '../../navigation/DietitianNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '../../constants/colors';

type RouteProps = RouteProp<DietitianStackParamList, 'CreatePlan'>;
type Nav = NativeStackNavigationProp<DietitianStackParamList>;

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const MEAL_LABELS: Record<string, string> = { breakfast: 'Kahvaltı', lunch: 'Öğle', dinner: 'Akşam', snack: 'Ara Öğün' };
const MEAL_ICONS: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };

// ─────────────────────────────────────────────────────────────────────────────
// Yardımcı bileşenler DIŞARIDA tanımlanmıştır
// ─────────────────────────────────────────────────────────────────────────────
type FProps = { label?: string; value: string; onChange: (v: string) => void; placeholder?: string; keyboard?: TextInput['props']['keyboardType']; multiline?: boolean; flex?: number; };

const F = ({ label, value, onChange, placeholder, keyboard, multiline, flex }: FProps) => (
    <View style={[fs.block, flex != null && { flex }]}>
        {label ? <Text style={fs.label}>{label}</Text> : null}
        <TextInput
            style={[fs.input, multiline && { height: 56, textAlignVertical: 'top', paddingTop: Spacing.sm }]}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={Colors.mutedForeground}
            keyboardType={keyboard ?? 'default'}
            selectionColor={Colors.primary}
            returnKeyType={multiline ? 'default' : 'next'}
            multiline={multiline}
        />
    </View>
);

const fs = StyleSheet.create({
    block: { marginBottom: Spacing.sm },
    label: { fontSize: Typography.size.sm, fontWeight: '600', color: Colors.foreground, marginBottom: 5, letterSpacing: 0.3 },
    input: {
        backgroundColor: Colors.input, borderRadius: Radius.lg,
        borderWidth: 1, borderColor: Colors.border,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
        color: Colors.foreground, fontSize: Typography.size.base,
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// Ana ekran
// ─────────────────────────────────────────────────────────────────────────────
export default function CreatePlanScreen() {
    const insets = useSafeAreaInsets();
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<Nav>();
    const { memberId } = route.params;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [notes, setNotes] = useState('');
    const [tCalories, setTCalories] = useState('2000');
    const [tProtein, setTProtein] = useState('150');
    const [tCarbs, setTCarbs] = useState('250');
    const [tFat, setTFat] = useState('65');
    const [tWater, setTWater] = useState('8');
    const [meals, setMeals] = useState<{ meal_type: string; foods: Food[]; time?: string }[]>([
        { meal_type: 'breakfast', foods: [{ name: '' }] },
        { meal_type: 'lunch', foods: [{ name: '' }] },
        { meal_type: 'dinner', foods: [{ name: '' }] },
    ]);
    const [saving, setSaving] = useState(false);

    const addMeal = (type: string) => setMeals(p => [...p, { meal_type: type, foods: [{ name: '' }] }]);
    const removeMeal = (i: number) => setMeals(p => p.filter((_, idx) => idx !== i));
    const addFood = (mi: number) => setMeals(p => { const c = [...p]; c[mi] = { ...c[mi], foods: [...c[mi].foods, { name: '' }] }; return c; });
    const removeFood = (mi: number, fi: number) => setMeals(p => { const c = [...p]; c[mi] = { ...c[mi], foods: c[mi].foods.filter((_, idx) => idx !== fi) }; return c; });
    const updateFood = (mi: number, fi: number, field: keyof Food, v: string) => setMeals(p => {
        const c = [...p]; const f = [...c[mi].foods]; f[fi] = { ...f[fi], [field]: v }; c[mi] = { ...c[mi], foods: f }; return c;
    });
    const updateTime = (mi: number, v: string) => setMeals(p => { const c = [...p]; c[mi] = { ...c[mi], time: v }; return c; });

    const handleSave = async () => {
        if (!title.trim() || !startDate.trim()) {
            Alert.alert('Hata', 'Başlık ve başlangıç tarihi zorunludur.');
            return;
        }
        const cleanMeals = meals
            .map(m => ({ ...m, meal_type: m.meal_type as Meal['meal_type'], foods: m.foods.filter(f => f.name.trim()) }))
            .filter(m => m.foods.length > 0);

        const plan: NutritionPlanCreate = {
            member_id: memberId,
            title: title.trim(),
            description: description || undefined,
            start_date: startDate,
            end_date: endDate || undefined,
            daily_targets: {
                calories: parseFloat(tCalories) || 0,
                protein: parseFloat(tProtein) || 0,
                carbs: parseFloat(tCarbs) || 0,
                fat: parseFloat(tFat) || 0,
                water: parseFloat(tWater) || 0,
            },
            meals: cleanMeals as Meal[],
            notes: notes || undefined,
        };

        setSaving(true);
        try {
            await createNutritionPlan(plan);
            Alert.alert('Başarılı', 'Beslenme programı oluşturuldu!', [
                { text: 'Tamam', onPress: () => navigation.goBack() },
            ]);
        } catch (e: any) {
            Alert.alert('Hata', e?.response?.data?.detail || 'Program oluşturulamadı.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={[st.root, { paddingTop: insets.top }]}>
            <Header title="Program Oluştur" showBack />
            <ScrollView
                contentContainerStyle={st.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="none"
            >
                {/* Temel Bilgi */}
                <Card>
                    <Text style={st.secTitle}>Temel Bilgiler</Text>
                    <F label="Program Başlığı *" value={title} onChange={setTitle} placeholder="Örn: Kilo Verme Programı" />
                    <F label="Açıklama" value={description} onChange={setDescription} placeholder="Kısa açıklama..." multiline />
                    <F label="Başlangıç Tarihi *" value={startDate} onChange={setStartDate} placeholder="2024-01-01" />
                    <F label="Bitiş Tarihi" value={endDate} onChange={setEndDate} placeholder="2024-03-01" />
                    <F label="Notlar" value={notes} onChange={setNotes} placeholder="Genel notlar..." multiline />
                </Card>

                {/* Günlük Hedefler */}
                <Card>
                    <Text style={st.secTitle}>Günlük Hedefler</Text>
                    <F label="Kalori (kcal)" value={tCalories} onChange={setTCalories} keyboard="numeric" />
                    <F label="Protein (g)" value={tProtein} onChange={setTProtein} keyboard="numeric" />
                    <F label="Karbonhidrat (g)" value={tCarbs} onChange={setTCarbs} keyboard="numeric" />
                    <F label="Yağ (g)" value={tFat} onChange={setTFat} keyboard="numeric" />
                    <F label="Su (bardak)" value={tWater} onChange={setTWater} keyboard="numeric" />
                </Card>

                {/* Öğünler */}
                <View>
                    <Text style={st.secTitle}>Öğünler</Text>
                    {meals.map((meal, mIdx) => (
                        <Card key={mIdx} style={st.mealCard}>
                            <View style={st.mealHeader}>
                                <Text style={st.mealTitle}>{MEAL_ICONS[meal.meal_type]} {MEAL_LABELS[meal.meal_type]}</Text>
                                <TouchableOpacity onPress={() => removeMeal(mIdx)}>
                                    <Ionicons name="trash-outline" size={16} color={Colors.destructive} />
                                </TouchableOpacity>
                            </View>
                            <F value={meal.time || ''} onChange={(v) => updateTime(mIdx, v)} placeholder="Saat (08:00)" />
                            <Text style={st.foodsTitle}>Besinler</Text>
                            {meal.foods.map((food, fIdx) => (
                                <View key={fIdx} style={st.foodRow}>
                                    <F flex={2} placeholder="Besin adı" value={food.name} onChange={(v) => updateFood(mIdx, fIdx, 'name', v)} />
                                    <View style={{ width: Spacing.xs }} />
                                    <F flex={1} placeholder="Miktar" value={food.amount || ''} onChange={(v) => updateFood(mIdx, fIdx, 'amount', v)} />
                                    <TouchableOpacity onPress={() => removeFood(mIdx, fIdx)} style={st.removeFood}>
                                        <Ionicons name="close-circle" size={20} color={Colors.mutedForeground} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <TouchableOpacity style={st.addFoodBtn} onPress={() => addFood(mIdx)}>
                                <Text style={st.addFoodText}>+ Besin Ekle</Text>
                            </TouchableOpacity>
                        </Card>
                    ))}

                    <View style={st.addMealRow}>
                        {MEAL_TYPES.map((type) => (
                            <TouchableOpacity key={type} style={st.addMealBtn} onPress={() => addMeal(type)} activeOpacity={0.8}>
                                <Text style={st.addMealIcon}>{MEAL_ICONS[type]}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity style={st.saveBtn} onPress={handleSave} activeOpacity={0.85} disabled={saving}>
                    <LinearGradient colors={Gradients.primary} style={st.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Text style={st.saveBtnText}>{saving ? 'Kaydediliyor...' : 'Programı Kaydet'}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const st = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.base, gap: Spacing.lg, paddingBottom: Spacing['5xl'] },
    secTitle: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground, marginBottom: Spacing.md },
    mealCard: { gap: Spacing.sm, marginBottom: Spacing.md },
    mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    mealTitle: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground },
    foodsTitle: { fontSize: Typography.size.sm, fontWeight: '600', color: Colors.mutedForeground, marginBottom: Spacing.xs },
    foodRow: { flexDirection: 'row', alignItems: 'center' },
    removeFood: { paddingLeft: Spacing.xs, paddingBottom: Spacing.sm },
    addFoodBtn: { paddingVertical: Spacing.xs },
    addFoodText: { color: Colors.primary, fontWeight: '600', fontSize: Typography.size.sm },
    addMealRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
    addMealBtn: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, paddingVertical: Spacing.sm, alignItems: 'center' },
    addMealIcon: { fontSize: 20 },
    saveBtn: { borderRadius: Radius.lg, overflow: 'hidden' },
    saveBtnGrad: { paddingVertical: Spacing.md + 2, alignItems: 'center' },
    saveBtnText: { color: Colors.primaryForeground, fontWeight: '700', fontSize: Typography.size.base },
});
