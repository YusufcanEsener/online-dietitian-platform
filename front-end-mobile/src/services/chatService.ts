import api from './api';

export interface Chat {
    id: string;
    participants: string[];
    status?: 'active' | 'pending' | 'rejected';
    other_participant?: {
        name: string;
        title?: string;
    };
    member_subscription_status?: boolean;
    last_message?: {
        id: string;
        sender_id: string;
        content: string;
        timestamp: string;
    };
}

export interface Message {
    id: string;
    sender_id: string;
    content: string;
    timestamp: string;
}

export const getChats = async (category?: 'subscribers' | 'non-subscribers'): Promise<Chat[]> => {
    const response = await api.get<Chat[]>('/chats', { params: { category } });
    return response.data;
};

export const getChat = async (chatId: string): Promise<Chat> => {
    const response = await api.get<Chat>(`/chats/${chatId}`);
    return response.data;
};

export const startChat = async (participantId: string): Promise<Chat> => {
    const response = await api.post<Chat>('/chats/start', null, {
        params: { participant_id: participantId },
    });
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

export const updateChatStatus = async (
    chatId: string,
    status: 'active' | 'rejected'
): Promise<Chat> => {
    const response = await api.put<Chat>(`/chats/${chatId}/status`, { status });
    return response.data;
};
