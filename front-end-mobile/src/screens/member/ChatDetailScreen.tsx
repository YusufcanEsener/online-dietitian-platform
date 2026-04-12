import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/layout/Header';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { Colors } from '../../constants/colors';
import { Spacing, Typography, Radius } from '../../constants/theme';
import { getMessages, sendMessage, type Message } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { useRoute, type RouteProp } from '@react-navigation/native';
import type { MemberStackParamList } from '../../navigation/MemberNavigator';

type RouteProps = RouteProp<MemberStackParamList, 'ChatDetail'>;

export default function ChatDetailScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const route = useRoute<RouteProps>();
    const { chatId, participantName } = route.params;

    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const flatRef = useRef<FlatList>(null);

    const loadMessages = useCallback(async () => {
        try {
            const data = await getMessages(chatId);
            // inverted FlatList: en yeni mesaj index 0'da olmalı
            setMessages([...data].reverse());
        } finally {
            setLoading(false);
        }
    }, [chatId]);

    useEffect(() => { loadMessages(); }, [loadMessages]);

    // Her 5 saniyede bir yenile
    useEffect(() => {
        const interval = setInterval(loadMessages, 5000);
        return () => clearInterval(interval);
    }, [loadMessages]);

    const handleSend = async () => {
        if (!text.trim()) return;
        setSending(true);
        const content = text.trim();
        setText('');
        try {
            const msg = await sendMessage(chatId, content);
            // inverted listede yeni mesaj başa eklenir (görsel olarak en altta)
            setMessages((prev) => [msg, ...prev]);
            setTimeout(() => flatRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
        } catch (e: any) {
            Alert.alert('Hata', e?.response?.data?.detail || 'Mesaj gönderilemedi.');
            setText(content);
        } finally {
            setSending(false);
        }
    };

    if (loading) return <LoadingScreen message="Mesajlar yükleniyor..." />;

    const renderMessage = ({ item }: { item: Message }) => {
        const isMine = item.sender_id === user?.id;
        return (
            <View style={[styles.msgWrapper, isMine ? styles.myWrapper : styles.theirWrapper]}>
                <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
                    <Text style={[styles.msgText, isMine ? styles.myText : styles.theirText]}>
                        {item.content}
                    </Text>
                    <Text style={styles.msgTime}>
                        {new Date(item.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
        >
            <View style={{ paddingTop: insets.top }}>
                <Header title={participantName} showBack />
            </View>
            <FlatList
                ref={flatRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.msgList}
                inverted
                showsVerticalScrollIndicator={false}
            />
            <View style={[styles.inputRow, { paddingBottom: insets.bottom + Spacing.sm }]}>
                <TextInput
                    style={styles.textInput}
                    value={text}
                    onChangeText={setText}
                    placeholder="Mesajınızı yazın..."
                    placeholderTextColor={Colors.mutedForeground}
                    multiline
                    maxLength={500}
                    selectionColor={Colors.primary}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
                    onPress={handleSend}
                    disabled={!text.trim() || sending}
                >
                    <Ionicons name="send" size={18} color={Colors.primaryForeground} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    msgList: { padding: Spacing.base, paddingBottom: Spacing.lg, gap: Spacing.sm },
    msgWrapper: { maxWidth: '80%' },
    myWrapper: { alignSelf: 'flex-end' },
    theirWrapper: { alignSelf: 'flex-start' },
    bubble: {
        borderRadius: Radius.xl, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
        gap: 4,
    },
    myBubble: { backgroundColor: Colors.primary },
    theirBubble: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
    msgText: { fontSize: Typography.size.base, lineHeight: 20 },
    myText: { color: Colors.primaryForeground },
    theirText: { color: Colors.foreground },
    msgTime: { fontSize: 10, color: 'rgba(255,255,255,0.6)', alignSelf: 'flex-end' },
    inputRow: {
        flexDirection: 'row', alignItems: 'flex-end',
        padding: Spacing.sm, gap: Spacing.sm,
        backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border,
    },
    textInput: {
        flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.xl,
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
        color: Colors.foreground, fontSize: Typography.size.base,
        maxHeight: 120, borderWidth: 1, borderColor: Colors.border,
    },
    sendBtn: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    },
    sendBtnDisabled: { opacity: 0.4 },
});
