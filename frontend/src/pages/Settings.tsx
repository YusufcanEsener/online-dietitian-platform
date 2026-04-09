import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Shield,
  Palette,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  Lock,
  X,
  Loader2,
  Check
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { changePassword } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Password change modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangedAt, setPasswordChangedAt] = useState<string | null>(null);

  useEffect(() => {
    // Get password_changed_at from user data if available
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed.password_changed_at) {
          setPasswordChangedAt(parsed.password_changed_at);
        }
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }, []);

  const getPasswordChangeText = () => {
    if (!passwordChangedAt) return "Henüz değiştirilmedi";
    const date = new Date(passwordChangedAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Bugün değiştirildi";
    if (diffDays === 1) return "Dün değiştirildi";
    return `${diffDays} gün önce değiştirildi`;
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({ title: "Hata", description: "Yeni şifreler eşleşmiyor", variant: "destructive" });
      return;
    }
    if (passwordForm.new_password.length < 6) {
      toast({ title: "Hata", description: "Şifre en az 6 karakter olmalı", variant: "destructive" });
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });

      // Update local storage with new password_changed_at
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.password_changed_at = result.password_changed_at;
        localStorage.setItem('user', JSON.stringify(parsed));
      }

      setPasswordChangedAt(result.password_changed_at);
      setPasswordModalOpen(false);
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      toast({ title: "Başarılı", description: "Şifreniz başarıyla değiştirildi" });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.response?.data?.detail || "Şifre değiştirme başarısız",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const settingsGroups = [
    {
      title: "Tercihler",
      items: [
        { icon: Bell, label: "Bildirimler", description: "Push ve e-posta bildirimleri", action: "toggle", enabled: true },
        { icon: Palette, label: "Görünüm", description: "Koyu tema aktif", action: "navigate" },
        { icon: Globe, label: "Dil", description: "Türkçe", action: "navigate" },
      ]
    },
    {
      title: "Güvenlik",
      items: [
        { icon: Lock, label: "Şifre Değiştir", description: getPasswordChangeText(), action: "password" },
        { icon: Shield, label: "İki Faktörlü Doğrulama", description: "Pasif", action: "toggle", enabled: false },
      ]
    },
    {
      title: "Destek",
      items: [
        { icon: HelpCircle, label: "Yardım Merkezi", description: "SSS ve rehberler", action: "navigate" },
      ]
    }
  ];

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-3xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            <span className="gradient-text">Ayarlar</span>
          </h1>
          <p className="text-muted-foreground">Hesap ve uygulama tercihlerinizi yönetin</p>
        </header>

        {/* Settings Groups */}
        <div className="space-y-8">
          {settingsGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                {group.title}
              </h3>
              <div className="glass-card divide-y divide-border">
                {group.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 hover:bg-surface transition-colors cursor-pointer"
                    onClick={() => {
                      if (item.action === "password") {
                        setPasswordModalOpen(true);
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>

                    {item.action === "toggle" ? (
                      <button
                        className={`relative w-12 h-6 rounded-full transition-colors ${item.enabled ? "bg-primary" : "bg-border"
                          }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${item.enabled ? "left-7" : "left-1"
                            }`}
                        />
                      </button>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="mt-8">
          <Button variant="destructive" className="w-full lg:w-auto" onClick={() => logout()}>
            <LogOut className="w-4 h-4 mr-2" />
            Çıkış Yap
          </Button>
        </div>

        {/* Version */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          DietPlatform v1.0.0
        </p>
      </div>

      {/* Password Change Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPasswordModalOpen(false)} />
          <div className="relative glass-card p-6 w-full max-w-md m-4 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Şifre Değiştir</h2>
              <button
                onClick={() => setPasswordModalOpen(false)}
                className="p-2 rounded-lg hover:bg-surface transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Mevcut Şifre
                </label>
                <input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
                  placeholder="Mevcut şifreniz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
                  placeholder="Yeni şifreniz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Yeni Şifre (Tekrar)
                </label>
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
                  placeholder="Yeni şifrenizi tekrar girin"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setPasswordModalOpen(false)}
              >
                İptal
              </Button>
              <Button
                variant="neon"
                className="flex-1"
                onClick={handlePasswordChange}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Değiştir
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Settings;
