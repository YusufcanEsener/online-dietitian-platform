import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock3,
  Loader2,
  Play,
  RefreshCw,
  Server,
  ShieldAlert,
  Signal,
  Users,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import * as agentService from '@/services/agentService';
import type {
  AgentLogItem,
  MonitoringEvent,
  MonitoringResponse,
  SchedulerState,
} from '@/services/agentService';
import { useAuth } from '@/contexts/AuthContext';

type DashboardRole = 'admin' | 'dietitian';
type AgenticDashboardProps = {
  expectedRole?: DashboardRole;
  backPath?: string;
  backLabel?: string;
  title?: string;
  description?: string;
};

const ROW_HEIGHT = 104;
const LIST_HEIGHT = 540;
const OVERSCAN = 6;
const MAX_WS_RETRIES = 5;
const WS_RECONNECT_DELAY_MS = 3000;

const statusColorMap: Record<string, string> = {
  completed: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
  failed: 'text-rose-300 border-rose-500/30 bg-rose-500/10',
  skipped: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
  started: 'text-sky-300 border-sky-500/30 bg-sky-500/10',
};

const actionLabelMap: Record<string, string> = {
  member_analysis: 'Uye analizi',
  batch_started: 'Batch basladi',
  batch_completed: 'Batch tamamlandi',
  batch_member_failed: 'Batch uye hatasi',
  risk_notification_sent: 'Risk bildirimi',
};

const eventLabelMap: Record<string, string> = {
  batch_started: 'Batch basladi',
  batch_completed: 'Batch tamamlandi',
  manual_batch_started: 'Manual batch kuyruga alindi',
  member_started: 'Uye isleniyor',
  member_completed: 'Uye tamamlandi',
  member_failed: 'Uye hatasi',
  scheduler_acquired: 'Scheduler lock aldi',
  scheduler_cycle_completed: 'Scheduler dongusu bitti',
  scheduler_error: 'Scheduler hatasi',
  initial_state: 'Baslangic durumu',
};

