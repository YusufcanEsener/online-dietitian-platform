import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Zap,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Clock,
    Users,
    Loader2,
    ChevronRight,
    History
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import * as aiService from "@/services/aiService";
import { useToast } from "@/hooks/use-toast";

interface AgenticMember {
    id: string;
    name: string;
    email: string;
    status: 'critical' | 'warning' | 'good';
    problem?: string;
    days_since_last_log?: number;
    program_status: string;
    calorie_compliance: number;
    recommendation?: string;
}

interface AgenticReport {
    id: string;
    report_date: string;
    total_members: number;
    critical_count: number;
    warning_count: number;
    good_count: number;
    members: AgenticMember[];
    created_at: string;
}

const AgenticDashboard = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [report, setReport] = useState<AgenticReport | null>(null);
    const [pastReports, setPastReports] = useState<AgenticReport[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate("/login");
            return;
        }
        if (!authLoading && user?.role !== "dietitian") {
            navigate("/dashboard");
            return;
        }

        loadLatestReport();
    }, [authLoading, isAuthenticated, user, navigate]);

    const loadLatestReport = async () => {
        try {
            const result = await aiService.getLatestAgenticReport();
            if (result.success && result.report) {
                setReport(result.report);
            }
        } catch (error) {
            console.error("Error loading report:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadPastReports = async () => {
        try {
            const result = await aiService.getAgenticReports(5);
            if (result.success && result.reports) {
                setPastReports(result.reports);
            }
        } catch (error) {
            console.error("Error loading past reports:", error);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const result = await aiService.generateAgenticReport();
            if (result.success && result.report) {
                setReport(result.report);
                toast({ title: "Başarılı", description: "Yeni rapor oluşturuldu" });
            } else {
                toast({ title: "Hata", description: result.error || "Rapor oluşturulamadı", variant: "destructive" });
            }
        } catch (error) {
            console.error("Error generating report:", error);
            toast({ title: "Hata", description: "Sunucu hatası", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'critical': return 'text-red-500';
            case 'warning': return 'text-yellow-500';
            case 'good': return 'text-green-500';
            default: return 'text-muted-foreground';
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'critical': return 'bg-red-500/10 border-red-500/30';
            case 'warning': return 'bg-yellow-500/10 border-yellow-500/30';
            case 'good': return 'bg-green-500/10 border-green-500/30';
            default: return 'bg-surface';
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-30 glass border-b border-border/50 px-4 lg:px-8 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Agentic AI Dashboard</h1>
                            <p className="text-sm text-muted-foreground">Danışan durumlarını takip edin</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setShowHistory(!showHistory);
                                if (!showHistory) loadPastReports();
                            }}
                        >
                            <History className="w-4 h-4 mr-2" />
                            Geçmiş
                        </Button>
                        <Button
                            variant="neon"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Oluşturuluyor...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Şimdi Güncelle
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
                {report ? (
                    <>
                        {/* Last Updated */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            Son Güncelleme: {formatDate(report.created_at)}
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="glass-card p-4 text-center">
                                <Users className="w-6 h-6 mx-auto text-primary mb-2" />
                                <div className="text-3xl font-bold text-foreground">{report.total_members}</div>
                                <div className="text-sm text-muted-foreground">Toplam</div>
                            </div>
                            <div className="glass-card p-4 text-center border-red-500/30">
                                <AlertTriangle className="w-6 h-6 mx-auto text-red-500 mb-2" />
                                <div className="text-3xl font-bold text-red-500">{report.critical_count}</div>
                                <div className="text-sm text-muted-foreground">Kritik</div>
                            </div>
                            <div className="glass-card p-4 text-center border-yellow-500/30">
                                <AlertTriangle className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
                                <div className="text-3xl font-bold text-yellow-500">{report.warning_count}</div>
                                <div className="text-sm text-muted-foreground">Dikkat</div>
                            </div>
                            <div className="glass-card p-4 text-center border-green-500/30">
                                <CheckCircle className="w-6 h-6 mx-auto text-green-500 mb-2" />
                                <div className="text-3xl font-bold text-green-500">{report.good_count}</div>
                                <div className="text-sm text-muted-foreground">İyi</div>
                            </div>
                        </div>

                        {/* Critical Members */}
                        {report.critical_count > 0 && (
                            <section className="space-y-3">
                                <h2 className="text-lg font-semibold text-red-500 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Kritik Danışanlar
                                </h2>
                                <div className="space-y-2">
                                    {report.members.filter(m => m.status === 'critical').map((member) => (
                                        <div
                                            key={member.id}
                                            className={`p-4 rounded-xl border ${getStatusBg(member.status)} flex items-center justify-between cursor-pointer hover:border-red-500 transition-colors`}
                                            onClick={() => navigate(`/dietitian/member/${member.id}`)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                                    <span className="text-red-500 font-semibold">
                                                        {member.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-foreground">{member.name}</h3>
                                                    <p className="text-sm text-red-400">{member.problem}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-muted-foreground bg-surface px-2 py-1 rounded">
                                                    {member.program_status}
                                                </span>
                                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Warning Members */}
                        {report.warning_count > 0 && (
                            <section className="space-y-3">
                                <h2 className="text-lg font-semibold text-yellow-500 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Dikkat Gerektiren
                                </h2>
                                <div className="space-y-2">
                                    {report.members.filter(m => m.status === 'warning').map((member) => (
                                        <div
                                            key={member.id}
                                            className={`p-4 rounded-xl border ${getStatusBg(member.status)} flex items-center justify-between cursor-pointer hover:border-yellow-500 transition-colors`}
                                            onClick={() => navigate(`/dietitian/member/${member.id}`)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                                    <span className="text-yellow-500 font-semibold">
                                                        {member.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-foreground">{member.name}</h3>
                                                    <p className="text-sm text-yellow-400">{member.problem}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-muted-foreground bg-surface px-2 py-1 rounded">
                                                    {member.program_status}
                                                </span>
                                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Good Members */}
                        {report.good_count > 0 && (
                            <section className="space-y-3">
                                <h2 className="text-lg font-semibold text-green-500 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    İyi Durumda
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {report.members.filter(m => m.status === 'good').map((member) => (
                                        <div
                                            key={member.id}
                                            className={`p-3 rounded-xl border ${getStatusBg(member.status)} flex items-center justify-between cursor-pointer hover:border-green-500 transition-colors`}
                                            onClick={() => navigate(`/dietitian/member/${member.id}`)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                </div>
                                                <span className="font-medium text-foreground">{member.name}</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Past Reports */}
                        {showHistory && pastReports.length > 0 && (
                            <section className="space-y-3">
                                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <History className="w-5 h-5" />
                                    Geçmiş Raporlar
                                </h2>
                                <div className="space-y-2">
                                    {pastReports.map((r) => (
                                        <div
                                            key={r.id}
                                            className="glass-card p-3 flex items-center justify-between cursor-pointer hover:border-primary transition-colors"
                                            onClick={() => setReport(r)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm text-foreground">{formatDate(r.created_at)}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                <span className="text-red-500">{r.critical_count} kritik</span>
                                                <span className="text-yellow-500">{r.warning_count} uyarı</span>
                                                <span className="text-green-500">{r.good_count} iyi</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 glass-card">
                        <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                            <Zap className="w-8 h-8 text-purple-500" />
                        </div>
                        <h3 className="font-medium text-foreground mb-2">Henüz Rapor Yok</h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                            "Şimdi Güncelle" butonuna tıklayarak ilk Agentic AI raporunuzu oluşturun.
                        </p>
                        <Button
                            variant="neon"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Oluşturuluyor...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 mr-2" />
                                    İlk Raporu Oluştur
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AgenticDashboard;
