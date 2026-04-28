/**
 * Agent Service - Agentic AI ajan loglarını frontend'den sorgulama
 * Diyetisyen panelinde AI İzleme tab'ı için kullanılır.
 */
import api from '@/lib/api';

// --- Tipler ---

export interface AgentLogItem {
    id: string;
    action_type: string;
    member_id?: string;
    member_name?: string;
    details: Record<string, any>;
    reasoning?: string;
    n8n_execution_id?: string;
    triggered_by: string;
    status: string;
    created_at: string;
}

export interface AgentLogsResponse {
    success: boolean;
    logs: AgentLogItem[];
    total: number;
    page: number;
    page_size: number;
    error?: string;
}

// --- API Çağrıları ---

/**
 * Ajan eylem loglarını getir (paginate + filtre)
 */
export const getAgentLogs = async (
    page: number = 1,
    pageSize: number = 20,
    actionType?: string
): Promise<AgentLogsResponse> => {
    const params: Record<string, any> = { page, page_size: pageSize };
    if (actionType && actionType !== 'all') {
        params.action_type = actionType;
    }
    const response = await api.get<AgentLogsResponse>('/agent/logs', { params });
    return response.data;
};
