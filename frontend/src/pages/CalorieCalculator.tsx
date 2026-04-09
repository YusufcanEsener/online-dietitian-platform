import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft,
    ArrowRight,
    Calculator,
    User,
    Activity,
    Heart,
    Utensils,
    Target,
    Sparkles,
    Check,
    Loader2
} from "lucide-react";

// Form adımları
const STEPS = [
    { id: 1, title: "Demografik Bilgiler", icon: User },
    { id: 2, title: "Fiziksel Ölçümler", icon: Activity },
    { id: 3, title: "Aktivite Seviyesi", icon: Activity },
    { id: 4, title: "Sağlık Durumu", icon: Heart },
    { id: 5, title: "Yaşam Tarzı", icon: User },
    { id: 6, title: "Beslenme Tercihleri", icon: Utensils },
    { id: 7, title: "Hedefler", icon: Target },
    { id: 8, title: "Sonuç", icon: Sparkles },
];

// Aktivite seviyeleri
const ACTIVITY_LEVELS = [
    { value: "sedentary", label: "Hareketsiz", description: "Masa başı iş, egzersiz yok", multiplier: 1.2 },
    { value: "light", label: "Hafif Aktif", description: "Haftada 1-2 gün hafif egzersiz", multiplier: 1.375 },
    { value: "moderate", label: "Orta Aktif", description: "Haftada 3-5 gün orta egzersiz", multiplier: 1.55 },
    { value: "active", label: "Aktif", description: "Haftada 6-7 gün yoğun egzersiz", multiplier: 1.725 },
    { value: "very_active", label: "Çok Aktif", description: "Günde 2 antrenman veya fiziksel iş", multiplier: 1.9 },
];

// Hedef türleri
const GOAL_TYPES = [
    { value: "lose", label: "Kilo Vermek", deficit: -500 },
    { value: "maintain", label: "Kilo Korumak", deficit: 0 },
    { value: "gain", label: "Kilo Almak", deficit: 500 },
];

interface FormData {
    // Demografik
    age: number;
    gender: "male" | "female";
    ethnicity: string;

    // Fiziksel
    weight: number;
    height: number;
    bodyFatPercentage: number;
    muscleMass: number;
    waistCircumference: number;
    hipCircumference: number;
    neckCircumference: number;
    wristCircumference: number;

    // Aktivite
    activityLevel: string;
    dailySteps: number;
    exerciseType: string;
    exerciseFrequency: number;
    exerciseDuration: number;
    jobType: string;
    standingHours: number;

    // Sağlık
    chronicDiseases: string[];
    medications: string[];
    allergies: string[];
    digestiveIssues: string[];
    hormoneIssues: boolean;
    thyroidIssue: string;
    insulinResistance: boolean;

    // Yaşam tarzı
    sleepHours: number;
    sleepQuality: string;
    stressLevel: string;
    smokingStatus: string;
    alcoholConsumption: string;
    caffeineIntake: number;
    waterIntake: number;
    mealTiming: string;

    // Beslenme
    mealCount: number;
    eatingSpeed: string;
    snackingHabit: string;
    nightEating: boolean;
    dietaryRestrictions: string[];
    foodPreferences: string[];
    dislikedFoods: string[];
    cookingAbility: string;

    // Hedefler
    goalType: string;
    targetWeight: number;
    targetDate: string;
    motivationLevel: string;
    previousDiets: string[];
    successFactors: string[];
}

