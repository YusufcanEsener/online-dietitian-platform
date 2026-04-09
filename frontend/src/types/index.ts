export type UserRole = 'admin' | 'dietitian' | 'member';
export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface User {
    id: string;
    email: string;
    full_name: string | null;
    role: UserRole;
    is_active: boolean;
}

export interface Member extends User {
    subscription_status: boolean;
    height: number | null;
    weight: number | null;
    target_weight: number | null;
    birth_date: string | null;
    gender: Gender | null;
    activity_level: ActivityLevel | null;
    phone: string | null;
    city: string | null;
}

export interface MemberUpdate {
    full_name?: string;
    height?: number;
    weight?: number;
    target_weight?: number;
    birth_date?: string;
    gender?: Gender;
    activity_level?: ActivityLevel;
    phone?: string;
    city?: string;
}

export interface Dietitian extends User {
    title: string | null;
    specialization: string | null;
    experience_years: number;
    bio: string | null;
}

export interface AuthToken {
    access_token: string;
    token_type: string;
}

export interface Message {
    id: string;
    sender_id: string;
    content: string;
    timestamp: string;
}

export interface ParticipantDetails {
    name: string;
    title?: string;
}

export interface Chat {
    id: string;
    participants: string[];
    status?: 'active' | 'pending' | 'rejected';
    other_participant?: ParticipantDetails;
    last_message?: Message;
}

export interface SubscriptionPlan {
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

export interface AdminStats {
    total_users: number;
    total_members: number;
    active_subscriptions: number;
    total_chats: number;
    total_messages: number;
    total_plans: number;
}
