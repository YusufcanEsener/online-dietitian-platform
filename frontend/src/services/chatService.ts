import api from '@/lib/api';
import type { Chat, Message } from '@/types';

export const getChats = async (): Promise<Chat[]> => {
    const response = await api.get<Chat[]>('/chats');
    return response.data;
};

export const getChat = async (chatId: string): Promise<Chat> => {
    const response = await api.get<Chat>(`/chats/${chatId}`);
    return response.data;
};

// Üye için: parametresiz, otomatik diyetisyen eşleştirme
export const startChat = async (): Promise<Chat> => {
    const response = await api.post<Chat>('/chats/start');
    return response.data;
};

// Diyetisyen için: belirli bir üyeyle sohbet başlat
export const startChatWithMember = async (memberId: string): Promise<Chat> => {
    const response = await api.post<Chat>('/chats/start', { member_id: memberId });
    return response.data;
};

export const getMessages = async (chatId: string, skip = 0, limit = 50): Promise<Message[]> => {
    const response = await api.get<Message[]>(`/chats/${chatId}/messages`, {
        params: { skip, limit },
    });
    return response.data;
};

export const sendMessage = async (chatId: string, content: string): Promise<Message> => {
    const response = await api.post<Message>(`/chats/${chatId}/messages`, { content });
    return response.data;
};
