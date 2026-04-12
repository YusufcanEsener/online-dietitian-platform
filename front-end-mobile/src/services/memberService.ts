import api from './api';
import type { User } from './authService';

export interface MemberUpdate {
    full_name?: string;
    height?: number;
    weight?: number;
    target_weight?: number;
    birth_date?: string;
    gender?: 'male' | 'female' | 'other';
    activity_level?: string;
    phone?: string;
    city?: string;
}

export interface MyNutritionPlan {
    id: string;
    dietitian_id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date?: string;
    is_active: boolean;
    daily_targets: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        water: number;
    };
    meals: {
        meal_type: string;
        foods: (string | { name: string; amount?: string })[];
        notes?: string;
        time?: string;
    }[];
    notes?: string;
}

export const getMeFull = async (): Promise<User> => {
    const response = await api.get<User>('/members/me/full');
    return response.data;
};

export const updateProfile = async (data: MemberUpdate): Promise<User> => {
    const response = await api.put<User>('/members/me', data);
    return response.data;
};

export const selectDietitian = async (dietitianId: string): Promise<User> => {
    const response = await api.post<User>('/members/select-dietitian', null, {
        params: { dietitian_id: dietitianId },
    });
    return response.data;
};

export const getMyDietitian = async (): Promise<User> => {
    const response = await api.get<User>('/members/my-dietitian');
    return response.data;
};

export const removeMyDietitian = async (): Promise<void> => {
    await api.delete('/members/my-dietitian');
};

export const getMyPlan = async (): Promise<MyNutritionPlan> => {
    const response = await api.get<MyNutritionPlan>('/members/my-plan');
    return response.data;
};
