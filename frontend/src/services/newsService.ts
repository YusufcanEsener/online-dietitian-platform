import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

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

export const newsService = {
  async getNews(skip = 0, limit = 20): Promise<PubMedNewsItem[]> {
    const token = localStorage.getItem("access_token");
    const response = await axios.get<PubMedNewsItem[]>(
      `${API_URL}/api/v1/news/`,
      {
        params: { skip, limit },
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async getInteractions(): Promise<NewsInteraction[]> {
    const token = localStorage.getItem("access_token");
    const response = await axios.get<NewsInteraction[]>(
      `${API_URL}/api/v1/news/interactions`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  async interact(
    newsId: string,
    payload: { is_read?: boolean; is_favorite?: boolean }
  ): Promise<NewsInteraction> {
    const token = localStorage.getItem("access_token");
    const response = await axios.post<NewsInteraction>(
      `${API_URL}/api/v1/news/${newsId}/interact`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },
};
