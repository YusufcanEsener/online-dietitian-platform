import api from './api';

export interface DailyLog {
    id: string;
    member_id: string;
    log_date: string;
    calories_consumed: number;
    calories_target: number;
    protein: number;
    protein_target: number;
    carbs: number;
    carbs_target: number;
    fat: number;
    fat_target: number;
    water_glasses: number;
    water_target: number;
}

export interface DailyLogUpdate {
    calories_consumed?: number;
    calories_target?: number;
    protein?: number;
    protein_target?: number;
    carbs?: number;
    carbs_target?: number;
    fat?: number;
    fat_target?: number;
    water_glasses?: number;
    water_target?: number;
}

export const getTodayLog = async (): Promise<DailyLog> => {
    const response = await api.get<DailyLog>('/daily-logs/today');
    return response.data;
};

export const updateTodayLog = async (data: DailyLogUpdate): Promise<DailyLog> => {
    const response = await api.put<DailyLog>('/daily-logs/today', data);
    return response.data;
};
