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
    History,
    Eye,
    X,
    Bot,
    Filter,
    ArrowLeft
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import * as aiService from "@/services/aiService";
import * as agentService from "@/services/agentService";
import type { AgentLogItem } from "@/services/agentService";
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

    // AI İzleme tab state'leri
    const [activeTab, setActiveTab] = useState<'report' | 'monitor'>('report');
    const [agentLogs, setAgentLogs] = useState<AgentLogItem[]>([]);
    const [logsTotal, setLogsTotal] = useState(0);
    const [logsPage, setLogsPage] = useState(1);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logFilter, setLogFilter] = useState('all');
    const [selectedLog, setSelectedLog] = useState<AgentLogItem | null>(null);

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

    // AI İzleme: ajan loglarını yükle
    const loadAgentLogs = async (page = 1, filter = logFilter) => {
        setLogsLoading(true);
        try {
            const result = await agentService.getAgentLogs(page, 20, filter);
            if (result.success) {
                setAgentLogs(result.logs);
                setLogsTotal(result.total);
                setLogsPage(page);
            }
        } catch (error) {
            console.error("Error loading agent logs:", error);
        } finally {
            setLogsLoading(false);
        }
    };

    // Tab değiştiğinde logları yükle
    const handleTabChange = (tab: 'report' | 'monitor') => {
        setActiveTab(tab);
        if (tab === 'monitor' && agentLogs.length === 0) {
            loadAgentLogs();
        }
    };

    // Action type Türkçe etiketleri
    const actionTypeLabels: Record<string, string> = {
        notification_sent: "Bildirim Gönderildi",
        plan_expiry_alert: "Plan Süresi Uyarısı",
        inactivity_warning: "İnaktiflik Uyarısı",
        adherence_check: "Uyum Kontrolü",
        escalation_to_dietitian: "Diyetisyene Eskalasyon",
        plan_suggestion: "Plan Önerisi",
        whatsapp_sent: "WhatsApp Gönderildi",
        weekly_report: "Haftalık Rapor",
    };

    // Action type renk eşleştirme
    const getActionColor = (type: string) => {
        if (type.includes('escalation') || type.includes('inactivity')) return 'text-red-400 bg-red-500/10 border-red-500/30';
        if (type.includes('expiry') || type.includes('warning') || type.includes('adherence')) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
        return 'text-green-400 bg-green-500/10 border-green-500/30';
    };

    // Zaman farkı (relative time)
    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins} dk önce`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} saat önce`;
        const days = Math.floor(hours / 24);
        return `${days} gün önce`;
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
                <div className="max-w-7xl mx-auto flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate("/dietitian-dashboard")}
                            className="w-fit rounded-full border-border/70 bg-background/60 px-3"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Diyetisyen paneline dön
                        </Button>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">Agentic AI Dashboard</h1>
                                <p className="text-sm text-muted-foreground">Danışan durumlarını takip edin</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
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
                {/* Tab Bar */}
                <div className="flex gap-1 p-1 rounded-xl bg-surface/50 border border-border/50 w-fit">
                    <button
                        onClick={() => handleTabChange('report')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === 'report'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Zap className="w-4 h-4 inline mr-2" />
                        Rapor
                    </button>
                    <button
                        onClick={() => handleTabChange('monitor')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === 'monitor'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Eye className="w-4 h-4 inline mr-2" />
                        AI İzleme
                    </button>
                </div>

                {/* Report Tab */}
                {activeTab === 'report' && report ? (
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
                ) : activeTab === 'report' ? (
                    <div className="glass-card p-8 sm:p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                            <Zap className="w-8 h-8 text-purple-500" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-2">Henüz rapor yok</h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                            İlk Agentic AI raporunu oluşturduğunuzda riskli danışanlar ve özet içgörüler burada görünecek.
                        </p>
                        <Button variant="neon" onClick={handleGenerate} disabled={isGenerating} className="min-w-[220px]">
                            {isGenerating ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Oluşturuluyor...</>
                            ) : (
                                <><Zap className="w-4 h-4 mr-2" />İlk Raporu Oluştur</>
                            )}
                        </Button>
                    </div>
                ) : null}

                {/* Monitor Tab — AI İzleme */}
                {activeTab === 'monitor' && (
                    <div className="space-y-4">
                        {/* Filtre */}
                        <div className="flex items-center gap-3">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <select
                                value={logFilter}
                                onChange={(e) => { setLogFilter(e.target.value); loadAgentLogs(1, e.target.value); }}
                                className="bg-surface border border-border/50 rounded-lg px-3 py-1.5 text-sm text-foreground"
                            >
                                <option value="all">Tümü</option>
                                <option value="notification_sent">Bildirimler</option>
                                <option value="inactivity_warning">İnaktiflik</option>
                                <option value="plan_expiry_alert">Plan Süresi</option>
                                <option value="escalation_to_dietitian">Eskalasyonlar</option>
                                <option value="adherence_check">Uyum Kontrolü</option>
                                <option value="weekly_report">Haftalık Rapor</option>
                            </select>
                            <span className="text-xs text-muted-foreground ml-auto">{logsTotal} kayıt</span>
                        </div>

                        {/* Log Listesi */}
                        {logsLoading ? (
                            <div className="text-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                            </div>
                        ) : agentLogs.length === 0 ? (
                            <div className="glass-card p-8 sm:p-10 text-center">
                                <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                <h3 className="font-semibold text-foreground mb-1">Henüz ajan eylemi yok</h3>
                                <p className="text-sm text-muted-foreground">n8n ajanı aktif olduğunda bildirim, uyarı ve takip kayıtları burada listelenecek.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {agentLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        onClick={() => setSelectedLog(log)}
                                        className={`p-4 rounded-xl border cursor-pointer hover:border-primary/50 transition-colors ${getActionColor(log.action_type)}`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium">
                                                {actionTypeLabels[log.action_type] || log.action_type}
                                            </span>
                                            <span className="text-xs opacity-70">{timeAgo(log.created_at)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm opacity-80">
                                                {log.member_name || log.member_id || '—'}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 rounded bg-black/10">{log.triggered_by}</span>
                                        </div>
                                        {log.reasoning && (
                                            <p className="text-xs opacity-60 mt-1 line-clamp-1">"{log.reasoning}"</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {logsTotal > 20 && (
                            <div className="flex justify-center gap-2 pt-2">
                                <Button variant="outline" size="sm" disabled={logsPage <= 1} onClick={() => loadAgentLogs(logsPage - 1)}>
                                    Önceki
                                </Button>
                                <span className="text-sm text-muted-foreground py-1.5">
                                    {logsPage} / {Math.ceil(logsTotal / 20)}
                                </span>
                                <Button variant="outline" size="sm" disabled={logsPage >= Math.ceil(logsTotal / 20)} onClick={() => loadAgentLogs(logsPage + 1)}>
                                    Sonraki
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Log Detay Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
                    <div className="glass-card w-full max-w-lg mx-4 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-foreground">
                                {actionTypeLabels[selectedLog.action_type] || selectedLog.action_type}
                            </h3>
                            <button onClick={() => setSelectedLog(null)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Danışan</span>
                                <span className="text-foreground">{selectedLog.member_name || selectedLog.member_id || '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tetikleyici</span>
                                <span className="text-foreground">{selectedLog.triggered_by}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Durum</span>
                                <span className="text-foreground">{selectedLog.status}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tarih</span>
                                <span className="text-foreground">{new Date(selectedLog.created_at).toLocaleString('tr-TR')}</span>
                            </div>
                            {selectedLog.n8n_execution_id && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">n8n ID</span>
                                    <span className="text-foreground font-mono text-xs">{selectedLog.n8n_execution_id}</span>
                                </div>
                            )}
                        </div>

                        {selectedLog.reasoning && (
                            <div className="pt-2 border-t border-border/50">
                                <h4 className="text-sm font-medium text-foreground mb-1">🧠 AI Muhakemesi</h4>
                                <p className="text-sm text-muted-foreground">{selectedLog.reasoning}</p>
                            </div>
                        )}

                        {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                            <div className="pt-2 border-t border-border/50">
                                <h4 className="text-sm font-medium text-foreground mb-1">📋 Detaylar</h4>
                                <pre className="text-xs text-muted-foreground bg-surface/50 rounded-lg p-3 overflow-auto max-h-40">
                                    {JSON.stringify(selectedLog.details, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgenticDashboard;
