import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    TextInput,
    ActivityIndicator,
    Switch,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors, Gradients } from '../../constants/colors';
import { Spacing, Typography, Radius } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

// ─── Yardımcı: Tek satırlık input ────────────────────────────────────────────
interface FieldProps {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    icon?: string;
    isPassword?: boolean;
    keyboardType?: TextInput['props']['keyboardType'];
    returnKeyType?: TextInput['props']['returnKeyType'];
    onSubmitEditing?: () => void;
    blurOnSubmit?: boolean;
    innerRef?: React.RefObject<TextInput>;
    error?: string;
    multiline?: boolean;
    numberOfLines?: number;
}

const Field: React.FC<FieldProps> = ({
    label, value, onChangeText, placeholder, icon,
    isPassword, keyboardType = 'default', returnKeyType = 'next',
    onSubmitEditing, blurOnSubmit = false, innerRef, error,
    multiline, numberOfLines,
}) => {
    const [show, setShow] = useState(false);
    return (
        <View style={fStyles.block}>
            <Text style={fStyles.label}>{label}</Text>
            <View style={[fStyles.row, error ? fStyles.errBorder : null, multiline ? { alignItems: 'flex-start' } : null]}>
                {icon ? (
                    <Ionicons name={icon as any} size={16} color={Colors.mutedForeground} style={fStyles.icon} />
                ) : null}
                <TextInput
                    ref={innerRef}
                    style={[fStyles.input, multiline ? { height: numberOfLines ? numberOfLines * 22 : 66, textAlignVertical: 'top', paddingTop: Spacing.sm } : null]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.mutedForeground}
                    secureTextEntry={isPassword && !show}
                    keyboardType={keyboardType}
                    autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
                    autoCorrect={false}
                    returnKeyType={returnKeyType}
                    onSubmitEditing={onSubmitEditing}
                    blurOnSubmit={blurOnSubmit}
                    selectionColor={Colors.primary}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                />
                {isPassword ? (
                    <TouchableOpacity onPress={() => setShow(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={16} color={Colors.mutedForeground} style={fStyles.eyeBtn} />
                    </TouchableOpacity>
                ) : null}
            </View>
            {error ? <Text style={fStyles.errText}>{error}</Text> : null}
        </View>
    );
};

const fStyles = StyleSheet.create({
    block: { marginBottom: Spacing.md },
    label: {
        fontSize: Typography.size.sm,
        fontWeight: '600',
        color: Colors.foreground,
        marginBottom: Spacing.xs,
        letterSpacing: 0.3,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.input,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    errBorder: { borderColor: Colors.destructive },
    icon: { marginHorizontal: Spacing.sm },
    eyeBtn: { marginRight: Spacing.sm },
    input: {
        flex: 1,
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.sm,
        color: Colors.foreground,
        fontSize: Typography.size.base,
    },
    errText: {
        fontSize: Typography.size.xs,
        color: Colors.destructive,
        marginTop: 4,
    },
});

// ─── Ana ekran ────────────────────────────────────────────────────────────────
export default function RegisterScreen() {
    const navigation = useNavigation<Nav>();
    const { register, registerDietitian } = useAuth();

    const [isDietitian, setIsDietitian] = useState(false);
    const [loading, setLoading] = useState(false);

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [title, setTitle] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [bio, setBio] = useState('');
    const [experienceYears, setExperienceYears] = useState('');

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Refs for focus chaining
    const emailRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const passwordConfirmRef = useRef<TextInput>(null);
    const titleRef = useRef<TextInput>(null);
    const specRef = useRef<TextInput>(null);
    const expRef = useRef<TextInput>(null);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!fullName.trim()) e.fullName = 'Ad Soyad gerekli';
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = 'Geçerli e-posta girin';
        if (!password || password.length < 6) e.password = 'En az 6 karakter';
        if (password !== passwordConfirm) e.passwordConfirm = 'Şifreler eşleşmiyor';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleRegister = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            if (isDietitian) {
                await registerDietitian({
                    email: email.trim(),
                    password,
                    full_name: fullName.trim(),
                    title: title.trim() || undefined,
                    specialization: specialization.trim() || undefined,
                    bio: bio.trim() || undefined,
                    experience_years: experienceYears ? parseInt(experienceYears) : undefined,
                });
                Alert.alert(
                    'Başvurunuz Alındı',
                    'Diyetisyen başvurunuz admin onayına gönderildi. Onay sonrası giriş yapabilirsiniz.',
                    [{ text: 'Giriş Yap', onPress: () => navigation.navigate('Login') }]
                );
            } else {
                await register(email.trim(), password, fullName.trim());
                Alert.alert('Kayıt Başarılı', 'Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.', [
                    { text: 'Giriş Yap', onPress: () => navigation.navigate('Login') },
                ]);
            }
        } catch (err: any) {
            const msg = err?.response?.data?.detail || 'Kayıt başarısız. Tekrar deneyin.';
            Alert.alert('Hata', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
            <LinearGradient colors={Gradients.background} style={styles.root}>
                <ScrollView
                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="none"
                >
                    {/* Geri Butonu */}
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={22} color={Colors.foreground} />
                    </TouchableOpacity>

                    {/* Logo */}
                    <View style={styles.logoSection}>
                        <LinearGradient colors={Gradients.primary} style={styles.logoCircle}>
                            <Ionicons name="leaf" size={28} color={Colors.primaryForeground} />
                        </LinearGradient>
                        <Text style={styles.logoText}>Kayıt Ol</Text>
                    </View>

                    {/* Kart */}
                    <View style={styles.card}>

                        {/* Tür Toggle */}
                        <View style={styles.typeToggle}>
                            <Text style={styles.typeLabel}>
                                {isDietitian ? '🥗 Diyetisyen olarak kayıt' : '👤 Üye olarak kayıt'}
                            </Text>
                            <Switch
                                value={isDietitian}
                                onValueChange={setIsDietitian}
                                trackColor={{ false: Colors.secondary, true: Colors.primary + '60' }}
                                thumbColor={isDietitian ? Colors.primary : Colors.mutedForeground}
                            />
                        </View>

                        {/* Ortak Alanlar */}
                        <Field
                            label="Ad Soyad"
                            value={fullName}
                            onChangeText={(t) => { setFullName(t); setErrors(p => ({ ...p, fullName: '' })); }}
                            placeholder="Adınız Soyadınız"
                            icon="person-outline"
                            returnKeyType="next"
                            onSubmitEditing={() => emailRef.current?.focus()}
                            error={errors.fullName}
                        />
                        <Field
                            label="E-posta"
                            value={email}
                            onChangeText={(t) => { setEmail(t); setErrors(p => ({ ...p, email: '' })); }}
                            placeholder="ornek@mail.com"
                            icon="mail-outline"
                            keyboardType="email-address"
                            returnKeyType="next"
                            onSubmitEditing={() => passwordRef.current?.focus()}
                            innerRef={emailRef}
                            error={errors.email}
                        />
                        <Field
                            label="Şifre"
                            value={password}
                            onChangeText={(t) => { setPassword(t); setErrors(p => ({ ...p, password: '' })); }}
                            placeholder="En az 6 karakter"
                            icon="lock-closed-outline"
                            isPassword
                            returnKeyType="next"
                            onSubmitEditing={() => passwordConfirmRef.current?.focus()}
                            innerRef={passwordRef}
                            error={errors.password}
                        />
                        <Field
                            label="Şifre Tekrar"
                            value={passwordConfirm}
                            onChangeText={(t) => { setPasswordConfirm(t); setErrors(p => ({ ...p, passwordConfirm: '' })); }}
                            placeholder="Şifrenizi tekrar girin"
                            icon="lock-closed-outline"
                            isPassword
                            returnKeyType={isDietitian ? 'next' : 'done'}
                            onSubmitEditing={isDietitian ? () => titleRef.current?.focus() : handleRegister}
                            blurOnSubmit={!isDietitian}
                            innerRef={passwordConfirmRef}
                            error={errors.passwordConfirm}
                        />

                        {/* Diyetisyen Ek Alanları */}
                        {isDietitian && (
                            <>
                                <View style={styles.sectionDivider}>
                                    <Text style={styles.sectionTitle}>Profesyonel Bilgiler</Text>
                                </View>
                                <Field
                                    label="Unvan"
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="Dr., Uzm. vb."
                                    icon="medal-outline"
                                    returnKeyType="next"
                                    onSubmitEditing={() => specRef.current?.focus()}
                                    innerRef={titleRef}
                                />
                                <Field
                                    label="Uzmanlık Alanı"
                                    value={specialization}
                                    onChangeText={setSpecialization}
                                    placeholder="Sporcu beslenmesi, obezite..."
                                    icon="ribbon-outline"
                                    returnKeyType="next"
                                    onSubmitEditing={() => expRef.current?.focus()}
                                    innerRef={specRef}
                                />
                                <Field
                                    label="Deneyim (Yıl)"
                                    value={experienceYears}
                                    onChangeText={setExperienceYears}
                                    placeholder="5"
                                    icon="time-outline"
                                    keyboardType="numeric"
                                    returnKeyType="next"
                                    onSubmitEditing={() => expRef.current?.blur()}
                                    innerRef={expRef}
                                />
                                <Field
                                    label="Biyografi"
                                    value={bio}
                                    onChangeText={setBio}
                                    placeholder="Kendinizden kısaca bahsedin..."
                                    icon="document-text-outline"
                                    multiline
                                    numberOfLines={3}
                                    returnKeyType="done"
                                    blurOnSubmit
                                />
                            </>
                        )}

                        {/* Kayıt Butonu */}
                        <TouchableOpacity
                            style={styles.btn}
                            onPress={handleRegister}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient colors={Gradients.primary} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                {loading
                                    ? <ActivityIndicator color={Colors.primaryForeground} />
                                    : <Text style={styles.btnText}>{isDietitian ? 'Başvuru Gönder' : 'Hesap Oluştur'}</Text>
                                }
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.linkText}>
                                Zaten hesabınız var mı? <Text style={styles.linkHighlight}>Giriş Yap</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    container: {
        flexGrow: 1,
        padding: Spacing.base,
        paddingTop: Spacing['2xl'],
        paddingBottom: Spacing['4xl'],
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: Colors.surface,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: Spacing.base,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
        gap: Spacing.sm,
    },
    logoCircle: {
        width: 60, height: 60, borderRadius: 30,
        alignItems: 'center', justifyContent: 'center',
    },
    logoText: {
        fontSize: Typography.size['2xl'],
        fontWeight: '800',
        color: Colors.foreground,
    },
    card: {
        backgroundColor: Colors.card,
        borderRadius: Radius['2xl'],
        padding: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    typeToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.xl,
    },
    typeLabel: {
        fontSize: Typography.size.base,
        fontWeight: '600',
        color: Colors.foreground,
        flex: 1,
        marginRight: Spacing.sm,
    },
    sectionDivider: {
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: Spacing.md,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.size.sm,
        fontWeight: '700',
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    btn: {
        borderRadius: Radius.lg,
        overflow: 'hidden',
        marginTop: Spacing.sm,
    },
    btnGradient: {
        paddingVertical: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: {
        color: Colors.primaryForeground,
        fontWeight: '700',
        fontSize: Typography.size.base,
        letterSpacing: 0.3,
    },
    linkBtn: { alignItems: 'center', marginTop: Spacing.lg },
    linkText: { color: Colors.mutedForeground, fontSize: Typography.size.base },
    linkHighlight: { color: Colors.primary, fontWeight: '700' },
});
