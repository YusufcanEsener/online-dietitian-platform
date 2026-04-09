import { Link } from "react-router-dom";
import { Leaf, Mail, MapPin, Phone, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-surface/50 border-t border-border">
            <div className="container mx-auto px-4 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Logo ve Açıklama */}
                    <div className="space-y-4">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-neon-gradient flex items-center justify-center">
                                <Leaf className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <span className="text-xl font-bold gradient-text">DietPlatform</span>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            Yapay zeka destekli kişisel beslenme danışmanlığı platformu.
                            Uzman diyetisyenlerle sağlıklı yaşama adım atın.
                        </p>
                        {/* Sosyal Medya */}
                        <div className="flex items-center gap-3">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                                className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                                <Facebook className="w-4 h-4" />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                                className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                                className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                                <Instagram className="w-4 h-4" />
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                                className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                                <Linkedin className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Hızlı Linkler */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Hızlı Linkler</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/#features" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    Özellikler
                                </Link>
                            </li>
                            <li>
                                <Link to="/#how-it-works" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    Nasıl Çalışır
                                </Link>
                            </li>
                            <li>
                                <Link to="/messages" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    Mesajlar
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    Hakkımızda
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    İletişim
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Yasal */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Yasal</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    Kullanım Şartları
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    Gizlilik Politikası
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy#kvkk" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    KVKK Aydınlatma Metni
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy#cookies" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    Çerez Politikası
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* İletişim */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">İletişim</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <Mail className="w-4 h-4 text-primary mt-0.5" />
                                <a href="mailto:info@dietplatform.com" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    info@dietplatform.com
                                </a>
                            </li>
                            <li className="flex items-start gap-3">
                                <Phone className="w-4 h-4 text-primary mt-0.5" />
                                <a href="tel:+902121234567" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    +90 (212) 123 45 67
                                </a>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                                <span className="text-sm text-muted-foreground">
                                    İstanbul, Türkiye
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Alt Kısım */}
                <div className="mt-12 pt-8 border-t border-border">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">
                            © {currentYear} DietPlatform. Tüm hakları saklıdır.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Agentic AI ile güçlendirilmiştir 🤖
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
