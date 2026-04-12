import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { EmptyState, Badge } from '../../components/ui/Widgets';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { Colors } from '../../constants/colors';
import { Spacing, Typography, Radius } from '../../constants/theme';
import { getChats, type Chat } from '../../services/chatService';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MemberStackParamList } from '../../navigation/MemberNavigator';

type Nav = NativeStackNavigationProp<MemberStackParamList>;

export default function MemberMessagesScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<Nav>();
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadChats = useCallback(async () => {
        try {
            const data = await getChats();
            setChats(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadChats(); }, [loadChats]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadChats();
        setRefreshing(false);
    };

    if (loading) return <LoadingScreen message="Mesajlar yükleniyor..." />;

    const statusColor = (status?: string) => {
        if (status === 'active') return 'success';
        if (status === 'pending') return 'warning';
        if (status === 'rejected') return 'danger';
        return 'default';
    };

    const statusLabel = (status?: string) => {
        if (status === 'active') return 'Aktif';
        if (status === 'pending') return 'Beklemede';
        if (status === 'rejected') return 'Reddedildi';
        return 'Bilinmiyor';
    };

    const renderItem = ({ item }: { item: Chat }) => (
        <TouchableOpacity
            onPress={() =>
                navigation.navigate('ChatDetail', {
                    chatId: item.id,
                    participantName: item.other_participant?.name || 'Konuşma',
                })
            }
            activeOpacity={0.8}
        >
            <Card style={styles.chatCard}>
                <View style={styles.chatRow}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={22} color={Colors.primary} />
                    </View>
                    <View style={styles.chatInfo}>
                        <View style={styles.chatTopRow}>
                            <Text style={styles.chatName} numberOfLines={1}>
                                {item.other_participant?.name || 'Bilinmiyor'}
                            </Text>
                            <Badge label={statusLabel(item.status)} variant={statusColor(item.status) as any} />
                        </View>
                        {item.other_participant?.title && (
                            <Text style={styles.chatSubtitle}>{item.other_participant.title}</Text>
                        )}
                        {item.last_message && (
                            <Text style={styles.lastMessage} numberOfLines={1}>
                                {item.last_message.content}
                            </Text>
                        )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.mutedForeground} />
                </View>
            </Card>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <Header title="Mesajlar" subtitle="Diyetisyeninizle iletişim" />
            <FlatList
                data={chats}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
                ListEmptyComponent={
                    <EmptyState
                        icon="chatbubbles-outline"
                        title="Henüz mesajınız yok"
                        description="Uzmanlar sayfasından bir diyetisyen seçerek mesaj gönderebilirsiniz."
                    />
                }
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    list: { padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['3xl'] },
    chatCard: { padding: Spacing.md },
    chatRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    avatar: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center',
    },
    chatInfo: { flex: 1 },
    chatTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 },
    chatName: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground, flex: 1 },
    chatSubtitle: { fontSize: Typography.size.xs, color: Colors.primary, marginBottom: 2 },
    lastMessage: { fontSize: Typography.size.xs, color: Colors.mutedForeground },
});
