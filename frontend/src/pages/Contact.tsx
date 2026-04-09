import { useState } from "react";
import { Link } from "react-router-dom";
import { Leaf, ArrowLeft, Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/layout/Footer";

const Contact = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.message) {
            toast({ title: "Hata", description: "Lütfen zorunlu alanları doldurun", variant: "destructive" });
            return;
        }

        setIsLoading(true);

        // Simüle edilmiş form gönderimi
        setTimeout(() => {
            toast({
                title: "Mesajınız Alındı",
                description: "En kısa sürede size dönüş yapacağız."
            });
            setFormData({ name: "", email: "", subject: "", message: "" });
            setIsLoading(false);
        }, 1500);
    };

    const contactInfo = [
        { icon: Mail, label: "E-posta", value: "info@dietplatform.com", href: "mailto:info@dietplatform.com" },
        { icon: Phone, label: "Telefon", value: "+90 (212) 123 45 67", href: "tel:+902121234567" },
        { icon: MapPin, label: "Adres", value: "İstanbul, Türkiye", href: null },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between h-16 lg:h-20">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-neon-gradient flex items-center justify-center neon-glow">
                                <Leaf className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <span className="text-xl font-bold gradient-text">DietPlatform</span>
                        </Link>
                        <Button variant="ghost" asChild>
                            <Link to="/" className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Ana Sayfa
                            </Link>
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="pt-32 pb-16">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">İletişim</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Sorularınız veya önerileriniz için bizimle iletişime geçin.
                            Size yardımcı olmaktan mutluluk duyarız.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
                        {/* Contact Form */}
                        <div className="glass-card p-8">
                            <h2 className="text-xl font-semibold text-foreground mb-6">Bize Yazın</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-foreground">Ad Soyad *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-12 mt-1 px-4 rounded-xl bg-surface border border-border focus:border-primary outline-none text-foreground"
                                        placeholder="Adınız Soyadınız"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground">E-posta *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full h-12 mt-1 px-4 rounded-xl bg-surface border border-border focus:border-primary outline-none text-foreground"
                                        placeholder="ornek@email.com"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground">Konu</label>
                                    <input
                                        type="text"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full h-12 mt-1 px-4 rounded-xl bg-surface border border-border focus:border-primary outline-none text-foreground"
                                        placeholder="Mesajınızın konusu"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-foreground">Mesaj *</label>
                                    <textarea
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full mt-1 px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-foreground resize-none"
                                        rows={5}
                                        placeholder="Mesajınızı buraya yazın..."
                                        disabled={isLoading}
                                    />
                                </div>
                                <Button type="submit" variant="neon" className="w-full h-12" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Gönderiliyor...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Mesaj Gönder
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-6">
                            <div className="glass-card p-8">
                                <h2 className="text-xl font-semibold text-foreground mb-6">İletişim Bilgileri</h2>
                                <div className="space-y-4">
                                    {contactInfo.map((info, index) => (
                                        <div key={index} className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <info.icon className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">{info.label}</p>
                                                {info.href ? (
                                                    <a href={info.href} className="text-foreground hover:text-primary transition-colors">
                                                        {info.value}
                                                    </a>
                                                ) : (
                                                    <p className="text-foreground">{info.value}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="glass-card p-8">
                                <h2 className="text-xl font-semibold text-foreground mb-4">Çalışma Saatleri</h2>
                                <div className="space-y-2 text-muted-foreground">
                                    <div className="flex justify-between">
                                        <span>Pazartesi - Cuma</span>
                                        <span className="text-foreground">09:00 - 18:00</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Cumartesi</span>
                                        <span className="text-foreground">10:00 - 14:00</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Pazar</span>
                                        <span className="text-foreground">Kapalı</span>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-8">
                                <h2 className="text-xl font-semibold text-foreground mb-4">Sık Sorulan Sorular</h2>
                                <p className="text-muted-foreground text-sm mb-4">
                                    Daha hızlı yanıt almak için SSS sayfamızı ziyaret edebilirsiniz.
                                </p>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link to="/#features">SSS'ye Git</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Contact;