function formatDate(value?: string | null) {
  if (!value) {
    return '-';
  }
  return new Date(value).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function timeAgo(value?: string | null) {
  if (!value) {
    return '-';
  }
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) {
    return 'simdi';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} dk once`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} saat once`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} gun once`;
}

function getWsBadge(status: string) {
  if (status === 'connected') {
    return {
      label: 'Canli bagli',
      className: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
      icon: Wifi,
    };
  }
  if (status === 'connecting') {
    return {
      label: 'Baglaniyor',
      className: 'text-sky-300 border-sky-500/30 bg-sky-500/10',
      icon: Loader2,
    };
  }
  return {
    label: 'Baglanti kesik',
    className: 'text-rose-300 border-rose-500/30 bg-rose-500/10',
    icon: WifiOff,
  };
}

function getLogCardStyle(log: AgentLogItem) {
  if (log.action_type === 'batch_member_failed' || log.status === 'failed') {
    return 'border-rose-500/30 bg-rose-500/10';
  }
  if (log.action_type === 'risk_notification_sent') {
    return 'border-amber-500/30 bg-amber-500/10';
  }
  if (log.action_type === 'batch_started') {
    return 'border-sky-500/30 bg-sky-500/10';
  }
  return 'border-white/10 bg-white/[0.03]';
}

function normalizeEventAsLog(event: MonitoringEvent): AgentLogItem | null {
  const payload = event.payload ?? {};
  const batchId = typeof payload.batch_id === 'string' ? payload.batch_id : undefined;
  const memberId = typeof payload.member_id === 'string' ? payload.member_id : undefined;
  const memberName = typeof payload.member_name === 'string' ? payload.member_name : undefined;

  if (event.event_type === 'member_completed') {
    return {
      id: `${event.event_type}-${event.timestamp}-${memberId ?? 'unknown'}`,
      action_type: 'member_analysis',
      member_id: memberId,
      member_name: memberName,
      batch_id: batchId,
      details: payload,
      reasoning: typeof payload.analysis === 'string' ? payload.analysis : undefined,
      triggered_by: 'scheduler',
      status: typeof payload.status === 'string' ? payload.status.toLowerCase() : 'completed',
      created_at: event.timestamp,
    };
  }

  if (event.event_type === 'member_failed') {
    return {
      id: `${event.event_type}-${event.timestamp}-${memberId ?? 'unknown'}`,
      action_type: 'batch_member_failed',
      member_id: memberId,
      member_name: memberName,
      batch_id: batchId,
      details: payload,
      reasoning: typeof payload.error === 'string' ? payload.error : undefined,
      triggered_by: 'scheduler',
      status: 'failed',
      created_at: event.timestamp,
    };
  }

  if (event.event_type === 'batch_started' || event.event_type === 'batch_completed') {
    return {
      id: `${event.event_type}-${event.timestamp}-${batchId ?? 'unknown'}`,
      action_type: event.event_type,
      batch_id: batchId,
      details: payload,
      reasoning: typeof payload.triggered_by === 'string' ? `Tetikleyici: ${payload.triggered_by}` : undefined,
      triggered_by: typeof payload.triggered_by === 'string' ? payload.triggered_by : 'scheduler',
      status: event.event_type === 'batch_started' ? 'started' : 'completed',
      created_at: event.timestamp,
    };
  }

  return null;
}

const AgenticDashboard = ({
  expectedRole = 'dietitian',
  backPath = '/dietitian-dashboard',
  backLabel = 'Diyetisyen paneline don',
  title = 'Agentic AI Monitoring Panel',
  description = 'Scheduler, batch akisi, risk bildirimleri ve canli loglar tek ekranda.',
}: AgenticDashboardProps) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const reconnectRef = useRef<number | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isUnmountedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const authStateRef = useRef({
    authLoading: true,
    isAuthenticated: false,
    role: '' as string | undefined,
  });

  const [snapshot, setSnapshot] = useState<MonitoringResponse | null>(null);
  const [logs, setLogs] = useState<AgentLogItem[]>([]);
  const [events, setEvents] = useState<MonitoringEvent[]>([]);
  const [selectedLog, setSelectedLog] = useState<AgentLogItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningBatch, setIsRunningBatch] = useState(false);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [logFilter, setLogFilter] = useState('all');
  const [scrollTop, setScrollTop] = useState(0);

  const schedulerState: SchedulerState | null = snapshot?.scheduler ?? null;
  const filteredLogs = useMemo(() => {
    if (logFilter === 'all') {
      return logs;
    }
    return logs.filter((log) => log.action_type === logFilter);
  }, [logFilter, logs]);

  const totalHeight = filteredLogs.length * ROW_HEIGHT;
  const visibleCount = Math.ceil(LIST_HEIGHT / ROW_HEIGHT);
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(filteredLogs.length, startIndex + visibleCount + OVERSCAN * 2);
  const visibleLogs = filteredLogs.slice(startIndex, endIndex);
  const topSpacerHeight = startIndex * ROW_HEIGHT;

  const hydrateSnapshot = (data: MonitoringResponse) => {
    setSnapshot(data);
    setLogs(data.logs);
    setEvents(data.history);
  };

  const loadMonitoring = async () => {
    const response = await agentService.getAgentMonitoring(120);
    hydrateSnapshot(response);
  };

  const clearReconnectTimer = () => {
    if (reconnectRef.current) {
      window.clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
  };

  const closeWebSocket = () => {
    const socket = websocketRef.current;
    websocketRef.current = null;
    if (socket && socket.readyState !== WebSocket.CLOSED) {
      socket.close();
    }
  };

  const scheduleReconnect = () => {
    if (isUnmountedRef.current) {
      return;
    }
    if (reconnectAttemptsRef.current >= MAX_WS_RETRIES) {
      setWsStatus('disconnected');
      return;
    }
    clearReconnectTimer();
    reconnectAttemptsRef.current += 1;
    setReconnectAttempt(reconnectAttemptsRef.current);
    reconnectRef.current = window.setTimeout(() => {
      connectWebSocket();
    }, WS_RECONNECT_DELAY_MS);
  };

  const handleMonitoringEvent = (event: MonitoringEvent) => {
    if (event.event_type === 'heartbeat') {
      return;
    }
    if (event.event_type === 'initial_state') {
      const payload = event.payload ?? {};
      setSnapshot((current) => {
        if (!current) {
          return {
            success: true,
            scheduler: (payload.scheduler as SchedulerState) ?? {
              enabled: false,
              running: false,
              instance_id: 'unknown',
              has_lock: false,
            },
            summary: {
              total_members: 0,
              recent_batches_24h: 0,
              websocket_clients: 0,
            },
            history: (payload.history as MonitoringEvent[]) ?? [],
            logs: [],
          };
        }

        return {
          ...current,
          scheduler: (payload.scheduler as SchedulerState) ?? current.scheduler,
          history: (payload.history as MonitoringEvent[]) ?? current.history,
        };
      });
      setEvents((payload.history as MonitoringEvent[]) ?? []);
      return;
    }

    setEvents((current) => [event, ...current].slice(0, 120));
    setSnapshot((current) => {
      if (!current) {
        return current;
      }
      const nextSummary = {
        ...current.summary,
        websocket_clients:
          typeof event.payload?.websocket_clients === 'number'
            ? (event.payload.websocket_clients as number)
            : current.summary.websocket_clients,
      };
      const nextScheduler =
        event.event_type.startsWith('scheduler') || event.event_type.startsWith('batch')
          ? {
              ...current.scheduler,
              current_batch_id:
                typeof event.payload?.batch_id === 'string'
                  ? (event.payload.batch_id as string)
                  : current.scheduler.current_batch_id,
              last_batch_summary:
                event.event_type === 'batch_completed'
                  ? event.payload
                  : current.scheduler.last_batch_summary,
            }
          : current.scheduler;

      return {
        ...current,
        summary: nextSummary,
        scheduler: nextScheduler,
        history: [event, ...current.history].slice(0, 120),
      };
    });

    const eventLog = normalizeEventAsLog(event);
    if (eventLog) {
      setLogs((current) => {
        const withoutDuplicate = current.filter((log) => log.id !== eventLog.id);
        return [eventLog, ...withoutDuplicate].slice(0, 240);
      });
    }
  };

  const connectWebSocket = () => {
    const authState = authStateRef.current;
    if (isUnmountedRef.current || authState.authLoading || !authState.isAuthenticated || authState.role !== 'dietitian') {
      return;
    }

    const existingSocket = websocketRef.current;
    if (
      existingSocket &&
      (existingSocket.readyState === WebSocket.OPEN || existingSocket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    clearReconnectTimer();
    setWsStatus('connecting');

    try {
      const websocket = new WebSocket(agentService.buildAgentMonitoringWsUrl());
      websocketRef.current = websocket;

      websocket.onopen = () => {
        if (isUnmountedRef.current) {
          closeWebSocket();
          return;
        }
        reconnectAttemptsRef.current = 0;
        setReconnectAttempt(0);
        setWsStatus('connected');
      };

      websocket.onmessage = (message) => {
        try {
          handleMonitoringEvent(JSON.parse(message.data) as MonitoringEvent);
        } catch (error) {
          console.error('WebSocket event parse edilemedi:', error);
        }
      };

      websocket.onclose = () => {
        if (websocketRef.current === websocket) {
          websocketRef.current = null;
        }
        if (!isUnmountedRef.current) {
          setWsStatus('disconnected');
          scheduleReconnect();
        }
      };

      websocket.onerror = () => {
        setWsStatus('disconnected');
      };
    } catch (error) {
      console.error('WebSocket baslatilamadi:', error);
      setWsStatus('disconnected');
      scheduleReconnect();
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      clearReconnectTimer();
      closeWebSocket();
      navigate('/login');
      return;
    }
    if (!authLoading && user?.role !== expectedRole) {
      clearReconnectTimer();
      closeWebSocket();
      navigate('/dashboard');
      return;
    }

    authStateRef.current = {
      authLoading,
      isAuthenticated,
      role: user?.role,
    };

    if (!authLoading && isAuthenticated && user?.role === expectedRole) {
      loadMonitoring()
        .catch((error) => {
          console.error('Monitoring yuklenemedi:', error);
          toast({
            title: 'Hata',
            description: 'Monitoring verisi alinamadi.',
            variant: 'destructive',
          });
        })
        .finally(() => setIsLoading(false));
    }
  }, [authLoading, expectedRole, isAuthenticated, navigate, toast, user]);

  useEffect(() => {
    isUnmountedRef.current = false;

    const startConnection = () => {
      const authState = authStateRef.current;
      if (authState.authLoading) {
        clearReconnectTimer();
        reconnectRef.current = window.setTimeout(startConnection, 300);
        return;
      }
      if (!authState.isAuthenticated || authState.role !== expectedRole) {
        return;
      }
      connectWebSocket();
    };

    startConnection();

    return () => {
      isUnmountedRef.current = true;
      clearReconnectTimer();
      closeWebSocket();
    };
  }, [expectedRole]);

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      await loadMonitoring();
    } catch (error) {
      console.error('Monitoring yenilenemedi:', error);
      toast({
        title: 'Hata',
        description: 'Monitoring verisi yenilenemedi.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunBatch = async () => {
    try {
      setIsRunningBatch(true);
      const response = await agentService.runAgentBatch();
      setSnapshot((current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          scheduler: {
            ...current.scheduler,
            current_batch_id: response.batch_id || current.scheduler.current_batch_id,
          },
        };
      });
      toast({
        title: 'Batch baslatildi',
        description: 'Canli log akisi ekranda gorunecek.',
      });
      await loadMonitoring();
    } catch (error) {
      console.error('Batch calistirilamadi:', error);
      toast({
        title: 'Hata',
        description: 'Batch calistirilamadi.',
        variant: 'destructive',
      });
    } finally {
      setIsRunningBatch(false);
    }
  };

  const wsBadge = getWsBadge(wsStatus);
  const WsIcon = wsBadge.icon;

  if (authLoading || (isLoading && !snapshot)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_35%),linear-gradient(180deg,_rgba(7,11,20,0.98),_rgba(4,6,12,1))] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(backPath)}
              className="w-fit rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backLabel}
            </Button>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/20">
                <Bot className="h-6 w-6 text-emerald-300" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
                <p className="text-sm text-slate-300">{description}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${wsBadge.className}`}>
              <WsIcon className={`h-4 w-4 ${wsStatus === 'connecting' ? 'animate-spin' : ''}`} />
              <span>{wsBadge.label}</span>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Yenile
            </Button>
            <Button
              variant="neon"
              onClick={handleRunBatch}
              disabled={isRunningBatch}
              className="min-w-[170px]"
            >
              {isRunningBatch ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Batch calisiyor
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Batch calistir
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-300">Toplam uye</span>
              <Users className="h-5 w-5 text-emerald-300" />
            </div>
            <div className="text-3xl font-semibold">{snapshot?.summary.total_members ?? 0}</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-300">Son 24 saat batch</span>
              <Activity className="h-5 w-5 text-sky-300" />
            </div>
            <div className="text-3xl font-semibold">{snapshot?.summary.recent_batches_24h ?? 0}</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-300">WebSocket client</span>
              <Signal className="h-5 w-5 text-amber-300" />
            </div>
            <div className="text-3xl font-semibold">{snapshot?.summary.websocket_clients ?? 0}</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-300">Scheduler</span>
              <Server className="h-5 w-5 text-violet-300" />
            </div>
            <div className="flex items-center gap-2 text-lg font-semibold">
              {schedulerState?.running ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  Calisiyor
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-300" />
                  Beklemede
                </>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Scheduler durumu</h2>
                <p className="text-sm text-slate-300">Tek instance kilidi, batch kimligi ve sonraki calisma zamani.</p>
              </div>
              <ShieldAlert className="h-5 w-5 text-slate-300" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Agent aktif</div>
                <div className="mt-2 text-lg font-medium">{schedulerState?.enabled ? 'Evet' : 'Hayir'}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Lock sahibi</div>
                <div className="mt-2 text-lg font-medium">{schedulerState?.has_lock ? 'Bu instance' : 'Yok'}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Instance id</div>
                <div className="mt-2 break-all text-sm text-slate-200">{schedulerState?.instance_id ?? '-'}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Sonraki calisma</div>
                <div className="mt-2 text-sm text-slate-200">{formatDate(schedulerState?.next_run_at)}</div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm text-slate-300">
                <Clock3 className="h-4 w-4" />
                Son batch ozeti
              </div>
              {schedulerState?.last_batch_summary ? (
                <pre className="overflow-auto text-xs leading-6 text-slate-200">
                  {JSON.stringify(schedulerState.last_batch_summary, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-slate-400">Henuz tamamlanmis batch ozeti yok.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Canli event akisi</h2>
                <p className="text-sm text-slate-300">WebSocket uzerinden throttle edilmis gercek zamanli olaylar.</p>
              </div>
              <Zap className="h-5 w-5 text-emerald-300" />
            </div>

            <div className="space-y-3">
              {events.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/50 p-6 text-center text-sm text-slate-400">
                  Henuz canli event gelmedi.
                </div>
              ) : (
                events.slice(0, 10).map((event) => (
                  <div key={`${event.event_type}-${event.timestamp}`} className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium">
                        {eventLabelMap[event.event_type] ?? event.event_type}
                      </div>
                      <div className="text-xs text-slate-400">{timeAgo(event.timestamp)}</div>
                    </div>
                    <div className="mt-2 text-xs text-slate-300">{formatDate(event.timestamp)}</div>
                    <pre className="mt-3 overflow-auto text-xs leading-6 text-slate-400">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Ajan loglari</h2>
              <p className="text-sm text-slate-300">Virtual list ile performansli canli log takibi.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
                Reconnect denemesi: {reconnectAttempt}
              </div>
              <select
                value={logFilter}
                onChange={(event) => setLogFilter(event.target.value)}
                className="rounded-full border border-white/15 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="all">Tum loglar</option>
                <option value="member_analysis">Uye analizleri</option>
                <option value="batch_started">Batch baslangici</option>
                <option value="batch_completed">Batch tamamlandi</option>
                <option value="batch_member_failed">Batch hatalari</option>
                <option value="risk_notification_sent">Risk bildirimleri</option>
              </select>
            </div>
          </div>

          <div
            ref={scrollRef}
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
            className="relative overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/65"
            style={{ height: LIST_HEIGHT }}
          >
            {filteredLogs.length === 0 ? (
              <div className="flex h-full items-center justify-center p-8 text-center text-sm text-slate-400">
                Filtreye uygun log bulunmuyor.
              </div>
            ) : (
              <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${topSpacerHeight}px)` }}>
                  {visibleLogs.map((log) => (
                    <button
                      key={log.id}
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className={`mx-3 mb-3 flex h-[92px] w-[calc(100%-24px)] flex-col justify-between rounded-2xl border p-4 text-left transition hover:border-emerald-400/50 ${getLogCardStyle(log)}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium">{actionLabelMap[log.action_type] ?? log.action_type}</div>
                          <div className="mt-1 text-xs text-slate-300">
                            {log.member_name || log.member_id || 'Sistem'} {log.batch_id ? `• ${log.batch_id}` : ''}
                          </div>
                        </div>
                        <div className={`rounded-full border px-2 py-1 text-[11px] ${statusColorMap[log.status] ?? 'border-white/10 bg-white/5 text-slate-300'}`}>
                          {log.status}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-xs text-slate-400">
                        <span>{log.triggered_by}</span>
                        <span>{timeAgo(log.created_at)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/60"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {actionLabelMap[selectedLog.action_type] ?? selectedLog.action_type}
                </h3>
                <p className="mt-1 text-sm text-slate-400">{formatDate(selectedLog.created_at)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300 hover:bg-white/5"
              >
                Kapat
              </button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Uye</div>
                <div className="mt-2 text-sm text-slate-100">{selectedLog.member_name || selectedLog.member_id || '-'}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Batch</div>
                <div className="mt-2 break-all text-sm text-slate-100">{selectedLog.batch_id || '-'}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Trigger</div>
                <div className="mt-2 text-sm text-slate-100">{selectedLog.triggered_by}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Durum</div>
                <div className="mt-2 text-sm text-slate-100">{selectedLog.status}</div>
              </div>
            </div>

            {selectedLog.reasoning && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 text-sm font-medium text-white">Muhakeme</div>
                <p className="text-sm leading-7 text-slate-300">{selectedLog.reasoning}</p>
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-2 text-sm font-medium text-white">Detaylar</div>
              <pre className="max-h-72 overflow-auto text-xs leading-6 text-slate-300">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgenticDashboard;
