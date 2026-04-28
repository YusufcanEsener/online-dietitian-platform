import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  Activity,
  TrendingUp,
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  BarChart3,
  Leaf,
  Settings,
  LogOut,
  Bell,
  Loader2,
  X,
  Edit,
  Stethoscope,
  UserPlus,
  Mail,
  Lock,
  Briefcase,
  Award,
  FileText,
  Trash2,
  Power,
  Eye,
  EyeOff,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import * as adminService from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import type { AdminStats, User, Dietitian } from "@/types";

type TabType = "overview" | "users" | "dietitian";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", password: "" });
  const [isUpdating, setIsUpdating] = useState(false);

  // Dietitian state
  const [dietitianInfo, setDietitianInfo] = useState<adminService.DietitianInfo | null>(null);
  const [dietitianLoading, setDietitianLoading] = useState(false);
  const [showDietitianForm, setShowDietitianForm] = useState(false);
  const [isEditingDietitian, setIsEditingDietitian] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [dietitianForm, setDietitianForm] = useState<adminService.DietitianCreateData>({
    email: "",
    password: "",
    full_name: "",
    title: "",
    specialization: "",
    experience_years: 0,
    bio: "",
  });
  const [dietitianSaving, setDietitianSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!authLoading && user && user.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    const loadData = async () => {
      try {
        const [statsData, usersData] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getAllUsers()
        ]);
        setStats(statsData);
        setAllUsers(usersData);
      } catch (error) {
        console.error("Error loading admin data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      loadData();
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // Load dietitian info when tab changes
  useEffect(() => {
    if (activeTab === "dietitian") {
      loadDietitianInfo();
    }
  }, [activeTab]);

  const loadDietitianInfo = async () => {
    setDietitianLoading(true);
    try {
      const info = await adminService.getDietitian();
      setDietitianInfo(info);
      if (!info.exists) {
        setShowDietitianForm(true);
        setIsEditingDietitian(false);
      }
    } catch (error) {
      console.error("Error loading dietitian info:", error);
    } finally {
      setDietitianLoading(false);
    }
  };

  const handleToggleUserActive = async (userId: string) => {
    try {
      const result = await adminService.toggleUserActive(userId);
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: result.is_active } : u));
      toast({ title: "Başarılı", description: `Kullanıcı ${result.is_active ? "aktifleştirildi" : "askıya alındı"}` });
    } catch (error: any) {
      toast({ title: "Hata", description: error.response?.data?.detail || "İşlem başarısız", variant: "destructive" });
    }
  };

  const handleEditUser = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setEditForm({
      full_name: userToEdit.full_name || "",
      email: userToEdit.email,
      password: ""
    });
    setEditModalOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setIsUpdating(true);
    try {
      const updateData: any = {};
      if (editForm.full_name !== editingUser.full_name) updateData.full_name = editForm.full_name;
      if (editForm.email !== editingUser.email) updateData.email = editForm.email;
      if (editForm.password) updateData.password = editForm.password;

      const updatedUser = await adminService.updateUser(editingUser.id, updateData);
      setAllUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...updatedUser } : u));
      setEditModalOpen(false);
      setEditingUser(null);
      toast({ title: "Başarılı", description: "Kullanıcı bilgileri güncellendi" });
    } catch (error: any) {
      toast({ title: "Hata", description: error.response?.data?.detail || "Güncelleme başarısız", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  // Dietitian handlers
  const handleCreateDietitian = async () => {
    if (!dietitianForm.email || !dietitianForm.password || !dietitianForm.full_name) {
      toast({ title: "Hata", description: "Ad Soyad, E-posta ve Şifre zorunludur", variant: "destructive" });
      return;
    }
    setDietitianSaving(true);
    try {
      await adminService.createDietitian(dietitianForm);
      toast({ title: "Başarılı", description: "Diyetisyen hesabı oluşturuldu!" });
      setShowDietitianForm(false);
      setDietitianForm({ email: "", password: "", full_name: "", title: "", specialization: "", experience_years: 0, bio: "" });
      await loadDietitianInfo();
    } catch (error: any) {
      toast({ title: "Hata", description: error.response?.data?.detail || "Diyetisyen oluşturulamadı", variant: "destructive" });
    } finally {
      setDietitianSaving(false);
    }
  };

  const handleEditDietitian = () => {
    if (!dietitianInfo?.dietitian) return;
    const d = dietitianInfo.dietitian;
    setDietitianForm({
      email: d.email,
      password: "",
      full_name: d.full_name || "",
      title: d.title || "",
      specialization: d.specialization || "",
      experience_years: d.experience_years || 0,
      bio: d.bio || "",
    });
    setIsEditingDietitian(true);
    setShowDietitianForm(true);
  };

  const handleUpdateDietitian = async () => {
    if (!dietitianInfo?.dietitian) return;
    setDietitianSaving(true);
    try {
      await adminService.updateDietitian(dietitianInfo.dietitian.id, dietitianForm);
      toast({ title: "Başarılı", description: "Diyetisyen bilgileri güncellendi" });
      setShowDietitianForm(false);
      setIsEditingDietitian(false);
      await loadDietitianInfo();
    } catch (error: any) {
      toast({ title: "Hata", description: error.response?.data?.detail || "Güncelleme başarısız", variant: "destructive" });
    } finally {
      setDietitianSaving(false);
    }
  };

  const handleToggleDietitianActive = async () => {
    if (!dietitianInfo?.dietitian) return;
    try {
      const result = await adminService.toggleDietitianActive(dietitianInfo.dietitian.id);
      toast({ title: "Başarılı", description: result.message });
      await loadDietitianInfo();
    } catch (error: any) {
      toast({ title: "Hata", description: error.response?.data?.detail || "İşlem başarısız", variant: "destructive" });
    }
  };

  const handleDeleteDietitian = async () => {
    if (!dietitianInfo?.dietitian) return;
    if (!window.confirm("Diyetisyen hesabını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) return;
    try {
      await adminService.deleteDietitian(dietitianInfo.dietitian.id);
      toast({ title: "Başarılı", description: "Diyetisyen hesabı silindi" });
      setDietitianInfo({ exists: false, dietitian: null });
      setShowDietitianForm(true);
      setIsEditingDietitian(false);
      setDietitianForm({ email: "", password: "", full_name: "", title: "", specialization: "", experience_years: 0, bio: "" });
    } catch (error: any) {
      toast({ title: "Hata", description: error.response?.data?.detail || "Silme başarısız", variant: "destructive" });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activityData = [
    { day: "Pzt", users: Math.floor((stats?.total_users || 0) * 0.12), appointments: 45 },
    { day: "Sal", users: Math.floor((stats?.total_users || 0) * 0.14), appointments: 62 },
    { day: "Çar", users: Math.floor((stats?.total_users || 0) * 0.16), appointments: 78 },
    { day: "Per", users: Math.floor((stats?.total_users || 0) * 0.13), appointments: 55 },
    { day: "Cum", users: Math.floor((stats?.total_users || 0) * 0.18), appointments: 90 },
    { day: "Cmt", users: Math.floor((stats?.total_users || 0) * 0.08), appointments: 30 },
    { day: "Paz", users: Math.floor((stats?.total_users || 0) * 0.06), appointments: 20 },
  ];
  const maxValue = Math.max(...activityData.map(d => Math.max(d.users, d.appointments)), 1);


  return (
    <div className="min-h-screen bg-background flex">
      {/* Admin Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 h-screen bg-sidebar border-r border-sidebar-border fixed left-0 top-0 z-40">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-xl bg-neon-gradient flex items-center justify-center neon-glow">
            <Leaf className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <span className="text-xl font-bold gradient-text">DietPlatform</span>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
              activeTab === "overview"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Genel Bakış</span>
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
              activeTab === "users"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Kullanıcılar</span>
          </button>
          <button
            onClick={() => setActiveTab("dietitian")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
              activeTab === "dietitian"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <Stethoscope className="w-5 h-5" />
            <span className="font-medium">Diyetisyen Yönetimi</span>
          </button>
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-300"
          >
            <Activity className="w-5 h-5" />
            <span className="font-medium">Kullanıcı Paneline Dön</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.full_name || "Admin"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || "admin@dietplatform.com"}</p>
            </div>
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="p-2 rounded-lg hover:bg-sidebar-border transition-colors"
              title="Çıkış Yap"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72">
        {/* Header */}
        <header className="sticky top-0 z-30 glass border-b border-border/50 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-foreground">
                {activeTab === "overview" && "Genel Bakış"}
                {activeTab === "users" && "Kullanıcı Yönetimi"}
                {activeTab === "dietitian" && "Diyetisyen Yönetimi"}
              </h1>
              <p className="text-sm text-muted-foreground">Hoş geldiniz, Admin</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-3 rounded-xl glass hover:neon-border transition-all duration-300">
                <Bell className="w-5 h-5 text-foreground" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive animate-pulse" />
              </button>
              <Button variant="glass" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {activeTab === "overview" && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="glass-card p-6 group hover:neon-border transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats?.total_users || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">Toplam Kullanıcı</p>
                </div>
                <div className="glass-card p-6 group hover:neon-border transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserCheck className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats?.active_subscriptions || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">Aktif Abonelik</p>
                </div>
                <div className="glass-card p-6 group hover:neon-border transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats?.total_chats || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">Toplam Sohbet</p>
                </div>
                <div className="glass-card p-6 group hover:neon-border transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stats?.total_members || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">Aktif Üye</p>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Activity Chart */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-6">Haftalık Aktivite</h3>
                  <div className="flex items-end justify-between gap-2 h-48">
                    {activityData.map((item) => (
                      <div key={item.day} className="flex-1 flex flex-col items-center gap-1">
                        <div className="relative w-full h-40 flex items-end justify-center gap-1">
                          <div
                            className="w-3 rounded-t-sm bg-gradient-to-t from-primary to-accent transition-all duration-500"
                            style={{ height: `${(item.users / maxValue) * 100}%` }}
                          />
                          <div
                            className="w-3 rounded-t-sm bg-gradient-to-t from-blue-500 to-cyan-400 transition-all duration-500"
                            style={{ height: `${(item.appointments / maxValue) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{item.day}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-accent" />
                      <span className="text-muted-foreground">Yeni Kullanıcı</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
                      <span className="text-muted-foreground">Randevu</span>
                    </div>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-6">Hızlı İstatistikler</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface">
                      <span className="text-sm text-muted-foreground">Aktif Abonelikler</span>
                      <span className="text-sm font-bold text-foreground">{stats?.active_subscriptions || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface">
                      <span className="text-sm text-muted-foreground">Toplam Mesajlar</span>
                      <span className="text-sm font-bold text-foreground">{stats?.total_messages || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface">
                      <span className="text-sm text-muted-foreground">Toplam Planlar</span>
                      <span className="text-sm font-bold text-foreground">{stats?.total_plans || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Users Table */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Son Kayıt Olan Kullanıcılar</h3>
                  <Button variant="glass" size="sm" onClick={() => setActiveTab("users")}>
                    Tümünü Gör
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Kullanıcı</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Plan</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Durum</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Katılım</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.slice(0, 5).map((user) => (
                        <tr key={user.id} className="border-b border-border/50 hover:bg-surface transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-xs font-bold">
                                {user.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{user.full_name || "İsimsiz"}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === "dietitian"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                              }`}>
                              {user.role === "member" ? "Üye" : user.role === "dietitian" ? "Diyetisyen" : "Admin"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`flex items-center gap-1 text-sm ${user.is_active ? "text-green-400" : "text-muted-foreground"
                              }`}>
                              <span className={`w-2 h-2 rounded-full ${user.is_active ? "bg-green-400" : "bg-muted-foreground"
                                }`} />
                              {user.is_active ? "Aktif" : "Pasif"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{user.role}</td>
                          <td className="py-3 px-4 text-right">
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Kullanıcı ara..."
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="glass">Tüm Planlar</Button>
                  <Button variant="glass">Tüm Durumlar</Button>
                </div>
              </div>

              {/* Users Table */}
              <div className="glass-card p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Kullanıcı</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Plan</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Durum</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Katılım</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((user, index) => (
                        <tr key={`${user.id}-${index}`} className="border-b border-border/50 hover:bg-surface transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                                {user.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{user.full_name || "İsimsiz"}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.role === "dietitian"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                              }`}>
                              {user.role === "member" ? "Üye" : user.role === "dietitian" ? "Diyetisyen" : "Admin"}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`flex items-center gap-2 text-sm ${user.is_active ? "text-green-400" : "text-muted-foreground"
                              }`}>
                              <span className={`w-2 h-2 rounded-full ${user.is_active ? "bg-green-400" : "bg-muted-foreground"
                                }`} />
                              {user.is_active ? "Aktif" : "Pasif"}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-muted-foreground">{user.role}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="glass" size="sm" onClick={() => handleEditUser(user)}>
                                <Edit className="w-4 h-4 mr-1" />
                                Düzenle
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleToggleUserActive(user.id)}
                              >
                                {user.is_active ? "Askıya Al" : "Aktifleştir"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* DİYETİSYEN YÖNETİMİ SEKMESİ */}
          {/* ============================================ */}
          {activeTab === "dietitian" && (
            <div className="space-y-6">
              {dietitianLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Mevcut Diyetisyen Kartı */}
                  {dietitianInfo?.exists && dietitianInfo.dietitian && !showDietitianForm && (
                    <div className="space-y-6">
                      {/* Profile Card */}
                      <div className="glass-card p-8 relative overflow-hidden">
                        {/* Background gradient accent */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

                        <div className="relative z-10">
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            {/* Avatar */}
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                              <Stethoscope className="w-12 h-12 text-white" />
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h2 className="text-2xl font-bold text-foreground">
                                  {dietitianInfo.dietitian.full_name}
                                </h2>
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-xs font-semibold",
                                  dietitianInfo.dietitian.is_active
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                                )}>
                                  {dietitianInfo.dietitian.is_active ? "● Aktif" : "● Pasif"}
                                </span>
                              </div>
                              {dietitianInfo.dietitian.title && (
                                <p className="text-primary font-medium mb-1">{dietitianInfo.dietitian.title}</p>
                              )}
                              <p className="text-sm text-muted-foreground">{dietitianInfo.dietitian.email}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <Button variant="glass" size="sm" onClick={handleEditDietitian}>
                                <Edit className="w-4 h-4 mr-2" />
                                Düzenle
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleToggleDietitianActive}
                                className={dietitianInfo.dietitian.is_active ? "text-amber-400 hover:bg-amber-500/10" : "text-green-400 hover:bg-green-500/10"}
                              >
                                <Power className="w-4 h-4 mr-2" />
                                {dietitianInfo.dietitian.is_active ? "Pasifleştir" : "Aktifleştir"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={handleDeleteDietitian}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Sil
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Detail Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="glass-card p-6 hover:neon-border transition-all duration-300">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                              <Briefcase className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm text-muted-foreground">Uzmanlık Alanı</span>
                          </div>
                          <p className="text-foreground font-medium">
                            {dietitianInfo.dietitian.specialization || "Belirtilmemiş"}
                          </p>
                        </div>
                        <div className="glass-card p-6 hover:neon-border transition-all duration-300">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center">
                              <Award className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm text-muted-foreground">Deneyim</span>
                          </div>
                          <p className="text-foreground font-medium">
                            {dietitianInfo.dietitian.experience_years} Yıl
                          </p>
                        </div>
                        <div className="glass-card p-6 hover:neon-border transition-all duration-300">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm text-muted-foreground">Biyografi</span>
                          </div>
                          <p className="text-foreground text-sm leading-relaxed">
                            {dietitianInfo.dietitian.bio || "Biyografi belirtilmemiş"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Diyetisyen Oluşturma / Düzenleme Formu */}
                  {showDietitianForm && (
                    <div className="max-w-2xl mx-auto">
                      <div className="glass-card p-8 relative overflow-hidden">
                        {/* Background accent */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-bl from-primary/20 to-transparent rounded-full" />
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-accent/20 to-transparent rounded-full" />

                        <div className="relative z-10">
                          {/* Header */}
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                                {isEditingDietitian ? (
                                  <Edit className="w-7 h-7 text-white" />
                                ) : (
                                  <UserPlus className="w-7 h-7 text-white" />
                                )}
                              </div>
                              <div>
                                <h2 className="text-xl font-bold text-foreground">
                                  {isEditingDietitian ? "Diyetisyen Düzenle" : "Yeni Diyetisyen Oluştur"}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                  {isEditingDietitian ? "Mevcut diyetisyen bilgilerini güncelleyin" : "Sistem için bir diyetisyen hesabı oluşturun"}
                                </p>
                              </div>
                            </div>
                            {dietitianInfo?.exists && (
                              <button
                                onClick={() => { setShowDietitianForm(false); setIsEditingDietitian(false); }}
                                className="p-2 rounded-lg hover:bg-surface transition-colors"
                              >
                                <X className="w-5 h-5 text-muted-foreground" />
                              </button>
                            )}
                          </div>

                          {/* Form */}
                          <div className="space-y-5">
                            {/* Ad Soyad */}
                            <div>
                              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                                <UserCheck className="w-4 h-4 text-primary" />
                                Ad Soyad <span className="text-destructive">*</span>
                              </label>
                              <input
                                type="text"
                                value={dietitianForm.full_name}
                                onChange={(e) => setDietitianForm(prev => ({ ...prev, full_name: e.target.value }))}
                                className="w-full h-12 px-4 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
                                placeholder="Uzm. Dyt. Örnek İsim"
                              />
                            </div>

                            {/* E-posta ve Şifre - yan yana */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                                  <Mail className="w-4 h-4 text-primary" />
                                  E-posta <span className="text-destructive">*</span>
                                </label>
                                <input
                                  type="email"
                                  value={dietitianForm.email}
                                  onChange={(e) => setDietitianForm(prev => ({ ...prev, email: e.target.value }))}
                                  className="w-full h-12 px-4 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
                                  placeholder="diyetisyen@ornek.com"
                                />
                              </div>
                              <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                                  <Lock className="w-4 h-4 text-primary" />
                                  Şifre {!isEditingDietitian && <span className="text-destructive">*</span>}
                                  {isEditingDietitian && <span className="text-muted-foreground text-xs">(boş bırakılırsa değişmez)</span>}
                                </label>
                                <div className="relative">
                                  <input
                                    type={showPassword ? "text" : "password"}
                                    value={dietitianForm.password}
                                    onChange={(e) => setDietitianForm(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full h-12 px-4 pr-12 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
                                    placeholder="••••••••"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-surface transition-colors"
                                  >
                                    {showPassword ? (
                                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                      <Eye className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Ünvan */}
                            <div>
                              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                                <Award className="w-4 h-4 text-primary" />
                                Ünvan
                              </label>
                              <input
                                type="text"
                                value={dietitianForm.title}
                                onChange={(e) => setDietitianForm(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full h-12 px-4 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
                                placeholder="Uzman Diyetisyen"
                              />
                            </div>

                            {/* Uzmanlık ve Deneyim - yan yana */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                                  <Briefcase className="w-4 h-4 text-primary" />
                                  Uzmanlık Alanı
                                </label>
                                <input
                                  type="text"
                                  value={dietitianForm.specialization}
                                  onChange={(e) => setDietitianForm(prev => ({ ...prev, specialization: e.target.value }))}
                                  className="w-full h-12 px-4 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
                                  placeholder="Klinik Beslenme"
                                />
                              </div>
                              <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                                  <TrendingUp className="w-4 h-4 text-primary" />
                                  Deneyim (Yıl)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="50"
                                  value={dietitianForm.experience_years}
                                  onChange={(e) => setDietitianForm(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                                  className="w-full h-12 px-4 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
                                  placeholder="0"
                                />
                              </div>
                            </div>

                            {/* Biyografi */}
                            <div>
                              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Biyografi
                              </label>
                              <textarea
                                value={dietitianForm.bio}
                                onChange={(e) => setDietitianForm(prev => ({ ...prev, bio: e.target.value }))}
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground resize-none"
                                placeholder="Diyetisyen hakkında kısa bir biyografi yazın..."
                              />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                              {dietitianInfo?.exists && (
                                <Button
                                  variant="ghost"
                                  className="flex-1"
                                  onClick={() => { setShowDietitianForm(false); setIsEditingDietitian(false); }}
                                >
                                  İptal
                                </Button>
                              )}
                              <Button
                                variant="neon"
                                className="flex-1"
                                onClick={isEditingDietitian ? handleUpdateDietitian : handleCreateDietitian}
                                disabled={dietitianSaving}
                              >
                                {dietitianSaving ? (
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                  <Save className="w-4 h-4 mr-2" />
                                )}
                                {isEditingDietitian ? "Güncelle" : "Diyetisyen Oluştur"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}


        </div>
      </main>

      {/* Edit User Modal */}
      {editModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditModalOpen(false)} />
          <div className="relative glass-card p-6 w-full max-w-md m-4 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Kullanıcı Düzenle</h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-2 rounded-lg hover:bg-surface transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
                  placeholder="Ad Soyad"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  E-posta
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
                  placeholder="E-posta"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Yeni Şifre <span className="text-muted-foreground">(boş bırakılırsa değişmez)</span>
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
                  placeholder="Yeni şifre"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setEditModalOpen(false)}
              >
                İptal
              </Button>
              <Button
                variant="neon"
                className="flex-1"
                onClick={handleUpdateUser}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Kaydet
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