const CalorieCalculator = () => {
    const { memberId } = useParams<{ memberId: string }>();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(1);
    const [isCalculating, setIsCalculating] = useState(false);
    const [results, setResults] = useState<{
        bmr: number;
        tdee: number;
        targetCalories: number;
        protein: number;
        carbs: number;
        fat: number;
    } | null>(null);

    const [formData, setFormData] = useState<FormData>({
        // Demografik
        age: 30,
        gender: "male",
        ethnicity: "",

        // Fiziksel
        weight: 80,
        height: 175,
        bodyFatPercentage: 0,
        muscleMass: 0,
        waistCircumference: 0,
        hipCircumference: 0,
        neckCircumference: 0,
        wristCircumference: 0,

        // Aktivite
        activityLevel: "moderate",
        dailySteps: 8000,
        exerciseType: "",
        exerciseFrequency: 3,
        exerciseDuration: 45,
        jobType: "",
        standingHours: 2,

        // Sağlık
        chronicDiseases: [],
        medications: [],
        allergies: [],
        digestiveIssues: [],
        hormoneIssues: false,
        thyroidIssue: "none",
        insulinResistance: false,

        // Yaşam tarzı
        sleepHours: 7,
        sleepQuality: "good",
        stressLevel: "moderate",
        smokingStatus: "never",
        alcoholConsumption: "rarely",
        caffeineIntake: 2,
        waterIntake: 8,
        mealTiming: "regular",

        // Beslenme
        mealCount: 3,
        eatingSpeed: "normal",
        snackingHabit: "sometimes",
        nightEating: false,
        dietaryRestrictions: [],
        foodPreferences: [],
        dislikedFoods: [],
        cookingAbility: "intermediate",

        // Hedefler
        goalType: "lose",
        targetWeight: 75,
        targetDate: "",
        motivationLevel: "high",
        previousDiets: [],
        successFactors: [],
    });

    const updateFormData = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // BMR hesaplama (Mifflin-St Jeor formülü)
    const calculateBMR = () => {
        const { weight, height, age, gender } = formData;
        if (gender === "male") {
            return 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            return 10 * weight + 6.25 * height - 5 * age - 161;
        }
    };

    // TDEE hesaplama
    const calculateTDEE = (bmr: number) => {
        const activity = ACTIVITY_LEVELS.find(a => a.value === formData.activityLevel);
        return bmr * (activity?.multiplier || 1.55);
    };

    // Makro hesaplama
    const calculateMacros = (calories: number) => {
        // Protein: 2g/kg vücut ağırlığı
        const protein = Math.round(formData.weight * 2);
        // Yağ: %25-30 kalori
        const fatCalories = calories * 0.25;
        const fat = Math.round(fatCalories / 9);
        // Karbonhidrat: Kalan kaloriler
        const proteinCalories = protein * 4;
        const carbCalories = calories - proteinCalories - fatCalories;
        const carbs = Math.round(carbCalories / 4);

        return { protein, carbs, fat };
    };

    const handleCalculate = () => {
        setIsCalculating(true);

        setTimeout(() => {
            const bmr = Math.round(calculateBMR());
            const tdee = Math.round(calculateTDEE(bmr));
            const goal = GOAL_TYPES.find(g => g.value === formData.goalType);
            const targetCalories = tdee + (goal?.deficit || 0);
            const macros = calculateMacros(targetCalories);

            setResults({
                bmr,
                tdee,
                targetCalories,
                ...macros
            });

            setIsCalculating(false);
            setCurrentStep(8);
        }, 1500);
    };

    const nextStep = () => {
        if (currentStep === 7) {
            handleCalculate();
        } else if (currentStep < 8) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Step içerikleri
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Yaş</Label>
                                <Input
                                    type="number"
                                    value={formData.age}
                                    onChange={(e) => updateFormData("age", parseInt(e.target.value) || 0)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label>Cinsiyet</Label>
                                <div className="flex gap-2 mt-1">
                                    <Button
                                        type="button"
                                        variant={formData.gender === "male" ? "neon" : "outline"}
                                        onClick={() => updateFormData("gender", "male")}
                                        className="flex-1"
                                    >
                                        Erkek
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={formData.gender === "female" ? "neon" : "outline"}
                                        onClick={() => updateFormData("gender", "female")}
                                        className="flex-1"
                                    >
                                        Kadın
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label>Etnik Köken (opsiyonel)</Label>
                            <Input
                                value={formData.ethnicity}
                                onChange={(e) => updateFormData("ethnicity", e.target.value)}
                                placeholder="Türk, Kafkas, vb."
                                className="mt-1"
                            />
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Kilo (kg)</Label>
                                <Input
                                    type="number"
                                    value={formData.weight}
                                    onChange={(e) => updateFormData("weight", parseFloat(e.target.value) || 0)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label>Boy (cm)</Label>
                                <Input
                                    type="number"
                                    value={formData.height}
                                    onChange={(e) => updateFormData("height", parseFloat(e.target.value) || 0)}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Vücut Yağ Oranı (%)</Label>
                                <Input
                                    type="number"
                                    value={formData.bodyFatPercentage || ""}
                                    onChange={(e) => updateFormData("bodyFatPercentage", parseFloat(e.target.value) || 0)}
                                    placeholder="Opsiyonel"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label>Kas Kütlesi (kg)</Label>
                                <Input
                                    type="number"
                                    value={formData.muscleMass || ""}
                                    onChange={(e) => updateFormData("muscleMass", parseFloat(e.target.value) || 0)}
                                    placeholder="Opsiyonel"
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Bel Çevresi (cm)</Label>
                                <Input
                                    type="number"
                                    value={formData.waistCircumference || ""}
                                    onChange={(e) => updateFormData("waistCircumference", parseFloat(e.target.value) || 0)}
                                    placeholder="Opsiyonel"
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label>Kalça Çevresi (cm)</Label>
                                <Input
                                    type="number"
                                    value={formData.hipCircumference || ""}
                                    onChange={(e) => updateFormData("hipCircumference", parseFloat(e.target.value) || 0)}
                                    placeholder="Opsiyonel"
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <Label className="text-lg">Genel Aktivite Seviyeniz</Label>
                        <div className="space-y-3">
                            {ACTIVITY_LEVELS.map((level) => (
                                <button
                                    key={level.value}
                                    type="button"
                                    onClick={() => updateFormData("activityLevel", level.value)}
                                    className={`w-full p-4 rounded-xl border text-left transition-all ${formData.activityLevel === level.value
                                            ? "border-primary bg-primary/10"
                                            : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-foreground">{level.label}</p>
                                            <p className="text-sm text-muted-foreground">{level.description}</p>
                                        </div>
                                        {formData.activityLevel === level.value && (
                                            <Check className="w-5 h-5 text-primary" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div>
                                <Label>Günlük Adım Sayısı</Label>
                                <Input
                                    type="number"
                                    value={formData.dailySteps}
                                    onChange={(e) => updateFormData("dailySteps", parseInt(e.target.value) || 0)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label>Haftalık Egzersiz (gün)</Label>
                                <Input
                                    type="number"
                                    value={formData.exerciseFrequency}
                                    onChange={(e) => updateFormData("exerciseFrequency", parseInt(e.target.value) || 0)}
                                    min={0}
                                    max={7}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <div>
                            <Label>Kronik Hastalıklar</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {["Diyabet", "Hipertansiyon", "Kalp Hastalığı", "Tiroid", "Kolesterol"].map((disease) => (
                                    <Button
                                        key={disease}
                                        type="button"
                                        variant={formData.chronicDiseases.includes(disease) ? "neon" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                            const current = formData.chronicDiseases;
                                            if (current.includes(disease)) {
                                                updateFormData("chronicDiseases", current.filter(d => d !== disease));
                                            } else {
                                                updateFormData("chronicDiseases", [...current, disease]);
                                            }
                                        }}
                                    >
                                        {disease}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label>Alerjiler</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {["Gluten", "Laktoz", "Fıstık", "Yumurta", "Deniz Ürünleri", "Soya"].map((allergy) => (
                                    <Button
                                        key={allergy}
                                        type="button"
                                        variant={formData.allergies.includes(allergy) ? "neon" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                            const current = formData.allergies;
                                            if (current.includes(allergy)) {
                                                updateFormData("allergies", current.filter(a => a !== allergy));
                                            } else {
                                                updateFormData("allergies", [...current, allergy]);
                                            }
                                        }}
                                    >
                                        {allergy}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Tiroid Durumu</Label>
                                <select
                                    value={formData.thyroidIssue}
                                    onChange={(e) => updateFormData("thyroidIssue", e.target.value)}
                                    className="w-full mt-1 p-2 rounded-lg bg-surface border border-border text-foreground"
                                >
                                    <option value="none">Normal</option>
                                    <option value="hypo">Hipotiroid (Düşük)</option>
                                    <option value="hyper">Hipertiroid (Yüksek)</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 mt-6">
                                <input
                                    type="checkbox"
                                    id="insulinResistance"
                                    checked={formData.insulinResistance}
                                    onChange={(e) => updateFormData("insulinResistance", e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <Label htmlFor="insulinResistance">İnsülin Direnci</Label>
                            </div>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Günlük Uyku (saat)</Label>
                                <Input
                                    type="number"
                                    value={formData.sleepHours}
                                    onChange={(e) => updateFormData("sleepHours", parseFloat(e.target.value) || 0)}
                                    min={4}
                                    max={12}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label>Uyku Kalitesi</Label>
                                <select
                                    value={formData.sleepQuality}
                                    onChange={(e) => updateFormData("sleepQuality", e.target.value)}
                                    className="w-full mt-1 p-2 rounded-lg bg-surface border border-border text-foreground"
                                >
                                    <option value="poor">Kötü</option>
                                    <option value="fair">Orta</option>
                                    <option value="good">İyi</option>
                                    <option value="excellent">Mükemmel</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Stres Seviyesi</Label>
                                <select
                                    value={formData.stressLevel}
                                    onChange={(e) => updateFormData("stressLevel", e.target.value)}
                                    className="w-full mt-1 p-2 rounded-lg bg-surface border border-border text-foreground"
                                >
                                    <option value="low">Düşük</option>
                                    <option value="moderate">Orta</option>
                                    <option value="high">Yüksek</option>
                                    <option value="very_high">Çok Yüksek</option>
                                </select>
                            </div>
                            <div>
                                <Label>Sigara</Label>
                                <select
                                    value={formData.smokingStatus}
                                    onChange={(e) => updateFormData("smokingStatus", e.target.value)}
                                    className="w-full mt-1 p-2 rounded-lg bg-surface border border-border text-foreground"
                                >
                                    <option value="never">Hiç içmedim</option>
                                    <option value="former">Bıraktım</option>
                                    <option value="occasional">Ara sıra</option>
                                    <option value="regular">Düzenli</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Günlük Kahve/Çay (bardak)</Label>
                                <Input
                                    type="number"
                                    value={formData.caffeineIntake}
                                    onChange={(e) => updateFormData("caffeineIntake", parseInt(e.target.value) || 0)}
                                    min={0}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label>Günlük Su (bardak)</Label>
                                <Input
                                    type="number"
                                    value={formData.waterIntake}
                                    onChange={(e) => updateFormData("waterIntake", parseInt(e.target.value) || 0)}
                                    min={0}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 6:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Günlük Öğün Sayısı</Label>
                                <Input
                                    type="number"
                                    value={formData.mealCount}
                                    onChange={(e) => updateFormData("mealCount", parseInt(e.target.value) || 3)}
                                    min={1}
                                    max={6}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label>Yeme Hızı</Label>
                                <select
                                    value={formData.eatingSpeed}
                                    onChange={(e) => updateFormData("eatingSpeed", e.target.value)}
                                    className="w-full mt-1 p-2 rounded-lg bg-surface border border-border text-foreground"
                                >
                                    <option value="slow">Yavaş</option>
                                    <option value="normal">Normal</option>
                                    <option value="fast">Hızlı</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <Label>Diyet Kısıtlamaları</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {["Vejetaryen", "Vegan", "Helal", "Koşer", "Düşük Karbonhidrat", "Düşük Yağ"].map((diet) => (
                                    <Button
                                        key={diet}
                                        type="button"
                                        variant={formData.dietaryRestrictions.includes(diet) ? "neon" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                            const current = formData.dietaryRestrictions;
                                            if (current.includes(diet)) {
                                                updateFormData("dietaryRestrictions", current.filter(d => d !== diet));
                                            } else {
                                                updateFormData("dietaryRestrictions", [...current, diet]);
                                            }
                                        }}
                                    >
                                        {diet}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label>Yemek Yapma Becerisi</Label>
                            <select
                                value={formData.cookingAbility}
                                onChange={(e) => updateFormData("cookingAbility", e.target.value)}
                                className="w-full mt-1 p-2 rounded-lg bg-surface border border-border text-foreground"
                            >
                                <option value="none">Yapamıyorum</option>
                                <option value="basic">Basit yemekler</option>
                                <option value="intermediate">Orta seviye</option>
                                <option value="advanced">İleri seviye</option>
                            </select>
                        </div>
                    </div>
                );

            case 7:
                return (
                    <div className="space-y-6">
                        <Label className="text-lg">Hedefiniz Nedir?</Label>
                        <div className="grid grid-cols-3 gap-4">
                            {GOAL_TYPES.map((goal) => (
                                <button
                                    key={goal.value}
                                    type="button"
                                    onClick={() => updateFormData("goalType", goal.value)}
                                    className={`p-4 rounded-xl border text-center transition-all ${formData.goalType === goal.value
                                            ? "border-primary bg-primary/10"
                                            : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    <p className="font-medium text-foreground">{goal.label}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {goal.deficit > 0 ? `+${goal.deficit}` : goal.deficit} kcal
                                    </p>
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Hedef Kilo (kg)</Label>
                                <Input
                                    type="number"
                                    value={formData.targetWeight}
                                    onChange={(e) => updateFormData("targetWeight", parseFloat(e.target.value) || 0)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label>Hedef Tarih</Label>
                                <Input
                                    type="date"
                                    value={formData.targetDate}
                                    onChange={(e) => updateFormData("targetDate", e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Motivasyon Seviyesi</Label>
                            <select
                                value={formData.motivationLevel}
                                onChange={(e) => updateFormData("motivationLevel", e.target.value)}
                                className="w-full mt-1 p-2 rounded-lg bg-surface border border-border text-foreground"
                            >
                                <option value="low">Düşük - Deneyeceğim</option>
                                <option value="moderate">Orta - Kararlıyım</option>
                                <option value="high">Yüksek - Çok Kararlıyım</option>
                            </select>
                        </div>
                    </div>
                );

            case 8:
                return (
                    <div className="space-y-6">
                        {isCalculating ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                                <p className="text-muted-foreground">Hesaplama yapılıyor...</p>
                            </div>
                        ) : results ? (
                            <>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="glass-card p-6 text-center">
                                        <p className="text-sm text-muted-foreground mb-2">Bazal Metabolizma (BMR)</p>
                                        <p className="text-3xl font-bold text-foreground">{results.bmr}</p>
                                        <p className="text-xs text-muted-foreground">kcal/gün</p>
                                    </div>
                                    <div className="glass-card p-6 text-center">
                                        <p className="text-sm text-muted-foreground mb-2">Günlük Harcama (TDEE)</p>
                                        <p className="text-3xl font-bold text-foreground">{results.tdee}</p>
                                        <p className="text-xs text-muted-foreground">kcal/gün</p>
                                    </div>
                                    <div className="glass-card p-6 text-center border-primary border-2">
                                        <p className="text-sm text-muted-foreground mb-2">Hedef Kalori</p>
                                        <p className="text-3xl font-bold text-primary">{results.targetCalories}</p>
                                        <p className="text-xs text-muted-foreground">kcal/gün</p>
                                    </div>
                                </div>

                                <div className="glass-card p-6">
                                    <h3 className="font-semibold text-foreground mb-4">Önerilen Makro Dağılımı</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-muted-foreground">Protein</span>
                                                <span className="text-sm font-medium">{results.protein}g</span>
                                            </div>
                                            <div className="h-3 bg-surface rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${(results.protein * 4 / results.targetCalories) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-muted-foreground">Karbonhidrat</span>
                                                <span className="text-sm font-medium">{results.carbs}g</span>
                                            </div>
                                            <div className="h-3 bg-surface rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 rounded-full"
                                                    style={{ width: `${(results.carbs * 4 / results.targetCalories) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm text-muted-foreground">Yağ</span>
                                                <span className="text-sm font-medium">{results.fat}g</span>
                                            </div>
                                            <div className="h-3 bg-surface rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-yellow-500 rounded-full"
                                                    style={{ width: `${(results.fat * 9 / results.targetCalories) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                                        Yeniden Hesapla
                                    </Button>
                                    <Button variant="neon" onClick={() => navigate(`/dietitian/create-plan/${memberId}`)} className="flex-1">
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Bu Değerlerle Plan Oluştur
                                    </Button>
                                </div>
                            </>
                        ) : null}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-30 glass border-b border-border/50 px-4 lg:px-8 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-primary" />
                                Bilimsel Kalori Hesaplayıcı
                            </h1>
                            <p className="text-sm text-muted-foreground">Mifflin-St Jeor formülü ile hesaplama</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 lg:p-8">
                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${currentStep >= step.id
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-surface text-muted-foreground"
                                        }`}
                                >
                                    {currentStep > step.id ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <step.icon className="w-5 h-5" />
                                    )}
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div
                                        className={`w-12 lg:w-24 h-1 mx-1 rounded ${currentStep > step.id ? "bg-primary" : "bg-surface"
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <p className="text-center mt-4 text-sm text-muted-foreground">
                        Adım {currentStep}/8: {STEPS[currentStep - 1].title}
                    </p>
                </div>

                {/* Form Content */}
                <div className="glass-card p-6 lg:p-8">
                    <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                        {(() => {
                            const StepIcon = STEPS[currentStep - 1].icon;
                            return <StepIcon className="w-5 h-5 text-primary" />;
                        })()}
                        {STEPS[currentStep - 1].title}
                    </h2>

                    {renderStepContent()}

                    {/* Navigation */}
                    {currentStep < 8 && (
                        <div className="flex justify-between mt-8 pt-6 border-t border-border">
                            <Button
                                variant="ghost"
                                onClick={prevStep}
                                disabled={currentStep === 1}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Geri
                            </Button>
                            <Button
                                variant="neon"
                                onClick={nextStep}
                            >
                                {currentStep === 7 ? (
                                    <>
                                        <Calculator className="w-4 h-4 mr-2" />
                                        Hesapla
                                    </>
                                ) : (
                                    <>
                                        İleri
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CalorieCalculator;
