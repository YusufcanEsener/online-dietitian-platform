import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, RefreshControl,
    TouchableOpacity, Alert, Linking, Share, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/layout/Header';
import { Card } from '../../components/ui/Card';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { Colors } from '../../constants/colors';
import { Spacing, Typography, Radius } from '../../constants/theme';
import {
    getNews, getInteractions, interact,
    type PubMedNewsItem, type NewsInteraction,
} from '../../services/newsService';

// ─── Yardımcılar ──────────────────────────────────────────────
function formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function estimateReadingTime(text: string): number {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
}

// ─── Tab Tipi ────────────────────────────────────────────────
type TabType = 'all' | 'unread' | 'favorites';

// ─── Ana Ekran ────────────────────────────────────────────────
export default function NewsScreen() {
    const insets = useSafeAreaInsets();
    const [news, setNews] = useState<PubMedNewsItem[]>([]);
    const [interactions, setInteractions] = useState<Record<string, NewsInteraction>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const [newsData, interactionsData] = await Promise.all([
                getNews(),
                getInteractions(),
            ]);
            setNews(newsData);

            const intMap: Record<string, NewsInteraction> = {};
            interactionsData.forEach((int) => {
                intMap[int.news_id] = int;
            });
            setInteractions(intMap);
        } catch (err: any) {
            const msg = err?.response?.data?.detail || 'Haberler yüklenirken bir hata oluştu.';
            setError(msg);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInteract = async (newsId: string, updates: { is_read?: boolean; is_favorite?: boolean }) => {
        // Optimistic update
        setInteractions((prev) => ({
            ...prev,
            [newsId]: {
                news_id: newsId,
                is_read: updates.is_read !== undefined ? updates.is_read : (prev[newsId]?.is_read || false),
                is_favorite: updates.is_favorite !== undefined ? updates.is_favorite : (prev[newsId]?.is_favorite || false),
            },
        }));

        try {
            await interact(newsId, updates);
        } catch (e) {
            console.error('Interaction update failed', e);
        }
    };

    const filteredNews = useMemo(() => {
        return news.filter((item) => {
            const interaction = interactions[item.id];
            if (activeTab === 'unread') return !interaction?.is_read;
            if (activeTab === 'favorites') return interaction?.is_favorite;
            return true;
        });
    }, [news, interactions, activeTab]);

    const handleShare = async (item: PubMedNewsItem) => {
        try {
            await Share.share({
                title: item.title,
                message: `${item.title_tr || item.title}\n\n${item.summary_tr}\n\nLink: ${item.link}`,
                url: item.link,
            });
        } catch {
            // user cancelled
        }
    };

    if (loading) return <LoadingScreen message="Haberler yükleniyor..." />;

    return (
        <View style={[styles.root, { paddingTop: insets.top }]}>
            <Header title="Güncel Araştırmalar" subtitle="PubMed · AI Özeti" showBack />

            {/* Tabs */}
            <View style={styles.tabRow}>
                {([
                    { key: 'all', label: 'Tümü' },
                    { key: 'unread', label: 'Okunmayanlar' },
                    { key: 'favorites', label: 'Favoriler' },
                ] as { key: TabType; label: string }[]).map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        onPress={() => setActiveTab(tab.key)}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                    >
                        <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={() => fetchData(true)} disabled={refreshing} style={styles.refreshBtn}>
                    <Ionicons
                        name="refresh"
                        size={18}
                        color={refreshing ? Colors.mutedForeground : Colors.primary}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={Colors.primary} />
                }
            >
                {/* Error */}
                {error && (
                    <Card style={styles.errorCard}>
                        <Ionicons name="wifi-outline" size={32} color={Colors.destructive} />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={() => fetchData()}>
                            <Text style={styles.retryText}>Tekrar dene</Text>
                        </TouchableOpacity>
                    </Card>
                )}

                {/* Info Banner */}
                {!error && (
                    <View style={styles.infoBanner}>
                        <Ionicons name="sparkles" size={18} color={Colors.primary} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.infoTitle}>AI Destekli Araştırma Özeti</Text>
                            <Text style={styles.infoSub}>PubMed'den günlük makaleler Türkçe özetlenerek sunulur.</Text>
                        </View>
                    </View>
                )}

                {/* Empty */}
                {!error && filteredNews.length === 0 && (
                    <Card style={styles.emptyCard}>
                        <Ionicons name="newspaper-outline" size={40} color={Colors.mutedForeground} />
                        <Text style={styles.emptyTitle}>
                            {activeTab === 'all'
                                ? 'Henüz haber yok'
                                : activeTab === 'unread'
                                    ? 'Tüm haberleri okudunuz 🎉'
                                    : 'Favori haberiniz bulunmuyor'}
                        </Text>
                        {activeTab !== 'all' && (
                            <TouchableOpacity onPress={() => setActiveTab('all')}>
                                <Text style={styles.retryText}>Tüm haberlere dön</Text>
                            </TouchableOpacity>
                        )}
                    </Card>
                )}

                {/* Count */}
                {!error && filteredNews.length > 0 && (
                    <View style={styles.countRow}>
                        <Text style={styles.countText}>
                            Gösterilen: <Text style={{ color: Colors.foreground, fontWeight: '700' }}>{filteredNews.length}</Text> makale
                        </Text>
                    </View>
                )}

                {/* News Cards */}
                {filteredNews.map((item) => {
                    const interaction = interactions[item.id];
                    const isRead = interaction?.is_read || false;
                    const isFavorite = interaction?.is_favorite || false;
                    const isExpanded = expandedId === item.id;

                    // Parse summary
                    let displayTitleTr = item.title_tr;
                    let displaySummary = item.summary_tr;
                    if (displaySummary && typeof displaySummary === 'string' && displaySummary.trim().startsWith('{')) {
                        try {
                            const parsed = JSON.parse(displaySummary);
                            if (parsed.title_tr) displayTitleTr = parsed.title_tr;
                            if (parsed.summary_tr) displaySummary = parsed.summary_tr;
                        } catch { }
                    }

                    const readTime = estimateReadingTime(displaySummary + (item.description || ''));

                    return (
                        <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.85}
                            onPress={() => {
                                if (!isRead) handleInteract(item.id, { is_read: true });
                            }}
                        >
                            <Card style={[styles.newsCard, !isRead && styles.newsCardUnread]}>
                                {/* Unread indicator */}
                                {!isRead && <View style={styles.unreadBar} />}

                                {/* Header Row */}
                                <View style={styles.newsHeader}>
                                    <View style={[styles.sourceIcon, isRead ? styles.sourceIconRead : null]}>
                                        <Ionicons name="flask" size={16} color={isRead ? Colors.mutedForeground : Colors.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={styles.badgeRow}>
                                            <View style={[styles.sourceBadge, isRead ? styles.sourceBadgeRead : null]}>
                                                <Ionicons name="book-outline" size={10} color={isRead ? Colors.mutedForeground : Colors.primary} />
                                                <Text style={[styles.sourceBadgeText, isRead ? { color: Colors.mutedForeground } : null]}>PubMed</Text>
                                            </View>
                                            {!isRead && <Text style={styles.newBadge}>YENİ</Text>}
                                        </View>
                                        <View style={styles.metaRow}>
                                            <Ionicons name="calendar-outline" size={11} color={Colors.mutedForeground} />
                                            <Text style={styles.metaText}>{formatDate(item.published_at || item.created_at)}</Text>
                                            <Ionicons name="time-outline" size={11} color={Colors.mutedForeground} />
                                            <Text style={styles.metaText}>~{readTime} dk</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleInteract(item.id, { is_favorite: !isFavorite })}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons
                                            name={isFavorite ? 'heart' : 'heart-outline'}
                                            size={20}
                                            color={isFavorite ? '#ef4444' : Colors.mutedForeground}
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* Title */}
                                <Text style={[styles.newsTitle, isRead && { color: Colors.foreground + 'cc' }]} numberOfLines={3}>
                                    {displayTitleTr ? `${item.title} (${displayTitleTr})` : item.title}
                                </Text>

                                {/* AI Summary Box */}
                                <View style={[styles.summaryBox, isRead ? styles.summaryBoxRead : null]}>
                                    <View style={styles.summaryHeader}>
                                        <Ionicons name="sparkles" size={13} color={isRead ? Colors.mutedForeground : Colors.primary} />
                                        <Text style={[styles.summaryLabel, isRead ? { color: Colors.mutedForeground } : null]}>AI Özeti</Text>
                                    </View>
                                    <Text style={styles.summaryText}>{displaySummary}</Text>
                                </View>

                                {/* Description toggle */}
                                {item.description && (
                                    <TouchableOpacity
                                        onPress={() => setExpandedId(isExpanded ? null : item.id)}
                                        style={styles.expandBtn}
                                    >
                                        <Ionicons
                                            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                                            size={14}
                                            color={Colors.mutedForeground}
                                        />
                                        <Text style={styles.expandText}>
                                            {isExpanded ? 'Orijinal özeti gizle' : 'Orijinal özeti gör'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                {isExpanded && item.description && (
                                    <View style={styles.descBox}>
                                        <Text style={styles.descText}>{item.description}</Text>
                                    </View>
                                )}

                                {/* Footer */}
                                <View style={styles.newsFooter}>
                                    <TouchableOpacity style={styles.footerBtn} onPress={() => handleShare(item)}>
                                        <Ionicons name="share-social-outline" size={16} color={Colors.mutedForeground} />
                                        <Text style={styles.footerBtnText}>Paylaş</Text>
                                    </TouchableOpacity>

                                    <View style={styles.footerRight}>
                                        {isRead && (
                                            <View style={styles.readBadge}>
                                                <Ionicons name="checkmark-circle" size={13} color={Colors.mutedForeground} />
                                                <Text style={styles.readBadgeText}>Okundu</Text>
                                            </View>
                                        )}
                                        <TouchableOpacity
                                            style={styles.pubmedBtn}
                                            onPress={() => {
                                                if (!isRead) handleInteract(item.id, { is_read: true });
                                                Linking.openURL(item.link);
                                            }}
                                        >
                                            <Text style={styles.pubmedBtnText}>PubMed'de Gör</Text>
                                            <Ionicons name="open-outline" size={12} color={Colors.primary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </Card>
                        </TouchableOpacity>
                    );
                })}

                {/* Footer info */}
                {filteredNews.length > 0 && (
                    <Text style={styles.footerInfo}>
                        Tüm makaleler PubMed / NCBI kaynaklıdır.
                    </Text>
                )}
            </ScrollView>
        </View>
    );
}

// ─── Stiller ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['4xl'] },

    // Tabs
    tabRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        gap: Spacing.md,
    },
    tab: {
        paddingVertical: Spacing.md,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: Colors.primary,
    },
    tabText: {
        fontSize: Typography.size.sm,
        fontWeight: '600',
        color: Colors.mutedForeground,
    },
    tabTextActive: {
        color: Colors.primary,
    },
    refreshBtn: {
        padding: Spacing.sm,
    },

    // Info Banner
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
        backgroundColor: Colors.primary + '10',
        borderRadius: Radius.xl,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
        padding: Spacing.md,
    },
    infoTitle: { fontSize: Typography.size.sm, fontWeight: '600', color: Colors.foreground },
    infoSub: { fontSize: Typography.size.xs, color: Colors.mutedForeground, marginTop: 2 },

    // Error
    errorCard: { alignItems: 'center', gap: Spacing.md, padding: Spacing.xl },
    errorText: { color: Colors.destructive, fontSize: Typography.size.sm, textAlign: 'center' },
    retryText: { color: Colors.primary, fontSize: Typography.size.sm, fontWeight: '600' },

    // Empty
    emptyCard: { alignItems: 'center', gap: Spacing.md, padding: Spacing['2xl'] },
    emptyTitle: { color: Colors.foreground, fontSize: Typography.size.base, fontWeight: '600', textAlign: 'center' },

    // Count
    countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    countText: { fontSize: Typography.size.sm, color: Colors.mutedForeground },

    // News Card
    newsCard: {
        padding: Spacing.base,
        gap: Spacing.md,
        overflow: 'hidden',
    },
    newsCardUnread: {
        borderColor: Colors.primary + '40',
    },
    unreadBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 3,
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },

    // News Header
    newsHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
    },
    sourceIcon: {
        width: 36,
        height: 36,
        borderRadius: Radius.md,
        backgroundColor: Colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sourceIconRead: {
        backgroundColor: Colors.muted,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    sourceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primary + '15',
        borderRadius: Radius.full,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
    },
    sourceBadgeRead: {
        backgroundColor: Colors.muted,
    },
    sourceBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.primary,
    },
    newBadge: {
        fontSize: 9,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: 1,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    metaText: {
        fontSize: 10,
        color: Colors.mutedForeground,
        marginRight: Spacing.sm,
    },

    // Title
    newsTitle: {
        fontSize: Typography.size.sm,
        fontWeight: '700',
        color: Colors.foreground,
        lineHeight: 20,
    },

    // Summary Box
    summaryBox: {
        backgroundColor: Colors.primary + '08',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.primary + '15',
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    summaryBoxRead: {
        backgroundColor: Colors.muted + '50',
        borderColor: Colors.border,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    summaryText: {
        fontSize: Typography.size.sm,
        color: Colors.mutedForeground,
        lineHeight: 20,
    },

    // Expand
    expandBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    expandText: {
        fontSize: Typography.size.xs,
        color: Colors.mutedForeground,
    },
    descBox: {
        borderLeftWidth: 2,
        borderLeftColor: Colors.border,
        paddingLeft: Spacing.md,
    },
    descText: {
        fontSize: Typography.size.xs,
        color: Colors.mutedForeground,
        lineHeight: 18,
    },

    // Footer
    newsFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.border + '50',
        paddingTop: Spacing.md,
    },
    footerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    footerBtnText: {
        fontSize: Typography.size.xs,
        fontWeight: '600',
        color: Colors.mutedForeground,
    },
    footerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    readBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    readBadgeText: {
        fontSize: 10,
        color: Colors.mutedForeground,
    },
    pubmedBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
        borderRadius: Radius.lg,
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
    },
    pubmedBtnText: {
        fontSize: Typography.size.xs,
        fontWeight: '600',
        color: Colors.primary,
    },

    footerInfo: {
        fontSize: Typography.size.xs,
        color: Colors.mutedForeground,
        textAlign: 'center',
        marginTop: Spacing.md,
    },
});
