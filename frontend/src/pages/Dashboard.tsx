import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Loader2,
  Droplets,
  Plus,
  Minus,
  Edit2,
  Save,
  X,
  Sparkles,
  Calendar,
  FileText,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import * as memberService from "@/services/memberService";
import * as dailyLogService from "@/services/dailyLogService";
import { useToast } from "@/hooks/use-toast";
import type { Member, Dietitian } from "@/types";
import type { DailyLog } from "@/services/dailyLogService";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [memberData, setMemberData] = useState<Member | null>(null);
  const [myDietitian, setMyDietitian] = useState<Dietitian | null>(null);
  const [dailyLog, setDailyLog] = useState<DailyLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingCalories, setIsEditingCalories] = useState(false);
  const [editCalories, setEditCalories] = useState({ consumed: 0, target: 2000 });
  const [isEditingMacros, setIsEditingMacros] = useState(false);
  const [editMacros, setEditMacros] = useState({ protein: 0, carbs: 0, fat: 0, proteinTarget: 120, carbsTarget: 250, fatTarget: 65 });

  const [myPlan, setMyPlan] = useState<memberService.MyNutritionPlan | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!authLoading && user && user.role === "admin") {
      navigate("/admin");
      return;
    }

    // Diyetisyen ise diyetisyen dashboard'a yönlendir
    if (!authLoading && user && user.role === "dietitian") {
      navigate("/dietitian-dashboard");
      return;
    }

    const loadData = async () => {
      try {
        if (user?.role === "member") {
          const data = await memberService.getMeFull();
          setMemberData(data);
          try {
            const dietitian = await memberService.getMyDietitian();
            setMyDietitian(dietitian);
          } catch { setMyDietitian(null); }

          // Try to load nutrition plan
          try {
            const plan = await memberService.getMyPlan();
            setMyPlan(plan);
          } catch { setMyPlan(null); }

          try {
            const log = await dailyLogService.getTodayLog();
            setDailyLog(log);
            setEditCalories({ consumed: log.calories_consumed, target: log.calories_target });
            setEditMacros({
              protein: log.protein,
              carbs: log.carbs,
              fat: log.fat,
              proteinTarget: log.protein_target,
              carbsTarget: log.carbs_target,
              fatTarget: log.fat_target,
            });
          } catch { console.error("Error loading daily log"); }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      loadData();
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const handleWaterChange = async (delta: number) => {
    if (!dailyLog) return;
    const newValue = Math.max(0, dailyLog.water_glasses + delta);
    try {
      const updated = await dailyLogService.updateTodayLog({ water_glasses: newValue });
      setDailyLog(updated);
    } catch { toast({ title: "Hata", description: "Su takibi güncellenemedi", variant: "destructive" }); }
  };

  const handleSaveCalories = async () => {
    try {
      const updated = await dailyLogService.updateTodayLog({
        calories_consumed: editCalories.consumed,
        calories_target: editCalories.target,
      });
      setDailyLog(updated);
      setIsEditingCalories(false);
      toast({ title: "Başarılı", description: "Kalori bilgileri güncellendi" });
    } catch { toast({ title: "Hata", description: "Güncelleme başarısız", variant: "destructive" }); }
  };

  const handleSaveMacros = async () => {
    try {
      const updated = await dailyLogService.updateTodayLog({
        protein: editMacros.protein,
        protein_target: editMacros.proteinTarget,
        carbs: editMacros.carbs,
        carbs_target: editMacros.carbsTarget,
        fat: editMacros.fat,
        fat_target: editMacros.fatTarget,
      });
      setDailyLog(updated);
      setIsEditingMacros(false);
      toast({ title: "Başarılı", description: "Makro bilgileri güncellendi" });
    } catch { toast({ title: "Hata", description: "Güncelleme başarısız", variant: "destructive" }); }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const userName = user?.full_name?.split(" ")[0] || "Kullanıcı";
  // Öncelik: Plan hedefleri > Günlük log hedefleri
  const caloriesConsumed = dailyLog?.calories_consumed || 0;
  const caloriesTarget = myPlan?.daily_targets.calories || dailyLog?.calories_target || 2000;
  const caloriesRemaining = Math.max(0, caloriesTarget - caloriesConsumed);
  const caloriePercentage = Math.min(100, (caloriesConsumed / caloriesTarget) * 100);
  const hasSubscription = memberData?.subscription_status || false;

  const proteinTarget = myPlan?.daily_targets.protein || dailyLog?.protein_target || 120;
  const carbsTarget = myPlan?.daily_targets.carbs || dailyLog?.carbs_target || 250;
  const fatTarget = myPlan?.daily_targets.fat || dailyLog?.fat_target || 65;
  const waterTarget = myPlan?.daily_targets.water || dailyLog?.water_target || 8;

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Merhaba, <span className="gradient-text">{userName}</span> 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              {myDietitian
                ? `Diyetisyeniniz:${myDietitian.full_name}`
                : "Bugünkü sağlık durumunuza göz atalım"
              }
            </p>
          </div>


        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Calories Card */}
          <div className="glass-card p-6 relative group">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Kalori</h3>
              <button
                onClick={() => setIsEditingCalories(true)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-primary transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            {isEditingCalories ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground">Tüketilen</label>
                  <input
                    type="number"
                    value={editCalories.consumed}
                    onChange={(e) => setEditCalories({ ...editCalories, consumed: Number(e.target.value) })}
                    className="w-full bg-surface border border-border rounded px-2 py-1 text-sm text-foreground"
                  />
                </div>
                {!myPlan && (
                  <div>
                    <label className="text-xs text-muted-foreground">Hedef</label>
                    <input
                      type="number"
                      value={editCalories.target}
                      onChange={(e) => setEditCalories({ ...editCalories, target: Number(e.target.value) })}
                      className="w-full bg-surface border border-border rounded px-2 py-1 text-sm text-foreground"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="neon" className="flex-1" onClick={handleSaveCalories}>Kaydet</Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingCalories(false)}>İptal</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-muted/20" />
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={175.93} strokeDashoffset={175.93 - (175.93 * caloriePercentage) / 100} className="text-primary" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                    {Math.round(caloriePercentage)}%
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{caloriesConsumed}</p>
                  <p className="text-sm text-muted-foreground">/ {caloriesTarget} kcal</p>
                  <p className="text-xs text-primary mt-1">{caloriesRemaining} kcal kaldı</p>
                </div>
              </div>
            )}
          </div>

          {/* Water Tracker */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-foreground mb-4">Su Tüketimi</h3>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Droplets className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-2xl font-bold text-foreground">{dailyLog?.water_glasses || 0}</span>
                <span className="text-sm text-muted-foreground">/ {waterTarget} bardak</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleWaterChange(-1)}
                disabled={(dailyLog?.water_glasses || 0) <= 0}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Button
                variant="neon"
                size="sm"
                className="flex-1"
                onClick={() => handleWaterChange(1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Macros */}
          <div className="glass-card p-6 md:col-span-2 relative group">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground">Makro Besinler</h3>
              <button
                onClick={() => setIsEditingMacros(true)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-primary transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            {isEditingMacros ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Protein</label>
                  <input type="number" value={editMacros.protein} onChange={(e) => setEditMacros({ ...editMacros, protein: Number(e.target.value) })} className="w-full bg-surface border border-border rounded px-2 py-1 text-sm text-foreground" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Karbonhidrat</label>
                  <input type="number" value={editMacros.carbs} onChange={(e) => setEditMacros({ ...editMacros, carbs: Number(e.target.value) })} className="w-full bg-surface border border-border rounded px-2 py-1 text-sm text-foreground" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Yağ</label>
                  <input type="number" value={editMacros.fat} onChange={(e) => setEditMacros({ ...editMacros, fat: Number(e.target.value) })} className="w-full bg-surface border border-border rounded px-2 py-1 text-sm text-foreground" />
                </div>
                <div className="col-span-3 flex gap-2 mt-2">
                  <Button size="sm" variant="neon" className="flex-1" onClick={handleSaveMacros}>Kaydet</Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingMacros(false)}>İptal</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Protein</span>
                    <span className="font-medium text-foreground">{dailyLog?.protein || 0} / {proteinTarget}g</span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, ((dailyLog?.protein || 0) / proteinTarget) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Karbonhidrat</span>
                    <span className="font-medium text-foreground">{dailyLog?.carbs || 0} / {carbsTarget}g</span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, ((dailyLog?.carbs || 0) / carbsTarget) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Yağ</span>
                    <span className="font-medium text-foreground">{dailyLog?.fat || 0} / {fatTarget}g</span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, ((dailyLog?.fat || 0) / fatTarget) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">

            {/* Diet Program */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-foreground">Diyet Programınız</h3>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {new Date().toLocaleDateString('tr-TR', { weekday: 'long' })}
                </span>
              </div>

              {myPlan ? (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <h4 className="font-bold text-primary mb-1">{myPlan.title}</h4>
                    <p className="text-sm text-muted-foreground">{myPlan.description}</p>
                  </div>

                  <div className="space-y-4">
                    {myPlan.meals.map((meal, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-surface hover:bg-surface-elevated transition-colors border border-border/50">
                        <div className="p-2 rounded-lg bg-background border border-border">
                          {meal.meal_type === 'breakfast' && <span className="text-xl">🍳</span>}
                          {meal.meal_type === 'lunch' && <span className="text-xl">🥗</span>}
                          {meal.meal_type === 'dinner' && <span className="text-xl">🍲</span>}
                          {meal.meal_type === 'snack' && <span className="text-xl">🍎</span>}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground capitalize">
                              {meal.meal_type === 'breakfast' ? 'Kahvaltı' :
                                meal.meal_type === 'lunch' ? 'Öğle Yemeği' :
                                  meal.meal_type === 'dinner' ? 'Akşam Yemeği' : 'Ara Öğün'}
                            </h4>
                            <span className="text-xs text-muted-foreground">• {meal.time || 'Saat belirtilmemiş'}</span>
                          </div>
                          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            {meal.foods.map((food, fIdx) => (
                              <li key={fIdx}>
                                {typeof food === 'string'
                                  ? food
                                  : `${food.name}${food.amount ? ` - ${food.amount}` : ''}`
                                }
                              </li>
                            ))}
                          </ul>
                          {meal.notes && (
                            <p className="text-xs text-primary mt-2 italic">{meal.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-surface/50 rounded-xl border border-dashed border-border">
                  <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h4 className="font-medium text-foreground mb-2">Henüz bir programınız yok</h4>
                  {hasSubscription ? (
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Diyetisyeniniz sizin için özel bir beslenme programı hazırlıyor.
                      Programınız hazır olduğunda burada görüntülenecektir.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Kişisel beslenme programınıza erişmek için bir uzmandan paket satın almanız gerekmektedir.
                    </p>
                  )}
                  {!hasSubscription && (
                    <Button variant="neon" size="sm" className="mt-4" onClick={() => navigate('/messages')}>
                      Paketleri İncele
                    </Button>
                  )}
                </div>
              )}
            </div>



          </div>
        </div>
      </div>
    </DashboardLayout >
  );
};

export default Dashboard;
