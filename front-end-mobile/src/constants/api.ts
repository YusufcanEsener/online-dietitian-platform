// =============================================
// API YAPILANDIRMASI
// =============================================
// API URL'si app.json > expo.extra.apiUrl'den okunur
// Değiştirmek için app.json dosyasını düzenleyin

import Constants from 'expo-constants';

// Expo Constants üzerinden API URL al (app.json > extra > apiUrl)
const extra = Constants.expoConfig?.extra || {};

export const API_BASE_URL: string = extra.apiUrl || 'http://localhost:8000/api/v1';

export const API_TIMEOUT = 15000; // 15 saniye

export const STORAGE_KEYS = {
    ACCESS_TOKEN: '@dietplatform/access_token',
    USER: '@dietplatform/user',
    REFRESH_TOKEN: '@dietplatform/refresh_token',
} as const;
