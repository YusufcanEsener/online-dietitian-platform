import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Alert, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Widgets';
import { Colors } from '../../constants/colors';
import { Spacing, Typography, Radius } from '../../constants/theme';
import { getDailyReport, type DailyReportResponse, type MemberStatus } from '../../services/aiService';

export default function DailyReportScreen() {
    const insets = useSafeAreaInsets();
    const [report, setReport] = useState<DailyReportResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getDailyReport();
            setReport(data);
        } catch (e: any) {
            Alert.alert('Hata', e?.response?.data?.detail || 'Rapor yüklenemedi.');
        } finally {
            setLoading(false);
        }
    }, []);

    const statusVariant = (status: string) => {
        if (status === 'critical') return 'danger';
        if (status === 'warning') return 'warning';
        return 'success';
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <Header title="Günlük Rapor" showBack subtitle="AI Danışan Analizi" />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Button title={loading ? 'Yükleniyor...' : '🤖 Raporu Yükle'} onPress={load} loading={loading} />

                {report && report.success && (
                    <>
                        <Card variant="bordered">
                            <Text style={styles.cardTitle}>📅 {report.report_date || report.date}</Text>
                            <Text style={styles.totalText}>Toplam Danışan: {report.total_members}</Text>
                            <View style={styles.summaryRow}>
                                {[
                                    { label: 'Kritik', count: report.summary?.critical, color: Colors.destructive },
                                    { label: 'Uyarı', count: report.summary?.warning, color: '#f59e0b' },
                                    { label: 'İyi', count: report.summary?.good, color: Colors.primary },
                                ].map((s) => (
                                    <View key={s.label} style={[styles.sumItem, { borderColor: s.color + '40' }]}>
                                        <Text style={[styles.sumCount, { color: s.color }]}>{s.count}</Text>
                                        <Text style={styles.sumLabel}>{s.label}</Text>
                                    </View>
                                ))}
                            </View>
                        </Card>

                        {(report.members || []).map((member: MemberStatus) => (
                            <Card key={member.id} style={{ gap: Spacing.sm }}>
                                <View style={styles.memberTop}>
                                    <Text style={styles.memberName}>{member.name}</Text>
                                    <Badge
                                        label={member.status === 'critical' ? '🔴 Kritik' : member.status === 'warning' ? '🟡 Uyarı' : '🟢 İyi'}
                                        variant={statusVariant(member.status) as any}
                                    />
                                </View>
                                {member.score !== undefined && (
                                    <Text style={styles.score}>Skor: {member.score}</Text>
                                )}
                                {member.analysis && (
                                    <Text style={styles.analysis}>{member.analysis}</Text>
                                )}
                                {(member.problems || []).map((p, i) => (
                                    <Text key={i} style={styles.problem}>⚠️ {p}</Text>
                                ))}
                                {member.recommendation && (
                                    <Text style={styles.recommendation}>💡 {member.recommendation}</Text>
                                )}
                                {member.days_without_log !== undefined && (
                                    <Text style={styles.metaText}>⏰ Log yok: {member.days_without_log} gün</Text>
                                )}
                            </Card>
                        ))}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['4xl'] },
    cardTitle: { fontSize: Typography.size.lg, fontWeight: '800', color: Colors.foreground, marginBottom: 4 },
    totalText: { fontSize: Typography.size.sm, color: Colors.mutedForeground, marginBottom: Spacing.md },
    summaryRow: { flexDirection: 'row', gap: Spacing.sm },
    sumItem: {
        flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg,
        padding: Spacing.md, alignItems: 'center', borderWidth: 1,
    },
    sumCount: { fontSize: Typography.size.xl, fontWeight: '800' },
    sumLabel: { fontSize: Typography.size.xs, color: Colors.mutedForeground },
    memberTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    memberName: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground, flex: 1 },
    score: { fontSize: Typography.size.sm, color: Colors.primary, fontWeight: '600' },
    analysis: { fontSize: Typography.size.sm, color: Colors.foreground, lineHeight: 18 },
    problem: { fontSize: Typography.size.sm, color: Colors.destructive },
    recommendation: { fontSize: Typography.size.sm, color: Colors.primary },
    metaText: { fontSize: Typography.size.xs, color: Colors.mutedForeground },
});
