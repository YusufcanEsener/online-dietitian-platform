import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl,
    TouchableOpacity, Alert, TextInput, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Colors } from '../../constants/colors';
import { Spacing, Typography, Radius } from '../../constants/theme';
import { getTodayLog, updateTodayLog, type DailyLogUpdate } from '../../services/dailyLogService';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '../../constants/colors';

// ─────────────────────────────────────────────────────────────────────────────
// Yardımcı bileşenler ANA BİLEŞENİN DIŞINDA — TextInput focus sorununu önler
// ─────────────────────────────────────────────────────────────────────────────
type FieldProps = { label: string; value: string; onChange: (v: string) => void };

const NumField = ({ label, value, onChange }: FieldProps) => (
    <View style={fst.block}>
        <Text style={fst.label}>{label}</Text>
        <TextInput
            style={fst.input}
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
            placeholderTextColor={Colors.mutedForeground}
            selectionColor={Colors.primary}
            returnKeyType="next"
        />
    </View>
);

type PRowProps = { label: string; val: number; target: number; color: string; unit?: string };
const ProgressRow = ({ label, val, target, color, unit = 'g' }: PRowProps) => {
    const pct = target > 0 ? Math.min(Math.round((val / target) * 100), 100) : 0;
    return (
        <View style={fst.pItem}>
            <View style={fst.pTop}>
                <Text style={fst.pLabel}>{label}</Text>
                <Text style={[fst.pVal, { color }]}>{val}{unit} / {target}{unit}</Text>
            </View>
            <View style={fst.bar}>
                <View style={[fst.fill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
            <Text style={fst.pct}>{pct}%</Text>
        </View>
    );
};

const fst = StyleSheet.create({
    block: { marginBottom: Spacing.md },
    label: { fontSize: Typography.size.sm, fontWeight: '600', color: Colors.foreground, marginBottom: 6, letterSpacing: 0.3 },
    input: {
        backgroundColor: Colors.input, borderRadius: Radius.lg,
        borderWidth: 1, borderColor: Colors.border,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
        color: Colors.foreground, fontSize: Typography.size.base,
    },
    pItem: { gap: Spacing.xs },
    pTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pLabel: { fontSize: Typography.size.sm, fontWeight: '600', color: Colors.foreground },
    pVal: { fontSize: Typography.size.sm, fontWeight: '700' },
    bar: { height: 6, backgroundColor: Colors.surface, borderRadius: Radius.full, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: Radius.full },
    pct: { fontSize: 10, color: Colors.mutedForeground, textAlign: 'right' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Form state'i: sayısal değerler string olarak tutulur (klavye için kritik)
// ─────────────────────────────────────────────────────────────────────────────
type FormState = {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
    water: string;
};

function logToForm(data: any): FormState {
    return {
        calories: String(data.calories_consumed ?? 0),
        protein: String(data.protein ?? 0),
        carbs: String(data.carbs ?? 0),
        fat: String(data.fat ?? 0),
        water: String(data.water_glasses ?? 0),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Ana ekran
// ─────────────────────────────────────────────────────────────────────────────
export default function ProgressScreen() {
    const insets = useSafeAreaInsets();
    const [log, setLog] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<FormState>({ calories: '0', protein: '0', carbs: '0', fat: '0', water: '0' });

    const load = useCallback(async () => {
        try {
            const data = await getTodayLog();
            setLog(data);
            setForm(logToForm(data));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const handleSave = async () => {
        Keyboard.dismiss();
        setSaving(true);
        try {
            const payload: DailyLogUpdate = {
                calories_consumed: parseFloat(form.calories) || 0,
                protein: parseFloat(form.protein) || 0,
                carbs: parseFloat(form.carbs) || 0,
                fat: parseFloat(form.fat) || 0,
                water_glasses: parseFloat(form.water) || 0,
            };
            const updated = await updateTodayLog(payload);
            setLog(updated);
            setEditing(false);
            Alert.alert('Başarılı', 'Günlük log güncellendi.');
        } catch (e: any) {
            Alert.alert('Hata', e?.response?.data?.detail || 'Güncelleme başarısız.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={st.root}><Text style={{ color: Colors.foreground, textAlign: 'center', marginTop: 80 }}>Yükleniyor...</Text></View>
        );
    }

    return (
        <View style={[st.root, { paddingTop: insets.top }]}>
            <Header
                title="İlerleme"
                subtitle="Bugünkü takip"
                rightAction={
                    <TouchableOpacity onPress={() => { Keyboard.dismiss(); setEditing(!editing); }} style={st.editBtn}>
                        <Ionicons name={editing ? 'close-outline' : 'pencil-outline'} size={18} color={Colors.primary} />
                    </TouchableOpacity>
                }
            />
            <ScrollView
                contentContainerStyle={st.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="none"
            >
                {!editing ? (
                    <>
                        {log ? (
                            <>
                                <Card variant="bordered" style={st.mainCard}>
                                    <Text style={st.dateText}>
                                        📅 {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </Text>
                                    <ProgressRow label="🔥 Kalori" val={log.calories_consumed} target={log.calories_target} color={Colors.primary} unit=" kcal" />
                                    <ProgressRow label="🥩 Protein" val={log.protein} target={log.protein_target} color="#f59e0b" />
                                    <ProgressRow label="🌾 Karbonhidrat" val={log.carbs} target={log.carbs_target} color="#3b82f6" />
                                    <ProgressRow label="🫙 Yağ" val={log.fat} target={log.fat_target} color="#8b5cf6" />
                                    <ProgressRow label="💧 Su" val={log.water_glasses} target={log.water_target} color="#60a5fa" unit=" bdk" />
                                </Card>
                                <TouchableOpacity style={st.updateBtn} onPress={() => setEditing(true)} activeOpacity={0.8}>
                                    <Text style={st.updateBtnText}>Güncelle</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <Card>
                                <Text style={st.empty}>Bugün için kayıt bulunamadı.</Text>
                            </Card>
                        )}
                    </>
                ) : (
                    <Card style={st.editCard}>
                        <Text style={st.editTitle}>Günlük Değerleri Güncelle</Text>

                        <NumField label="Kalori (kcal)" value={form.calories} onChange={(v) => setForm(p => ({ ...p, calories: v }))} />
                        <NumField label="Protein (g)" value={form.protein} onChange={(v) => setForm(p => ({ ...p, protein: v }))} />
                        <NumField label="Karbonhidrat (g)" value={form.carbs} onChange={(v) => setForm(p => ({ ...p, carbs: v }))} />
                        <NumField label="Yağ (g)" value={form.fat} onChange={(v) => setForm(p => ({ ...p, fat: v }))} />
                        <NumField label="Su (bardak)" value={form.water} onChange={(v) => setForm(p => ({ ...p, water: v }))} />

                        <TouchableOpacity style={st.saveBtn} onPress={handleSave} activeOpacity={0.85} disabled={saving}>
                            <LinearGradient colors={Gradients.primary} style={st.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                <Text style={st.saveBtnText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity style={st.cancelBtn} onPress={() => { Keyboard.dismiss(); setEditing(false); }}>
                            <Text style={st.cancelBtnText}>İptal</Text>
                        </TouchableOpacity>
                    </Card>
                )}
            </ScrollView>
        </View>
    );
}

const st = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.base, paddingBottom: Spacing['3xl'], gap: Spacing.md },
    editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
    mainCard: { gap: Spacing.lg },
    dateText: { fontSize: Typography.size.sm, color: Colors.mutedForeground, marginBottom: Spacing.sm },
    empty: { color: Colors.mutedForeground, textAlign: 'center', fontSize: Typography.size.base },
    updateBtn: {
        borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
        paddingVertical: Spacing.sm + 2, alignItems: 'center', marginTop: Spacing.md,
    },
    updateBtnText: { color: Colors.foreground, fontWeight: '600', fontSize: Typography.size.base },
    editCard: { gap: Spacing.xs },
    editTitle: { fontSize: Typography.size.lg, fontWeight: '700', color: Colors.foreground, marginBottom: Spacing.sm },
    saveBtn: { borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.sm },
    saveBtnGrad: { paddingVertical: Spacing.md, alignItems: 'center' },
    saveBtnText: { color: Colors.primaryForeground, fontWeight: '700', fontSize: Typography.size.base },
    cancelBtn: { paddingVertical: Spacing.sm, alignItems: 'center' },
    cancelBtnText: { color: Colors.mutedForeground, fontSize: Typography.size.base },
});
