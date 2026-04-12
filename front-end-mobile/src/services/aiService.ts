import api from './api';

// ── Tipler ──────────────────────────────────────────────────────────────────

export interface AgenticMember {
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

export interface AgenticReportResponse {
    success: boolean;
    dietitian_name?: string;
    report_date?: string;
    total_members?: number;
    critical_count?: number;
    warning_count?: number;
    good_count?: number;
    members?: AgenticMember[];
    error?: string;
}

export interface MemberStatus {
    id: string;
    name: string;
    email?: string;
    score?: number;
    status: 'critical' | 'warning' | 'good';
    analysis?: string;
    problems?: string[];
    recommendation?: string;
    issue?: string;
    action?: string;
    days_without_log?: number;
}

export interface DailyReportResponse {
    success: boolean;
    date?: string;
    dietitian_name?: string;
    report_date?: string;
    total_members?: number;
    summary?: {
        total?: number;
        critical: number;
        warning: number;
        good: number;
    };
    members?: MemberStatus[];
    error?: string;
}

export interface GeneratePlanResponse {
    success: boolean;
    daily_targets?: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        water: number;
    };
    meals?: {
        meal_type: string;
        time?: string;
        notes?: string;
        foods: { name: string; amount: string }[];
    }[];
    error?: string;
}

export interface AIAnalyzeResponse {
    success: boolean;
    analysis?: string;
    error?: string;
}

// ── API Fonksiyonları ────────────────────────────────────────────────────────

/** POST /api/v1/ai/agentic-report  (dietitian_id opsiyonel) */
export const getAgenticReport = async (dietitianId?: string): Promise<AgenticReportResponse> => {
    const response = await api.post<AgenticReportResponse>('/ai/agentic-report',
        dietitianId ? { dietitian_id: dietitianId } : {}
    );
    return response.data;
};

/** POST /api/v1/ai/agentic-alert?member_id=...&alert_type=critical */
export const sendAgenticAlert = async (memberId: string, alertType = 'critical') => {
    const response = await api.post('/ai/agentic-alert', null, {
        params: { member_id: memberId, alert_type: alertType },
    });
    return response.data;
};

/** POST /api/v1/ai/daily-report */
export const getDailyReport = async (): Promise<DailyReportResponse> => {
    const response = await api.post<DailyReportResponse>('/ai/daily-report');
    return response.data;
};

/** POST /api/v1/ai/analyze-member */
export const analyzeMemberWithAI = async (memberId: string): Promise<AIAnalyzeResponse> => {
    const response = await api.post<AIAnalyzeResponse>('/ai/analyze-member', { member_id: memberId });
    return response.data;
};

/** POST /api/v1/ai/generate-plan */
export const generateNutritionPlan = async (data: {
    member_id: string;
    goal: string;          // 'weight_loss' | 'muscle_gain' | 'maintenance'
    target_calories: number;
}): Promise<GeneratePlanResponse> => {
    const response = await api.post<GeneratePlanResponse>('/ai/generate-plan', data);
    return response.data;
};

/** GET /api/v1/ai/agentic-reports?limit=10 */
export const getAgenticReports = async (limit = 10) => {
    const response = await api.get('/ai/agentic-reports', { params: { limit } });
    return response.data;
};

/** GET /api/v1/ai/agentic-latest */
export const getLatestAgenticReport = async () => {
    const response = await api.get('/ai/agentic-latest');
    return response.data;
};

/** POST /api/v1/ai/weekly-progress */
export const getWeeklyProgress = async (memberId: string) => {
    const response = await api.post('/ai/weekly-progress', { member_id: memberId });
    return response.data;
};

/** POST /api/v1/ai/agentic-generate */
export const generateAgenticReport = async () => {
    const response = await api.post('/ai/agentic-generate');
    return response.data;
};
