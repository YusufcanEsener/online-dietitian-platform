import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl,
    TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { Colors } from '../../constants/colors';
import { Spacing, Typography, Radius } from '../../constants/theme';
import {
    getAgentMonitoring, runAgentBatch,
    type AgentLogItem, type MonitoringResponse,
} from '../../services/agentService';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DietitianStackParamList } from '../../navigation/DietitianNavigator';

type Nav = NativeStackNavigationProp<DietitianStackParamList>;

// ─── Tipler ──────────────────────────────────────────────────
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

type RiskCardItem = {
    memberId: string;
    memberName: string;
    riskLevel: RiskLevel;
    explanation: string[];
    recommendation: string;
    createdAt: string;
};

const riskPriority: Record<RiskLevel, number> = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
};

const riskColors: Record<RiskLevel, { bg: string; text: string; border: string }> = {
    LOW: { bg: '#22c55e15', text: '#22c55e', border: '#22c55e30' },
    MEDIUM: { bg: '#f59e0b15', text: '#f59e0b', border: '#f59e0b30' },
    HIGH: { bg: '#f9731615', text: '#f97316', border: '#f9731630' },
    CRITICAL: { bg: '#ef444415', text: '#ef4444', border: '#ef444430' },
};

const riskLabels: Record<RiskLevel, string> = {
    LOW: 'Düşük Risk',
    MEDIUM: 'Orta Risk',
    HIGH: 'Yüksek Risk',
    CRITICAL: 'Kritik Risk',
};

