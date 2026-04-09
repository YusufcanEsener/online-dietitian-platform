import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  User,
  Mail,
  Edit2,
  Award,
  Target,
  TrendingUp,
  Heart,
  Loader2,
  X,
  Save
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import * as memberService from "@/services/memberService";
import { useToast } from "@/hooks/use-toast";
import type { Member, Dietitian, MemberUpdate, Gender, ActivityLevel } from "@/types";

const achievements = [
  { icon: "🎯", title: "İlk Hedef", description: "İlk kilo hedefinize ulaştınız" },
  { icon: "🔥", title: "7 Gün Serisi", description: "7 gün üst üste kalori takibi" },
  { icon: "💧", title: "Su Ustası", description: "Günlük su hedefini 30 gün tuttunuz" },
  { icon: "🥗", title: "Sağlıklı Seçim", description: "50 sağlıklı yemek kaydettiniz" },
];

const genderOptions: { value: Gender; label: string }[] = [
  { value: "male", label: "Erkek" },
  { value: "female", label: "Kadın" },
  { value: "other", label: "Diğer" },
];

const activityOptions: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Hareketsiz" },
  { value: "light", label: "Hafif Aktif" },
  { value: "moderate", label: "Orta Aktif" },
  { value: "active", label: "Aktif" },
  { value: "very_active", label: "Çok Aktif" },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const { toast } = useToast();
  const [memberData, setMemberData] = useState<Member | null>(null);
  const [myDietitian, setMyDietitian] = useState<Dietitian | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editForm, setEditForm] = useState<MemberUpdate>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        if (user?.role === "member") {
          const data = await memberService.getMeFull();
          setMemberData(data);
          setEditForm({
            full_name: data.full_name || "",
            height: data.height || undefined,
            weight: data.weight || undefined,
            target_weight: data.target_weight || undefined,
            birth_date: data.birth_date || undefined,
            gender: data.gender || undefined,
            activity_level: data.activity_level || undefined,
            phone: data.phone || undefined,
            city: data.city || undefined,
          });
          try {
            const dietitian = await memberService.getMyDietitian();
            setMyDietitian(dietitian);
          } catch { setMyDietitian(null); }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      loadData();
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await memberService.updateProfile(editForm);
      setMemberData(updated);
      await refreshUser();
      toast({ title: "Başarılı", description: "Profil güncellendi" });
      setIsEditing(false);
    } catch (error: any) {
      toast({ title: "Hata", description: error.response?.data?.detail || "Güncelleme başarısız", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateBMI = () => {
    if (memberData?.weight && memberData?.height) {
      const heightM = memberData.height / 100;
      return (memberData.weight / (heightM * heightM)).toFixed(1);
    }
    return "-";
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = user?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?";

  const healthStats = [
    { label: "Boy", value: memberData?.height ? `${memberData.height} cm` : "-", icon: Target },
    { label: "Kilo", value: memberData?.weight ? `${memberData.weight} kg` : "-", icon: TrendingUp },
    { label: "BMI", value: calculateBMI(), icon: Heart },
    { label: "Hedef", value: memberData?.target_weight ? `${memberData.target_weight} kg` : "-", icon: Award },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8">
        {/* Header Card */}
        <div className="glass-card p-6 lg:p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-3xl lg:text-4xl font-bold neon-glow">
                {initials}
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-110 transition-transform"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{user?.full_name || "Kullanıcı"}</h1>
              <p className="text-muted-foreground mt-1">
                {memberData?.subscription_status ? "Premium Üye" : "Ücretsiz Üye"}
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
              </div>

              {myDietitian && (
                <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-4">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    Diyetisyen: {myDietitian.full_name}
                  </span>
                </div>
              )}
            </div>

            <Button variant="glass" className="hidden lg:flex" onClick={() => setIsEditing(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Profili Düzenle
            </Button>
          </div>
        </div>

        {/* Health Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {healthStats.map((stat) => (
            <div key={stat.label} className="glass-card p-4 lg:p-6 text-center">
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Info */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Kişisel Bilgiler
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Ad Soyad</span>
                <span className="text-foreground font-medium">{user?.full_name || "-"}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">E-posta</span>
                <span className="text-foreground font-medium">{user?.email || "-"}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Cinsiyet</span>
                <span className="text-foreground font-medium">
                  {genderOptions.find(g => g.value === memberData?.gender)?.label || "-"}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Aktivite Seviyesi</span>
                <span className="text-foreground font-medium">
                  {activityOptions.find(a => a.value === memberData?.activity_level)?.label || "-"}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-muted-foreground">Şehir</span>
                <span className="text-foreground font-medium">{memberData?.city || "-"}</span>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Başarılar
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-surface hover:bg-surface-elevated transition-colors text-center group"
                >
                  <span className="text-3xl mb-2 block group-hover:scale-110 transition-transform">{achievement.icon}</span>
                  <p className="font-medium text-foreground text-sm">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="mt-8 glass-card p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-neon-gradient opacity-5" />
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${memberData?.subscription_status ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {memberData?.subscription_status ? "PREMIUM" : "ÜCRETSİZ"}
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground">
                {memberData?.subscription_status ? "Premium Üyelik" : "Ücretsiz Plan"}
              </h3>
              <p className="text-muted-foreground">
                {memberData?.subscription_status
                  ? "Sınırsız uzman erişimi, AI desteği ve daha fazlası"
                  : "Premium'a yükseltin ve tüm özelliklere erişin"
                }
              </p>
            </div>
            {!memberData?.subscription_status && (
              <Button variant="neon">Premium'a Yükselt</Button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Profili Düzenle</h2>
              <button onClick={() => setIsEditing(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Ad Soyad</label>
                <input
                  type="text"
                  value={editForm.full_name || ""}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full h-10 mt-1 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Boy (cm)</label>
                  <input
                    type="number"
                    value={editForm.height || ""}
                    onChange={(e) => setEditForm({ ...editForm, height: Number(e.target.value) || undefined })}
                    className="w-full h-10 mt-1 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground"
                    placeholder="175"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Kilo (kg)</label>
                  <input
                    type="number"
                    value={editForm.weight || ""}
                    onChange={(e) => setEditForm({ ...editForm, weight: Number(e.target.value) || undefined })}
                    className="w-full h-10 mt-1 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground"
                    placeholder="70"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Hedef Kilo (kg)</label>
                <input
                  type="number"
                  value={editForm.target_weight || ""}
                  onChange={(e) => setEditForm({ ...editForm, target_weight: Number(e.target.value) || undefined })}
                  className="w-full h-10 mt-1 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground"
                  placeholder="65"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Cinsiyet</label>
                <select
                  value={editForm.gender || ""}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value as Gender || undefined })}
                  className="w-full h-10 mt-1 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground"
                >
                  <option value="">Seçiniz</option>
                  {genderOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Aktivite Seviyesi</label>
                <select
                  value={editForm.activity_level || ""}
                  onChange={(e) => setEditForm({ ...editForm, activity_level: e.target.value as ActivityLevel || undefined })}
                  className="w-full h-10 mt-1 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground"
                >
                  <option value="">Seçiniz</option>
                  {activityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Doğum Tarihi</label>
                <input
                  type="date"
                  value={editForm.birth_date || ""}
                  onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value || undefined })}
                  className="w-full h-10 mt-1 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Telefon</label>
                  <input
                    type="tel"
                    value={editForm.phone || ""}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value || undefined })}
                    className="w-full h-10 mt-1 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground"
                    placeholder="+90 555 123 4567"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Şehir</label>
                  <input
                    type="text"
                    value={editForm.city || ""}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value || undefined })}
                    className="w-full h-10 mt-1 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground"
                    placeholder="İstanbul"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-border">
              <Button variant="glass" className="flex-1" onClick={() => setIsEditing(false)}>
                İptal
              </Button>
              <Button variant="neon" className="flex-1" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Kaydet
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Profile;
