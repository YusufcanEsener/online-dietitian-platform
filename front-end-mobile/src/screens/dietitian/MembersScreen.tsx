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
import { getMyMembers, type DietitianMember } from '../../services/dietitianDashboardService';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DietitianStackParamList } from '../../navigation/DietitianNavigator';

type Nav = NativeStackNavigationProp<DietitianStackParamList>;

export default function DietitianMembersScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<Nav>();
    const [members, setMembers] = useState<DietitianMember[]>([]);
    const [filtered, setFiltered] = useState<DietitianMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    const load = useCallback(async () => {
        try {
            const data = await getMyMembers();
            setMembers(data);
            setFiltered(data);
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

    const handleSearch = (text: string) => {
        setSearch(text);
        const q = text.toLowerCase();
        setFiltered(members.filter((m) =>
            (m.full_name || '').toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q)
        ));
    };

    if (loading) return <LoadingScreen message="Danışanlar yükleniyor..." />;

    const renderItem = ({ item }: { item: DietitianMember }) => (
        <TouchableOpacity
            onPress={() => navigation.navigate('MemberDetail', { memberId: item.id })}
            activeOpacity={0.8}
        >
            <Card style={styles.card}>
                <View style={styles.row}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.info}>
                        <Text style={styles.name}>{item.full_name || item.email}</Text>
                        <Text style={styles.sub} numberOfLines={1}>{item.email}</Text>
                        <View style={styles.badges}>
                            <Badge
                                label={item.has_active_plan ? 'Program Var' : 'Program Yok'}
                                variant={item.has_active_plan ? 'success' : 'warning'}
                            />
                            <Badge
                                label={item.subscription_status ? 'Abone' : 'Abone Değil'}
                                variant={item.subscription_status ? 'success' : 'default'}
                            />
                        </View>
                    </View>
                    <View style={styles.stats}>
                        {item.weight && <Text style={styles.statText}>{item.weight} kg</Text>}
                        {item.height && <Text style={styles.statText}>{item.height} cm</Text>}
                        <Ionicons name="chevron-forward" size={16} color={Colors.mutedForeground} />
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <Header title="Danışanlarım" subtitle={`${members.length} kişi`} />
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={16} color={Colors.mutedForeground} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={handleSearch}
                    placeholder="İsim veya e-posta ara..."
                    placeholderTextColor={Colors.mutedForeground}
                    selectionColor={Colors.primary}
                />
            </View>
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                ListEmptyComponent={<EmptyState icon="people-outline" title="Danışan bulunamadı" />}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.base,
        marginVertical: Spacing.sm, backgroundColor: Colors.input,
        borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    },
    searchIcon: { marginLeft: Spacing.md },
    searchInput: {
        flex: 1, paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
        color: Colors.foreground, fontSize: Typography.size.base,
    },
    list: { padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['3xl'] },
    card: { padding: Spacing.md },
    row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    avatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center',
    },
    info: { flex: 1, gap: 2 },
    name: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground },
    sub: { fontSize: Typography.size.xs, color: Colors.mutedForeground },
    badges: { flexDirection: 'row', gap: 4, marginTop: 4 },
    stats: { alignItems: 'flex-end', gap: 2 },
    statText: { fontSize: Typography.size.xs, color: Colors.mutedForeground },
});
