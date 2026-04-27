import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Newspaper,
  ExternalLink,
  RefreshCw,
  FlaskConical,
  Calendar,
  ChevronRight,
  Sparkles,
  BookOpen,
  Wifi,
  WifiOff,
  Heart,
  Share2,
  CheckCircle2,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { newsService, PubMedNewsItem, NewsInteraction } from "@/services/newsService";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

// ─── Yardımcılar ──────────────────────────────────────────────
function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isToday(iso?: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
}

function estimateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/4" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded" />
        <div className="h-3 bg-muted rounded w-5/6" />
        <div className="h-3 bg-muted rounded w-4/6" />
      </div>
    </div>
  );
}

// ─── News Card ────────────────────────────────────────────────────────────────
interface NewsCardProps {
  item: PubMedNewsItem;
  index: number;
  interaction?: NewsInteraction;
  onInteract: (newsId: string, updates: { is_read?: boolean; is_favorite?: boolean }) => void;
}

function NewsCard({ item, index, interaction, onInteract }: NewsCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isRead = interaction?.is_read || false;
  const isFavorite = interaction?.is_favorite || false;
  
  let displayTitleTr = item.title_tr;
  let displayTitleEn = item.title;
  let displaySummary = item.summary_tr;

  if (displaySummary && typeof displaySummary === 'string' && displaySummary.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(displaySummary);
      if (parsed.title_tr) displayTitleTr = parsed.title_tr;
      if (parsed.summary_tr) displaySummary = parsed.summary_tr;
    } catch (e) {
      // Ignore parse errors
    }
  }

  const displayTitle = displayTitleTr ? `${displayTitleEn} (${displayTitleTr})` : displayTitleEn;

  const readTime = estimateReadingTime(displaySummary + (item.description || ""));

  const handleExpand = () => {
    setExpanded(!expanded);
    if (!isRead) {
      onInteract(item.id, { is_read: true });
    }
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInteract(item.id, { is_favorite: !isFavorite });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: displayTitle,
        text: displaySummary,
        url: item.link
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${displayTitle}\n\n${displaySummary}\n\nLink: ${item.link}`);
      alert("Bağlantı kopyalandı!");
    }
  };

  // Click entire card to mark as read
  const handleCardClick = () => {
    if (!isRead) {
      onInteract(item.id, { is_read: true });
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group relative rounded-2xl border bg-card cursor-pointer",
        "transition-all duration-300 overflow-hidden",
        isRead ? "border-border/40 opacity-80" : "border-border/80 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Unread Accent Bar */}
      {!isRead && (
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary via-accent to-primary/30 opacity-100" />
      )}

      <div className="p-6 pl-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
              isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary group-hover:bg-primary/20"
            )}>
              <FlaskConical className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
                  isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                )}>
                  <BookOpen className="w-3 h-3" />
                  PubMed
                </span>
                {!isRead && (
                  <span className="text-[10px] font-bold text-primary animate-pulse tracking-wide uppercase">
                    YENİ
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(item.published_at || item.created_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>~{readTime} dk</span>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={toggleFavorite}
            className={cn(
              "p-2 rounded-full transition-colors hover:bg-muted",
              isFavorite ? "text-red-500" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
          </button>
        </div>

        {/* Title */}
        <h3 className={cn("text-sm font-semibold leading-snug mb-4 line-clamp-3 transition-colors",
          isRead ? "text-foreground/80" : "text-foreground group-hover:text-primary"
        )}>
          {displayTitle}
        </h3>

        {/* AI Summary */}
        <div className={cn("rounded-xl border p-4 mb-4 transition-colors",
          isRead ? "bg-muted/50 border-border/50" : "bg-primary/5 border-primary/10"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className={cn("w-3.5 h-3.5", isRead ? "text-muted-foreground" : "text-primary")} />
            <span className={cn("text-xs font-semibold uppercase tracking-wide",
              isRead ? "text-muted-foreground" : "text-primary"
            )}>
              AI Özeti
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {displaySummary}
          </p>
        </div>

        {/* Description (collapsible) */}
        {item.description && (
          <div className="mb-4">
            <button
              onClick={(e) => { e.stopPropagation(); handleExpand(); }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight
                className={cn(
                  "w-3.5 h-3.5 transition-transform duration-200",
                  expanded && "rotate-90"
                )}
              />
              {expanded ? "Orijinal özeti gizle" : "Orijinal özeti gör"}
            </button>
            {expanded && (
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed border-l-2 border-border pl-3">
                {item.description}
              </p>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>Paylaş</span>
          </button>
          
          <div className="flex items-center gap-3">
             {isRead && (
               <span className="flex items-center gap-1 text-xs text-muted-foreground">
                 <CheckCircle2 className="w-3.5 h-3.5" />
                 Okundu
               </span>
             )}
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                if (!isRead) onInteract(item.id, { is_read: true });
              }}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium",
                "text-primary hover:text-primary/80 transition-colors",
                "border border-primary/20 hover:border-primary/50 rounded-lg px-3 py-1.5"
              )}
            >
              PubMed'de Görüntüle
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type TabType = 'all' | 'unread' | 'favorites';

export default function DietitianNews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [news, setNews] = useState<PubMedNewsItem[]>([]);
  const [interactions, setInteractions] = useState<Record<string, NewsInteraction>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Rol koruması
  useEffect(() => {
    if (user && user.role !== "dietitian") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [newsData, interactionsData] = await Promise.all([
        newsService.getNews(),
        newsService.getInteractions().catch(() => []) // fail gracefully
      ]);
      
      setNews(newsData);
      
      const intMap: Record<string, NewsInteraction> = {};
      interactionsData.forEach(int => {
        intMap[int.news_id] = int;
      });
      setInteractions(intMap);
      
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Haberler yüklenirken bir hata oluştu.";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === "dietitian") {
      fetchData();
    }
  }, [user]);

  const handleInteract = async (newsId: string, updates: { is_read?: boolean; is_favorite?: boolean }) => {
    // Optimistic update
    setInteractions(prev => ({
      ...prev,
      [newsId]: {
        news_id: newsId,
        is_read: updates.is_read !== undefined ? updates.is_read : (prev[newsId]?.is_read || false),
        is_favorite: updates.is_favorite !== undefined ? updates.is_favorite : (prev[newsId]?.is_favorite || false)
      }
    }));

    try {
      await newsService.interact(newsId, updates);
    } catch (error) {
      console.error("Interaction update failed", error);
    }
  };

  const filteredNews = useMemo(() => {
    return news.filter(item => {
      const interaction = interactions[item.id];
      if (activeTab === 'unread') return !interaction?.is_read;
      if (activeTab === 'favorites') return interaction?.is_favorite;
      return true; // all
    });
  }, [news, interactions, activeTab]);

  const todayNewCount = useMemo(() => {
    return news.filter(item => isToday(item.published_at || item.created_at)).length;
  }, [news]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 lg:ml-72 pb-20 lg:pb-0">
        {/* ─── Header ─── */}
        <div className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-md">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neon-gradient flex items-center justify-center neon-glow">
                <Newspaper className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">
                  Güncel Araştırmalar
                </h1>
                <p className="text-xs text-muted-foreground">
                  PubMed · Her gün sabah güncellenir
                </p>
              </div>
            </div>

            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium",
                "border border-border hover:border-primary/50 hover:bg-primary/5",
                "text-muted-foreground hover:text-primary transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              <span className="hidden sm:inline">Yenile</span>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center gap-6 mt-2">
            <button
              onClick={() => setActiveTab('all')}
              className={cn("pb-3 text-sm font-medium border-b-2 transition-colors", 
                activeTab === 'all' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Tümü
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={cn("pb-3 text-sm font-medium border-b-2 transition-colors", 
                activeTab === 'unread' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Okunmayanlar
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={cn("pb-3 text-sm font-medium border-b-2 transition-colors", 
                activeTab === 'favorites' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Favorilerim
            </button>
          </div>
        </div>

        {/* ─── Content ─── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          
          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {/* Info Banner */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    AI Destekli Araştırma Özeti
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    PubMed'den günlük makaleler Türkçe özetlenerek sunulur.
                  </p>
                </div>
              </div>
              
              {/* Daily Count Banner */}
              <div className="rounded-2xl border border-border/50 bg-card p-4 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-primary">{todayNewCount}</span>
                 </div>
                 <div>
                    <p className="text-sm font-medium text-foreground">Bugün Yayınlanan Yeni Makale</p>
                    <p className="text-xs text-muted-foreground">Son 24 saat içinde eklendi.</p>
                 </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
              <WifiOff className="w-12 h-12 text-destructive/50 mx-auto mb-3" />
              <p className="text-sm font-medium text-destructive">{error}</p>
              <button
                onClick={() => fetchData()}
                className="mt-4 text-xs text-muted-foreground underline hover:text-foreground"
              >
                Tekrar dene
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filteredNews.length === 0 && (
            <div className="rounded-2xl border border-border/50 bg-card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Newspaper className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                {activeTab === 'all' ? "Henüz haber yok" : activeTab === 'unread' ? "Tüm haberleri okudunuz!" : "Favori haberiniz bulunmuyor"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'all' ? "Sistem her gün güncel makaleleri çekecektir." : "Farklı sekmelere göz atabilirsiniz."}
              </p>
            </div>
          )}

          {/* News Grid */}
          {!loading && !error && filteredNews.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Gösterilen: <span className="font-semibold text-foreground">{filteredNews.length}</span> makale
                </p>
                <span className="text-xs text-muted-foreground">
                  Son güncelleme: {formatDate(news[0]?.created_at)}
                </span>
              </div>

              <div className="space-y-4">
                {filteredNews.map((item, i) => (
                  <NewsCard 
                    key={item.id} 
                    item={item} 
                    index={i} 
                    interaction={interactions[item.id]}
                    onInteract={handleInteract}
                  />
                ))}
              </div>

              <p className="text-center text-xs text-muted-foreground mt-8">
                Tüm makaleler PubMed / NCBI kaynaklıdır.{" "}
                <a
                  href="https://pubmed.ncbi.nlm.nih.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  pubmed.ncbi.nlm.nih.gov
                </a>
              </p>
            </>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
