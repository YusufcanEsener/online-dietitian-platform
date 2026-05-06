import React, { useState, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    TextInput,
    ActivityIndicator,
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

// ─── Şifre Güçlülük ────────────────────────────────────────────────
const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Zayıf', color: Colors.destructive };
    if (score <= 4) return { score, label: 'Orta', color: '#f59e0b' };
    return { score, label: 'Güçlü', color: '#22c55e' };
};

// ─── Field Component ────────────────────────────────────────────────
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
    innerRef?: React.RefObject<TextInput | null>;
    error?: string;
}

const Field: React.FC<FieldProps> = ({
    label, value, onChangeText, placeholder, icon,
    isPassword, keyboardType = 'default', returnKeyType = 'next',
    onSubmitEditing, blurOnSubmit = false, innerRef, error,
}) => {
    const [show, setShow] = useState(false);
    return (
        <View style={fStyles.block}>
            <Text style={fStyles.label}>{label}</Text>
            <View style={[fStyles.row, error ? fStyles.errBorder : null]}>
                {icon ? (
                    <Ionicons name={icon as any} size={16} color={Colors.mutedForeground} style={fStyles.icon} />
                ) : null}
                <TextInput
                    ref={innerRef as any}
                    style={fStyles.input}
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
                />
                {isPassword ? (
                    <TouchableOpacity onPress={() => setShow((v) => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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

// ─── Ana Ekran ────────────────────────────────────────────────────────────────
export default function RegisterScreen() {
    const navigation = useNavigation<Nav>();
    const { register } = useAuth();

    const [loading, setLoading] = useState(false);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Refs for focus chaining
    const lastNameRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const passwordConfirmRef = useRef<TextInput>(null);

    // Şifre güçlülüğü
    const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
    const passwordsMatch = useMemo(() => {
        if (!passwordConfirm) return null;
        return password === passwordConfirm;
    }, [password, passwordConfirm]);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!firstName.trim()) e.firstName = 'Ad gerekli';
        if (!lastName.trim()) e.lastName = 'Soyad gerekli';
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = 'Geçerli e-posta girin';
        if (!password || password.length < 8) e.password = 'En az 8 karakter';
        if (password !== passwordConfirm) e.passwordConfirm = 'Şifreler eşleşmiyor';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleRegister = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const fullName = `${firstName.trim()} ${lastName.trim()}`;
            await register(email.trim(), password, fullName);
            Alert.alert('Kayıt Başarılı', 'Hesabınız oluşturuldu. Şimdi giriş yapabilirsiniz.', [
                { text: 'Giriş Yap', onPress: () => navigation.navigate('Login') },
            ]);
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
                        <Text style={styles.tagline}>Sağlıklı yaşama başlayın</Text>
                    </View>

                    {/* Form Kartı */}
                    <View style={styles.card}>
                        {/* Ad Soyad */}
                        <Field
                            label="Ad"
                            value={firstName}
                            onChangeText={(t) => { setFirstName(t); setErrors((p) => ({ ...p, firstName: '' })); }}
                            placeholder="Adınız"
                            icon="person-outline"
                            returnKeyType="next"
                            onSubmitEditing={() => (lastNameRef.current as any)?.focus()}
                            error={errors.firstName}
                        />
                        <Field
                            label="Soyad"
                            value={lastName}
                            onChangeText={(t) => { setLastName(t); setErrors((p) => ({ ...p, lastName: '' })); }}
                            placeholder="Soyadınız"
                            icon="person-outline"
                            returnKeyType="next"
                            onSubmitEditing={() => (emailRef.current as any)?.focus()}
                            innerRef={lastNameRef}
                            error={errors.lastName}
                        />
                        <Field
                            label="E-posta"
                            value={email}
                            onChangeText={(t) => { setEmail(t); setErrors((p) => ({ ...p, email: '' })); }}
                            placeholder="ornek@mail.com"
                            icon="mail-outline"
                            keyboardType="email-address"
                            returnKeyType="next"
                            onSubmitEditing={() => (passwordRef.current as any)?.focus()}
                            innerRef={emailRef}
                            error={errors.email}
                        />
                        <Field
                            label="Şifre"
                            value={password}
                            onChangeText={(t) => { setPassword(t); setErrors((p) => ({ ...p, password: '' })); }}
                            placeholder="En az 8 karakter"
                            icon="lock-closed-outline"
                            isPassword
                            returnKeyType="next"
                            onSubmitEditing={() => (passwordConfirmRef.current as any)?.focus()}
                            innerRef={passwordRef}
                            error={errors.password}
                        />

                        {/* Şifre Güçlülük Bar */}
                        {password.length > 0 && (
                            <View style={styles.strengthSection}>
                                <View style={styles.strengthHeader}>
                                    <Text style={styles.strengthLabel}>Şifre Güçlülüğü:</Text>
                                    <Text style={[styles.strengthValue, { color: passwordStrength.color }]}>
                                        {passwordStrength.label}
                                    </Text>
                                </View>
                                <View style={styles.strengthBarBg}>
                                    <View
                                        style={[
                                            styles.strengthBarFill,
                                            {
                                                width: `${(passwordStrength.score / 6) * 100}%`,
                                                backgroundColor: passwordStrength.color,
                                            },
                                        ]}
                                    />
                                </View>
                                <View style={styles.strengthChecks}>
                                    {[
                                        { check: password.length >= 8, text: 'En az 8 karakter' },
                                        { check: /[A-Z]/.test(password), text: 'Büyük harf' },
                                        { check: /[0-9]/.test(password), text: 'Rakam' },
                                        { check: /[^a-zA-Z0-9]/.test(password), text: 'Özel karakter' },
                                    ].map((item, i) => (
                                        <View key={i} style={styles.strengthCheckRow}>
                                            <Ionicons
                                                name={item.check ? 'checkmark-circle' : 'close-circle'}
                                                size={13}
                                                color={item.check ? '#22c55e' : Colors.destructive}
                                            />
                                            <Text style={styles.strengthCheckText}>{item.text}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        <Field
                            label="Şifre Tekrar"
                            value={passwordConfirm}
                            onChangeText={(t) => { setPasswordConfirm(t); setErrors((p) => ({ ...p, passwordConfirm: '' })); }}
                            placeholder="Şifrenizi tekrar girin"
                            icon="lock-closed-outline"
                            isPassword
                            returnKeyType="done"
                            onSubmitEditing={handleRegister}
                            blurOnSubmit
                            innerRef={passwordConfirmRef}
                            error={errors.passwordConfirm}
                        />

                        {/* Şifre eşleşme */}
                        {passwordsMatch === false && (
                            <Text style={styles.matchError}>Şifreler eşleşmiyor</Text>
                        )}
                        {passwordsMatch === true && (
                            <View style={styles.matchRow}>
                                <Ionicons name="checkmark-circle" size={13} color="#22c55e" />
                                <Text style={styles.matchOk}>Şifreler eşleşiyor</Text>
                            </View>
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
                                    : <Text style={styles.btnText}>Hesap Oluştur</Text>
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
    tagline: {
        fontSize: Typography.size.sm,
        color: Colors.mutedForeground,
    },
    card: {
        backgroundColor: Colors.card,
        borderRadius: Radius['2xl'],
        padding: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border,
    },

    // Password Strength
    strengthSection: {
        marginBottom: Spacing.md,
        gap: 6,
    },
    strengthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    strengthLabel: { fontSize: Typography.size.xs, color: Colors.mutedForeground },
    strengthValue: { fontSize: Typography.size.xs, fontWeight: '600' },
    strengthBarBg: {
        height: 5,
        backgroundColor: Colors.surface,
        borderRadius: Radius.full,
        overflow: 'hidden',
    },
    strengthBarFill: {
        height: '100%',
        borderRadius: Radius.full,
    },
    strengthChecks: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginTop: 4,
    },
    strengthCheckRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        width: '45%',
    },
    strengthCheckText: { fontSize: 10, color: Colors.mutedForeground },

    // Match
    matchError: { fontSize: Typography.size.xs, color: Colors.destructive, marginBottom: Spacing.sm },
    matchRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
    matchOk: { fontSize: Typography.size.xs, color: '#22c55e' },

    // Button
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
