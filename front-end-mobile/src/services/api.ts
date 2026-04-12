import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants/api';
import { getToken, clearAll } from '../utils/storage';

let _onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: () => void) => {
    _onUnauthorized = handler;
};

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Her isteğe token ekle
api.interceptors.request.use(
    async (config) => {
        const token = await getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: 401 durumunda otomatik logout
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await clearAll();
            if (_onUnauthorized) {
                _onUnauthorized();
            }
        }
        return Promise.reject(error);
    }
);

export default api;
