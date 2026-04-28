import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { AlertCircle, Eye, EyeOff, Leaf, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Login = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { login, isAuthenticated, user } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [approvalMessage, setApprovalMessage] = useState<string | null>(null);

    if (isAuthenticated && user) {
        if (user.role === 'admin') navigate('/admin', { replace: true });
        else if (user.role === 'dietitian') navigate('/dietitian-dashboard', { replace: true });
        else navigate('/dashboard', { replace: true });
        return null;
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast({ title: "Hata", description: "Tüm alanları doldurun", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        try {
            await login(email, password);

            // Kullanıcı verilerini kontrol et
            const u = localStorage.getItem('user');
            if (u) {
                const userData = JSON.parse(u);

                // Diyetisyen onay kontrolü
                if (userData.role === 'dietitian' && userData.is_approved === false) {
                    // Token'ı temizle - giriş izni verme
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('user');

                    setApprovalMessage("Diyetisyen hesabınız henüz onaylanmadı. Onay işlemi tamamlandığında e-posta ile bilgilendirileceksiniz.");
                    setIsLoading(false);
                    return;
                }

                setApprovalMessage(null);
                toast({ title: "Giriş Başarılı", description: "Yönlendiriliyorsunuz..." });
                setTimeout(() => {
                    if (userData.role === 'admin') navigate('/admin');
                    else if (userData.role === 'dietitian') navigate('/dietitian-dashboard');
                    else navigate('/dashboard');
                }, 500);
            } else {
                navigate('/dashboard');
            }
        } catch (error: unknown) {
            const errorDetail =
                typeof error === "object" &&
                error !== null &&
                "response" in error &&
                typeof (error as { response?: { data?: { detail?: string } } }).response?.data?.detail === "string"
                    ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
                    : undefined;
            setApprovalMessage(null);
            toast({ title: "Giriş Başarısız", description: errorDetail || "E-posta veya şifre hatalı", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    // Google OAuth Success Handler
    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) {
            toast({ title: "Hata", description: "Google token alınamadı", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential })
            });
            const data = await res.json();

            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                const userRes = await fetch(`${API_BASE_URL}/api/v1/auth/me/full`, {
                    headers: { 'Authorization': `Bearer ${data.access_token}` }
                });
                const userData = await userRes.json();
                localStorage.setItem('user', JSON.stringify(userData));

                // Diyetisyen onay kontrolü
                if (userData.role === 'dietitian' && userData.is_approved === false) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('user');
                    setApprovalMessage("Diyetisyen hesabınız henüz onaylanmadı. Onay işlemi tamamlandığında e-posta ile bilgilendirileceksiniz.");
                    setIsLoading(false);
                    return;
                }

                setApprovalMessage(null);
                toast({ title: "Giriş Başarılı", description: "Google ile giriş yapıldı" });
                if (userData.role === 'admin') navigate('/admin');
                else if (userData.role === 'dietitian') navigate('/dietitian-dashboard');
                else navigate('/dashboard');
            } else {
                toast({ title: "Hata", description: data.detail || "Google ile giriş başarısız", variant: "destructive" });
            }
        } catch (error) {
            console.error('Google login error:', error);
            setApprovalMessage(null);
            toast({ title: "Hata", description: "Google ile giriş başarısız", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    // Google OAuth Error Handler
    const handleGoogleError = () => {
        toast({ title: "Hata", description: "Google ile giriş başarısız. Lütfen tekrar deneyin.", variant: "destructive" });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
            <div className="w-full max-w-md glass-card p-8">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-neon-gradient flex items-center justify-center neon-glow">
                            <Leaf className="w-7 h-7 text-primary-foreground" />
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold gradient-text">Giriş Yap</h1>
                    <p className="text-muted-foreground mt-2">Hesabınıza giriş yapın</p>
                </div>

                {/* Google ile Giriş */}
                <div className="flex justify-center mb-4">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="outline"
                        size="large"
                        width="350"
                        text="signin_with"
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

                {approvalMessage && (
                    <Alert className="mb-6 border-amber-500/30 bg-amber-500/10 text-foreground">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <AlertTitle>Diyetisyen onayı bekleniyor</AlertTitle>
                        <AlertDescription>{approvalMessage}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-foreground">E-posta</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-12 mt-1 px-4 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
                            placeholder="ornek@email.com"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground">Şifre</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-12 mt-1 px-4 pr-12 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
                                placeholder="••••••••"
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
                    </div>
                    <Button type="submit" variant="default" className="w-full h-12 text-white font-bold relative z-10" disabled={isLoading}>
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Giriş yapılıyor...</> : "Giriş Yap"}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <span className="text-muted-foreground">Hesabınız yok mu? </span>
                    <Link to="/register" className="text-primary hover:underline font-medium">Kayıt Ol</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
