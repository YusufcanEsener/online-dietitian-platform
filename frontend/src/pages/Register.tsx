import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, CheckCircle2, Eye, EyeOff, Leaf, Loader2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Şifre güçlülük hesaplama
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: "Zayıf", color: "bg-red-500" };
    if (score <= 4) return { score, label: "Orta", color: "bg-yellow-500" };
    return { score, label: "Güçlü", color: "bg-green-500" };
};

// Şifre güçlülük bar bileşeni
const PasswordStrengthBar = ({ password }: { password: string }) => {
    const strength = getPasswordStrength(password);
    const percentage = (strength.score / 6) * 100;

    if (!password) return null;

    return (
        <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Şifre Güçlülüğü:</span>
                <span className={`font-medium ${strength.score <= 2 ? 'text-red-500' : strength.score <= 4 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {strength.label}
                </span>
            </div>
            <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                    {password.length >= 8 ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-500" />}
                    <span>En az 8 karakter</span>
                </div>
                <div className="flex items-center gap-1">
                    {/[A-Z]/.test(password) ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-500" />}
                    <span>Büyük harf</span>
                </div>
                <div className="flex items-center gap-1">
                    {/[0-9]/.test(password) ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-500" />}
                    <span>Rakam</span>
                </div>
                <div className="flex items-center gap-1">
                    {/[^a-zA-Z0-9]/.test(password) ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-500" />}
                    <span>Özel karakter</span>
                </div>
            </div>
        </div>
    );
};

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "", lastName: "", email: "", password: "", confirmPassword: ""
    });
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof formData | "acceptTerms", string>>>({});
    const [formMessage, setFormMessage] = useState<{
        type: "error" | "success" | "info";
        title: string;
        description: string;
    } | null>(null);

    // Şifre eşleşme kontrolü
    const passwordsMatch = useMemo(() => {
        if (!formData.confirmPassword) return null;
        return formData.password === formData.confirmPassword;
    }, [formData.password, formData.confirmPassword]);

    const updateField = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setFieldErrors(prev => ({ ...prev, [field]: undefined }));
        setFormMessage(null);
    };

    const validateForm = () => {
        const nextErrors: Partial<Record<keyof typeof formData | "acceptTerms", string>> = {};

        if (!formData.firstName.trim()) nextErrors.firstName = "Ad alanı zorunludur.";
        if (!formData.lastName.trim()) nextErrors.lastName = "Soyad alanı zorunludur.";
        if (!formData.email.trim()) nextErrors.email = "E-posta alanı zorunludur.";
        if (!formData.password) nextErrors.password = "Şifre alanı zorunludur.";
        if (formData.password && formData.password.length < 8) {
            nextErrors.password = "Şifre en az 8 karakter olmalıdır.";
        }
        if (!formData.confirmPassword) nextErrors.confirmPassword = "Şifre tekrar alanı zorunludur.";
        if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
            nextErrors.confirmPassword = "Şifreler eşleşmiyor.";
        }
        if (!acceptTerms) nextErrors.acceptTerms = "Devam etmek için kullanım şartlarını kabul etmelisiniz.";

        setFieldErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            setFormMessage({
                type: "error",
                title: "Formu kontrol edin",
                description: "Lütfen eksik veya hatalı alanları düzeltin."
            });
            return false;
        }

        setFormMessage(null);
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            const fullName = `${formData.firstName} ${formData.lastName}`;
            await register(formData.email, formData.password, fullName);
            setFormMessage({
                type: "success",
                title: "Kayıt başarılı",
                description: "Hesabınız oluşturuldu. Giriş sayfasına yönlendiriliyorsunuz."
            });
            
            setTimeout(() => navigate("/login"), 1500);
        } catch (error: unknown) {
            const errorDetail =
                typeof error === "object" &&
                error !== null &&
                "response" in error &&
                typeof (error as { response?: { data?: { detail?: string } } }).response?.data?.detail === "string"
                    ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
                    : undefined;
            setFormMessage({
                type: "error",
                title: "Kayıt başarısız",
                description: errorDetail || "Bir hata oluştu."
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Google OAuth Success Handler
    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) {
            setFormMessage({
                type: "error",
                title: "Google ile kayıt başarısız",
                description: "Google token alınamadı."
            });
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential, role: "user" })
            });
            const data = await res.json();

            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                const userRes = await fetch(`${API_BASE_URL}/api/v1/auth/me/full`, {
                    headers: { 'Authorization': `Bearer ${data.access_token}` }
                });
                const userData = await userRes.json();
                localStorage.setItem('user', JSON.stringify(userData));
                setFormMessage({
                    type: "success",
                    title: "Kayıt başarılı",
                    description: "Google hesabınız ile giriş yapılıyor."
                });
                if (userData.role === 'dietitian') {
                    navigate('/dietitian-dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setFormMessage({
                    type: "error",
                    title: "Google ile kayıt başarısız",
                    description: data.detail || "Google ile kayıt başarısız."
                });
            }
        } catch (error) {
            console.error('Google register error:', error);
            setFormMessage({
                type: "error",
                title: "Google ile kayıt başarısız",
                description: "Google ile kayıt başarısız."
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Google OAuth Error Handler
    const handleGoogleError = () => {
        setFormMessage({
            type: "error",
            title: "Google ile kayıt başarısız",
            description: "Lütfen tekrar deneyin."
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4 py-12">
            <div className="w-full max-w-md glass-card p-8">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-neon-gradient flex items-center justify-center neon-glow">
                            <Leaf className="w-7 h-7 text-primary-foreground" />
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold gradient-text">Kayıt Ol</h1>
                    <p className="text-muted-foreground mt-2">Sağlıklı yaşama başlayın</p>
                </div>

                {/* Google ile Kayıt */}
                <div className="flex justify-center mb-4">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="outline"
                        size="large"
                        width="350"
                        text="signup_with"
                        shape="rectangular"
                        logo_alignment="left"
                    />
                </div>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-background text-muted-foreground">veya e-posta ile</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {formMessage && (
                        <Alert
                            variant={formMessage.type === "error" ? "destructive" : "default"}
                            className={
                                formMessage.type === "success"
                                    ? "border-green-500/30 bg-green-500/10 text-foreground"
                                    : formMessage.type === "info"
                                      ? "border-primary/30 bg-primary/10 text-foreground"
                                      : undefined
                            }
                        >
                            {formMessage.type === "success" ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                                <AlertCircle className="h-4 w-4" />
                            )}
                            <AlertTitle>{formMessage.title}</AlertTitle>
                            <AlertDescription>{formMessage.description}</AlertDescription>
                        </Alert>
                    )}

                    {/* Diyetisyen Bilgilendirme Kartı */}
                    <div className="p-4 mb-6 rounded-xl bg-primary/10 border border-primary/20 text-center">
                        <h3 className="text-sm font-semibold text-primary mb-1">Diyetisyen Girişi</h3>
                        <p className="text-xs text-muted-foreground">
                            Platformda tek yetkili diyetisyen hesabı kullanılmaktadır. Yeni diyetisyen kaydı alınmamaktadır.
                            <br/><br/>
                            <Link to="/login" className="text-primary hover:underline font-medium">Uzman Girişi İçin Tıklayın</Link>
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-foreground">Ad *</label>
                            <input type="text" value={formData.firstName} onChange={(e) => updateField("firstName", e.target.value)}
                                className="w-full h-12 mt-1 px-4 rounded-xl bg-surface border border-border focus:border-primary outline-none text-foreground" disabled={isLoading} />
                            {fieldErrors.firstName && <p className="mt-1 text-xs text-red-500">{fieldErrors.firstName}</p>}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground">Soyad *</label>
                            <input type="text" value={formData.lastName} onChange={(e) => updateField("lastName", e.target.value)}
                                className="w-full h-12 mt-1 px-4 rounded-xl bg-surface border border-border focus:border-primary outline-none text-foreground" disabled={isLoading} />
                            {fieldErrors.lastName && <p className="mt-1 text-xs text-red-500">{fieldErrors.lastName}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground">E-posta *</label>
                        <input type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)}
                            className="w-full h-12 mt-1 px-4 rounded-xl bg-surface border border-border focus:border-primary outline-none text-foreground" disabled={isLoading} />
                        {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground">Şifre *</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={(e) => updateField("password", e.target.value)}
                                className="w-full h-12 mt-1 px-4 pr-12 rounded-xl bg-surface border border-border focus:border-primary outline-none text-foreground"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground mt-0.5"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {fieldErrors.password && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}
                        <PasswordStrengthBar password={formData.password} />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground">Şifre Tekrar *</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={formData.confirmPassword}
                                onChange={(e) => updateField("confirmPassword", e.target.value)}
                                className={`w-full h-12 mt-1 px-4 pr-12 rounded-xl bg-surface border outline-none text-foreground ${passwordsMatch === null ? 'border-border focus:border-primary' :
                                    passwordsMatch ? 'border-green-500' : 'border-red-500'
                                    }`}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground mt-0.5"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {passwordsMatch === false && (
                            <p className="text-xs text-red-500 mt-1">Şifreler eşleşmiyor</p>
                        )}
                        {passwordsMatch === true && (
                            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Şifreler eşleşiyor
                            </p>
                        )}
                        {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-500">{fieldErrors.confirmPassword}</p>}
                    </div>



                    {/* KVKK / Kullanım Şartları Checkbox */}
                    <div className="flex items-start gap-3 mt-4">
                        <input
                            type="checkbox"
                            id="acceptTerms"
                            checked={acceptTerms}
                            onChange={(e) => {
                                setAcceptTerms(e.target.checked);
                                setFieldErrors(prev => ({ ...prev, acceptTerms: undefined }));
                                setFormMessage(null);
                            }}
                            className="mt-1 w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary cursor-pointer"
                            disabled={isLoading}
                        />
                        <label htmlFor="acceptTerms" className="text-sm text-muted-foreground cursor-pointer">
                            <Link to="/terms" className="text-primary hover:underline">Kullanım Şartları</Link>
                            {" "}ve{" "}
                            <Link to="/privacy" className="text-primary hover:underline">Gizlilik Politikası</Link>
                            'nı (KVKK) okudum ve kabul ediyorum. *
                        </label>
                    </div>
                    {fieldErrors.acceptTerms && <p className="text-xs text-red-500">{fieldErrors.acceptTerms}</p>}

                    <Button
                        type="submit"
                        variant="neon"
                        className="w-full h-12 mt-4"
                        disabled={isLoading}
                    >
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Kayıt yapılıyor...</> : "Kayıt Ol"}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <span className="text-muted-foreground">Hesabınız var mı? </span>
                    <Link to="/login" className="text-primary hover:underline font-medium">Giriş Yap</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
