import api from '@/lib/api';

export interface AIAnalyzeRequest {
    member_id: string;
}

export interface AIAnalyzeResponse {
    success: boolean;
    analysis?: string;
    error?: string;
}

/**
 * Üye verilerini AI ile analiz et
 * Diyetisyen, danışanının tüm verilerini AI'a gönderip
 * kişiselleştirilmiş diyet önerileri alır.
 */
export const analyzeMemberWithAI = async (memberId: string): Promise<AIAnalyzeResponse> => {
    const response = await api.post<AIAnalyzeResponse>('/ai/analyze-member', {
        member_id: memberId
    });
    return response.data;
};


// ==================== YENİ AI FONKSİYONLARI ====================

export interface WeeklyProgressResponse {
    success: boolean;
    score?: number;
    score_label?: string;
    summary?: string;
    positives?: string[];
    improvements?: string[];
    recommendations?: string[];
    trend?: 'up' | 'down' | 'stable';
    alert?: string | null;
    error?: string;
}

/**
 * Agentic AI - Haftalık Gelişim Analizi
 * Danışanın son 7 günlük verilerini analiz edip skor ve öneriler üretir.
 */
export const getWeeklyProgress = async (memberId: string): Promise<WeeklyProgressResponse> => {
    const response = await api.post<WeeklyProgressResponse>('/ai/weekly-progress', {
        member_id: memberId
    });
    return response.data;
};


export interface MemberStatus {
    id: string;
    name: string;
    email?: string;
    score?: number;
    status: 'critical' | 'warning' | 'good';
    // Gemini format
    analysis?: string;
    problems?: string[];
    recommendation?: string;
    // Legacy format
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

/**
 * Günlük Danışan Raporu
 * Tüm danışanların durumunu analiz edip öncelik sırasına göre listeler.
 */
export const getDailyReport = async (): Promise<DailyReportResponse> => {
    const response = await api.post<DailyReportResponse>('/ai/daily-report');
    return response.data;
};


// ==================== AI BESLENME PROGRAMI OLUŞTURUCU ====================

export interface GeneratePlanRequest {
    member_id: string;
    goal: 'weight_loss' | 'muscle_gain' | 'maintenance';
    target_calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    menu_type?: 'daily' | 'weekly';
    medications?: string;
    allergies?: string;
    disliked_foods?: string;
}

export interface GeneratedMeal {
    meal_type: string;
    time?: string;
    notes?: string;
    foods: { name: string; amount: string }[];
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
    meals?: GeneratedMeal[];
    error?: string;
}

/**
 * AI ile Beslenme Programı Oluştur
 * Hedef ve kalori bilgilerine göre AI beslenme programı önerir.
 */
export const generateNutritionPlan = async (data: GeneratePlanRequest): Promise<GeneratePlanResponse> => {
    const response = await api.post<GeneratePlanResponse>('/ai/generate-plan', data);
    return response.data;
};


// ==================== AGENTIC AI ====================

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

/**
 * Agentic AI Raporu Al
 * Tüm danışanların kritik/uyarı/iyi durumlarını döndürür
 */
export const getAgenticReport = async (): Promise<AgenticReportResponse> => {
    const response = await api.post<AgenticReportResponse>('/ai/agentic-report');
    return response.data;
};

/**
 * Kritik Uyarı Gönder
 * n8n webhook tetikleyerek Telegram'a mesaj gönderir
 */
export const sendAgenticAlert = async (memberId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    const response = await api.post('/ai/agentic-alert', null, { params: { member_id: memberId } });
    return response.data;
};

/**
 * En son Agentic raporu getir (kaydedilmiş)
 */
export const getLatestAgenticReport = async (): Promise<{ success: boolean; report?: any; error?: string }> => {
    const response = await api.get('/ai/agentic-latest');
    return response.data;
};

/**
 * Geçmiş Agentic raporlarını getir
 */
export const getAgenticReports = async (limit: number = 10): Promise<{ success: boolean; reports?: any[]; error?: string }> => {
    const response = await api.get('/ai/agentic-reports', { params: { limit } });
    return response.data;
};

/**
 * Yeni Agentic raporu oluştur ve kaydet
 */
export const generateAgenticReport = async (): Promise<{ success: boolean; report?: any; error?: string }> => {
    const response = await api.post('/ai/agentic-generate');
    return response.data;
};
