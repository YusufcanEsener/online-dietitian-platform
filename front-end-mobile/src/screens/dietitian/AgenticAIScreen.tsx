import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Widgets';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { Colors } from '../../constants/colors';
import { Spacing, Typography, Radius } from '../../constants/theme';
import {
    getAgenticReport, sendAgenticAlert, generateAgenticReport,
    type AgenticReportResponse, type AgenticMember,
} from '../../services/aiService';

export default function AgenticAIScreen() {
    const insets = useSafeAreaInsets();
    const [report, setReport] = useState<AgenticReportResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [alertLoading, setAlertLoading] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAgenticReport();
            setReport(data);
        } catch (e: any) {
            Alert.alert('Hata', e?.response?.data?.detail || 'Rapor yüklenemedi.');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            await generateAgenticReport();
            await load();
        } catch (e: any) {
            Alert.alert('Hata', 'Rapor oluşturulamadı.');
        } finally {
            setGenerating(false);
        }
    };

    const handleAlert = async (memberId: string, name: string) => {
        setAlertLoading(memberId);
        try {
            await sendAgenticAlert(memberId);
            Alert.alert('Gönderildi', `${name} için uyarı gönderildi.`);
        } catch {
            Alert.alert('Hata', 'Uyarı gönderilemedi.');
        } finally {
            setAlertLoading(null);
        }
    };

    const statusColor = (status: string) => {
        if (status === 'critical') return Colors.destructive;
        if (status === 'warning') return '#f59e0b';
        return Colors.primary;
    };

    const statusLabel = (status: string) => {
        if (status === 'critical') return '🔴 Kritik';
        if (status === 'warning') return '🟡 Uyarı';
        return '🟢 İyi';
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <Header title="AI Asistan" subtitle="Agentic Analiz" />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Aksiyon */}
                <View style={styles.actionRow}>
                    <Button title="Rapor Yükle" variant="outline" onPress={load} loading={loading} style={{ flex: 1 }} />
                    <Button title="✨ Yeni Üret" onPress={handleGenerate} loading={generating} style={{ flex: 1 }} />
                </View>

                {report && report.success && (
                    <>
                        {/* Özet */}
                        <Card variant="bordered">
                            <Text style={styles.reportTitle}>📊 Durum Raporu</Text>
                            {report.report_date && (
                                <Text style={styles.reportDate}>{report.report_date}</Text>
                            )}
                            <View style={styles.summaryRow}>
                                {[
                                    { label: 'Kritik', count: report.critical_count, color: Colors.destructive },
                                    { label: 'Uyarı', count: report.warning_count, color: '#f59e0b' },
                                    { label: 'İyi', count: report.good_count, color: Colors.primary },
                                ].map((s) => (
                                    <View key={s.label} style={styles.sumCard}>
                                        <Text style={[styles.sumCount, { color: s.color }]}>{s.count}</Text>
                                        <Text style={styles.sumLabel}>{s.label}</Text>
                                    </View>
                                ))}
                            </View>
                        </Card>

                        {/* Üye Listesi */}
                        {(report.members || []).map((member: AgenticMember) => (
                            <Card key={member.id} style={[styles.memberCard, { borderLeftColor: statusColor(member.status), borderLeftWidth: 3 }]}>
                                <View style={styles.memberHeader}>
                                    <View style={styles.memberIdentity}>
                                        <Text style={styles.memberName}>{member.name}</Text>
                                        <Text style={styles.memberEmail}>{member.email}</Text>
                                    </View>
                                    <Badge
                                        label={statusLabel(member.status)}
                                        variant={member.status === 'critical' ? 'danger' : member.status === 'warning' ? 'warning' : 'success'}
                                    />
                                </View>

                                <View style={styles.memberStats}>
                                    <Text style={styles.statItem}>📋 {member.program_status}</Text>
                                    <Text style={styles.statItem}>⚡ Uyum: %{member.calorie_compliance}</Text>
                                    {member.days_since_last_log !== undefined && (
                                        <Text style={styles.statItem}>⏰ Son log: {member.days_since_last_log} gün</Text>
                                    )}
                                </View>

                                {member.problem && (
                                    <Text style={styles.problem}>⚠️ {member.problem}</Text>
                                )}
                                {member.recommendation && (
                                    <Text style={styles.recommendation}>💡 {member.recommendation}</Text>
                                )}

                                {member.status !== 'good' && (
                                    <Button
                                        title="Uyarı Gönder"
                                        variant="destructive"
                                        size="sm"
                                        loading={alertLoading === member.id}
                                        onPress={() => handleAlert(member.id, member.name)}
                                    />
                                )}
                            </Card>
                        ))}
                    </>
                )}

                {!report && !loading && (
                    <Card>
                        <Text style={styles.emptyText}>
                            "Rapor Yükle" veya "Yeni Üret" butonuna basarak AI analizi başlatın.
                        </Text>
                    </Card>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.base, gap: Spacing.lg, paddingBottom: Spacing['4xl'] },
    actionRow: { flexDirection: 'row', gap: Spacing.sm },
    reportTitle: { fontSize: Typography.size.lg, fontWeight: '800', color: Colors.foreground, marginBottom: 4 },
    reportDate: { fontSize: Typography.size.xs, color: Colors.mutedForeground, marginBottom: Spacing.md },
    summaryRow: { flexDirection: 'row', gap: Spacing.sm },
    sumCard: {
        flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg,
        padding: Spacing.md, alignItems: 'center', gap: 4,
    },
    sumCount: { fontSize: Typography.size['2xl'], fontWeight: '800' },
    sumLabel: { fontSize: Typography.size.xs, color: Colors.mutedForeground },
    memberCard: { gap: Spacing.sm },
    memberHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
    memberIdentity: { flex: 1 },
    memberName: { fontSize: Typography.size.base, fontWeight: '700', color: Colors.foreground },
    memberEmail: { fontSize: Typography.size.xs, color: Colors.mutedForeground },
    memberStats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    statItem: { fontSize: Typography.size.xs, color: Colors.mutedForeground },
    problem: { fontSize: Typography.size.sm, color: Colors.destructive, fontStyle: 'italic' },
    recommendation: { fontSize: Typography.size.sm, color: Colors.primary },
    emptyText: { color: Colors.mutedForeground, textAlign: 'center', lineHeight: 22 },
});
