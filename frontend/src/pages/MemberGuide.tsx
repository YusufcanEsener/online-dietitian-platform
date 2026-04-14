import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, 
    UserCircle, 
    Calculator, 
    Activity, 
    MessageSquare, 
    TrendingUp,
    HeartPulse
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
    {
        id: 1,
        title: "Profilinizi Doldurun",
        description: "Sistem ilk olarak kilonuzu, boyunuzu ve hareket seviyenizi bilmelidir. Bunları eksiksiz girmek diyetisyenin veya yapay zekanın sizi tanımasını sağlar.",
        icon: UserCircle,
        location: "Kişisel Bilgiler (Profil)",
        color: "text-blue-400",
        bg: "bg-blue-400/10",
        border: "border-blue-400/30"
    },
    {
        id: 2,
        title: "Günlük Kalorinizi Hesaplayın",
        description: "Amacınızın bilimsel formüllerle döküldüğü yerdir. Bu sayfa sayesinde vücudunuzun bazal metabolizma ve günlük kalori ihtiyacını (Mifflin-St Jeor) net olarak belirleriz.",
        icon: Calculator,
        location: "Kalori Hesapla Butonu",
        color: "text-orange-400",
        bg: "bg-orange-400/10",
        border: "border-orange-400/30"
    },
    {
        id: 3,
        title: "Günlük Tüketimi İşleyin",
        description: "Gün içindeki makro/kalori hedeflerinizi anasayfadan güncellersiniz. Gün boyunca 'Su Tüketimi' bardak butonlarıyla (+) kolayca içtiğiniz suları kaydedersiniz.",
        icon: Activity,
        location: "Ana Sayfa (Dashboard)",
        color: "text-green-400",
        bg: "bg-green-400/10",
        border: "border-green-400/30"
    },
    {
        id: 4,
        title: "Diyetisyeninize Danışın",
        description: "Size özel atanmış diyetisyeninle birebir şifreli mesajlaşın. Programlarınız eklendiğinde doğrudan panelinizde yönlendirilir ve hedeflerinizi ortak belirlersiniz.",
        icon: MessageSquare,
        location: "Mesajlar Sayfası",
        color: "text-purple-400",
        bg: "bg-purple-400/10",
        border: "border-purple-400/30"
    },
    {
        id: 5,
        title: "Gelişimi Gözlemleyin",
        description: "Tarihsel olarak girdiğiniz vücut ağırlıklarınızın istatistiksel grafiğini sunar. Hedef kilonuza ne kadar yaklaştığınızı her gün beraber heyecanla takip ediyoruz!",
        icon: TrendingUp,
        location: "İlerleme Sayfası",
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/30"
    }
];

const MemberGuide = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-30 glass border-b border-border/50 px-4 lg:px-8 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <HeartPulse className="w-5 h-5 text-primary" />
                                Kullanıcı Rehberi
                            </h1>
                            <p className="text-sm text-muted-foreground">Adım adım DietPlatform kullanımı</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 lg:p-12">
                {/* Hero Skeleton Concept */}
                <div className="relative overflow-hidden rounded-3xl glass-card border border-primary/20 p-8 lg:p-12 mb-12 text-center">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
                    
                    <div className="relative z-10 space-y-4">
                        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                            <HeartPulse className="w-8 h-8 text-primary animate-pulse" />
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
                            Platforma <span className="gradient-text">Hoş Geldiniz</span>
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Sağlıklı yaşama giden yolda ilk adımınızı attınız! Platformumuzu etkili kullanıp, maksimum verim almak için sizin için hazırladığımız bu kısa rehberi inceleyin.
                        </p>
                    </div>
                </div>

                {/* Vertical Stepper */}
                <div className="relative">
                    {/* The glowing vertical line */}
                    <div className="absolute left-[24px] lg:left-[39px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary/50 via-accent/30 to-transparent rounded-full" />

                    <div className="space-y-8 relative z-10">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="group relative flex gap-6 lg:gap-8 items-start">
                                {/* Step Icon Indicator */}
                                <div className={cn(
                                    "relative flex-shrink-0 w-12 h-12 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center transition-all duration-300",
                                    "glass shadow-lg border group-hover:scale-[1.05] group-hover:shadow-[0_0_20px_rgba(var(--primary),0.3)]",
                                    step.bg, step.border
                                )}>
                                    <step.icon className={cn("w-6 h-6 lg:w-10 lg:h-10", step.color)} />
                                    {/* Number Badge */}
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-background rounded-full border border-border flex items-center justify-center text-xs font-bold text-foreground">
                                        {step.id}
                                    </div>
                                </div>

                                {/* Step Info Card */}
                                <div className="flex-1 glass-card p-6 lg:p-8 transition-all duration-300 group-hover:-translate-y-1 hover:shadow-xl border border-border/50 group-hover:border-primary/30">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="px-2.5 py-1 rounded-md bg-surface text-xs font-semibold text-muted-foreground border border-border/50 uppercase tracking-wider">
                                            {step.location}
                                        </div>
                                    </div>
                                    <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-3">
                                        {step.title}
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Go to Dashboard */}
                <div className="mt-16 text-center">
                    <Button 
                        variant="hero" 
                        size="xl" 
                        className="w-full sm:w-auto relative z-10"
                        onClick={() => navigate('/dashboard')}
                    >
                        Hadi Başlayalım
                    </Button>
                    <p className="mt-4 text-sm text-muted-foreground">İlk öğününüzü eklemek için Ana Sayfa'ya dönün.</p>
                </div>
            </main>
        </div>
    );
};

export default MemberGuide;
