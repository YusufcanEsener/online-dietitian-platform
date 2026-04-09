import { Link } from "react-router-dom";
import { Leaf, ArrowLeft, Users, Target, Award, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/layout/Footer";

const About = () => {
    const team = [
        { name: "Dr. Ahmet Yılmaz", role: "Kurucu & CEO", image: "AY" },
        { name: "Dyt. Elif Kaya", role: "Baş Diyetisyen", image: "EK" },
        { name: "Mehmet Demir", role: "CTO", image: "MD" },
        { name: "Zeynep Öztürk", role: "Kullanıcı Deneyimi", image: "ZÖ" },
    ];

    const values = [
        { icon: Heart, title: "Sağlık Önceliğimiz", description: "Her bireyin sağlıklı yaşam hakkına inanıyoruz." },
        { icon: Users, title: "Uzman Kadro", description: "Sertifikalı diyetisyenlerle güvenilir danışmanlık." },
        { icon: Target, title: "Kişiselleştirme", description: "Her bireyin ihtiyacına özel beslenme programları." },
        { icon: Award, title: "Kalite", description: "En yüksek standartlarda hizmet sunuyoruz." },
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

            {/* Hero */}
            <section className="pt-32 pb-16 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                </div>
                <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
                    <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">Hakkımızda</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        DietPlatform, yapay zeka ve uzman diyetisyenleri bir araya getirerek
                        sağlıklı yaşamı herkes için erişilebilir kılan yenilikçi bir platformdur.
                    </p>
                </div>
            </section>

            {/* Mission */}
            <section className="py-16 bg-surface/50">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="glass-card p-8">
                                <h2 className="text-2xl font-bold text-foreground mb-4">Misyonumuz</h2>
                                <p className="text-muted-foreground">
                                    Teknoloji ve bilimin gücünü kullanarak, bireylerin beslenme alışkanlıklarını
                                    iyileştirmelerine yardımcı olmak ve sağlıklı yaşamı sürdürülebilir kılmak.
                                </p>
                            </div>
                            <div className="glass-card p-8">
                                <h2 className="text-2xl font-bold text-foreground mb-4">Vizyonumuz</h2>
                                <p className="text-muted-foreground">
                                    Türkiye'nin en güvenilir online beslenme danışmanlığı platformu olarak,
                                    yapay zeka destekli kişiselleştirilmiş sağlık çözümleri sunmak.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-16">
                <div className="container mx-auto px-4 lg:px-8">
                    <h2 className="text-3xl font-bold text-foreground text-center mb-12">Değerlerimiz</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {values.map((value, index) => (
                            <div key={index} className="glass-card p-6 text-center hover:neon-border transition-all">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <value.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                                <p className="text-sm text-muted-foreground">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-16 bg-surface/50">
                <div className="container mx-auto px-4 lg:px-8">
                    <h2 className="text-3xl font-bold text-foreground text-center mb-12">Ekibimiz</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                        {team.map((member, index) => (
                            <div key={index} className="glass-card p-6 text-center">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
                                    <span className="text-xl font-bold text-primary-foreground">{member.image}</span>
                                </div>
                                <h3 className="font-semibold text-foreground">{member.name}</h3>
                                <p className="text-sm text-muted-foreground">{member.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-16">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="glass-card p-8 lg:p-12">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                            <div>
                                <p className="text-3xl lg:text-4xl font-bold gradient-text">10,000+</p>
                                <p className="text-muted-foreground mt-2">Mutlu Kullanıcı</p>
                            </div>
                            <div>
                                <p className="text-3xl lg:text-4xl font-bold gradient-text">150+</p>
                                <p className="text-muted-foreground mt-2">Uzman Diyetisyen</p>
                            </div>
                            <div>
                                <p className="text-3xl lg:text-4xl font-bold gradient-text">50,000+</p>
                                <p className="text-muted-foreground mt-2">Oluşturulan Program</p>
                            </div>
                            <div>
                                <p className="text-3xl lg:text-4xl font-bold gradient-text">4.9</p>
                                <p className="text-muted-foreground mt-2">Ortalama Puan</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default About;