// ─── Yardımcılar ──────────────────────────────────────────────
function startOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function formatDateTime(value?: string | null) {
    if (!value) return '–';
    return new Date(value).toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function parseFindings(log: AgentLogItem): string[] {
    const findings = Array.isArray(log.details?.findings)
        ? (log.details.findings as Array<Record<string, unknown>>)
        : [];
    const messages = findings
        .map((f) => (typeof f.message === 'string' ? f.message : ''))
        .filter(Boolean);
    if (messages.length > 0) return messages.slice(0, 2);
    if (log.reasoning) return [log.reasoning];
    return ['Ek açıklama bulunmuyor.'];
}

function parseRecommendation(log: AgentLogItem): string {
    if (typeof log.details?.recommendation === 'string' && log.details.recommendation.trim().length > 0) {
        return log.details.recommendation;
    }
    if (log.reasoning && log.reasoning.trim().length > 0) return log.reasoning;
    return 'Danışanı kontrol edip gerekli ise iletişime geçin.';
}

function isRiskyLog(log: AgentLogItem) {
    const status = typeof log.details?.status === 'string' ? log.details.status : '';
    const riskLevel = (log.risk_level ?? 'LOW') as RiskLevel;
    return status !== 'INSUFFICIENT_DATA' && riskPriority[riskLevel] >= riskPriority.MEDIUM;
}

const POLL_INTERVAL_MS = 15000;

// ─── Ana Ekran ────────────────────────────────────────────────
export default function AgenticAIScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<Nav>();

    const [snapshot, setSnapshot] = useState<MonitoringResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [runningBatch, setRunningBatch] = useState(false);

    const load = useCallback(async (showSpinner = false) => {
        if (showSpinner) setRefreshing(true);
        try {
            const response = await getAgentMonitoring(120);
            setSnapshot(response);
        } catch (e) {
            if (showSpinner) {
                Alert.alert('Hata', 'Monitoring verisi alınamadı.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load(true);
    }, [load]);

    // Polling
    useEffect(() => {
        const id = setInterval(() => load(false), POLL_INTERVAL_MS);
        return () => clearInterval(id);
    }, [load]);

    const analysisLogs = useMemo(
        () => (snapshot?.logs ?? []).filter((l) => l.action_type === 'member_analysis'),
        [snapshot?.logs]
    );

    const latestRiskCards = useMemo(() => {
        const byMember = new Map<string, AgentLogItem>();
        for (const log of analysisLogs) {
            if (!log.member_id) continue;
            if (!byMember.has(log.member_id)) byMember.set(log.member_id, log);
        }

        return Array.from(byMember.values())
            .filter(isRiskyLog)
            .map<RiskCardItem>((log) => ({
                memberId: log.member_id || '',
                memberName: log.member_name || 'İsimsiz Danışan',
                riskLevel: (log.risk_level ?? 'LOW') as RiskLevel,
                explanation: parseFindings(log),
                recommendation: parseRecommendation(log),
                createdAt: log.created_at,
            }))
            .sort((a, b) => {
                const rd = riskPriority[b.riskLevel] - riskPriority[a.riskLevel];
                if (rd !== 0) return rd;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
    }, [analysisLogs]);

    const todaySummary = useMemo(() => {
        const today = startOfToday().getTime();
        const todaysLogs = analysisLogs.filter((l) => new Date(l.created_at).getTime() >= today);
        const todaysNotifs = (snapshot?.logs ?? []).filter(
            (l) =>
                l.action_type === 'risk_notification_sent' &&
                l.status === 'completed' &&
                l.details?.sent === true &&
                new Date(l.created_at).getTime() >= today
        );
        const analyzedIds = new Set(todaysLogs.map((l) => l.member_id).filter(Boolean));
        const riskyIds = new Set(todaysLogs.filter(isRiskyLog).map((l) => l.member_id).filter(Boolean));

        return {
            analyzedToday: analyzedIds.size,
            riskyToday: riskyIds.size,
            notificationsToday: todaysNotifs.length,
            lastAnalysisAt: todaysLogs[0]?.created_at ?? analysisLogs[0]?.created_at ?? null,
        };
    }, [analysisLogs, snapshot?.logs]);

    const handleRunBatch = async () => {
        try {
            setRunningBatch(true);
            await runAgentBatch();
            Alert.alert('Başlatıldı', 'Sistem yeni taramayı arka planda başlattı.');
            await load(false);
        } catch {
            Alert.alert('Hata', 'Analiz başlatılamadı.');
        } finally {
            setRunningBatch(false);
        }
    };

    if (loading) return <LoadingScreen message="AI asistan yükleniyor..." />;

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <Header title="AI Asistan" subtitle="Agentic Analiz" />
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primary} />
                }
            >
                {/* Header Card */}
                <Card style={styles.headerCard}>
                    <View style={styles.headerBadge}>
                        <Ionicons name="sparkles" size={14} color={Colors.primary} />
                        <Text style={styles.headerBadgeText}>Agentic AI Özet</Text>
                    </View>
                    <Text style={styles.headerTitle}>Bugün hangi danışanla ilgilenmelisiniz?</Text>
                    <Text style={styles.headerSub}>
                        Sadece aksiyon gerektiren durumlar gösterilir.
                    </Text>
                    <View style={styles.actionRow}>
                        <Button title="Yenile" variant="outline" onPress={() => load(true)} loading={refreshing} style={{ flex: 1 }} />
                        <Button title="⚡ Yeniden Tara" onPress={handleRunBatch} loading={runningBatch} style={{ flex: 1 }} />
                    </View>
                </Card>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {[
                        { label: 'Toplam danışan', value: snapshot?.summary.total_members ?? 0, icon: 'people', color: Colors.primary },
                        { label: 'Riskli danışan', value: latestRiskCards.length, icon: 'shield-half', color: '#f97316' },
                        { label: 'Bugün analiz', value: todaySummary.analyzedToday, icon: 'checkmark-circle', color: '#3b82f6' },
                        { label: 'Son analiz', value: formatDateTime(todaySummary.lastAnalysisAt), icon: 'time', color: '#8b5cf6', isText: true },
                    ].map((stat) => (
                        <View key={stat.label} style={styles.statItem}>
                            <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                            <Text style={[styles.statValue, (stat as any).isText ? { fontSize: Typography.size.xs } : null]}>
                                {stat.value}
                            </Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Risk Cards Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Riskli danışanlar</Text>
                        <View style={styles.countBadge}>
                            <Text style={styles.countBadgeText}>{latestRiskCards.length} kişi</Text>
                        </View>
                    </View>

                    {latestRiskCards.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <Ionicons name="checkmark-circle" size={36} color={Colors.primary} />
                            <Text style={styles.emptyTitle}>Bugün acil risk görünmüyor</Text>
                            <Text style={styles.emptySub}>
                                Son analizlere göre dikkat gerektiren bir durum bulunmuyor.
                            </Text>
                        </Card>
                    ) : (
                        latestRiskCards.map((member) => {
                            const rc = riskColors[member.riskLevel];
                            return (
                                <Card key={member.memberId} style={[styles.riskCard, { borderLeftWidth: 3, borderLeftColor: rc.text }]}>
                                    {/* Name + Badge */}
                                    <View style={styles.riskHeader}>
                                        <Text style={styles.riskName}>{member.memberName}</Text>
                                        <View style={[styles.riskBadge, { backgroundColor: rc.bg, borderColor: rc.border }]}>
                                            <Text style={[styles.riskBadgeText, { color: rc.text }]}>
                                                {riskLabels[member.riskLevel]}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Explanations */}
                                    {member.explanation.map((line, i) => (
                                        <View key={i} style={styles.findingRow}>
                                            <Ionicons name="alert-circle" size={14} color="#f97316" />
                                            <Text style={styles.findingText}>{line}</Text>
                                        </View>
                                    ))}

                                    {/* Recommendation */}
                                    <View style={styles.recoBox}>
                                        <Text style={styles.recoText}>
                                            <Text style={{ fontWeight: '700', color: Colors.foreground }}>Öneri: </Text>
                                            {member.recommendation}
                                        </Text>
                                    </View>

                                    {/* Actions */}
                                    <View style={styles.riskActions}>
                                        <Text style={styles.riskDate}>Son analiz: {formatDateTime(member.createdAt)}</Text>
                                        <TouchableOpacity
                                            style={styles.goBtn}
                                            onPress={() => navigation.navigate('MemberDetail', { memberId: member.memberId })}
                                        >
                                            <Text style={styles.goBtnText}>Danışana git</Text>
                                            <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
                                        </TouchableOpacity>
                                    </View>
                                </Card>
                            );
                        })
                    )}
                </View>

                {/* Daily Summary */}
                <Card style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <View style={styles.summaryIcon}>
                            <Ionicons name="sparkles" size={18} color={Colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.summaryTitle}>Günlük özet</Text>
                            <Text style={styles.summarySub}>Hızlı durum özeti</Text>
                        </View>
                    </View>
                    {[
                        `Bugün ${todaySummary.analyzedToday} kullanıcı analiz edildi.`,
                        `${todaySummary.riskyToday} kullanıcı riskli bulundu.`,
                        `${todaySummary.notificationsToday} kullanıcıya bildirim gönderildi.`,
                    ].map((line, i) => (
                        <View key={i} style={styles.summaryLine}>
                            <Text style={styles.summaryLineText}>{line}</Text>
                        </View>
                    ))}
                </Card>

                {/* Tips */}
                <Card>
                    <Text style={styles.tipsTitle}>Ne yapmalı?</Text>
                    {[
                        'Kritik ve yüksek riskli danışanlarla önce iletişime geçin.',
                        'Orta riskte olanlar için log ve plan uyumunu gözden geçirin.',
                        'Yeni tarama başlatmak isterseniz yukarıdaki butonu kullanın.',
                    ].map((tip, i) => (
                        <View key={i} style={styles.tipRow}>
                            <View style={styles.tipDot} />
                            <Text style={styles.tipText}>{tip}</Text>
                        </View>
                    ))}
                </Card>
            </ScrollView>
        </View>
    );
}

// ─── Stiller ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.base, gap: Spacing.lg, paddingBottom: Spacing['4xl'] },

    // Header Card
    headerCard: { gap: Spacing.md },
    headerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primary + '15',
        borderRadius: Radius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: 5,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: Colors.primary + '25',
    },
    headerBadgeText: { fontSize: Typography.size.xs, fontWeight: '600', color: Colors.primary },
    headerTitle: { fontSize: Typography.size.lg, fontWeight: '700', color: Colors.foreground },
    headerSub: { fontSize: Typography.size.sm, color: Colors.mutedForeground, lineHeight: 20 },
    actionRow: { flexDirection: 'row', gap: Spacing.sm },

    // Stats
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    statItem: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: Colors.card,
        borderRadius: Radius.xl,
        padding: Spacing.md,
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statValue: { fontSize: Typography.size['2xl'], fontWeight: '800', color: Colors.foreground },
    statLabel: { fontSize: Typography.size.xs, color: Colors.mutedForeground, textAlign: 'center' },

    // Section
    section: { gap: Spacing.md },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground },
    countBadge: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: 4,
    },
    countBadgeText: { fontSize: Typography.size.xs, fontWeight: '600', color: Colors.foreground },

    // Empty
    emptyCard: { alignItems: 'center', gap: Spacing.md, padding: Spacing.xl },
    emptyTitle: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground },
    emptySub: { fontSize: Typography.size.sm, color: Colors.mutedForeground, textAlign: 'center', lineHeight: 20 },

    // Risk Card
    riskCard: { gap: Spacing.md },
    riskHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: Spacing.sm },
    riskName: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground },
    riskBadge: {
        borderRadius: Radius.full,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
        paddingVertical: 3,
    },
    riskBadgeText: { fontSize: Typography.size.xs, fontWeight: '700' },
    findingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
    findingText: { fontSize: Typography.size.sm, color: Colors.mutedForeground, flex: 1, lineHeight: 20 },
    recoBox: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radius.xl,
        padding: Spacing.md,
    },
    recoText: { fontSize: Typography.size.sm, color: Colors.mutedForeground, lineHeight: 20 },
    riskActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    riskDate: { fontSize: Typography.size.xs, color: Colors.mutedForeground },
    goBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    goBtnText: { fontSize: Typography.size.sm, fontWeight: '600', color: Colors.primary },

    // Summary Card
    summaryCard: { gap: Spacing.md },
    summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    summaryIcon: {
        width: 40,
        height: 40,
        borderRadius: Radius.xl,
        backgroundColor: Colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryTitle: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground },
    summarySub: { fontSize: Typography.size.sm, color: Colors.mutedForeground },
    summaryLine: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.xl,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
    },
    summaryLineText: { fontSize: Typography.size.sm, color: Colors.mutedForeground },

    // Tips
    tipsTitle: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground, marginBottom: Spacing.md },
    tipRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
        backgroundColor: Colors.surface,
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    tipDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary,
        marginTop: 6,
    },
    tipText: { fontSize: Typography.size.sm, color: Colors.mutedForeground, flex: 1, lineHeight: 20 },
});
