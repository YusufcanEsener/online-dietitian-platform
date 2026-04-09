import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Leaf,
  Brain,
  Users,
  TrendingUp,
  MessageSquare,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Star,
  User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/layout/Footer";

const features = [
  {
    icon: Brain,
    title: "Agentic AI Desteği",
    description: "Yapay zeka destekli kişiselleştirilmiş beslenme önerileri ve günlük sağlık analizleri."
  },
  {
    icon: Users,
    title: "Uzman Diyetisyenler",
    description: "Alanında uzman, sertifikalı diyetisyenlerle birebir online görüşme imkanı."
  },
  {
    icon: TrendingUp,
    title: "İlerleme Takibi",
    description: "Detaylı grafikler ve istatistiklerle kilo ve sağlık hedeflerinizi takip edin."
  },
  {
    icon: MessageSquare,
    title: "7/24 Destek",
    description: "Diyetisyeninizle anlık mesajlaşma ve kesintisiz iletişim."
  },
  {
    icon: Shield,
    title: "Güvenli Veri",
    description: "Tüm sağlık verileriniz şifreli ve güvenle saklanır."
  },
  {
    icon: Sparkles,
    title: "Kişisel Planlar",
    description: "Size özel beslenme ve egzersiz programları."
  }
];

const steps = [
  { step: 1, title: "Kayıt Olun", description: "Hızlı ve kolay üyelik oluşturun" },
  { step: 2, title: "Mesaj Atın", description: "Diyetisyeninizle iletişime geçin" },
  { step: 3, title: "Hedefe Ulaşın", description: "Kişisel planınızla sonuç alın" }
];

const testimonials = [
  { name: "Ayşe K.", role: "3 ayda 12 kg verdi", rating: 5, text: "DietPlatform sayesinde hayatım değişti!" },
  { name: "Mehmet Y.", role: "Sporcu Beslenmesi", rating: 5, text: "Antrenörüm kadar etkili bir platform." },
  { name: "Zeynep B.", role: "Hamilelik Diyeti", rating: 5, text: "Güvenilir ve profesyonel destek aldım." }
];

const Landing = () => {
  const { isAuthenticated, user } = useAuth();
  const initials = user?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?";

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neon-gradient flex items-center justify-center neon-glow">
                <Leaf className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text">DietPlatform</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Özellikler</a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">Nasıl Çalışır</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Yorumlar</a>
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-foreground">{initials}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground hidden sm:inline">Dashboard</span>
                </Link>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link to="/login">Giriş Yap</Link>
                  </Button>
                  <Button variant="neon" asChild>
                    <Link to="/register">Ücretsiz Başla</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>


      {/* Hero Section */}
      <section className="relative pt-32 lg:pt-40 pb-20 lg:pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30 mb-8 animate-slide-up">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Agentic AI Beslenme Uzmanı</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-foreground mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Sağlıklı Yaşama{" "}
              <span className="gradient-text">İlk Adımı</span>{" "}
              At
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              Yapay zeka destekli kişisel beslenme danışmanlığı ile hedeflerinize ulaşın.
              Uzman diyetisyenler, akıllı takip ve 7/24 destek bir arada.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <Button variant="hero" size="xl" asChild>
                <Link to="/dashboard" className="flex items-center gap-2">
                  Hemen Başla
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="glass" size="lg" asChild>
                <Link to="/messages">Mesajlaşmaya Başla</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto animate-fade-in" style={{ animationDelay: "0.5s" }}>
              <div className="text-center">
                <p className="text-3xl lg:text-4xl font-bold gradient-text">10K+</p>
                <p className="text-sm text-muted-foreground mt-1">Mutlu Kullanıcı</p>
              </div>
              <div className="text-center">
                <p className="text-3xl lg:text-4xl font-bold gradient-text">1</p>
                <p className="text-sm text-muted-foreground mt-1">Uzman Diyetisyen</p>
              </div>
              <div className="text-center">
                <p className="text-3xl lg:text-4xl font-bold gradient-text">4.9</p>
                <p className="text-sm text-muted-foreground mt-1">Ortalama Puan</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">Nasıl Çalışır?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">3 kolay adımda sağlıklı yaşam yolculuğunuza başlayın</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((item, index) => (
              <div key={item.step} className="relative group">
                <div className="glass-card p-8 text-center hover:neon-border transition-all duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-neon-gradient flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl font-bold text-primary-foreground">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>

                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-primary/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-32 bg-surface/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">Özellikler</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Size özel hazırlanmış tüm araçlar bir arada</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="glass-card p-6 hover:neon-border transition-all duration-300 group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">Kullanıcı Yorumları</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Binlerce mutlu kullanıcımızın deneyimleri</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="glass-card p-6">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground mb-4">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-foreground">
                      {testimonial.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl p-8 lg:p-16 text-center">
            <div className="absolute inset-0 bg-neon-gradient opacity-10" />
            <div className="absolute inset-0 glass" />

            <div className="relative z-10">
              <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
                Sağlıklı Yaşama Başlamaya Hazır mısın?
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
                Ücretsiz hesabınızı oluşturun ve yapay zeka destekli beslenme danışmanlığının gücünü keşfedin.
              </p>
              <Button variant="hero" size="xl" asChild>
                <Link to="/dashboard" className="flex items-center gap-2">
                  Ücretsiz Başla
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing;
