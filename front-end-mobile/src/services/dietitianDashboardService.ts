import api from './api';

export interface DietitianStats {
    total_members: number;
    active_members: number;
    active_plans: number;
    rating: number;
}

export interface DietitianMember {
    id: string;
    email: string;
    full_name: string | null;
    subscription_status: boolean;
    weight: number | null;
    height: number | null;
    target_weight: number | null;
    has_active_plan: boolean;
}

export interface DailyTargets {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
}

export interface Food {
    name: string;
    amount?: string;
}

export interface Meal {
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    foods: Food[];
    notes?: string;
    time?: string;
}

export interface NutritionPlanCreate {
    member_id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date?: string;
    daily_targets: DailyTargets;
    meals: Meal[];
    notes?: string;
}

export interface NutritionPlan extends NutritionPlanCreate {
    id: string;
    dietitian_id: string;
    is_active: boolean;
}

export interface PlanSummary {
    id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date?: string;
    is_active: boolean;
    daily_targets: DailyTargets;
    created_at: string;
}

export interface DailyLogEntry {
    date: string;
    calories_consumed: number;
    calories_target: number;
    protein_consumed: number;
    carbs_consumed: number;
    fat_consumed: number;
    water_consumed: number;
}

export interface MemberFullDetail extends DietitianMember {
    gender?: string;
    activity_level?: string;
    birth_date?: string;
    active_plan?: PlanSummary;
    all_plans: PlanSummary[];
    daily_logs: DailyLogEntry[];
}

export interface SavedCalorieData {
    member_id: string;
    member_name?: string;
    calculated_bmr: number;
    calculated_tdee: number;
    calculated_target_calories: number;
    calculated_protein: number;
    calculated_carbs: number;
    calculated_fat: number;
    calorie_goal: string;
    calorie_calculated_at: string;
}

export const getStats = async (): Promise<DietitianStats> => {
    const response = await api.get<DietitianStats>('/dietitian/stats');
    return response.data;
};

export const getMyMembers = async (): Promise<DietitianMember[]> => {
    const response = await api.get<DietitianMember[]>('/dietitian/my-members');
    return response.data;
};

export const getMemberDetail = async (memberId: string): Promise<MemberFullDetail> => {
    const response = await api.get<MemberFullDetail>(`/dietitian/member/${memberId}`);
    return response.data;
};

export const createNutritionPlan = async (plan: NutritionPlanCreate): Promise<NutritionPlan> => {
    const response = await api.post<NutritionPlan>('/dietitian/nutrition-plans', plan);
    return response.data;
};

export const getNutritionPlan = async (planId: string): Promise<NutritionPlan> => {
    const response = await api.get<NutritionPlan>(`/dietitian/nutrition-plans/${planId}`);
    return response.data;
};

export const updateNutritionPlan = async (
    planId: string,
    data: Partial<NutritionPlanCreate>
): Promise<NutritionPlan> => {
    const response = await api.put<NutritionPlan>(`/dietitian/nutrition-plans/${planId}`, data);
    return response.data;
};

export const deleteNutritionPlan = async (planId: string): Promise<void> => {
    await api.delete(`/dietitian/nutrition-plans/${planId}`);
};

export const getMemberCalories = async (
    memberId: string
): Promise<{ success: boolean; data?: SavedCalorieData; message?: string }> => {
    const response = await api.get(`/dietitian/member/${memberId}/calories`);
    return response.data;
};

export const saveMemberCalories = async (memberId: string, calorieData: any) => {
    const response = await api.post(`/dietitian/member/${memberId}/save-calories`, calorieData);
    return response.data;
};
