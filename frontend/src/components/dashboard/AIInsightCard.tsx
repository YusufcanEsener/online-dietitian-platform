import { Sparkles, Brain, TrendingUp, Lightbulb } from "lucide-react";

export const AIInsightCard = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl p-[2px] animate-pulse-glow">
      {/* Gradient border animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-shimmer rounded-2xl" />
      
      <div className="relative glass-card p-6 rounded-2xl bg-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-neon-gradient flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              Agentic AI Özet
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            </h3>
            <p className="text-xs text-muted-foreground">Günlük kişisel analiz</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Harika Gidiyorsunuz!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Bu hafta kalori hedefinizi %92 oranında tuttunuz. Protein alımınızı biraz artırmanızı öneririm.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-accent/5 border border-accent/20">
            <Lightbulb className="w-5 h-5 text-accent mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Günün Önerisi</p>
              <p className="text-xs text-muted-foreground mt-1">
                Akşam yemeğinize ızgara tavuk veya balık ekleyerek protein hedeflerinize ulaşabilirsiniz.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>Son güncelleme: 5 dakika önce</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Aktif
          </span>
        </div>
      </div>
    </div>
  );
};
