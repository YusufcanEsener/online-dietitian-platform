import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import * as agentService from '@/services/agentService';
import type { AgentLogItem, MonitoringResponse } from '@/services/agentService';

type DietitianRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

type RiskCardItem = {
  memberId: string;
  memberName: string;
  riskLevel: DietitianRiskLevel;
  explanation: string[];
  recommendation: string;
  createdAt: string;
};

const POLL_INTERVAL_MS = 15000;

const riskStyles: Record<DietitianRiskLevel, string> = {
  LOW: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  MEDIUM: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
  HIGH: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
  CRITICAL: 'border-red-500/30 bg-red-500/10 text-red-300',
};

const riskLabels: Record<DietitianRiskLevel, string> = {
  LOW: 'Dusuk Risk',
  MEDIUM: 'Orta Risk',
  HIGH: 'Yuksek Risk',
  CRITICAL: 'Kritik Risk',
};

const riskPriority: Record<DietitianRiskLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parseFindings(log: AgentLogItem): string[] {
  const findings = Array.isArray(log.details?.findings) ? (log.details.findings as Array<Record<string, unknown>>) : [];
  const messages = findings
    .map((finding) => (typeof finding.message === 'string' ? finding.message : ''))
    .filter(Boolean);

  if (messages.length > 0) {
    return messages.slice(0, 2);
  }

  if (log.reasoning) {
    return [log.reasoning];
  }

  return ['Ek aciklama bulunmuyor.'];
}

function parseRecommendation(log: AgentLogItem): string {
  if (typeof log.details?.recommendation === 'string' && log.details.recommendation.trim().length > 0) {
    return log.details.recommendation;
  }
  if (log.reasoning && log.reasoning.trim().length > 0) {
    return log.reasoning;
  }
  return 'Danisani kontrol edip gerekli ise iletisime gec.';
}

function isRiskyLog(log: AgentLogItem) {
  const status = typeof log.details?.status === 'string' ? log.details.status : '';
  const riskLevel = (log.risk_level ?? 'LOW') as DietitianRiskLevel;
  return status !== 'INSUFFICIENT_DATA' && riskPriority[riskLevel] >= riskPriority.MEDIUM;
}

