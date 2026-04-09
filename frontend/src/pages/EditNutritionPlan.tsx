import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    Loader2,
    Sparkles,
    Calculator,
    Check,
    Bot,
    Wand2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import * as dietitianService from "@/services/dietitianDashboardService";
import * as aiService from "@/services/aiService";
import { useToast } from "@/hooks/use-toast";
import type { NutritionPlan, Meal, DailyTargets, Food, SavedCalorieData } from "@/services/dietitianDashboardService";

const EditNutritionPlan = () => {
    const { planId } = useParams<{ planId: string }>();
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { toast } = useToast();

    const [plan, setPlan] = useState<NutritionPlan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [endDate, setEndDate] = useState("");
    const [targets, setTargets] = useState<DailyTargets>({
        calories: 2000,
        protein: 120,
        carbs: 250,
        fat: 65,
        water: 8
    });
    const [meals, setMeals] = useState<Meal[]>([]);

    // AI Modal State
    const [aiGoal, setAiGoal] = useState<'weight_loss' | 'muscle_gain' | 'maintenance'>('weight_loss');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiPlanGenerated, setAiPlanGenerated] = useState(false);

    // Saved calorie data
    const [savedCalorieData, setSavedCalorieData] = useState<SavedCalorieData | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate("/login");
            return;
        }
        if (!authLoading && user?.role !== "dietitian") {
            navigate("/dashboard");
            return;
        }

        const loadPlan = async () => {
            if (!planId) return;
            try {
                const data = await dietitianService.getNutritionPlan(planId);
                setPlan(data);
                setTitle(data.title);
                setDescription(data.description || "");
                setEndDate(data.end_date || "");
                setTargets(data.daily_targets);
                setMeals(data.meals);
            } catch (error) {
                console.error("Error loading plan:", error);
                toast({ title: "Hata", description: "Plan yüklenemedi", variant: "destructive" });
                navigate("/dietitian-dashboard");
            } finally {
                setIsLoading(false);
            }
        };

        if (!authLoading && isAuthenticated && planId) {
            loadPlan();
        }
    }, [authLoading, isAuthenticated, user, planId, navigate, toast]);

    // Load saved calorie data when plan is loaded
    useEffect(() => {
        const loadCalorieData = async () => {
            if (plan?.member_id) {
                try {
                    const result = await dietitianService.getMemberCalories(plan.member_id);
                    if (result.success && result.data) {
                        setSavedCalorieData(result.data);
                    }
                } catch (error) {
                    console.error("Could not load calorie data:", error);
                }
            }
        };
        loadCalorieData();
    }, [plan?.member_id]);

    const applyCalculatedValues = () => {
        if (savedCalorieData) {
            setTargets({
                ...targets,
                calories: savedCalorieData.calculated_target_calories,
                protein: savedCalorieData.calculated_protein,
                carbs: savedCalorieData.calculated_carbs,
                fat: savedCalorieData.calculated_fat
            });
            toast({ title: "Uygulandı", description: "Hesaplanan değerler forma aktarıldı" });
        }
    };

    const handleAddMeal = () => {
        setMeals([...meals, { meal_type: 'snack', foods: [{ name: '', amount: '' }], time: '', notes: '' }]);
    };

    const handleRemoveMeal = (index: number) => {
        const newMeals = [...meals];
        newMeals.splice(index, 1);
        setMeals(newMeals);
    };

    const handleMealChange = (index: number, field: keyof Meal, value: any) => {
        const newMeals = [...meals];
        newMeals[index] = { ...newMeals[index], [field]: value };
        setMeals(newMeals);
    };

    const handleFoodChange = (mealIndex: number, foodIndex: number, field: keyof Food, value: string) => {
        const newMeals = [...meals];
        const newFoods = [...newMeals[mealIndex].foods];
        newFoods[foodIndex] = { ...newFoods[foodIndex], [field]: value };
        newMeals[mealIndex].foods = newFoods;
        setMeals(newMeals);
    };

    const handleAddFood = (mealIndex: number) => {
        const newMeals = [...meals];
        newMeals[mealIndex].foods.push({ name: '', amount: '' });
        setMeals(newMeals);
    };

    const handleRemoveFood = (mealIndex: number, foodIndex: number) => {
        const newMeals = [...meals];
        newMeals[mealIndex].foods.splice(foodIndex, 1);
        setMeals(newMeals);
    };

    const handleSave = async () => {
        if (!planId || !title) {
            toast({ title: "Hata", description: "Lütfen zorunlu alanları doldurun", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            await dietitianService.updateNutritionPlan(planId, {
                title,
                description,
                end_date: endDate || undefined,
                daily_targets: targets,
                meals: meals.map(m => ({
                    ...m,
                    foods: m.foods.filter(f => f.name.trim() !== '')
                })),
            });
            toast({ title: "Başarılı", description: "Beslenme programı güncellendi" });
            navigate("/dietitian-dashboard");
        } catch (error) {
            console.error("Error saving plan:", error);
            toast({ title: "Hata", description: "Program kaydedilemedi", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateWithAI = async () => {
        if (!plan?.member_id) return;
        if (!targets.calories || targets.calories < 500) {
            toast({ title: "Hata", description: "Lütfen önce günlük kalori hedefini girin", variant: "destructive" });
            return;
        }
        setIsGenerating(true);
        setAiPlanGenerated(false);
        try {
            const result = await aiService.generateNutritionPlan({
                member_id: plan.member_id,
                goal: aiGoal,
                target_calories: targets.calories
            });

            if (result.success && result.daily_targets && result.meals) {
                // Form'u AI verileriyle doldur
                setTargets({
                    calories: result.daily_targets.calories || targets.calories,
                    protein: result.daily_targets.protein || 120,
                    carbs: result.daily_targets.carbs || 250,
                    fat: result.daily_targets.fat || 65,
                    water: result.daily_targets.water || 8
                });

                // Öğünleri dönüştür
                const convertedMeals: Meal[] = result.meals.map(m => ({
                    meal_type: m.meal_type as any,
                    time: m.time || '',
                    notes: m.notes || '',
                    foods: m.foods.map(f => ({ name: f.name, amount: f.amount || '' }))
                }));
                setMeals(convertedMeals);

                setAiPlanGenerated(true);
                toast({ title: "✨ AI Planı Oluşturuldu", description: "Öğünler ve hedefler forma aktarıldı. Düzenleme yapabilirsiniz." });
            } else {
                toast({ title: "Hata", description: result.error || "AI program oluşturamadı", variant: "destructive" });
            }
        } catch (error: any) {
            console.error("AI generate error:", error);
            toast({ title: "Hata", description: "AI servisine bağlanılamadı", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-30 glass border-b border-border/50 px-4 lg:px-8 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/dietitian-dashboard")}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Programı Düzenle</h1>
                            <p className="text-sm text-muted-foreground">{plan?.title}</p>
                        </div>
                    </div>
                    <Button variant="neon" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Değişiklikleri Kaydet
                    </Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">

                {/* AI Plan Generator - Inline Panel */}
                <section className="glass-card p-6 border border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                Yapay Zeka ile Beslenme Planı Oluştur
                                {aiPlanGenerated && <span className="text-xs font-normal text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">✓ Uygulandı</span>}
                            </h2>
                            <p className="text-sm text-muted-foreground">Hedef ve kalori değerine göre AI otomatik öğün listesi oluşturur</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                        <div className="flex-1">
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Günlük Kalori Hedefi (kcal)</label>
                            <input
                                type="number"
                                value={targets.calories}
                                onChange={(e) => setTargets({ ...targets, calories: Number(e.target.value) })}
                                className="w-full h-10 px-3 rounded-lg bg-surface border border-border focus:border-purple-500 outline-none text-foreground"
                                placeholder="2000"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-medium text-muted-foreground block mb-1">Hedef</label>
                            <select
                                value={aiGoal}
                                onChange={(e) => setAiGoal(e.target.value as 'weight_loss' | 'muscle_gain' | 'maintenance')}
                                className="w-full h-10 px-3 rounded-lg bg-surface border border-border focus:border-purple-500 outline-none text-foreground appearance-none"
                            >
                                <option value="weight_loss">🔥 Kilo Vermek</option>
                                <option value="muscle_gain">💪 Kas Yapmak</option>
                                <option value="maintenance">⚖️ Kiloyu Korumak</option>
                            </select>
                        </div>
                        <Button
                            onClick={handleGenerateWithAI}
                            disabled={isGenerating}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shrink-0 h-10"
                        >
                            {isGenerating ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Oluşturuluyor...</>
                            ) : (
                                <><Wand2 className="w-4 h-4 mr-2" />AI ile Oluştur</>
                            )}
                        </Button>
                    </div>

                    {isGenerating && (
                        <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <p className="text-sm text-purple-400">AI beslenme programı hazırlanıyor, lütfen bekleyin...</p>
                        </div>
                    )}
                </section>

                {/* Basic Info */}
                <section className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Program Detayları</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Program Başlığı</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full h-10 mt-1 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Açıklama</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full h-10 mt-1 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Bitiş Tarihi</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full h-10 mt-1 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground"
                            />
                        </div>
                    </div>
                </section>

                {/* Daily Targets */}
                <section className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Günlük Hedefler</h2>

                    {/* Saved Calorie Info */}
                    {savedCalorieData && (
                        <div className="mb-6 p-4 rounded-xl border border-green-500/30 bg-green-500/5">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                        <Calculator className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                                            <Sparkles className="w-4 h-4 text-green-500" />
                                            Önceden Hesaplanan Değerler
                                        </h3>
                                        <div className="flex flex-wrap gap-3 mt-2 text-xs">
                                            <span className="text-orange-500">
                                                🔥 TDEE: <strong>{savedCalorieData.calculated_tdee}</strong> kcal
                                            </span>
                                            <span className="text-primary">
                                                🎯 Hedef: <strong>{savedCalorieData.calculated_target_calories}</strong> kcal
                                            </span>
                                            <span className="text-red-400">
                                                P: <strong>{savedCalorieData.calculated_protein}g</strong>
                                            </span>
                                            <span className="text-yellow-400">
                                                K: <strong>{savedCalorieData.calculated_carbs}g</strong>
                                            </span>
                                            <span className="text-blue-400">
                                                Y: <strong>{savedCalorieData.calculated_fat}g</strong>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={applyCalculatedValues}
                                    className="shrink-0"
                                >
                                    <Check className="w-4 h-4 mr-2" />
                                    Uygula
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-foreground">Günlük Hedefler</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Kalori (kcal)</label>
                            <input
                                type="number"
                                value={targets.calories}
                                onChange={(e) => setTargets({ ...targets, calories: Number(e.target.value) })}
                                className="w-full h-10 mt-1 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Protein (g)</label>
                            <input
                                type="number"
                                value={targets.protein}
                                onChange={(e) => setTargets({ ...targets, protein: Number(e.target.value) })}
                                className="w-full h-10 mt-1 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Karbonhidrat (g)</label>
                            <input
                                type="number"
                                value={targets.carbs}
                                onChange={(e) => setTargets({ ...targets, carbs: Number(e.target.value) })}
                                className="w-full h-10 mt-1 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Yağ (g)</label>
                            <input
                                type="number"
                                value={targets.fat}
                                onChange={(e) => setTargets({ ...targets, fat: Number(e.target.value) })}
                                className="w-full h-10 mt-1 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Su (Bardak)</label>
                            <input
                                type="number"
                                value={targets.water}
                                onChange={(e) => setTargets({ ...targets, water: Number(e.target.value) })}
                                className="w-full h-10 mt-1 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground"
                            />
                        </div>
                    </div>
                </section>

                {/* Meals */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">Öğünler</h2>
                        <Button variant="outline" size="sm" onClick={handleAddMeal}>
                            <Plus className="w-4 h-4 mr-2" /> Öğün Ekle
                        </Button>
                    </div>

                    {meals.map((meal, mealIndex) => (
                        <div key={mealIndex} className="glass-card p-6 relative group">
                            <button
                                onClick={() => handleRemoveMeal(mealIndex)}
                                className="absolute top-4 right-4 p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Öğün Tipi</label>
                                    <select
                                        value={meal.meal_type}
                                        onChange={(e) => handleMealChange(mealIndex, 'meal_type', e.target.value)}
                                        className="w-full h-10 mt-1 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground appearance-none"
                                    >
                                        <option value="breakfast">Kahvaltı</option>
                                        <option value="lunch">Öğle</option>
                                        <option value="dinner">Akşam</option>
                                        <option value="snack">Ara Öğün</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Saat</label>
                                    <input
                                        type="time"
                                        value={meal.time || ''}
                                        onChange={(e) => handleMealChange(mealIndex, 'time', e.target.value)}
                                        className="w-full h-10 mt-1 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Notlar</label>
                                    <input
                                        type="text"
                                        value={meal.notes || ''}
                                        onChange={(e) => handleMealChange(mealIndex, 'notes', e.target.value)}
                                        className="w-full h-10 mt-1 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Yiyecekler</label>
                                {meal.foods.map((food, foodIndex) => (
                                    <div key={foodIndex} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={food.name}
                                            onChange={(e) => handleFoodChange(mealIndex, foodIndex, 'name', e.target.value)}
                                            className="flex-1 h-9 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground text-sm"
                                            placeholder="Yiyecek adı..."
                                        />
                                        <input
                                            type="text"
                                            value={food.amount || ''}
                                            onChange={(e) => handleFoodChange(mealIndex, foodIndex, 'amount', e.target.value)}
                                            className="w-28 h-9 px-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-foreground text-sm"
                                            placeholder="Miktar (100g)"
                                        />
                                        {meal.foods.length > 1 && (
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveFood(mealIndex, foodIndex)}>
                                                <Trash2 className="w-4 h-4 text-muted-foreground" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 mt-2" onClick={() => handleAddFood(mealIndex)}>
                                    <Plus className="w-3 h-3 mr-1" /> Yiyecek Ekle
                                </Button>
                            </div>
                        </div>
                    ))}
                </section>

            </main>
        </div>
    );
};

export default EditNutritionPlan;
