import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Search, Star, Filter, Award, Loader2, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import * as dietitianService from "@/services/dietitianService";
import * as memberService from "@/services/memberService";
import * as chatService from "@/services/chatService";
import { useToast } from "@/hooks/use-toast";
import type { Dietitian } from "@/types";

const categories = ["Tümü", "Kilo Verme", "Sporcu Beslenmesi", "Hamilelik", "Çocuk Beslenmesi", "Diyabet"];

const Experts = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [searchQuery, setSearchQuery] = useState("");
  const [experts, setExperts] = useState<Dietitian[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [startingChatId, setStartingChatId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }

    const loadExperts = async () => {
      try {
        const data = await dietitianService.getDietitians();
        setExperts(data);
      } catch (error) {
        console.error("Error loading experts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      loadExperts();
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleSelectDietitian = async (dietitianId: string) => {
    if (user?.role !== "member") {
      toast({ title: "Hata", description: "Sadece üyeler diyetisyen seçebilir", variant: "destructive" });
      return;
    }
    setSelectingId(dietitianId);
    try {
      await memberService.selectDietitian(dietitianId);
      toast({ title: "Başarılı", description: "Diyetisyen seçildi!" });
    } catch (error: any) {
      toast({ title: "Hata", description: error.response?.data?.detail || "Bir hata oluştu", variant: "destructive" });
    } finally {
      setSelectingId(null);
    }
  };

  const handleStartChat = async (dietitianId: string) => {
    if (user?.role !== "member") return;
    setStartingChatId(dietitianId);
    try {
      const chat = await chatService.startChat(dietitianId);
      navigate("/messages", { state: { selectedChatId: chat.id } });
    } catch (error) {
      toast({ title: "Hata", description: "Sohbet başlatılamadı", variant: "destructive" });
    } finally {
      setStartingChatId(null);
    }
  };

  const filteredExperts = experts.filter(expert => {
    const matchesCategory = selectedCategory === "Tümü" || expert.specialization?.includes(selectedCategory);
    const matchesSearch = expert.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expert.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Uzman <span className="gradient-text">Diyetisyenler</span>
          </h1>
          <p className="text-muted-foreground">Size en uygun beslenme uzmanını bulun</p>
        </header>

        {/* Search and Filter */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Uzman veya uzmanlık alanı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button variant="glass" className="h-12">
            <Filter className="w-4 h-4 mr-2" />
            Filtrele
          </Button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-300 ${selectedCategory === category
                ? "bg-primary text-primary-foreground neon-glow"
                : "bg-surface text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Experts Grid */}
        {filteredExperts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperts.map((expert) => (
              <div key={expert.id} className="glass-card p-6 hover:neon-border transition-all duration-300 group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-xl font-bold">
                      {expert.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                    </div>
                    {expert.is_active && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{expert.full_name || "İsimsiz"}</h3>
                    <p className="text-sm text-muted-foreground">{expert.title || "Diyetisyen"}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 fill-primary text-primary" />
                      <span className="text-sm font-medium text-foreground">{expert.rating?.toFixed(1) || "5.0"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                    {expert.specialization || "Genel Beslenme"}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-surface text-muted-foreground text-xs flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    {expert.experience_years || 0} yıl
                  </span>
                </div>

                {expert.bio && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{expert.bio}</p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                  <div>
                    {selectingId !== expert.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-primary mr-2"
                        onClick={() => handleStartChat(expert.id)}
                        disabled={startingChatId === expert.id}
                      >
                        {startingChatId === expert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                        Mesaj
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-lg font-bold gradient-text">Ücretsiz</span>
                      <span className="text-sm text-muted-foreground"> danışmanlık</span>
                    </div>
                    {user?.role === "member" && (
                      <Button
                        variant="neon"
                        size="sm"
                        disabled={selectingId === expert.id}
                        onClick={() => handleSelectDietitian(expert.id)}
                      >
                        {selectingId === expert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Seç"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Henüz kayıtlı diyetisyen bulunmuyor.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Experts;

