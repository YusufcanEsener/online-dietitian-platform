import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl, Alert,
    TextInput, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Colors } from '../../constants/colors';
import { Spacing, Typography, Radius } from '../../constants/theme';
import { getMeFull, updateProfile, type MemberUpdate } from '../../services/memberService';
import { changePassword } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '../../constants/colors';

// ─────────────────────────────────────────────────────────────────────────────
// Yardımcı bileşenler DIŞARIDA tanımlanmıştır — re-render'da yeniden oluşmaz
// ─────────────────────────────────────────────────────────────────────────────
type TFProps = {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; keyboard?: TextInput['props']['keyboardType'];
    password?: boolean;
};

const TField = ({ label, value, onChange, placeholder, keyboard, password }: TFProps) => {
    const [show, setShow] = useState(false);
    return (
        <View style={tfs.block}>
            <Text style={tfs.label}>{label}</Text>
            <View style={tfs.row}>
                <TextInput
                    style={tfs.input}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.mutedForeground}
                    keyboardType={keyboard}
                    secureTextEntry={password ? !show : false}
                    selectionColor={Colors.primary}
                    returnKeyType="next"
                />
                {password && (
                    <TouchableOpacity onPress={() => setShow(s => !s)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={tfs.eyeBtn}>
                        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={16} color={Colors.mutedForeground} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const tfs = StyleSheet.create({
    block: { marginBottom: Spacing.md },
    label: { fontSize: Typography.size.sm, fontWeight: '600', color: Colors.foreground, marginBottom: 6, letterSpacing: 0.3 },
    row: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.input, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
    input: { flex: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, color: Colors.foreground, fontSize: Typography.size.base },
    eyeBtn: { paddingHorizontal: Spacing.sm },
});

// ─────────────────────────────────────────────────────────────────────────────
// Ana ekran
// ─────────────────────────────────────────────────────────────────────────────
export default function MemberProfileScreen() {
    const insets = useSafeAreaInsets();
    const { refreshUser, logout } = useAuth();
    const [member, setMember] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Form değerleri string — klavye için kritik
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [targetWeight, setTargetWeight] = useState('');
    const [curPw, setCurPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [pwLoading, setPwLoading] = useState(false);

    const load = useCallback(async () => {
        try {
            const data = await getMeFull();
            setMember(data);
            setFullName(data.full_name || '');
            setPhone(data.phone || '');
            setCity(data.city || '');
            setHeight(String(data.height || ''));
            setWeight(String(data.weight || ''));
            setTargetWeight(String(data.target_weight || ''));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const handleSave = async () => {
        setSaving(true);
        try {
            const data: MemberUpdate = {
                full_name: fullName,
                phone,
                city,
                height: parseFloat(height) || undefined,
                weight: parseFloat(weight) || undefined,
                target_weight: parseFloat(targetWeight) || undefined,
            };
            await updateProfile(data);
            await refreshUser();
            Alert.alert('Başarılı', 'Profil güncellendi!');
        } catch (e: any) {
            Alert.alert('Hata', e?.response?.data?.detail || 'Güncelleme başarısız.');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPw !== confirmPw) { Alert.alert('Hata', 'Şifreler eşleşmiyor.'); return; }
        if (newPw.length < 6) { Alert.alert('Hata', 'En az 6 karakter olmalı.'); return; }
        setPwLoading(true);
        try {
            await changePassword({ current_password: curPw, new_password: newPw });
            Alert.alert('Başarılı', 'Şifreniz güncellendi.');
            setCurPw(''); setNewPw(''); setConfirmPw('');
        } catch (e: any) {
            Alert.alert('Hata', e?.response?.data?.detail || 'Şifre değiştirme başarısız.');
        } finally {
            setPwLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
        ]);
    };

    if (loading) return (
        <View style={st.root}><Text style={{ color: Colors.foreground, textAlign: 'center', marginTop: 80 }}>Yükleniyor...</Text></View>
    );

    return (
        <View style={[st.root, { paddingTop: insets.top }]}>
            <Header title="Profilim" />
            <ScrollView
                contentContainerStyle={st.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="none"
            >
                {/* Avatar */}
                <Card style={st.avatarCard}>
                    <View style={st.avatarCircle}>
                        <Text style={st.avatarInitial}>
                            {(member?.full_name || member?.email || '?').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <Text style={st.userName}>{member?.full_name || member?.email}</Text>
                    <View style={st.badge}><Text style={st.badgeText}>Üye</Text></View>
                </Card>

                {/* Kişisel Bilgiler */}
                <Card>
                    <Text style={st.secTitle}>Kişisel Bilgiler</Text>
                    <TField label="Ad Soyad" value={fullName} onChange={setFullName} />
                    <TField label="Telefon" value={phone} onChange={setPhone} keyboard="phone-pad" />
                    <TField label="Şehir" value={city} onChange={setCity} />
                    <TField label="Boy (cm)" value={height} onChange={setHeight} keyboard="numeric" />
                    <TField label="Kilo (kg)" value={weight} onChange={setWeight} keyboard="numeric" />
                    <TField label="Hedef Kilo (kg)" value={targetWeight} onChange={setTargetWeight} keyboard="numeric" />
                    <TouchableOpacity style={st.saveBtn} onPress={handleSave} activeOpacity={0.85} disabled={saving}>
                        <LinearGradient colors={Gradients.primary} style={st.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Text style={st.saveBtnText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Card>

                {/* Şifre */}
                <Card>
                    <Text style={st.secTitle}>Şifre Değiştir</Text>
                    <TField label="Mevcut Şifre" value={curPw} onChange={setCurPw} password />
                    <TField label="Yeni Şifre" value={newPw} onChange={setNewPw} password />
                    <TField label="Yeni Şifre Tekrar" value={confirmPw} onChange={setConfirmPw} password />
                    <TouchableOpacity style={[st.saveBtn, st.outlineBtn]} onPress={handleChangePassword} activeOpacity={0.8} disabled={pwLoading}>
                        <Text style={st.outlineBtnText}>{pwLoading ? 'Değiştiriliyor...' : 'Şifre Değiştir'}</Text>
                    </TouchableOpacity>
                </Card>

                {/* Çıkış */}
                <TouchableOpacity style={st.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                    <Text style={st.logoutText}>Çıkış Yap</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const st = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.base, gap: Spacing.lg, paddingBottom: 120 },
    avatarCard: { alignItems: 'center', gap: Spacing.sm },
    avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { fontSize: 32, fontWeight: '800', color: Colors.primaryForeground },
    userName: { fontSize: Typography.size.lg, fontWeight: '700', color: Colors.foreground },
    badge: { backgroundColor: Colors.primary + '20', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4 },
    badgeText: { color: Colors.primary, fontWeight: '700', fontSize: Typography.size.sm },
    secTitle: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.primary, marginBottom: Spacing.md, letterSpacing: 0.5 },
    saveBtn: { borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.xs },
    saveBtnGrad: { paddingVertical: Spacing.md, alignItems: 'center' },
    saveBtnText: { color: Colors.primaryForeground, fontWeight: '700', fontSize: Typography.size.base },
    outlineBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border },
    outlineBtnText: { color: Colors.foreground, fontWeight: '700', fontSize: Typography.size.base, paddingVertical: Spacing.md - 1, textAlign: 'center' },
    logoutBtn: { borderRadius: Radius.lg, backgroundColor: '#ef444420', borderWidth: 1, borderColor: '#ef4444', paddingVertical: Spacing.md, alignItems: 'center' },
    logoutText: { color: '#ef4444', fontWeight: '700', fontSize: Typography.size.base },
});