const AgenticDashboardDietitian = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [snapshot, setSnapshot] = useState<MonitoringResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRunningBatch, setIsRunningBatch] = useState(false);

  const loadMonitoring = async (showSpinner = false) => {
    if (showSpinner) {
      setIsRefreshing(true);
    }
    try {
      const response = await agentService.getAgentMonitoring(120);
      setSnapshot(response);
    } catch (error) {
      console.error('Dietitian monitoring yuklenemedi:', error);
      if (showSpinner) {
        toast({
          title: 'Hata',
          description: 'Monitoring verisi alinamadi.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!authLoading && user?.role !== 'dietitian') {
      navigate('/dashboard');
      return;
    }

    if (!authLoading && isAuthenticated && user?.role === 'dietitian') {
      loadMonitoring(true);
    }
  }, [authLoading, isAuthenticated, navigate, toast, user]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || user?.role !== 'dietitian') {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadMonitoring(false);
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [authLoading, isAuthenticated, user]);

  const analysisLogs = useMemo(
    () => (snapshot?.logs ?? []).filter((log) => log.action_type === 'member_analysis'),
    [snapshot?.logs],
  );

  const latestRiskCards = useMemo(() => {
    const byMember = new Map<string, AgentLogItem>();
    for (const log of analysisLogs) {
      if (!log.member_id) {
        continue;
      }
      if (!byMember.has(log.member_id)) {
        byMember.set(log.member_id, log);
      }
    }

    return Array.from(byMember.values())
      .filter(isRiskyLog)
      .map<RiskCardItem>((log) => ({
        memberId: log.member_id || '',
        memberName: log.member_name || 'Isimsiz Danisan',
        riskLevel: (log.risk_level ?? 'LOW') as DietitianRiskLevel,
        explanation: parseFindings(log),
        recommendation: parseRecommendation(log),
        createdAt: log.created_at,
      }))
      .sort((left, right) => {
        const riskDelta = riskPriority[right.riskLevel] - riskPriority[left.riskLevel];
        if (riskDelta !== 0) {
          return riskDelta;
        }
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });
  }, [analysisLogs]);

  const todaySummary = useMemo(() => {
    const today = startOfToday().getTime();
    const todaysAnalysisLogs = analysisLogs.filter((log) => new Date(log.created_at).getTime() >= today);
    const todaysNotifications = (snapshot?.logs ?? []).filter(
      (log) =>
        log.action_type === 'risk_notification_sent' &&
        log.status === 'completed' &&
        log.details?.sent === true &&
        new Date(log.created_at).getTime() >= today,
    );

    const analyzedMemberIds = new Set(todaysAnalysisLogs.map((log) => log.member_id).filter(Boolean));
    const riskyTodayIds = new Set(
      todaysAnalysisLogs.filter(isRiskyLog).map((log) => log.member_id).filter(Boolean),
    );

    return {
      analyzedToday: analyzedMemberIds.size,
      riskyToday: riskyTodayIds.size,
      notificationsToday: todaysNotifications.length,
      lastAnalysisAt: todaysAnalysisLogs[0]?.created_at ?? analysisLogs[0]?.created_at ?? null,
    };
  }, [analysisLogs, snapshot?.logs]);

  const handleRefresh = async () => {
    await loadMonitoring(true);
  };

  const handleRunBatch = async () => {
    try {
      setIsRunningBatch(true);
      await agentService.runAgentBatch();
      toast({
        title: 'Analiz baslatildi',
        description: 'Sistem yeni taramayi arka planda baslatti.',
      });
      await loadMonitoring(false);
    } catch (error) {
      console.error('Dietitian batch baslatilamadi:', error);
      toast({
        title: 'Hata',
        description: 'Analiz baslatilamadi.',
        variant: 'destructive',
      });
    } finally {
      setIsRunningBatch(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
          <header className="glass-card p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary border border-primary/20">
                  <Sparkles className="h-4 w-4" />
                  Agentic AI Özet
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">Bugün hangi danışanla ilgilenmelisiniz?</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Bu ekran sadece aksiyon gerektiren durumları gösterir. Teknik loglar ve sistem detayları admin
                    panelinde kalır.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                  {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Yenile
                </Button>
                <Button variant="neon" onClick={handleRunBatch} disabled={isRunningBatch}>
                  {isRunningBatch ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                  Bugunu yeniden tara
                </Button>
              </div>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="glass-card p-5 hover:neon-border transition-all duration-300">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Toplam danışan</span>
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-semibold text-foreground">{snapshot?.summary.total_members ?? 0}</div>
            </div>

            <div className="glass-card p-5 hover:neon-border transition-all duration-300">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Riskli danışan</span>
                <ShieldAlert className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-3xl font-semibold text-foreground">{latestRiskCards.length}</div>
            </div>

            <div className="glass-card p-5 hover:neon-border transition-all duration-300">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Bugün analiz edilen</span>
                <CheckCircle2 className="h-5 w-5 text-sky-500" />
              </div>
              <div className="text-3xl font-semibold text-foreground">{todaySummary.analyzedToday}</div>
            </div>

            <div className="glass-card p-5 hover:neon-border transition-all duration-300">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Son analiz zamanı</span>
                <Clock3 className="h-5 w-5 text-violet-500" />
              </div>
              <div className="text-sm font-semibold text-foreground">{formatDateTime(todaySummary.lastAnalysisAt)}</div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="glass-card p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Riskli danışanlar</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Öncelik gerektiren kişiler burada listelenir.</p>
                </div>
                <div className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-foreground">
                  {latestRiskCards.length} kişi
                </div>
              </div>

              {latestRiskCards.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-primary/30 bg-surface/50 p-8 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">Bugün acil risk görünmüyor</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Son analizlere göre dikkat gerektiren bir durum bulunmuyor. Yine de yeni tarama başlatabilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {latestRiskCards.map((member) => (
                    <div key={member.memberId} className="rounded-3xl border border-border bg-surface p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-semibold text-foreground">{member.memberName}</h3>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskStyles[member.riskLevel]}`}>
                              {riskLabels[member.riskLevel]}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {member.explanation.map((line) => (
                              <div key={line} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                                <span>{line}</span>
                              </div>
                            ))}
                          </div>

                          <div className="rounded-2xl bg-background border border-border px-4 py-3 text-sm text-muted-foreground shadow-sm">
                            <span className="font-semibold text-foreground">Öneri:</span> {member.recommendation}
                          </div>
                        </div>

                        <div className="flex min-w-[180px] flex-col items-start gap-3 lg:items-end">
                          <div className="text-xs text-muted-foreground">Son analiz: {formatDateTime(member.createdAt)}</div>
                          <Button variant="outline" onClick={() => navigate(`/dietitian/member/${member.memberId}`)}>
                            Danışana git
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="glass-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Günlük özet</h2>
                    <p className="text-sm text-muted-foreground">Hızlı durum özeti</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-2xl bg-surface px-4 py-3">
                    Bugün <span className="font-semibold text-foreground">{todaySummary.analyzedToday}</span> kullanıcı analiz edildi.
                  </div>
                  <div className="rounded-2xl bg-surface px-4 py-3">
                    <span className="font-semibold text-foreground">{todaySummary.riskyToday}</span> kullanıcı riskli bulundu.
                  </div>
                  <div className="rounded-2xl bg-surface px-4 py-3">
                    <span className="font-semibold text-foreground">{todaySummary.notificationsToday}</span> kullanıcıya bildirim gönderildi.
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-foreground">Ne yapmalı?</h2>
                <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                  <div className="rounded-2xl border border-border bg-surface px-4 py-3">
                    Kritik ve yüksek riskli danışanlarla önce iletişime geçin.
                  </div>
                  <div className="rounded-2xl border border-border bg-surface px-4 py-3">
                    Orta riskte olanlar için log ve plan uyumunu gözden geçirin.
                  </div>
                  <div className="rounded-2xl border border-border bg-surface px-4 py-3">
                    Yeni tarama başlatmak isterseniz yukarıdaki butonu kullanın.
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AgenticDashboardDietitian;
