import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    User,
    Target,
    Calendar,
    FileText,
    TrendingUp,
    Loader2,
    Plus,
    Edit,
    Check,
    X,
    Sparkles,
    Calculator
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import * as dietitianService from "@/services/dietitianDashboardService";
import * as aiService from "@/services/aiService";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/contexts/NotificationContext";
import NotificationBell from "@/components/NotificationBell";
import type { MemberFullDetail, PlanSummary, DailyLogEntry } from "@/services/dietitianDashboardService";

const MemberDetail = () => {
    const { memberId } = useParams<{ memberId: string }>();
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { toast } = useToast();
    const { addNotification } = useNotifications();

    const [member, setMember] = useState<MemberFullDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'profile' | 'plans' | 'logs' | 'ai'>('profile');

    // AI State
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAIAnalyze = async () => {
        if (!memberId) return;

        setIsAnalyzing(true);
        setActiveTab('ai');

        try {
            const result = await aiService.analyzeMemberWithAI(memberId);

            if (result.success && result.analysis) {
                setAiAnalysis(result.analysis);
                addNotification({
                    title: '🤖 AI Analizi Tamamlandı',
                    message: `${member?.full_name || 'Danışan'} için AI analiz raporu hazırlandı.`,
                    type: 'info'
                });
            } else {
                toast({
                    title: "AI Analiz Hatası",
                    description: result.error || "Analiz yapılamadı",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error("AI analysis error:", error);
            toast({
                title: "Bağlantı Hatası",
                description: "n8n'e bağlanılamadı. n8n'in çalıştığından emin olun.",
                variant: "destructive"
            });
        } finally {
            setIsAnalyzing(false);
        }
    };


    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate("/login");
            return;
        }
        if (!authLoading && user?.role !== "dietitian") {
            navigate("/dashboard");
            return;
        }

        const loadMember = async () => {
            if (!memberId) return;
            try {
                const data = await dietitianService.getMemberDetail(memberId);
                setMember(data as MemberFullDetail);
            } catch (error) {
                console.error("Error loading member:", error);
                toast({ title: "Hata", description: "Danışan bilgileri yüklenemedi", variant: "destructive" });
                navigate("/dietitian-dashboard");
            } finally {
                setIsLoading(false);
            }
        };

        if (!authLoading && isAuthenticated && memberId) {
            loadMember();
        }
    }, [authLoading, isAuthenticated, user, memberId, navigate, toast]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!member) return null;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-30 glass border-b border-border/50 px-4 lg:px-8 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/dietitian-dashboard")}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">{member.full_name || 'Danışan'}</h1>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={() => navigate(`/dietitian/detailed-calorie-calculator?memberId=${memberId}`)}>
                            <Calculator className="w-4 h-4 mr-2" />
                            Detaylı Kalori Hesapla
                        </Button>
                        <Button variant="outline" onClick={handleAIAnalyze} disabled={isAnalyzing}>
                            {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            AI Analiz
                        </Button>
                        <Button variant="neon" onClick={() => navigate(`/dietitian/create-plan/${memberId}`)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Yeni Program Oluştur
                        </Button>
                        <NotificationBell />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">


                {/* Tab Navigation */}
                <div className="flex gap-2 border-b border-border pb-2">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-surface'
                            }`}
                    >
                        <User className="w-4 h-4 inline mr-2" />
                        Profil
                    </button>
                    <button
                        onClick={() => setActiveTab('plans')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'plans'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-surface'
                            }`}
                    >
                        <FileText className="w-4 h-4 inline mr-2" />
                        Beslenme Programları ({member.all_plans?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'logs'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-surface'
                            }`}
                    >
                        <TrendingUp className="w-4 h-4 inline mr-2" />
                        Günlük Loglar ({member.daily_logs?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ai'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'text-muted-foreground hover:bg-surface'
                            }`}
                    >
                        <Sparkles className="w-4 h-4 inline mr-2" />
                        AI Analiz
                    </button>
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="glass-card p-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-4">Kişisel Bilgiler</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Ad Soyad</span>
                                    <span className="font-medium">{member.full_name || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">E-posta</span>
                                    <span className="font-medium">{member.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Cinsiyet</span>
                                    <span className="font-medium">
                                        {member.gender === 'male' ? 'Erkek' : member.gender === 'female' ? 'Kadın' : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Doğum Tarihi</span>
                                    <span className="font-medium">
                                        {member.birth_date ? formatDate(member.birth_date) : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-4">Fiziksel Bilgiler</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Mevcut Kilo</span>
                                    <span className="font-medium text-lg">{member.weight ? `${member.weight} kg` : '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Boy</span>
                                    <span className="font-medium">{member.height ? `${member.height} cm` : '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Hedef Kilo</span>
                                    <span className="font-medium text-primary">{member.target_weight ? `${member.target_weight} kg` : '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Aktivite Seviyesi</span>
                                    <span className="font-medium">{member.activity_level || '-'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-4">Abonelik Durumu</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Durum</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${member.subscription_status
                                        ? 'bg-green-500/10 text-green-500'
                                        : 'bg-red-500/10 text-red-500'
                                        }`}>
                                        {member.subscription_status ? 'Aktif' : 'Pasif'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Aktif Program</span>
                                    <span className={`flex items-center gap-1 ${member.active_plan ? 'text-green-500' : 'text-yellow-500'
                                        }`}>
                                        {member.active_plan ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                        {member.active_plan ? 'Var' : 'Yok'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Plans Tab */}
                {activeTab === 'plans' && (
                    <div className="space-y-4">
                        {member.all_plans && member.all_plans.length > 0 ? (
                            member.all_plans.map((plan: PlanSummary) => (
                                <div key={plan.id} className={`glass-card p-6 ${plan.is_active ? 'border-primary border-2' : ''}`}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-foreground">{plan.title}</h3>
                                                {plan.is_active && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                                                        Aktif
                                                    </span>
                                                )}
                                            </div>
                                            {plan.description && (
                                                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(plan.start_date)}
                                                    {plan.end_date && ` - ${formatDate(plan.end_date)}`}
                                                </span>
                                            </div>
                                            <div className="flex gap-4 mt-3 text-xs">
                                                <span className="px-2 py-1 rounded bg-surface">{plan.daily_targets.calories} kcal</span>
                                                <span className="px-2 py-1 rounded bg-surface">P: {plan.daily_targets.protein}g</span>
                                                <span className="px-2 py-1 rounded bg-surface">K: {plan.daily_targets.carbs}g</span>
                                                <span className="px-2 py-1 rounded bg-surface">Y: {plan.daily_targets.fat}g</span>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => navigate(`/dietitian/edit-plan/${plan.id}`)}>
                                            <Edit className="w-4 h-4 mr-2" />
                                            Düzenle
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="glass-card p-12 text-center">
                                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                                <h3 className="font-medium text-foreground mb-2">Henüz program yok</h3>
                                <p className="text-sm text-muted-foreground mb-4">Bu danışan için ilk beslenme programını oluşturun</p>
                                <Button variant="neon" onClick={() => navigate(`/dietitian/create-plan/${memberId}`)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Program Oluştur
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Logs Tab */}
                {activeTab === 'logs' && (
                    <div className="glass-card overflow-hidden">
                        {member.daily_logs && member.daily_logs.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-surface">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Tarih</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Kalori</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Protein</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Karb.</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Yağ</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Su</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {member.daily_logs.map((log: DailyLogEntry, index: number) => (
                                            <tr key={index} className="hover:bg-surface/50 transition-colors">
                                                <td className="px-4 py-3 text-sm font-medium">{formatDate(log.date)}</td>
                                                <td className="px-4 py-3 text-center text-sm">
                                                    <span className={log.calories_consumed >= log.calories_target ? 'text-green-500' : 'text-yellow-500'}>
                                                        {log.calories_consumed}
                                                    </span>
                                                    <span className="text-muted-foreground"> / {log.calories_target}</span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm">{log.protein_consumed}g</td>
                                                <td className="px-4 py-3 text-center text-sm">{log.carbs_consumed}g</td>
                                                <td className="px-4 py-3 text-center text-sm">{log.fat_consumed}g</td>
                                                <td className="px-4 py-3 text-center text-sm">{log.water_consumed} bardak</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                                <h3 className="font-medium text-foreground mb-2">Henüz log kaydı yok</h3>
                                <p className="text-sm text-muted-foreground">Danışan henüz günlük takip yapmaya başlamamış</p>
                            </div>
                        )}
                    </div>
                )}

                {/* AI Analysis Tab */}
                {activeTab === 'ai' && (
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">AI Analiz Raporu</h2>
                                <p className="text-sm text-muted-foreground">Gemini AI tarafından oluşturuldu</p>
                            </div>
                        </div>

                        {isAnalyzing ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
                                <p className="text-muted-foreground">AI danışanınızı analiz ediyor...</p>
                                <p className="text-sm text-muted-foreground mt-2">Bu işlem 10-30 saniye sürebilir</p>
                            </div>
                        ) : aiAnalysis ? (
                            <div className="prose prose-invert max-w-none">
                                <div className="bg-surface rounded-xl p-6 text-foreground leading-relaxed markdown-content">
                                    <ReactMarkdown
                                        components={{
                                            h2: ({ children }) => <h2 className="text-xl font-bold text-primary mt-6 mb-3 border-b border-border pb-2">{children}</h2>,
                                            h3: ({ children }) => <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">{children}</h3>,
                                            p: ({ children }) => <p className="mb-3 text-muted-foreground">{children}</p>,
                                            ul: ({ children }) => <ul className="list-disc ml-6 mb-4 space-y-1">{children}</ul>,
                                            li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
                                            strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
                                            hr: () => <hr className="my-6 border-border" />,
                                        }}
                                    >
                                        {aiAnalysis}
                                    </ReactMarkdown>
                                </div>
                                <div className="mt-6 flex gap-3">
                                    <Button variant="outline" onClick={handleAIAnalyze}>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Yeniden Analiz Et
                                    </Button>
                                    <Button variant="neon" onClick={() => navigate(`/dietitian/create-plan/${memberId}`)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Bu Önerilere Göre Plan Oluştur
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <Sparkles className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                                <h3 className="font-medium text-foreground mb-2">Henüz analiz yapılmadı</h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    AI, danışanınızın tüm verilerini analiz edip kişiselleştirilmiş öneriler sunacak
                                </p>
                                <Button onClick={handleAIAnalyze} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    AI Analizi Başlat
                                </Button>
                            </div>
                        )}
                    </div>
                )}



            </main>
        </div>
    );
};

export default MemberDetail;
