import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { EmptyState, Badge } from '../../components/ui/Widgets';
import { Button } from '../../components/ui/Button';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { Colors } from '../../constants/colors';
import { Spacing, Typography, Radius } from '../../constants/theme';
import { getDietitians, type Dietitian } from '../../services/dietitianService';
import { selectDietitian, getMyDietitian, removeMyDietitian } from '../../services/memberService';
import { useAuth } from '../../context/AuthContext';

export default function ExpertsScreen() {
    const insets = useSafeAreaInsets();
    const { user, refreshUser } = useAuth();

    const [dietitians, setDietitians] = useState<Dietitian[]>([]);
    const [myDietitian, setMyDietitian] = useState<Dietitian | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            const [list] = await Promise.allSettled([getDietitians()]);
            if (list.status === 'fulfilled') setDietitians(list.value);
            try {
                const mine = await getMyDietitian();
                setMyDietitian(mine);
            } catch { setMyDietitian(null); }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleSelect = async (id: string, name: string) => {
        Alert.alert(
            'Diyetisyen Seç',
            `${name} isimli diyetisyeni seçmek istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Seç', onPress: async () => {
                        setActionLoading(id);
                        try {
                            await selectDietitian(id);
                            await refreshUser();
                            await loadData();
                            Alert.alert('Başarılı', 'Diyetisyen seçildi!');
                        } catch (e: any) {
                            Alert.alert('Hata', e?.response?.data?.detail || 'Seçim başarısız.');
                        } finally {
                            setActionLoading(null);
                        }
                    },
                },
            ]
        );
    };

    const handleRemove = async () => {
        Alert.alert('Diyetisyeni Kaldır', 'Diyetisyeninizi kaldırmak istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Kaldır', style: 'destructive', onPress: async () => {
                    try {
                        await removeMyDietitian();
                        await refreshUser();
                        setMyDietitian(null);
                        Alert.alert('Başarılı', 'Diyetisyeniniz kaldırıldı.');
                    } catch (e: any) {
                        Alert.alert('Hata', e?.response?.data?.detail || 'İşlem başarısız.');
                    }
                },
            },
        ]);
    };

    if (loading) return <LoadingScreen message="Uzmanlar yükleniyor..." />;

    const renderItem = ({ item }: { item: Dietitian }) => {
        const isMyDiet = myDietitian?.id === item.id;
        return (
            <Card style={styles.card} variant={isMyDiet ? 'bordered' : 'default'}>
                {/* Avatar + Info */}
                <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={28} color={Colors.primary} />
                    </View>
                    <View style={styles.info}>
                        <View style={styles.nameRow}>
                            <Text style={styles.name} numberOfLines={1}>
                                {item.full_name || 'İsimsiz'}
                            </Text>
                            {isMyDiet && <Badge label="Seçildi ✓" variant="success" />}
                        </View>
                        {item.title && (
                            <Text style={styles.title}>{item.title}</Text>
                        )}
                        {item.specialization && (
                            <Text style={styles.spec} numberOfLines={1}>{item.specialization}</Text>
                        )}
                    </View>
                </View>

                {/* Meta */}
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="star" size={14} color="#f59e0b" />
                        <Text style={styles.metaText}>{item.rating?.toFixed(1) || '0.0'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color={Colors.mutedForeground} />
                        <Text style={styles.metaText}>{item.experience_years} yıl</Text>
                    </View>
                </View>

                {item.bio && (
                    <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
                )}

                {isMyDiet ? (
                    <Button
                        title="Kaldır"
                        variant="destructive"
                        size="sm"
                        onPress={handleRemove}
                        style={{ marginTop: Spacing.md }}
                    />
                ) : (
                    <Button
                        title="Seç"
                        variant="outline"
                        size="sm"
                        loading={actionLoading === item.id}
                        onPress={() => handleSelect(item.id, item.full_name || 'bu diyetisyen')}
                        style={{ marginTop: Spacing.md }}
                    />
                )}
            </Card>
        );
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <Header title="Uzmanlar" subtitle={`${dietitians.length} diyetisyen`} />
            <FlatList
                data={dietitians}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                }
                ListEmptyComponent={
                    <EmptyState icon="people-outline" title="Diyetisyen bulunamadı" />
                }
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    list: { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['3xl'] },
    card: { gap: Spacing.sm },
    cardHeader: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
    avatar: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center',
    },
    info: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
    name: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground },
    title: { fontSize: Typography.size.sm, color: Colors.primary, fontWeight: '600', marginTop: 2 },
    spec: { fontSize: Typography.size.xs, color: Colors.mutedForeground, marginTop: 2 },
    metaRow: { flexDirection: 'row', gap: Spacing.lg },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: Typography.size.sm, color: Colors.mutedForeground },
    bio: { fontSize: Typography.size.sm, color: Colors.mutedForeground, lineHeight: 18 },
});
