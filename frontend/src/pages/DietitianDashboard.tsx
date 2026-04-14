import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Users,
    FileText,
    Star,
    TrendingUp,
    Plus,
    Loader2,
    LogOut,
    Leaf,
    MessageSquare,
    User,
    Calendar,
    Eye,
    Sparkles,
    Zap,
    Flame,
    HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import * as dietitianService from "@/services/dietitianDashboardService";
import { useToast } from "@/hooks/use-toast";
import type { DietitianStats, DietitianMember } from "@/services/dietitianDashboardService";
import NotificationBell from "@/components/NotificationBell";

const DietitianDashboard = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
    const { toast } = useToast();
    const [stats, setStats] = useState<DietitianStats | null>(null);
    const [members, setMembers] = useState<DietitianMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'plans'>('overview');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate("/login");
            return;
        }

        if (!authLoading && user && user.role !== "dietitian") {
            navigate("/dashboard");
            return;
        }

        const loadData = async () => {
            try {
                const [statsData, membersData] = await Promise.all([
                    dietitianService.getStats(),
                    dietitianService.getMyMembers(),
                ]);
                setStats(statsData);
                setMembers(membersData);
            } catch (error) {
                console.error("Error loading data:", error);
                toast({ title: "Hata", description: "Veriler yüklenemedi", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        if (!authLoading && isAuthenticated) {
            loadData();
        }
    }, [authLoading, isAuthenticated, user, navigate, toast]);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const initials = user?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?";

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="hidden lg:flex flex-col w-72 h-screen bg-sidebar border-r border-sidebar-border fixed left-0 top-0 z-40">
                <Link to="/" className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border hover:bg-sidebar-accent transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-neon-gradient flex items-center justify-center neon-glow">
                        <Leaf className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                        <span className="text-xl font-bold gradient-text">DietPlatform</span>
                        <p className="text-xs text-muted-foreground">Diyetisyen Paneli</p>
                    </div>
                </Link>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                            activeTab === 'overview'
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                    >
                        <TrendingUp className="w-5 h-5" />
                        <span className="font-medium">Genel Bakış</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                            activeTab === 'members'
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                    >
                        <Users className="w-5 h-5" />
                        <span className="font-medium">Danışanlarım</span>
                        <span className="ml-auto px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">
                            {members.length}
                        </span>
                    </button>
                    <Link
                        to="/messages"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-300"
                    >
                        <MessageSquare className="w-5 h-5" />
                        <span className="font-medium">Mesajlar</span>
                    </Link>
                    <Link
                        to="/dietitian/agentic-ai"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-300"
                    >
                        <Zap className="w-5 h-5 text-purple-500" />
                        <span className="font-medium">Agentic AI</span>
                    </Link>
                    <Link
                        to="/dietitian/detailed-calorie-calculator"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-300"
                    >
                        <Flame className="w-5 h-5 text-orange-500" />
                        <span className="font-medium">Detaylı Kalori</span>
                    </Link>
                    <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-300"
                    >
                        <User className="w-5 h-5" />
                        <span className="font-medium">Profilim</span>
                    </Link>
                </nav>

                {/* Guide & Help Section */}
                <div className="px-4 pb-4">
                    <Link
                        to="/guide/dietitian"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-primary bg-primary/5 hover:bg-primary/15 transition-all duration-300 border border-primary/20"
                    >
                        <HelpCircle className="w-5 h-5" />
                        <span className="font-medium text-sm">Nasıl Çalışır?</span>
                    </Link>
                </div>

                <div className="p-4 border-t border-sidebar-border">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <span className="text-sm font-bold text-primary-foreground">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.full_name || "Diyetisyen"}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
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
                <div className="p-4 lg:p-8">
                    {/* Header */}
                    <header className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                                Hoş geldiniz, <span className="gradient-text">{user?.full_name?.split(" ")[0]}</span>
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Danışanlarınızı ve beslenme programlarını yönetin
                            </p>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => navigate("/dietitian/daily-report")}
                                    className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:from-purple-500/20 hover:to-pink-500/20"
                                >
                                    <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                                    Günlük AI Raporu
                                </Button>
                            </div>
                        </div>
                        <NotificationBell />
                    </header>

                    {activeTab === 'overview' && (
                        <>
                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <div className="glass-card p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                            <Users className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">{stats?.total_members || 0}</p>
                                            <p className="text-sm text-muted-foreground">Toplam Danışan</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="glass-card p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                                            <TrendingUp className="w-6 h-6 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">{stats?.active_members || 0}</p>
                                            <p className="text-sm text-muted-foreground">Aktif Üye</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="glass-card p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                            <FileText className="w-6 h-6 text-purple-500" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">{stats?.active_plans || 0}</p>
                                            <p className="text-sm text-muted-foreground">Aktif Program</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="glass-card p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                            <Star className="w-6 h-6 text-amber-500" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">{stats?.rating?.toFixed(1) || "0.0"}</p>
                                            <p className="text-sm text-muted-foreground">Ortalama Puan</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Members */}
                            <div className="glass-card p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold text-foreground">Son Danışanlar</h2>
                                    <Button variant="glass" size="sm" onClick={() => setActiveTab('members')}>
                                        Tümünü Gör
                                    </Button>
                                </div>

                                {members.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">Henüz danışanınız bulunmuyor</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {members.slice(0, 5).map((member) => (
                                            <div key={member.id} className="flex items-center gap-4 p-4 rounded-xl bg-surface hover:bg-surface-elevated transition-colors cursor-pointer" onClick={() => navigate(`/dietitian/member/${member.id}`)}>
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
                                                    {member.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-foreground truncate">{member.full_name || "İsimsiz"}</p>
                                                    <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {member.subscription_status ? (
                                                        <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">Premium</span>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">Ücretsiz</span>
                                                    )}
                                                    {member.has_active_plan ? (
                                                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Programlı</span>
                                                    ) : (
                                                        <Button variant="neon" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/dietitian/create-plan/${member.id}`); }}>
                                                            <Plus className="w-4 h-4 mr-1" /> Program Oluştur
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'members' && (
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-foreground">Tüm Danışanlar ({members.length})</h2>
                            </div>

                            {members.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">Henüz danışanınız bulunmuyor</p>
                                    <p className="text-sm text-muted-foreground mt-2">Üyeler sizi seçtiğinde burada görünecektir</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {members.map((member) => (
                                        <div key={member.id} className="p-4 rounded-xl bg-surface hover:bg-surface-elevated transition-colors cursor-pointer" onClick={() => navigate(`/dietitian/member/${member.id}`)}>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                                                    {member.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-foreground truncate">{member.full_name || "İsimsiz"}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 text-center mb-4">
                                                <div className="p-2 rounded-lg bg-background">
                                                    <p className="text-sm font-bold text-foreground">{member.weight || "-"}</p>
                                                    <p className="text-xs text-muted-foreground">Kilo</p>
                                                </div>
                                                <div className="p-2 rounded-lg bg-background">
                                                    <p className="text-sm font-bold text-foreground">{member.height || "-"}</p>
                                                    <p className="text-xs text-muted-foreground">Boy</p>
                                                </div>
                                                <div className="p-2 rounded-lg bg-background">
                                                    <p className="text-sm font-bold text-foreground">{member.target_weight || "-"}</p>
                                                    <p className="text-xs text-muted-foreground">Hedef</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button variant="glass" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); navigate(`/dietitian/member/${member.id}`); }}>
                                                    <Eye className="w-4 h-4 mr-1" /> Detay
                                                </Button>
                                                {member.has_active_plan ? (
                                                    <Button variant="glass" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); }}>
                                                        <FileText className="w-4 h-4 mr-1" /> Programı Düzenle
                                                    </Button>
                                                ) : (
                                                    <Button variant="neon" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); navigate(`/dietitian/create-plan/${member.id}`); }}>
                                                        <Plus className="w-4 h-4 mr-1" /> Program Oluştur
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default DietitianDashboard;
