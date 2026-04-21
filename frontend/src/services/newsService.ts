import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

export interface PubMedNewsItem {
  id: string;
  title: string;
  link: string;
  description?: string;
  published_at?: string;
  summary_tr: string;
  source: string;
  created_at: string;
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
};
