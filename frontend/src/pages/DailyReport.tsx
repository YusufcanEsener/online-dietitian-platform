import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    FileText,
    Users,
    AlertTriangle,
    AlertCircle,
    CheckCircle,
    Loader2,
    RefreshCw,
    MessageSquare,
    Phone,
    ExternalLink,
    Download,
    Mail,
    Sparkles,
    Calendar
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import * as aiService from "@/services/aiService";
import { useToast } from "@/hooks/use-toast";

interface MemberStatus {
    id: string;
    name: string;
    email?: string;
    score?: number;
    status: "critical" | "warning" | "good";
    // Eski format
    issue?: string;
    action?: string;
    // Gemini formatı
    analysis?: string;
    problems?: string[];
    recommendation?: string;
    // Ek bilgiler
    days_without_log?: number;
    days_until_program_ends?: number;
    calorie_compliance?: number;
}

const DailyReport = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [showAllGood, setShowAllGood] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [report, setReport] = useState<{
        date: string;
        summary: { total: number; critical: number; warning: number; good: number };
        members: MemberStatus[];
    } | null>(null);

    const handleGenerateReport = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await aiService.getDailyReport();
            console.log("AI Report Response:", result);

            // Handle both wrapped (success: true) and direct response formats
            const data = result as any;
            const members = data.members || [];
            const hasMembers = members.length > 0;

            if (hasMembers || data.success) {
                // Parse summary from different possible locations
                const summary = data.summary || {
                    total: data.total_members || members.length,
                    critical: data.summary?.critical ?? members.filter((m: any) => m.status === 'critical').length,
                    warning: data.summary?.warning ?? members.filter((m: any) => m.status === 'warning').length,
                    good: data.summary?.good ?? members.filter((m: any) => m.status === 'good').length
                };

                setReport({
                    date: data.report_date || new Date().toLocaleDateString('tr-TR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    summary: {
                        total: summary.total || summary.critical + summary.warning + summary.good,
                        critical: summary.critical || 0,
                        warning: summary.warning || 0,
                        good: summary.good || 0
                    },
                    members: members
                });
            } else {
                setError(data.error || "Rapor oluşturulamadı");
                toast({
                    title: "Hata",
                    description: data.error || "n8n'e bağlanılamadı. n8n'in çalıştığından emin olun.",
                    variant: "destructive"
                });
            }
        } catch (err) {
            console.error("Report generation error:", err);
            setError("Sunucu hatası oluştu");
            toast({
                title: "Bağlantı Hatası",
                description: "Sunucuya bağlanılamadı",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "critical":
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            case "warning":
                return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            default:
                return <CheckCircle className="w-5 h-5 text-green-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "critical":
                return "bg-red-500/10 text-red-500 border-red-500/30";
            case "warning":
                return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
            default:
                return "bg-green-500/10 text-green-500 border-green-500/30";
        }
    };

    const criticalMembers = report?.members.filter(m => m.status === "critical") || [];
    const warningMembers = report?.members.filter(m => m.status === "warning") || [];
    const goodMembers = report?.members.filter(m => m.status === "good") || [];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-30 glass border-b border-border/50 px-4 lg:px-8 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/dietitian-dashboard")}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Günlük AI Raporu
                            </h1>
                            <p className="text-sm text-muted-foreground">Tüm danışanlarınızın durumu</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {report && (
                            <>
                                <Button variant="outline" size="sm">
                                    <Download className="w-4 h-4 mr-2" />
                                    PDF İndir
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Mail className="w-4 h-4 mr-2" />
                                    E-posta Gönder
                                </Button>
                            </>
                        )}
                        <Button
                            variant="neon"
                            onClick={handleGenerateReport}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4 mr-2" />
                            )}
                            {report ? "Yenile" : "Rapor Oluştur"}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-4 lg:p-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="relative mb-6">
                            <Users className="w-16 h-16 text-primary/20" />
                            <Sparkles className="w-8 h-8 text-primary absolute -top-2 -right-2 animate-pulse" />
                        </div>
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                        <p className="text-lg font-medium text-foreground">AI Rapor Oluşturuyor</p>
                        <p className="text-sm text-muted-foreground">Tüm danışanlar analiz ediliyor...</p>
                    </div>
                ) : report ? (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    <h2 className="text-lg font-semibold text-foreground">{report.date}</h2>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div className="p-4 rounded-xl bg-surface text-center">
                                    <p className="text-3xl font-bold text-foreground">{report.summary.total}</p>
                                    <p className="text-sm text-muted-foreground">Toplam Danışan</p>
                                </div>
                                <div className="p-4 rounded-xl bg-red-500/10 text-center">
                                    <p className="text-3xl font-bold text-red-500">{report.summary.critical}</p>
                                    <p className="text-sm text-red-400">Kritik</p>
                                </div>
                                <div className="p-4 rounded-xl bg-yellow-500/10 text-center">
                                    <p className="text-3xl font-bold text-yellow-500">{report.summary.warning}</p>
                                    <p className="text-sm text-yellow-400">Dikkat</p>
                                </div>
                                <div className="p-4 rounded-xl bg-green-500/10 text-center">
                                    <p className="text-3xl font-bold text-green-500">{report.summary.good}</p>
                                    <p className="text-sm text-green-400">İyi</p>
                                </div>
                            </div>
                        </div>

                        {/* Critical Section */}
                        {criticalMembers.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <h3 className="text-lg font-semibold text-red-500">
                                        Acil Aksiyon Gerekli ({criticalMembers.length})
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {criticalMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="glass-card p-5 border-l-4 border-red-500"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="font-medium text-foreground">{member.name}</h4>
                                                        {member.score && (
                                                            <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusBadge(member.status)}`}>
                                                                Puan: {member.score}/10
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* Gemini formatı: analysis */}
                                                    {member.analysis && (
                                                        <p className="text-sm text-red-400 mb-2">
                                                            ⚠️ {member.analysis}
                                                        </p>
                                                    )}
                                                    {/* Eski format: issue */}
                                                    {member.issue && !member.analysis && (
                                                        <p className="text-sm text-red-400 mb-2">
                                                            ⚠️ {member.issue}
                                                        </p>
                                                    )}
                                                    {/* Gemini: problems listesi */}
                                                    {member.problems && member.problems.length > 0 && (
                                                        <ul className="text-sm text-red-400/80 mb-2 list-disc list-inside">
                                                            {member.problems.map((p, i) => <li key={i}>{p}</li>)}
                                                        </ul>
                                                    )}
                                                    {/* Öneri */}
                                                    <p className="text-sm text-muted-foreground">
                                                        📝 Öneri: {member.recommendation || member.action || 'Diyetisyenle görüşün'}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => navigate(`/dietitian/member/${member.id}`)}
                                                    >
                                                        <ExternalLink className="w-4 h-4 mr-1" />
                                                        Detay
                                                    </Button>
                                                    <Button variant="outline" size="sm">
                                                        <MessageSquare className="w-4 h-4 mr-1" />
                                                        Mesaj
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Warning Section */}
                        {warningMembers.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                    <h3 className="text-lg font-semibold text-yellow-500">
                                        Dikkat Gerekli ({warningMembers.length})
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    {warningMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="glass-card p-5 border-l-4 border-yellow-500"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="font-medium text-foreground">{member.name}</h4>
                                                        {member.score && (
                                                            <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusBadge(member.status)}`}>
                                                                Puan: {member.score}/10
                                                            </span>
                                                        )}
                                                    </div>
                                                    {member.analysis && (
                                                        <p className="text-sm text-yellow-400 mb-2">
                                                            ℹ️ {member.analysis}
                                                        </p>
                                                    )}
                                                    {member.issue && !member.analysis && (
                                                        <p className="text-sm text-yellow-400 mb-2">
                                                            ℹ️ {member.issue}
                                                        </p>
                                                    )}
                                                    {member.problems && member.problems.length > 0 && (
                                                        <ul className="text-sm text-yellow-400/80 mb-2 list-disc list-inside">
                                                            {member.problems.map((p, i) => <li key={i}>{p}</li>)}
                                                        </ul>
                                                    )}
                                                    <p className="text-sm text-muted-foreground">
                                                        📝 Öneri: {member.recommendation || member.action || 'Takip mesajı gönderin'}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => navigate(`/dietitian/member/${member.id}`)}
                                                    >
                                                        <ExternalLink className="w-4 h-4 mr-1" />
                                                        Detay
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Good Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <h3 className="text-lg font-semibold text-green-500">
                                        İyi İlerliyor ({goodMembers.length})
                                    </h3>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAllGood(!showAllGood)}
                                >
                                    {showAllGood ? "Gizle" : "Tümünü Göster"}
                                </Button>
                            </div>

                            {showAllGood && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {goodMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="glass-card p-4 border-l-4 border-green-500"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium text-foreground">{member.name}</h4>
                                                    {member.score && (
                                                        <span className={`text-xs ${getStatusBadge(member.status)}`}>
                                                            Puan: {member.score}/10
                                                        </span>
                                                    )}
                                                    {member.analysis && (
                                                        <p className="text-xs text-green-400 mt-1">{member.analysis.substring(0, 100)}...</p>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => navigate(`/dietitian/member/${member.id}`)}
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 glass-card">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                            <FileText className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">Günlük AI Raporu</h2>
                        <p className="text-muted-foreground text-center max-w-md mb-6">
                            AI, tüm danışanlarınızın son 7 günlük verilerini analiz edip
                            öncelik sırasına göre aksiyon listesi hazırlayacak.
                        </p>
                        <Button
                            variant="neon"
                            size="lg"
                            onClick={handleGenerateReport}
                        >
                            <Sparkles className="w-5 h-5 mr-2" />
                            Rapor Oluştur
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DailyReport;
