import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../../components/layout/Header';
import { Colors, Gradients } from '../../constants/colors';
import { Spacing, Typography, Radius } from '../../constants/theme';

// ─────────────────────────────────────────────────────────────────────────────
// Yardımcı bileşenler ANA BİLEŞENİN DIŞINDA tanımlanmıştır.
// İçeride tanımlanırsa her render'da yeniden oluşur, TextInput focus kaybeder.
// ─────────────────────────────────────────────────────────────────────────────

type FieldProps = {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    keyboard?: 'numeric' | 'default';
};

// Tek etiketli TextInput alanı
const Field = ({ label, value, onChange, placeholder, keyboard }: FieldProps) => (
    <View style={fst.block}>
        <Text style={fst.label}>{label}</Text>
        <TextInput
            style={fst.input}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={Colors.mutedForeground}
            keyboardType={keyboard ?? 'default'}
            selectionColor={Colors.primary}
            returnKeyType="next"
        />
    </View>
);

// Aktivite / Cinsiyet / Hedef seçim butonu
type SelProps = {
    options: { label: string; value: string }[];
    value: string;
    onSelect: (v: any) => void;
    column?: boolean;
};
const SelGroup = ({ options, value, onSelect, column }: SelProps) => (
    <View style={column ? fst.colWrap : fst.rowWrap}>
        {options.map((o) => {
            const active = o.value === value;
            return (
                <TouchableOpacity
                    key={o.value}
                    onPress={() => onSelect(o.value)}
                    activeOpacity={0.8}
                    style={[fst.selBtn, column ? fst.selFull : fst.selFlex, active && fst.selActive]}
                >
                    {active ? (
                        <LinearGradient colors={Gradients.primary} style={fst.selGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Text style={fst.selTextActive}>{o.label}</Text>
                        </LinearGradient>
                    ) : (
                        <Text style={fst.selText}>{o.label}</Text>
                    )}
                </TouchableOpacity>
            );
        })}
    </View>
);

const fst = StyleSheet.create({
    block: { marginBottom: Spacing.md },
    label: { fontSize: Typography.size.sm, fontWeight: '600', color: Colors.foreground, marginBottom: 6, letterSpacing: 0.3 },
    input: {
        backgroundColor: Colors.input, borderRadius: Radius.lg,
        borderWidth: 1, borderColor: Colors.border,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
        color: Colors.foreground, fontSize: Typography.size.base,
    },
    rowWrap: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    colWrap: { flexDirection: 'column', gap: Spacing.xs, marginBottom: Spacing.md },
    selBtn: { borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', backgroundColor: Colors.surface },
    selFlex: { flex: 1 },
    selFull: { width: '100%' },
    selActive: { borderColor: Colors.primary },
    selGrad: { paddingVertical: Spacing.sm, alignItems: 'center' },
    selText: { paddingVertical: Spacing.sm, textAlign: 'center', color: Colors.mutedForeground, fontSize: Typography.size.sm, fontWeight: '600' },
    selTextActive: { color: Colors.primaryForeground, fontSize: Typography.size.sm, fontWeight: '700' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Ana ekran
// ─────────────────────────────────────────────────────────────────────────────
type Gender = 'male' | 'female';
type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type Goal = 'lose' | 'maintain' | 'gain';

const ACTIVITY_MULTIPLIERS: Record<Activity, number> = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
};

export default function CalorieCalculatorScreen() {
    const insets = useSafeAreaInsets();

    // Sayısal değerler string olarak tutulur — klavye düzgün çalışsın diye
    const [age, setAge] = useState('');
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [gender, setGender] = useState<Gender>('female');
    const [activity, setActivity] = useState<Activity>('moderate');
    const [goal, setGoal] = useState<Goal>('maintain');
    const [result, setResult] = useState<null | {
        bmr: number; tdee: number; target: number; protein: number; carbs: number; fat: number;
    }>(null);

    const calculate = () => {
        const a = parseFloat(age), w = parseFloat(weight), h = parseFloat(height);
        if (!a || !w || !h) { Alert.alert('Hata', 'Tüm alanları doldurun.'); return; }
        let bmr: number;
        if (gender === 'male') bmr = 88.362 + 13.397 * w + 4.799 * h - 5.677 * a;
        else bmr = 447.593 + 9.247 * w + 3.098 * h - 4.330 * a;
        const tdee = bmr * ACTIVITY_MULTIPLIERS[activity];
        let target = tdee;
        if (goal === 'lose') target = tdee - 500;
        if (goal === 'gain') target = tdee + 300;
        setResult({
            bmr: Math.round(bmr),
            tdee: Math.round(tdee),
            target: Math.round(target),
            protein: Math.round((target * 0.25) / 4),
            carbs: Math.round((target * 0.45) / 4),
            fat: Math.round((target * 0.30) / 9),
        });
    };

    return (
        <View style={[st.root, { paddingTop: insets.top }]}>
            <Header title="Kalori Hesapla" showBack subtitle="Harris-Benedict Formülü" />
            <ScrollView
                contentContainerStyle={st.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="none"
            >
                {/* Form kartı */}
                <View style={st.card}>
                    <Field label="Yaş" value={age} onChange={setAge} placeholder="25" keyboard="numeric" />
                    <Field label="Kilo (kg)" value={weight} onChange={setWeight} placeholder="65" keyboard="numeric" />
                    <Field label="Boy (cm)" value={height} onChange={setHeight} placeholder="170" keyboard="numeric" />

                    <Text style={st.secLabel}>Cinsiyet</Text>
                    <SelGroup
                        value={gender} onSelect={setGender}
                        options={[{ label: '👩 Kadın', value: 'female' }, { label: '👨 Erkek', value: 'male' }]}
                    />

                    <Text style={st.secLabel}>Aktivite Seviyesi</Text>
                    <SelGroup
                        value={activity} onSelect={setActivity} column
                        options={[
                            { label: 'Hareketsiz', value: 'sedentary' },
                            { label: 'Hafif aktif', value: 'light' },
                            { label: 'Orta aktif', value: 'moderate' },
                            { label: 'Aktif', value: 'active' },
                            { label: 'Çok aktif', value: 'very_active' },
                        ]}
                    />

                    <Text style={st.secLabel}>Hedef</Text>
                    <SelGroup
                        value={goal} onSelect={setGoal}
                        options={[
                            { label: '⬇️ Kaybet', value: 'lose' },
                            { label: '⚖️ Koru', value: 'maintain' },
                            { label: '⬆️ Kazan', value: 'gain' },
                        ]}
                    />

                    <TouchableOpacity style={st.calcBtn} onPress={calculate} activeOpacity={0.85}>
                        <LinearGradient colors={Gradients.primary} style={st.calcGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Text style={st.calcText}>Hesapla</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Sonuç */}
                {result && (
                    <View style={st.resultCard}>
                        <Text style={st.resultTitle}>📊 Sonuçlar</Text>
                        {[
                            { label: 'Bazal Metabolizma (BMR)', value: `${result.bmr} kcal` },
                            { label: 'Toplam Günlük Enerji (TDEE)', value: `${result.tdee} kcal` },
                            { label: '🎯 Hedef Kalori', value: `${result.target} kcal`, hi: true },
                            { label: '🥩 Protein', value: `${result.protein} g` },
                            { label: '🌾 Karbonhidrat', value: `${result.carbs} g` },
                            { label: '🫙 Yağ', value: `${result.fat} g` },
                        ].map((item) => (
                            <View key={item.label} style={[st.row, item.hi && st.rowHi]}>
                                <Text style={[st.rowLabel, item.hi && st.rowLabelHi]}>{item.label}</Text>
                                <Text style={[st.rowVal, item.hi && { color: Colors.primary }]}>{item.value}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const st = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.base, gap: Spacing.lg, paddingBottom: Spacing['4xl'] },
    card: { backgroundColor: Colors.card, borderRadius: Radius['2xl'], padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border },
    secLabel: { fontSize: Typography.size.sm, fontWeight: '600', color: Colors.foreground, marginBottom: Spacing.sm, marginTop: Spacing.xs },
    calcBtn: { borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.md },
    calcGrad: { paddingVertical: Spacing.md, alignItems: 'center' },
    calcText: { color: Colors.primaryForeground, fontWeight: '700', fontSize: Typography.size.base },
    resultCard: { backgroundColor: Colors.card, borderRadius: Radius['2xl'], padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border },
    resultTitle: { fontSize: Typography.size.lg, fontWeight: '800', color: Colors.foreground, marginBottom: Spacing.lg },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
    rowHi: { backgroundColor: Colors.primary + '15', borderRadius: 8, paddingHorizontal: Spacing.sm },
    rowLabel: { fontSize: Typography.size.sm, color: Colors.mutedForeground, flex: 1 },
    rowLabelHi: { color: Colors.foreground, fontWeight: '700' },
    rowVal: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground },
});
