import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/api';

export const storeToken = async (token: string): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
};

export const getToken = async (): Promise<string | null> => {
    return AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

export const removeToken = async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
};

export const storeUser = async (user: object): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const getUser = async (): Promise<any | null> => {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return val ? JSON.parse(val) : null;
};

export const removeUser = async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
};

export const clearAll = async (): Promise<void> => {
    await AsyncStorage.multiRemove([STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.USER]);
};
