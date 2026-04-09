import api from '@/lib/api';
import type { Member, Dietitian, MemberUpdate } from '@/types';

export const getMeFull = async (): Promise<Member> => {
    const response = await api.get<Member>('/members/me/full');
    return response.data;
};

export const updateProfile = async (data: MemberUpdate): Promise<Member> => {
    const response = await api.put<Member>('/members/me', data);
    return response.data;
};

export const getMyDietitian = async (): Promise<Dietitian> => {
    const response = await api.get<Dietitian>('/members/my-dietitian');
    return response.data;
};

export interface MyNutritionPlan {
    id: string;
    dietitian_id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date?: string;
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

export const getMyPlan = async (): Promise<MyNutritionPlan> => {
    const response = await api.get<MyNutritionPlan>('/members/my-plan');
    return response.data;
};
