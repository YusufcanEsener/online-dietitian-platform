import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Sparkles,
    TrendingUp,
    TrendingDown,
    Minus,
    Loader2,
    RefreshCw,
    CheckCircle,
    AlertTriangle,
    Info,
    Zap
} from "lucide-react";
import * as aiService from "@/services/aiService";

interface AgenticAIProps {
    memberId: string;
    memberName: string;
}

interface WeeklyProgress {
    score: number;
    scoreLabel: string;
    summary: string;
    positives: string[];
    improvements: string[];
    recommendations: string[];
    trend: "up" | "down" | "stable";
    alert: string | null;
}

const AgenticAIPanel = ({ memberId, memberName }: AgenticAIProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState<WeeklyProgress | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const handleAnalyze = async () => {
        setIsLoading(true);
        try {
            const result = await aiService.getWeeklyProgress(memberId);

            if (result.success) {
                setProgress({
                    score: result.score || 0,
                    scoreLabel: result.score_label || "Bilinmiyor",
                    summary: result.summary || "",
                    positives: result.positives || [],
                    improvements: result.improvements || [],
                    recommendations: result.recommendations || [],
                    trend: result.trend || "stable",
                    alert: result.alert || null
                });
                setLastUpdated(new Date());
            } else {
                console.error("Agentic AI error:", result.error);
            }
        } catch (error) {
            console.error("Agentic AI error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 8) return "text-green-500";
        if (score >= 6) return "text-yellow-500";
        if (score >= 4) return "text-orange-500";
        return "text-red-500";
    };

    const getScoreBarColor = (score: number) => {
        if (score >= 8) return "bg-green-500";
        if (score >= 6) return "bg-yellow-500";
        if (score >= 4) return "bg-orange-500";
        return "bg-red-500";
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case "up":
                return <TrendingUp className="w-5 h-5 text-green-500" />;
            case "down":
                return <TrendingDown className="w-5 h-5 text-red-500" />;
            default:
                return <Minus className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Agentic AI - Gelişim Takibi</h2>
                        <p className="text-sm text-muted-foreground">Haftalık otomatik analiz + anlık değerlendirme</p>
                    </div>
                </div>
                <Button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analiz ediliyor...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Şimdi Analiz Et
                        </>
                    )}
                </Button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-purple-500/20 animate-pulse" />
                        <Sparkles className="w-10 h-10 text-purple-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <p className="text-muted-foreground mt-4">AI danışanınızı analiz ediyor...</p>
                    <p className="text-sm text-muted-foreground">Son 7 günlük veriler inceleniyor</p>
                </div>
            ) : progress ? (
                <div className="space-y-6">
                    {/* Alert Banner */}
                    {progress.alert && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                            <div>
                                <p className="font-medium text-red-500">Dikkat!</p>
                                <p className="text-sm text-red-400">{progress.alert}</p>
                            </div>
                        </div>
                    )}

                    {/* Score Card */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-muted-foreground">Haftalık Gelişim Skoru</h3>
                            <div className="flex items-center gap-2">
                                {getTrendIcon(progress.trend)}
                                <span className="text-sm text-muted-foreground">
                                    {progress.trend === "up" ? "Yükseliyor" :
                                        progress.trend === "down" ? "Düşüyor" : "Stabil"}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-end gap-4 mb-4">
                            <span className={`text-5xl font-bold ${getScoreColor(progress.score)}`}>
                                {progress.score}
                            </span>
                            <span className="text-2xl text-muted-foreground mb-1">/10</span>
                            <span className={`text-lg font-medium mb-1 ${getScoreColor(progress.score)}`}>
                                {progress.scoreLabel}
                            </span>
                        </div>

                        <div className="h-3 bg-surface rounded-full overflow-hidden">
                            <div
                                className={`h-full ${getScoreBarColor(progress.score)} rounded-full transition-all duration-500`}
                                style={{ width: `${progress.score * 10}%` }}
                            />
                        </div>

                        <p className="text-sm text-muted-foreground mt-4">{progress.summary}</p>
                    </div>

                    {/* Analysis Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Positives */}
                        <div className="glass-card p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <h3 className="font-medium text-foreground">Olumlu Gelişmeler</h3>
                            </div>
                            <ul className="space-y-2">
                                {progress.positives.map((item, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <span className="text-green-500 mt-1">✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Improvements */}
                        <div className="glass-card p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                <h3 className="font-medium text-foreground">Geliştirilecekler</h3>
                            </div>
                            <ul className="space-y-2">
                                {progress.improvements.map((item, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <span className="text-yellow-500 mt-1">!</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="glass-card p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            <h3 className="font-medium text-foreground">AI Önerileri</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {progress.recommendations.map((item, index) => (
                                <div
                                    key={index}
                                    className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-xs text-purple-400">
                                            {index + 1}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Last Updated */}
                    {lastUpdated && (
                        <p className="text-xs text-muted-foreground text-center">
                            Son güncelleme: {lastUpdated.toLocaleString('tr-TR')}
                        </p>
                    )}
                </div>
            ) : (
                <div className="text-center py-16 glass-card">
                    <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-8 h-8 text-purple-500" />
                    </div>
                    <h3 className="font-medium text-foreground mb-2">Agentic AI Hazır</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                        AI, danışanınızın son 7 günlük verilerini analiz edip
                        kişiselleştirilmiş öneriler ve gelişim skoru sunacak.
                    </p>
                    <div className="flex flex-col items-center gap-2">
                        <Button
                            onClick={handleAnalyze}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Analizi Başlat
                        </Button>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            Otomatik haftalık analiz her Pazartesi 08:00'da çalışır
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgenticAIPanel;
