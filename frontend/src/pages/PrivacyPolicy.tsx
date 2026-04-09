import { Link } from "react-router-dom";
import { Leaf, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/layout/Footer";

const PrivacyPolicy = () => {
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
                    <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-8">Gizlilik Politikası ve KVKK</h1>

                    <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
                        <p className="text-sm">Son güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>

                        <section id="kvkk" className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">KVKK Aydınlatma Metni</h2>
                            <p>
                                6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, DietPlatform olarak kişisel verilerinizin güvenliğine önem veriyoruz. Bu aydınlatma metni, kişisel verilerinizin nasıl işlendiği hakkında sizi bilgilendirmek amacıyla hazırlanmıştır.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">1. Veri Sorumlusu</h2>
                            <p>
                                Kişisel verileriniz, veri sorumlusu sıfatıyla DietPlatform Teknoloji A.Ş. tarafından işlenmektedir.
                            </p>
                            <div className="bg-surface p-4 rounded-lg border border-border">
                                <p><strong>Ticari Unvan:</strong> DietPlatform Teknoloji A.Ş.</p>
                                <p><strong>Adres:</strong> İstanbul, Türkiye</p>
                                <p><strong>E-posta:</strong> kvkk@dietplatform.com</p>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">2. İşlenen Kişisel Veriler</h2>
                            <p>Platform üzerinden aşağıdaki kişisel verileriniz işlenmektedir:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Kimlik Bilgileri:</strong> Ad, soyad, doğum tarihi</li>
                                <li><strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası</li>
                                <li><strong>Sağlık Verileri:</strong> Boy, kilo, hedef kilo, beslenme alışkanlıkları, sağlık durumu notları</li>
                                <li><strong>İşlem Güvenliği:</strong> IP adresi, oturum bilgileri, cihaz bilgileri</li>
                                <li><strong>Finansal Bilgiler:</strong> Fatura adresi, ödeme geçmişi (ödeme bilgileri saklanmaz)</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">3. Kişisel Verilerin İşlenme Amaçları</h2>
                            <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Üyelik işlemlerinin gerçekleştirilmesi</li>
                                <li>Beslenme danışmanlığı hizmetlerinin sunulması</li>
                                <li>Kişiselleştirilmiş beslenme programları oluşturulması</li>
                                <li>Yapay zeka destekli önerilerin sağlanması</li>
                                <li>Diyetisyen-danışan iletişiminin sağlanması</li>
                                <li>Faturalandırma ve ödeme işlemlerinin yürütülmesi</li>
                                <li>Hizmet kalitesinin artırılması</li>
                                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">4. Hukuki Sebepler</h2>
                            <p>Kişisel verileriniz, KVKK'nın 5. ve 6. maddelerinde belirtilen:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Açık rızanızın bulunması</li>
                                <li>Sözleşmenin ifası için gerekli olması</li>
                                <li>Hukuki yükümlülüğün yerine getirilmesi</li>
                                <li>Meşru menfaat</li>
                            </ul>
                            <p>hukuki sebeplerine dayanılarak işlenmektedir.</p>
                        </section>

                        <section className="space-y-4 bg-primary/10 p-6 rounded-lg border border-primary/30">
                            <h2 className="text-xl font-semibold text-foreground">5. Özel Nitelikli Kişisel Veriler</h2>
                            <p>
                                Sağlık verileriniz, KVKK kapsamında "özel nitelikli kişisel veri" olarak değerlendirilmektedir. Bu veriler, yalnızca beslenme danışmanlığı hizmetinin sunulması amacıyla ve açık rızanız doğrultusunda işlenmektedir.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">6. Verilerin Aktarımı</h2>
                            <p>Kişisel verileriniz:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Seçtiğiniz diyetisyene (beslenme danışmanlığı için)</li>
                                <li>Ödeme hizmeti sağlayıcılarına (ödeme işlemleri için)</li>
                                <li>Yasal zorunluluk halinde kamu kurumlarına</li>
                            </ul>
                            <p>aktarılabilmektedir.</p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">7. Veri Saklama Süresi</h2>
                            <p>
                                Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca ve yasal saklama süreleri kapsamında muhafaza edilir. Hesabınızı silmeniz halinde, yasal yükümlülükler saklı kalmak kaydıyla verileriniz silinir.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">8. Haklarınız</h2>
                            <p>KVKK'nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                                <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                                <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                                <li>Yurt içinde veya yurt dışındaki üçüncü kişileri bilme</li>
                                <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
                                <li>Verilerin silinmesini veya yok edilmesini isteme</li>
                                <li>İşlenen verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
                                <li>Verilerin otomatik sistemler vasıtasıyla analiz edilmesi sonucu aleyhinize bir sonuç ortaya çıkması halinde itiraz etme</li>
                                <li>Kanuna aykırı işleme sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme</li>
                            </ul>
                        </section>

                        <section id="cookies" className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">9. Çerez Politikası</h2>
                            <p>
                                Platform, oturum yönetimi ve kullanıcı deneyimini iyileştirmek için çerezler kullanmaktadır:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Zorunlu Çerezler:</strong> Platform'un çalışması için gerekli çerezler</li>
                                <li><strong>İşlevsel Çerezler:</strong> Tercihlerinizi hatırlamak için kullanılan çerezler</li>
                                <li><strong>Analitik Çerezler:</strong> Platform kullanımını analiz etmek için (isimsizleştirilmiş)</li>
                            </ul>
                            <p>
                                Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz, ancak bu durumda bazı özelliklere erişemeyebilirsiniz.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">10. Veri Güvenliği</h2>
                            <p>
                                Kişisel verilerinizin güvenliği için SSL şifreleme, güvenli sunucu altyapısı ve düzenli güvenlik denetimleri uygulanmaktadır.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold text-foreground">11. Başvuru</h2>
                            <p>
                                KVKK kapsamındaki haklarınızı kullanmak için <a href="mailto:kvkk@dietplatform.com" className="text-primary hover:underline">kvkk@dietplatform.com</a> adresine e-posta gönderebilir veya Profil sayfanızdaki "Verilerimi Talep Et" bölümünü kullanabilirsiniz.
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
