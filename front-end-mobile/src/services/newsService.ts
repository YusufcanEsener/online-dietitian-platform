import api from './api';

// ── Tipler ──────────────────────────────────────────────────────────────────

export interface PubMedNewsItem {
    id: string;
    title: string;
    title_tr?: string;
    link: string;
    description?: string;
    published_at?: string;
    summary_tr: string;
    source: string;
    created_at: string;
}

export interface NewsInteraction {
    news_id: string;
    is_read: boolean;
    is_favorite: boolean;
}

// ── API Fonksiyonları ────────────────────────────────────────────────────────

/** GET /api/v1/news/ */
export const getNews = async (skip = 0, limit = 20): Promise<PubMedNewsItem[]> => {
    const response = await api.get<PubMedNewsItem[]>('/news/', {
        params: { skip, limit },
    });
    return response.data;
};

/** GET /api/v1/news/interactions */
export const getInteractions = async (): Promise<NewsInteraction[]> => {
    try {
        const response = await api.get<NewsInteraction[]>('/news/interactions');
        return response.data;
    } catch {
        return []; // fail gracefully
    }
};

/** POST /api/v1/news/:newsId/interact */
export const interact = async (
    newsId: string,
    payload: { is_read?: boolean; is_favorite?: boolean }
): Promise<NewsInteraction> => {
    const response = await api.post<NewsInteraction>(
        `/news/${newsId}/interact`,
        payload
    );
    return response.data;
};
