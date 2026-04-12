import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { EmptyState, Badge } from '../../components/ui/Widgets';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { Colors } from '../../constants/colors';
import { Spacing, Typography } from '../../constants/theme';
import { getChats, updateChatStatus, type Chat } from '../../services/chatService';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DietitianStackParamList } from '../../navigation/DietitianNavigator';

type Nav = NativeStackNavigationProp<DietitianStackParamList>;

export default function DietitianMessagesScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<Nav>();
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const data = await getChats();
            setChats(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const handleStatus = (chatId: string, status: 'active' | 'rejected') => {
        const label = status === 'active' ? 'Kabul Et' : 'Reddet';
        Alert.alert(
            `${label}`,
            `Bu mesaj talebini ${status === 'active' ? 'kabul' : 'reddetmek'} istiyor musunuz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: label, onPress: async () => {
                        try {
                            await updateChatStatus(chatId, status);
                            await load();
                        } catch (e: any) {
                            Alert.alert('Hata', e?.response?.data?.detail || 'İşlem başarısız.');
                        }
                    },
                },
            ]
        );
    };

    if (loading) return <LoadingScreen message="Mesajlar yükleniyor..." />;

    const renderItem = ({ item }: { item: Chat }) => {
        const isPending = item.status === 'pending';
        return (
            <Card style={styles.card}>
                <TouchableOpacity
                    onPress={() =>
                        navigation.navigate('ChatDetail', {
                            chatId: item.id,
                            participantName: item.other_participant?.name || 'Danışan',
                        })
                    }
                    activeOpacity={0.8}
                >
                    <View style={styles.cardRow}>
                        <View style={styles.avatar}>
                            <Ionicons name="person-outline" size={20} color={Colors.primary} />
                        </View>
                        <View style={styles.info}>
                            <View style={styles.topRow}>
                                <Text style={styles.name}>{item.other_participant?.name || 'Bilinmiyor'}</Text>
                                <Badge
                                    label={item.status === 'active' ? 'Aktif' : item.status === 'pending' ? 'Bekliyor' : 'Reddedildi'}
                                    variant={item.status === 'active' ? 'success' : item.status === 'pending' ? 'warning' : 'danger'}
                                />
                            </View>
                            {item.member_subscription_status !== undefined && (
                                <Badge
                                    label={item.member_subscription_status ? '💎 Abone' : '⭕ Abone Değil'}
                                    variant={item.member_subscription_status ? 'success' : 'default'}
                                />
                            )}
                            {item.last_message && (
                                <Text style={styles.lastMsg} numberOfLines={1}>{item.last_message.content}</Text>
                            )}
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={Colors.mutedForeground} />
                    </View>
                </TouchableOpacity>

                {isPending && (
                    <View style={styles.actionRow}>
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity style={styles.acceptBtn} onPress={() => handleStatus(item.id, 'active')}>
                                <Ionicons name="checkmark" size={16} color="#0c1a0c" />
                                <Text style={styles.acceptText}>Kabul Et</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1 }}>
                            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleStatus(item.id, 'rejected')}>
                                <Ionicons name="close" size={16} color="#fff" />
                                <Text style={styles.rejectText}>Reddet</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </Card>
        );
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <Header title="Mesajlar" subtitle="Danışan talepleri" />
            <FlatList
                data={chats}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                ListEmptyComponent={<EmptyState icon="chatbubbles-outline" title="Mesaj bulunamadı" />}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    list: { padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['3xl'] },
    card: { gap: Spacing.sm },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    avatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center',
    },
    info: { flex: 1, gap: 4 },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    name: { flex: 1, fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground },
    lastMsg: { fontSize: Typography.size.xs, color: Colors.mutedForeground },
    actionRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
    acceptBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
        backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: Spacing.sm,
    },
    acceptText: { color: '#0c1a0c', fontWeight: '700', fontSize: Typography.size.sm },
    rejectBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
        backgroundColor: Colors.destructive, borderRadius: 8, paddingVertical: Spacing.sm,
    },
    rejectText: { color: '#fff', fontWeight: '700', fontSize: Typography.size.sm },
});
