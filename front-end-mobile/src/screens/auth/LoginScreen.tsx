import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    TextInput,
    TouchableWithoutFeedback,
    Keyboard,
    ActivityIndicator,
    Platform,
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

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
    const navigation = useNavigation<Nav>();
    const { login, logout } = useAuth();
    const passwordRef = useRef<TextInput>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [approvalMessage, setApprovalMessage] = useState<string | null>(null);

    const validate = () => {
        const e: typeof errors = {};
        if (!email.trim()) e.email = 'E-posta gerekli';
        else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Geçersiz e-posta';
        if (!password) e.password = 'Şifre gerekli';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleLogin = async () => {
        Keyboard.dismiss();
        if (!validate()) return;
        setLoading(true);
        setApprovalMessage(null);
        try {
            await login(email.trim(), password);
            // Login başarılı — diyetisyen onay kontrolü yapılacak
            // AuthContext zaten user'ı set etti, ama onay kontrolü için
            // storage'dan kontrol ediyoruz
            const { getUser } = await import('../../utils/storage');
            const userData = await getUser();
            if (userData?.role === 'dietitian' && userData?.is_approved === false) {
                // Onaylanmamış diyetisyen - çıkış yaptır
                const { logout: doLogout } = { logout };
                await doLogout();
                setApprovalMessage(
                    'Diyetisyen hesabınız henüz onaylanmadı. Onay işlemi tamamlandığında giriş yapabilirsiniz.'
                );
                return;
            }
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            let msg = 'Giriş başarısız. Bilgilerinizi kontrol edin.';
            if (typeof detail === 'string') msg = detail;
            else if (Array.isArray(detail)) msg = detail.map((d: any) => d.msg || d).join('\n');
            else if (!err?.response) msg = 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
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
                    {/* Logo */}
                    <View style={styles.logoSection}>
                        <LinearGradient colors={Gradients.primary} style={styles.logoCircle}>
                            <Ionicons name="leaf" size={32} color={Colors.primaryForeground} />
                        </LinearGradient>
                        <Text style={styles.logoText}>DietPlatform</Text>
                        <Text style={styles.tagline}>Sağlıklı yaşamın dijital adresi</Text>
                    </View>

                    {/* Onay Mesajı */}
                    {approvalMessage && (
                        <View style={styles.approvalBanner}>
                            <Ionicons name="alert-circle" size={20} color="#f59e0b" />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.approvalTitle}>Diyetisyen onayı bekleniyor</Text>
                                <Text style={styles.approvalText}>{approvalMessage}</Text>
                            </View>
                        </View>
                    )}

                    {/* Form Kartı */}
                    <View style={styles.card}>
                        <Text style={styles.heading}>Giriş Yap</Text>
                        <Text style={styles.subheading}>Hesabınıza erişin</Text>

                        {/* E-posta */}
                        <View style={styles.fieldBlock}>
                            <Text style={styles.label}>E-posta</Text>
                            <View style={[styles.inputRow, errors.email ? styles.inputError : null]}>
                                <Ionicons name="mail-outline" size={18} color={Colors.mutedForeground} style={styles.icon} />
                                <TextInput
                                    style={styles.textInput}
                                    value={email}
                                    onChangeText={(t) => { setEmail(t); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    placeholder="ornek@mail.com"
                                    placeholderTextColor={Colors.mutedForeground}
                                    selectionColor={Colors.primary}
                                    returnKeyType="next"
                                    blurOnSubmit={false}
                                    onSubmitEditing={() => passwordRef.current?.focus()}
                                />
                            </View>
                            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                        </View>

                        {/* Şifre */}
                        <View style={styles.fieldBlock}>
                            <Text style={styles.label}>Şifre</Text>
                            <View style={[styles.inputRow, errors.password ? styles.inputError : null]}>
                                <Ionicons name="lock-closed-outline" size={18} color={Colors.mutedForeground} style={styles.icon} />
                                <TextInput
                                    ref={passwordRef}
                                    style={styles.textInput}
                                    value={password}
                                    onChangeText={(t) => { setPassword(t); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }}
                                    secureTextEntry={!showPassword}
                                    placeholder="••••••••"
                                    placeholderTextColor={Colors.mutedForeground}
                                    selectionColor={Colors.primary}
                                    returnKeyType="done"
                                    onSubmitEditing={handleLogin}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.mutedForeground} style={styles.eyeIcon} />
                                </TouchableOpacity>
                            </View>
                            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                        </View>

                        {/* Giriş Butonu */}
                        <TouchableOpacity
                            style={styles.btn}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient colors={Gradients.primary} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                {loading
                                    ? <ActivityIndicator color={Colors.primaryForeground} />
                                    : <Text style={styles.btnText}>Giriş Yap</Text>
                                }
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Ayırıcı */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>veya</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.linkText}>
                                Hesabınız yok mu? <Text style={styles.linkHighlight}>Kayıt Ol</Text>
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
        paddingTop: Spacing['5xl'],
        paddingBottom: Spacing['4xl'],
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: Spacing['2xl'],
        gap: Spacing.sm,
    },
    logoCircle: {
        width: 72, height: 72, borderRadius: 36,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    logoText: {
        fontSize: Typography.size['3xl'],
        fontWeight: '800',
        color: Colors.foreground,
        letterSpacing: -0.5,
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
    heading: {
        fontSize: Typography.size['2xl'],
        fontWeight: '800',
        color: Colors.foreground,
        marginBottom: 4,
    },
    subheading: {
        fontSize: Typography.size.sm,
        color: Colors.mutedForeground,
        marginBottom: Spacing.xl,
    },
    fieldBlock: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: Typography.size.sm,
        fontWeight: '600',
        color: Colors.foreground,
        marginBottom: Spacing.xs,
        letterSpacing: 0.3,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.input,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    inputError: {
        borderColor: Colors.destructive,
    },
    icon: {
        marginHorizontal: Spacing.md,
    },
    eyeIcon: {
        marginRight: Spacing.md,
    },
    textInput: {
        flex: 1,
        paddingVertical: Spacing.md,
        paddingRight: Spacing.md,
        color: Colors.foreground,
        fontSize: Typography.size.base,
    },
    errorText: {
        fontSize: Typography.size.xs,
        color: Colors.destructive,
        marginTop: 4,
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
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginVertical: Spacing.lg,
    },
    dividerLine: {
        flex: 1, height: 1,
        backgroundColor: Colors.border,
    },
    dividerText: {
        color: Colors.mutedForeground,
        fontSize: Typography.size.sm,
    },
    linkBtn: { alignItems: 'center' },
    linkText: {
        color: Colors.mutedForeground,
        fontSize: Typography.size.base,
    },
    linkHighlight: {
        color: Colors.primary,
        fontWeight: '700',
    },
    approvalBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
        backgroundColor: '#f59e0b15',
        borderRadius: Radius['2xl'],
        borderWidth: 1,
        borderColor: '#f59e0b30',
        padding: Spacing.base,
        marginBottom: Spacing.lg,
    },
    approvalTitle: {
        fontSize: Typography.size.sm,
        fontWeight: '700',
        color: '#f59e0b',
        marginBottom: 4,
    },
    approvalText: {
        fontSize: Typography.size.xs,
        color: Colors.mutedForeground,
        lineHeight: 18,
    },
});
