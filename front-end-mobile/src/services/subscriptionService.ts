import api from './api';

// ── Tipler ──────────────────────────────────────────────────────────────────

export interface Plan {
    id: string;
    name: string;
    price: number;
    duration_days: number;
    features: string;
}

export interface Subscription {
    id: string;
    plan_id: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

// ── API Fonksiyonları ────────────────────────────────────────────────────────

/** GET /api/v1/subscriptions/plans */
export const getPlans = async (): Promise<Plan[]> => {
    const response = await api.get<Plan[]>('/subscriptions/plans');
    return response.data;
};

/** GET /api/v1/subscriptions/plans/{plan_id} */
export const getPlan = async (planId: string): Promise<Plan> => {
    const response = await api.get<Plan>(`/subscriptions/plans/${planId}`);
    return response.data;
};

/** GET /api/v1/subscriptions/my-subscription */
export const getMySubscription = async (): Promise<Subscription> => {
    const response = await api.get<Subscription>('/subscriptions/my-subscription');
    return response.data;
};

/** POST /api/v1/subscriptions/purchase?plan_id=... */
export const purchaseSubscription = async (planId: string): Promise<Subscription> => {
    const response = await api.post<Subscription>('/subscriptions/purchase', null, {
        params: { plan_id: planId },
    });
    return response.data;
};

/** DELETE /api/v1/subscriptions/my-subscription */
export const cancelSubscription = async (): Promise<void> => {
    await api.delete('/subscriptions/my-subscription');
};
