import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Calculator,
    Info,
    X,
    ArrowLeft,
    Flame,
    TrendingDown,
    TrendingUp,
    Scale,
    Save,
    Users,
    Check,
    Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import * as dietitianService from "@/services/dietitianDashboardService";
import { useNotifications } from "@/contexts/NotificationContext";

interface CalorieResult {
    who: number;
    harrisBenedict: number;
    mifflinStJeor: number;
    tdee: number;
    loseWeight: number;
    maintain: number;
    gainWeight: number;
    protein: number;
    carbs: number;
    fat: number;
}

interface MemberOption {
    id: string;
    full_name: string;
    email: string;
}

const DetailedCalorieCalculator = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { toast } = useToast();
    const { addNotification } = useNotifications();

    // Form state
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [age, setAge] = useState<number>(25);
    const [height, setHeight] = useState<number>(170);
    const [weight, setWeight] = useState<number>(70);
    const [activityLevel, setActivityLevel] = useState<number>(1.55);
    const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');

    // Results
    const [results, setResults] = useState<CalorieResult | null>(null);
    const [showHowItWorks, setShowHowItWorks] = useState(false);

    // Member selection
    const [members, setMembers] = useState<MemberOption[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [prefilledMemberName, setPrefilledMemberName] = useState<string | null>(null);

    // Load members and pre-fill from URL param
    useEffect(() => {
        const urlMemberId = searchParams.get("memberId");

        const loadMembers = async () => {
            try {
                const data = await dietitianService.getMyMembers();
                setMembers(data.map(m => ({
                    id: m.id,
                    full_name: m.full_name || "İsimsiz",
                    email: m.email
                })));
            } catch (error) {
                console.error("Members could not be loaded:", error);
            }
        };

        const prefillMemberData = async (memberId: string) => {
            try {
                const detail = await dietitianService.getMemberDetail(memberId);
                if (detail.gender === 'male' || detail.gender === 'female') {
                    setGender(detail.gender);
                }
                if (detail.birth_date) {
                    const birthYear = new Date(detail.birth_date).getFullYear();
                    const currentYear = new Date().getFullYear();
                    setAge(currentYear - birthYear);
                }
                if (detail.height) setHeight(detail.height);
                if (detail.weight) setWeight(detail.weight);
                setSelectedMemberId(memberId);
                setPrefilledMemberName(detail.full_name || null);
            } catch (error) {
                console.error("Member detail could not be loaded:", error);
            }
        };

        loadMembers();
        if (urlMemberId) {
            prefillMemberData(urlMemberId);
        }
    }, [searchParams]);

    const handleSaveToMember = async () => {
        if (!selectedMemberId || !results) {
            toast({ title: "Hata", description: "Lütfen bir danışan seçin", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            const targetCalories = goal === 'lose' ? results.loseWeight : goal === 'gain' ? results.gainWeight : results.maintain;
            const proteinPercent = goal === 'gain' ? 0.30 : 0.25;
            const carbPercent = goal === 'lose' ? 0.35 : 0.40;
            const fatPercent = goal === 'lose' ? 0.40 : 0.35;

            await dietitianService.saveMemberCalories(selectedMemberId, {
                bmr: Math.round((results.who + results.harrisBenedict + results.mifflinStJeor) / 3),
                tdee: results.tdee,
                target_calories: targetCalories,
                protein: Math.round((targetCalories * proteinPercent) / 4),
                carbs: Math.round((targetCalories * carbPercent) / 4),
                fat: Math.round((targetCalories * fatPercent) / 9),
                goal: goal
            });

            setIsSaved(true);
            const memberName = members.find(m => m.id === selectedMemberId)?.full_name || 'Danışan';
            toast({ title: "Başarılı", description: "Kalori bilgileri danışana kaydedildi" });
            addNotification({
                title: '🔥 Kalori Hesabı Kaydedildi',
                message: `${memberName} için günlük kalori hedefi belirlendi: ${goal === 'lose' ? results.loseWeight : goal === 'gain' ? results.gainWeight : results.maintain} kcal`,
                type: 'success'
            });
            setTimeout(() => setIsSaved(false), 3000);
        } catch (error) {
            console.error("Save error:", error);
            toast({ title: "Hata", description: "Kaydetme başarısız oldu", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const activityOptions = [
        { value: 1.2, label: "Sedanter", desc: "Ofis işi, hareketsiz yaşam" },
        { value: 1.375, label: "Hafif Aktif", desc: "Hafif egzersiz (haftada 1-3 gün)" },
        { value: 1.55, label: "Orta Aktif", desc: "Düzenli egzersiz (haftada 3-5 gün)" },
        { value: 1.725, label: "Çok Aktif", desc: "Yoğun egzersiz (haftada 6-7 gün)" },
        { value: 1.9, label: "Ekstra Aktif", desc: "Çok ağır egzersiz veya fiziksel iş" }
    ];

    const calculateCalories = () => {
        // WHO Formula (from Uçar & Çiçek 2025 paper)
        const whoConstant = gender === 'male' ? 1 : 0.95;
        const whoBMR = weight * whoConstant * 24;

        // Harris-Benedict Formula
        let harrisBenedictBMR: number;
        if (gender === 'male') {
            harrisBenedictBMR = 66.5 + (13.75 * weight) + (5.003 * height) - (6.755 * age);
        } else {
            harrisBenedictBMR = 655.1 + (9.563 * weight) + (1.850 * height) - (4.676 * age);
        }

        // Mifflin-St Jeor Formula
        let mifflinBMR: number;
        if (gender === 'male') {
            mifflinBMR = (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else {
            mifflinBMR = (10 * weight) + (6.25 * height) - (5 * age) - 161;
        }

        // Average BMR for TDEE calculation
        const avgBMR = (whoBMR + harrisBenedictBMR + mifflinBMR) / 3;
        const tdee = Math.round(avgBMR * activityLevel);

        // Goal calories
        const loseWeight = Math.round(tdee * 0.85); // -15%
        const maintain = tdee;
        const gainWeight = Math.round(tdee * 1.15); // +15%

        // Macro distribution based on goal
        let targetCalories = goal === 'lose' ? loseWeight : goal === 'gain' ? gainWeight : maintain;
        const proteinPercent = goal === 'gain' ? 0.30 : 0.25;
        const carbPercent = goal === 'lose' ? 0.35 : 0.40;
        const fatPercent = goal === 'lose' ? 0.40 : 0.35;

        const protein = Math.round((targetCalories * proteinPercent) / 4);
        const carbs = Math.round((targetCalories * carbPercent) / 4);
        const fat = Math.round((targetCalories * fatPercent) / 9);

        setResults({
            who: Math.round(whoBMR),
            harrisBenedict: Math.round(harrisBenedictBMR),
            mifflinStJeor: Math.round(mifflinBMR),
            tdee,
            loseWeight,
            maintain,
            gainWeight,
            protein,
            carbs,
            fat
        });
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
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                            <Calculator className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Detaylı Kalori Hesaplayıcı</h1>
                            <p className="text-sm text-muted-foreground">Bilimsel formüllerle günlük kalori ihtiyacınız</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setShowHowItWorks(true)}
                        className="gap-2"
                    >
                        <Info className="w-4 h-4" />
                        Nasıl Çalışır?
                    </Button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 lg:p-8 space-y-6">
                {/* Input Form */}
                <div className="glass-card p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">Kişisel Bilgiler</h2>
                        {prefilledMemberName && (
                            <span className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                <Users className="w-3.5 h-3.5" />
                                {prefilledMemberName} verileri yüklendi
                            </span>
                        )}
                    </div>

                    {/* Gender */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">Cinsiyet</label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setGender('male')}
                                className={`flex-1 p-4 rounded-xl border-2 transition-all ${gender === 'male'
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <span className="text-2xl mb-1">👨</span>
                                <p className="font-medium">Erkek</p>
                            </button>
                            <button
                                onClick={() => setGender('female')}
                                className={`flex-1 p-4 rounded-xl border-2 transition-all ${gender === 'female'
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <span className="text-2xl mb-1">👩</span>
                                <p className="font-medium">Kadın</p>
                            </button>
                        </div>
                    </div>

                    {/* Age, Height, Weight */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">Yaş</label>
                            <input
                                type="number"
                                value={age}
                                onChange={(e) => setAge(Number(e.target.value))}
                                className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:outline-none text-foreground text-center text-lg font-semibold"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">Boy (cm)</label>
                            <input
                                type="number"
                                value={height}
                                onChange={(e) => setHeight(Number(e.target.value))}
                                className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:outline-none text-foreground text-center text-lg font-semibold"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">Kilo (kg)</label>
                            <input
                                type="number"
                                value={weight}
                                onChange={(e) => setWeight(Number(e.target.value))}
                                className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:outline-none text-foreground text-center text-lg font-semibold"
                            />
                        </div>
                    </div>

                    {/* Activity Level */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">Aktivite Düzeyi</label>
                        <div className="space-y-2">
                            {activityOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setActivityLevel(option.value)}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${activityLevel === option.value
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-foreground">{option.label}</p>
                                            <p className="text-sm text-muted-foreground">{option.desc}</p>
                                        </div>
                                        <span className="text-sm font-mono text-muted-foreground">×{option.value}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button
                        variant="neon"
                        className="w-full py-6 text-lg"
                        onClick={calculateCalories}
                    >
                        <Flame className="w-5 h-5 mr-2" />
                        Hesapla
                    </Button>
                </div>

                {/* Results */}
                {results && (
                    <div className="space-y-6">
                        {/* BMR Results */}
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4">📊 Bazal Metabolizma Hızı (BMR)</h2>
                            <p className="text-sm text-muted-foreground mb-4">
                                Vücudunuzun dinlenme halinde harcadığı enerji miktarı (3 farklı formül)
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
                                    <p className="text-sm text-blue-400 mb-1">WHO</p>
                                    <p className="text-2xl font-bold text-blue-500">{results.who}</p>
                                    <p className="text-xs text-muted-foreground">kcal/gün</p>
                                </div>
                                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center">
                                    <p className="text-sm text-purple-400 mb-1">Harris-Benedict</p>
                                    <p className="text-2xl font-bold text-purple-500">{results.harrisBenedict}</p>
                                    <p className="text-xs text-muted-foreground">kcal/gün</p>
                                </div>
                                <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/30 text-center">
                                    <p className="text-sm text-pink-400 mb-1">Mifflin-St Jeor</p>
                                    <p className="text-2xl font-bold text-pink-500">{results.mifflinStJeor}</p>
                                    <p className="text-xs text-muted-foreground">kcal/gün</p>
                                </div>
                            </div>
                        </div>

                        {/* TDEE */}
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4">🎯 Günlük Toplam Enerji İhtiyacı (TDEE)</h2>
                            <div className="text-center p-6 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30">
                                <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                                <p className="text-4xl font-bold text-orange-500">{results.tdee}</p>
                                <p className="text-muted-foreground">kcal/gün</p>
                            </div>
                        </div>

                        {/* Goal Selection */}
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4">🎯 Hedefinizi Seçin</h2>
                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    onClick={() => setGoal('lose')}
                                    className={`p-4 rounded-xl border-2 text-center transition-all ${goal === 'lose'
                                        ? 'border-red-500 bg-red-500/10'
                                        : 'border-border hover:border-red-500/50'
                                        }`}
                                >
                                    <TrendingDown className="w-6 h-6 text-red-500 mx-auto mb-2" />
                                    <p className="font-medium text-foreground">Kilo Ver</p>
                                    <p className="text-2xl font-bold text-red-500">{results.loseWeight}</p>
                                    <p className="text-xs text-muted-foreground">kcal/gün</p>
                                </button>
                                <button
                                    onClick={() => setGoal('maintain')}
                                    className={`p-4 rounded-xl border-2 text-center transition-all ${goal === 'maintain'
                                        ? 'border-yellow-500 bg-yellow-500/10'
                                        : 'border-border hover:border-yellow-500/50'
                                        }`}
                                >
                                    <Scale className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                                    <p className="font-medium text-foreground">Koru</p>
                                    <p className="text-2xl font-bold text-yellow-500">{results.maintain}</p>
                                    <p className="text-xs text-muted-foreground">kcal/gün</p>
                                </button>
                                <button
                                    onClick={() => setGoal('gain')}
                                    className={`p-4 rounded-xl border-2 text-center transition-all ${goal === 'gain'
                                        ? 'border-green-500 bg-green-500/10'
                                        : 'border-border hover:border-green-500/50'
                                        }`}
                                >
                                    <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                                    <p className="font-medium text-foreground">Kilo Al</p>
                                    <p className="text-2xl font-bold text-green-500">{results.gainWeight}</p>
                                    <p className="text-xs text-muted-foreground">kcal/gün</p>
                                </button>
                            </div>
                        </div>

                        {/* Macro Distribution */}
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4">📋 Makro Besin Dağılımı</h2>
                            <p className="text-sm text-muted-foreground mb-4">
                                {goal === 'lose' ? 'Kilo vermek' : goal === 'gain' ? 'Kilo almak' : 'Kilo korumak'} için önerilen günlük makro değerleri:
                            </p>
                            {(() => {
                                const targetCalories = goal === 'lose' ? results.loseWeight : goal === 'gain' ? results.gainWeight : results.maintain;
                                const proteinPercent = goal === 'gain' ? 0.30 : 0.25;
                                const carbPercent = goal === 'lose' ? 0.35 : 0.40;
                                const fatPercent = goal === 'lose' ? 0.40 : 0.35;

                                const protein = Math.round((targetCalories * proteinPercent) / 4);
                                const carbs = Math.round((targetCalories * carbPercent) / 4);
                                const fat = Math.round((targetCalories * fatPercent) / 9);

                                return (
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 rounded-xl bg-red-500/10 text-center">
                                            <p className="text-sm text-red-400 mb-1">Protein</p>
                                            <p className="text-2xl font-bold text-red-500">{protein}g</p>
                                            <p className="text-xs text-muted-foreground">%{Math.round(proteinPercent * 100)}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-yellow-500/10 text-center">
                                            <p className="text-sm text-yellow-400 mb-1">Karbonhidrat</p>
                                            <p className="text-2xl font-bold text-yellow-500">{carbs}g</p>
                                            <p className="text-xs text-muted-foreground">%{Math.round(carbPercent * 100)}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-blue-500/10 text-center">
                                            <p className="text-sm text-blue-400 mb-1">Yağ</p>
                                            <p className="text-2xl font-bold text-blue-500">{fat}g</p>
                                            <p className="text-xs text-muted-foreground">%{Math.round(fatPercent * 100)}</p>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Save to Member Section */}
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4">💾 Danışana Kaydet</h2>
                            <p className="text-sm text-muted-foreground mb-4">
                                Hesaplanan kalori ve makro bilgilerini bir danışanınıza kaydedin.
                                Bu bilgiler beslenme programı oluştururken otomatik olarak görünecektir.
                            </p>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <select
                                        value={selectedMemberId}
                                        onChange={(e) => setSelectedMemberId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:outline-none text-foreground"
                                    >
                                        <option value="">Danışan seçin...</option>
                                        {members.map((member) => (
                                            <option key={member.id} value={member.id}>
                                                {member.full_name} ({member.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Button
                                    variant="neon"
                                    onClick={handleSaveToMember}
                                    disabled={!selectedMemberId || isSaving}
                                    className="min-w-[150px]"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Kaydediliyor...
                                        </>
                                    ) : isSaved ? (
                                        <>
                                            <Check className="w-4 h-4 mr-2" />
                                            Kaydedildi!
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Kaydet
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* How It Works Modal */}
            {showHowItWorks && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="glass-card w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-card p-4 border-b border-border flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-foreground">📚 Nasıl Çalışır?</h2>
                            <Button variant="ghost" size="icon" onClick={() => setShowHowItWorks(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="p-6 space-y-6">
                            <section>
                                <h3 className="font-semibold text-foreground mb-2">1. Bazal Metabolizma Hızı (BMR)</h3>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Vücudunuzun hiç hareket etmeden, sadece yaşamsal faaliyetleri (nefes alma, kalp atışı, hücre yenilenmesi) sürdürmek için harcadığı enerjidir.
                                </p>
                                <div className="space-y-3 bg-surface p-4 rounded-xl">
                                    <div>
                                        <p className="text-sm font-medium text-blue-400">WHO Formülü (Uçar & Çiçek, 2025):</p>
                                        <code className="text-xs text-foreground">Erkek: BMR = Kilo × 1 × 24</code><br />
                                        <code className="text-xs text-foreground">Kadın: BMR = Kilo × 0.95 × 24</code>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-purple-400">Harris-Benedict (1919):</p>
                                        <code className="text-xs text-foreground">Erkek: 66.5 + (13.75 × Kilo) + (5.003 × Boy) - (6.755 × Yaş)</code><br />
                                        <code className="text-xs text-foreground">Kadın: 655.1 + (9.563 × Kilo) + (1.850 × Boy) - (4.676 × Yaş)</code>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-pink-400">Mifflin-St Jeor (1990):</p>
                                        <code className="text-xs text-foreground">Erkek: (10 × Kilo) + (6.25 × Boy) - (5 × Yaş) + 5</code><br />
                                        <code className="text-xs text-foreground">Kadın: (10 × Kilo) + (6.25 × Boy) - (5 × Yaş) - 161</code>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="font-semibold text-foreground mb-2">2. Fiziksel Aktivite Faktörü (PAL)</h3>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Günlük aktivite düzeyinize göre BMR'yi çarpan bir katsayıdır.
                                </p>
                                <div className="bg-surface p-4 rounded-xl">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-muted-foreground">
                                                <th className="text-left py-1">Düzey</th>
                                                <th className="text-right py-1">Çarpan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-foreground">
                                            <tr><td>Sedanter</td><td className="text-right">×1.2</td></tr>
                                            <tr><td>Hafif Aktif</td><td className="text-right">×1.375</td></tr>
                                            <tr><td>Orta Aktif</td><td className="text-right">×1.55</td></tr>
                                            <tr><td>Çok Aktif</td><td className="text-right">×1.725</td></tr>
                                            <tr><td>Ekstra Aktif</td><td className="text-right">×1.9</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section>
                                <h3 className="font-semibold text-foreground mb-2">3. Toplam Günlük Enerji Harcaması (TDEE)</h3>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Günlük tüm aktiviteleriniz dahil toplam harcadığınız enerjidir.
                                </p>
                                <div className="bg-surface p-4 rounded-xl">
                                    <code className="text-foreground">TDEE = BMR × PAL</code>
                                </div>
                            </section>

                            <section>
                                <h3 className="font-semibold text-foreground mb-2">4. Hedef Kalorileri</h3>
                                <div className="bg-surface p-4 rounded-xl space-y-2">
                                    <p className="text-sm"><span className="text-red-400">Kilo Vermek:</span> TDEE × 0.85 (-%15 kalori açığı)</p>
                                    <p className="text-sm"><span className="text-yellow-400">Korumak:</span> TDEE (değişiklik yok)</p>
                                    <p className="text-sm"><span className="text-green-400">Kilo Almak:</span> TDEE × 1.15 (+%15 kalori fazlası)</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="font-semibold text-foreground mb-2">5. Makro Besin Dağılımı</h3>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Kalorilerin besin gruplarına dağılımı:
                                </p>
                                <div className="bg-surface p-4 rounded-xl space-y-2 text-sm">
                                    <p><span className="text-red-400">Protein:</span> 1g = 4 kcal</p>
                                    <p><span className="text-yellow-400">Karbonhidrat:</span> 1g = 4 kcal</p>
                                    <p><span className="text-blue-400">Yağ:</span> 1g = 9 kcal</p>
                                </div>
                            </section>

                            <div className="text-xs text-muted-foreground border-t border-border pt-4">
                                <p>📚 Kaynak: Uçar, Z., & Çiçek, B. (2025). Estimation of daily energy requirements using a hybrid artificial intelligence model. Scientific Reports, 15, 38882.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetailedCalorieCalculator;
