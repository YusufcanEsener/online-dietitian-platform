import { useState, useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { newsService, PubMedNewsItem } from "@/services/newsService";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

// ─── Yardımcı: Tarih formatlama ──────────────────────────────────────────────
function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
}

function NewsCard({ item, index }: NewsCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border/50 bg-card",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        "transition-all duration-300 overflow-hidden"
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary via-accent to-primary/30 opacity-70 group-hover:opacity-100 transition-opacity" />

      <div className="p-6 pl-7">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <FlaskConical className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                <BookOpen className="w-3 h-3" />
                PubMed
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(item.published_at || item.created_at)}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-foreground leading-snug mb-4 line-clamp-3 group-hover:text-primary transition-colors">
          {item.title}
        </h3>

        {/* AI Summary */}
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
              AI Özeti
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {item.summary_tr}
          </p>
        </div>

        {/* Description (collapsible) */}
        {item.description && (
          <div className="mb-4">
            <button
              onClick={() => setExpanded(!expanded)}
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

        {/* Footer */}
        <div className="flex items-center justify-end">
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
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
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DietitianNews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [news, setNews] = useState<PubMedNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Rol koruması: diyetisyen değilse dashboard'a yönlendir
  useEffect(() => {
    if (user && user.role !== "dietitian") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const fetchNews = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await newsService.getNews();
      setNews(data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Haberler yüklenirken bir hata oluştu.";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === "dietitian") {
      fetchNews();
    }
  }, [user]);

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
              id="news-refresh-btn"
              onClick={() => fetchNews(true)}
              disabled={refreshing}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium",
                "border border-border hover:border-primary/50 hover:bg-primary/5",
                "text-muted-foreground hover:text-primary transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <RefreshCw
                className={cn("w-4 h-4", refreshing && "animate-spin")}
              />
              <span className="hidden sm:inline">Yenile</span>
            </button>
          </div>
        </div>

        {/* ─── Content ─── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Info Banner */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-8 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Yapay Zeka Destekli Günlük Araştırma Özeti
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                PubMed'den her gün sabah 08:00'de otomatik çekilen en güncel 3
                makale, AI tarafından Türkçe olarak özetlenerek sizinle
                paylaşılıyor.
              </p>
            </div>
          </div>

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
                onClick={() => fetchNews()}
                className="mt-4 text-xs text-muted-foreground underline hover:text-foreground"
              >
                Tekrar dene
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && news.length === 0 && (
            <div className="rounded-2xl border border-border/50 bg-card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Newspaper className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                Henüz haber yok
              </h3>
              <p className="text-sm text-muted-foreground">
                n8n iş akışı her gün sabah 08:00'de çalışarak haberleri
                güncelleyecek.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                <Wifi className="w-3.5 h-3.5 text-primary" />
                <span>Sistem aktif — ilk haber yarın sabah gelecek</span>
              </div>
            </div>
          )}

          {/* News Grid */}
          {!loading && !error && news.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {news.length}
                  </span>{" "}
                  güncel makale
                </p>
                <span className="text-xs text-muted-foreground">
                  Son güncelleme:{" "}
                  {formatDate(news[0]?.created_at)}
                </span>
              </div>

              <div className="space-y-4">
                {news.map((item, i) => (
                  <NewsCard key={item.id} item={item} index={i} />
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
