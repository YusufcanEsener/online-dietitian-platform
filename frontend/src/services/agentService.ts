import api, { API_BASE_URL } from '@/lib/api';

export interface AgentLogItem {
  id: string;
  action_type: string;
  member_id?: string;
  member_name?: string;
  batch_id?: string;
  risk_level?: string | null;
  ai_used?: boolean | null;
  fallback_used?: boolean | null;
  execution_time_ms?: number | null;
  ai_error?: string | null;
  details: Record<string, unknown>;
  reasoning?: string;
  triggered_by: string;
  status: string;
  created_at: string;
}

export interface MonitoringEvent {
  event_type: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface MonitoringSummary {
  total_members: number;
  recent_batches_24h: number;
  websocket_clients: number;
}

export interface SchedulerState {
  enabled: boolean;
  running: boolean;
  instance_id: string;
  has_lock: boolean;
  current_batch_id?: string | null;
  next_run_at?: string | null;
  last_batch_summary?: Record<string, unknown> | null;
}

export interface MonitoringResponse {
  success: boolean;
  scheduler: SchedulerState;
  summary: MonitoringSummary;
  history: MonitoringEvent[];
  logs: AgentLogItem[];
}

export interface RunBatchResponse {
  success: boolean;
  batch_id: string;
  status: string;
}

export const getAgentMonitoring = async (limit = 100): Promise<MonitoringResponse> => {
  const response = await api.get<MonitoringResponse>('/agent/monitoring', {
    params: { limit },
  });
  return response.data;
};

export const runAgentBatch = async (memberIds?: string[]): Promise<RunBatchResponse> => {
  const response = await api.post<RunBatchResponse>('/agent/monitoring/run', {
    member_ids: memberIds ?? null,
  });
  return response.data;
};

export const buildAgentMonitoringWsUrl = (): string => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Yetki tokeni bulunamadi');
  }

  const baseUrl = API_BASE_URL && API_BASE_URL.length > 0 ? API_BASE_URL : window.location.origin;
  const wsBase = baseUrl.replace(/^http/i, 'ws');
  return `${wsBase}/api/v1/agent/monitoring/ws?token=${encodeURIComponent(token)}`;
};
