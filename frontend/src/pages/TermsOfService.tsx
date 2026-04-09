import { Link } from "react-router-dom";
import { Leaf, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/layout/Footer";

const TermsOfService = () => {
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
            <main className="pt-24 pb-16">
                <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
                    <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-8">Kullanım Şartları</h1>

                    <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
                        <p className="text-sm">Son güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">1. Genel Hükümler</h2>
                            <p>
                                Bu Kullanım Şartları, DietPlatform web sitesi ve mobil uygulamasının (bundan böyle "Platform" olarak anılacaktır) kullanımını düzenler. Platforma erişerek veya kullanarak, bu şartları kabul etmiş sayılırsınız.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">2. Hizmet Tanımı</h2>
                            <p>
                                DietPlatform, kullanıcıları sertifikalı diyetisyenlerle buluşturan ve yapay zeka destekli beslenme önerileri sunan bir online beslenme danışmanlığı platformudur. Platform üzerinden:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Uzman diyetisyenlerle online görüşme yapabilirsiniz</li>
                                <li>Kişiselleştirilmiş beslenme programları alabilirsiniz</li>
                                <li>Günlük beslenme ve sağlık takibinizi yapabilirsiniz</li>
                                <li>AI destekli beslenme önerileri alabilirsiniz</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">3. Üyelik ve Hesap</h2>
                            <p>
                                Platform'a üye olmak için 18 yaşından büyük olmanız gerekmektedir. Hesabınızla ilgili tüm aktivitelerden siz sorumlusunuz. Şifrenizi güvenli tutmalı ve başkalarıyla paylaşmamalısınız.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">4. Kullanıcı Yükümlülükleri</h2>
                            <p>Platform kullanıcıları olarak:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Doğru ve güncel bilgi sağlamayı kabul edersiniz</li>
                                <li>Platform'u yasalara uygun şekilde kullanmayı taahhüt edersiniz</li>
                                <li>Diğer kullanıcılara saygılı davranmayı kabul edersiniz</li>
                                <li>Platform güvenliğini tehlikeye atacak eylemlerden kaçınmayı taahhüt edersiniz</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">5. Sağlık Uyarısı</h2>
                            <p className="text-yellow-500 bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/30">
                                ⚠️ Platform üzerinden sunulan beslenme önerileri ve programlar, tıbbi tedavinin yerini almaz. Ciddi sağlık sorunlarınız varsa mutlaka bir sağlık kuruluşuna başvurunuz. Platform diyetisyenleri tarafından verilen öneriler, genel beslenme rehberliği niteliğindedir.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">6. Fikri Mülkiyet</h2>
                            <p>
                                Platform'daki tüm içerik, tasarım, logo ve yazılımlar DietPlatform'a aittir ve telif hakkı yasaları ile korunmaktadır. İzinsiz kopyalama, dağıtım veya kullanım yasaktır.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">7. Ücretlendirme ve Ödeme</h2>
                            <p>
                                Platform'daki bazı hizmetler ücretlidir. Ücretler, ilgili hizmet sayfasında belirtilir. Ödeme işlemleri güvenli ödeme altyapısı üzerinden gerçekleştirilir.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">8. İptal ve İade</h2>
                            <p>
                                Abonelik iptalleri, cari dönem sonunda geçerli olur. İade politikası için lütfen bizimle iletişime geçiniz.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">9. Sorumluluk Sınırlaması</h2>
                            <p>
                                Platform, kesintisiz veya hatasız çalışmayı garanti etmez. Platformdan kaynaklanan doğrudan veya dolaylı zararlardan DietPlatform sorumlu tutulamaz.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">10. Değişiklikler</h2>
                            <p>
                                DietPlatform, bu Kullanım Şartları'nı önceden haber vermeksizin değiştirme hakkını saklı tutar. Önemli değişiklikler e-posta ile bildirilecektir.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">11. İletişim</h2>
                            <p>
                                Bu Kullanım Şartları ile ilgili sorularınız için <a href="mailto:legal@dietplatform.com" className="text-primary hover:underline">legal@dietplatform.com</a> adresinden bize ulaşabilirsiniz.
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default TermsOfService;
