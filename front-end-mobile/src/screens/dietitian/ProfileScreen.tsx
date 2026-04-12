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
import { getMyProfile, updateProfile } from '../../services/dietitianService';
import { changePassword } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '../../constants/colors';

// ─────────────────────────────────────────────────────────────────────────────
// Yardımcı bileşenler DIŞARIDA — re-render'da unmount olmaz
// ─────────────────────────────────────────────────────────────────────────────
type TFProps = {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; keyboard?: TextInput['props']['keyboardType'];
    password?: boolean; multiline?: boolean;
};

const TField = ({ label, value, onChange, placeholder, keyboard, password, multiline }: TFProps) => {
    const [show, setShow] = useState(false);
    return (
        <View style={tfs.block}>
            <Text style={tfs.label}>{label}</Text>
            <View style={[tfs.row, multiline && { alignItems: 'flex-start' }]}>
                <TextInput
                    style={[tfs.input, multiline && { height: 72, textAlignVertical: 'top', paddingTop: Spacing.sm }]}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.mutedForeground}
                    keyboardType={keyboard}
                    secureTextEntry={password ? !show : false}
                    selectionColor={Colors.primary}
                    returnKeyType={multiline ? 'default' : 'next'}
                    multiline={multiline}
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
export default function DietitianProfileScreen() {
    const insets = useSafeAreaInsets();
    const { logout, refreshUser } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Ayrı string state'ler
    const [title, setTitle] = useState('');
    const [spec, setSpec] = useState('');
    const [bio, setBio] = useState('');
    const [expYears, setExpYears] = useState('');
    const [curPw, setCurPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [pwLoading, setPwLoading] = useState(false);

    const load = useCallback(async () => {
        try {
            const data = await getMyProfile();
            setProfile(data);
            setTitle(data.title || '');
            setSpec(data.specialization || '');
            setBio(data.bio || '');
            setExpYears(String(data.experience_years || ''));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateProfile({
                title: title || undefined,
                specialization: spec || undefined,
                bio: bio || undefined,
                experience_years: parseFloat(expYears) || undefined,
            });
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
        setPwLoading(true);
        try {
            await changePassword({ current_password: curPw, new_password: newPw });
            Alert.alert('Başarılı', 'Şifre güncellendi.');
            setCurPw(''); setNewPw(''); setConfirmPw('');
        } catch (e: any) {
            Alert.alert('Hata', e?.response?.data?.detail || 'Hata oluştu.');
        } finally {
            setPwLoading(false);
        }
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
                            {(profile?.full_name || profile?.email || '?').charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <Text style={st.name}>{profile?.full_name || profile?.email}</Text>
                    <View style={st.badge}><Text style={st.badgeText}>Diyetisyen</Text></View>
                    {profile?.rating > 0 && <Text style={st.rating}>⭐ {profile.rating?.toFixed(1)}</Text>}
                </Card>

                {/* Profesyonel Bilgiler */}
                <Card>
                    <Text style={st.secTitle}>Profesyonel Bilgiler</Text>
                    <TField label="Unvan" value={title} onChange={setTitle} placeholder="Dr., Uzm. vb." />
                    <TField label="Uzmanlık" value={spec} onChange={setSpec} placeholder="Sporcu beslenmesi..." />
                    <TField label="Deneyim (Yıl)" value={expYears} onChange={setExpYears} keyboard="numeric" />
                    <TField label="Biyografi" value={bio} onChange={setBio} placeholder="Kendinizden bahsedin..." multiline />
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
                    <TField label="Tekrar" value={confirmPw} onChange={setConfirmPw} password />
                    <TouchableOpacity style={[st.saveBtn, st.outlineBtn]} onPress={handleChangePassword} activeOpacity={0.8} disabled={pwLoading}>
                        <Text style={st.outlineBtnText}>{pwLoading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}</Text>
                    </TouchableOpacity>
                </Card>

                {/* Çıkış */}
                <TouchableOpacity
                    style={st.logoutBtn}
                    onPress={() => Alert.alert('Çıkış', 'Çıkış yapmak istiyor musunuz?', [
                        { text: 'İptal', style: 'cancel' },
                        { text: 'Çıkış', style: 'destructive', onPress: logout },
                    ])}
                    activeOpacity={0.8}
                >
                    <Text style={st.logoutText}>Çıkış Yap</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const st = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.base, gap: Spacing.lg, paddingBottom: Spacing['4xl'] },
    avatarCard: { alignItems: 'center', gap: Spacing.sm },
    avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    avatarInitial: { fontSize: 32, fontWeight: '800', color: Colors.primaryForeground },
    name: { fontSize: Typography.size.lg, fontWeight: '700', color: Colors.foreground },
    badge: { backgroundColor: Colors.primary + '20', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4 },
    badgeText: { color: Colors.primary, fontWeight: '700', fontSize: Typography.size.sm },
    rating: { fontSize: Typography.size.sm, color: '#f59e0b', fontWeight: '600' },
    secTitle: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.primary, marginBottom: Spacing.md },
    saveBtn: { borderRadius: Radius.lg, overflow: 'hidden', marginTop: Spacing.xs },
    saveBtnGrad: { paddingVertical: Spacing.md, alignItems: 'center' },
    saveBtnText: { color: Colors.primaryForeground, fontWeight: '700', fontSize: Typography.size.base },
    outlineBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border },
    outlineBtnText: { color: Colors.foreground, fontWeight: '700', fontSize: Typography.size.base, paddingVertical: Spacing.md - 1, textAlign: 'center' },
    logoutBtn: { borderRadius: Radius.lg, backgroundColor: '#ef444420', borderWidth: 1, borderColor: '#ef4444', paddingVertical: Spacing.md, alignItems: 'center' },
    logoutText: { color: '#ef4444', fontWeight: '700', fontSize: Typography.size.base },
});
