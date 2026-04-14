import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, 
    BarChart3, 
    Users, 
    FileText, 
    MessageSquare, 
    Zap,
    BriefcaseMedical
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
    {
        id: 1,
        title: "İstatistiklere Hakim Olun",
        description: "Anasayfanız olan Dashboard, profesyonel merkezinizdir. Toplam danışan sayınız, aktif programlar ve sistemdeki genel skorunuzu tek bir bakışta buradan yönetebilirsiniz.",
        icon: BarChart3,
        location: "Dashboard (Genel Bakış)",
        color: "text-blue-400",
        bg: "bg-blue-400/10",
        border: "border-blue-400/30"
    },
    {
        id: 2,
        title: "Danışanlarınızı İnceleyin",
        description: "Sisteme size güvenerek katılmış tüm kişileri listeleyin. Üyelerinizin günlük ne kadar su/kalori harcadığını görmek platform üzerinden sadece bir tık uzağınızda ('Detay' butonunda).",
        icon: Users,
        location: "Danışanlarım Sekmesi",
        color: "text-indigo-400",
        bg: "bg-indigo-400/10",
        border: "border-indigo-400/30"
    },
    {
        id: 3,
        title: "Beslenme Programı Oluşturun",
        description: "En kritik adım: Seçtiğiniz üye için Öğün bazlı (Kahvaltı, Akşam vb.) listeler atayın. Belirlediğiniz menüler anında hesaplanıp üyenin platformunda hedef kalori olarak görünür.",
        icon: FileText,
        location: "Üye Detayı > Program Oluştur",
        color: "text-green-400",
        bg: "bg-green-400/10",
        border: "border-green-400/30"
    },
    {
        id: 4,
        title: "Aktif İletişimde Kalın",
        description: "Mesajlar sekmesiyle hastalarınıza anlık destek sunun. Sistem, soru soran danışanlarla aranızda güvenli ve şifreli bir iletişim kanalı yaratır.",
        icon: MessageSquare,
        location: "Mesajlar Sayfası",
        color: "text-purple-400",
        bg: "bg-purple-400/10",
        border: "border-purple-400/30"
    },
    {
        id: 5,
        title: "Yapay Zeka Desteği Alın",
        description: "Agentic AI ve Detaylı Kalori özellikleriyle otonom bir asistanı yanınızda hissedin. n8n verilerinden gelen günlük raporları okuyun ve vakit kazanın.",
        icon: Zap,
        location: "Agentic AI Ana Menüsü",
        color: "text-orange-400",
        bg: "bg-orange-400/10",
        border: "border-orange-400/30"
    }
];

const DietitianGuide = () => {
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
                                <BriefcaseMedical className="w-5 h-5 text-primary" />
                                Uzman Rehberi
                            </h1>
                            <p className="text-sm text-muted-foreground">Diyetisyen Paneli Kullanım Akışı</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 lg:p-12">
                {/* Hero Skeleton Concept */}
                <div className="relative overflow-hidden rounded-3xl glass-card border border-primary/20 p-8 lg:p-12 mb-12 text-center">
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />
                    
                    <div className="relative z-10 space-y-4">
                        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
                            <BriefcaseMedical className="w-8 h-8 text-primary animate-pulse" />
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
                            Dijital Kliniğinize <span className="gradient-text">Hoş Geldiniz</span>
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Danışanlarınızı dijital ortamda en verimli şekilde yönetmek, onlara profesyonel programlar atamak ve yapay zeka ile raporları incelemek için bu dikey rehberi izleyin.
                        </p>
                    </div>
                </div>

                {/* Vertical Stepper */}
                <div className="relative">
                    {/* The glowing vertical line */}
                    <div className="absolute left-[24px] lg:left-[39px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary/50 via-purple-500/30 to-transparent rounded-full" />

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
                        className="w-full sm:w-auto relative z-10 shadow-[0_0_20px_rgba(var(--primary),0.5)]"
                        onClick={() => navigate('/dietitian-dashboard')}
                    >
                        Panelime Geçiş Yap
                    </Button>
                    <p className="mt-4 text-sm text-muted-foreground">İlk danışanınızı incelemek için devam edin.</p>
                </div>
            </main>
        </div>
    );
};

export default DietitianGuide;
