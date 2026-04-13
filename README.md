# 🥗 Online Diyetisyen Platformu

Diyetisyen ve danışanları bir araya getiren, yapay zekâ destekli online beslenme takip platformu.

## 📌 Proje Hakkında

Bu platform, diyetisyenlerin danışanlarını uzaktan takip etmesini, kişiye özel beslenme planları oluşturmasını ve yapay zekâ desteğiyle beslenme süreçlerini yönetmesini sağlar. Üç farklı kullanıcı rolü (Admin, Diyetisyen, Üye) desteklenmektedir.

---

## 🏗️ Yeni: Mimari ve Güvenlik Özellikleri

Proje son güncellemelerle birlikte kurumsal standartlarda bir yapıya kavuşturulmuştur:

-   **Docker Containerization:** Tüm servisler (Backend, Frontend, MongoDB, n8n) izole container'lar üzerinde çalışır.
-   **Gelişmiş Güvenlik:** 
    -   **MongoDB Hardening:** Veritabanı dış dünyaya kapalıdır, sadece internal network üzerinden erişilebilir.
    -   **Root Auth:** Güçlü şifreleme ve root kullanıcı yönetimi eklenmiştir.
-   **CI/CD Pipeline:** GitHub Actions ile her `push` işleminde sunucuya otomatik deployment yapılır.

---

## 🧩 Özellikler

- **Rol Tabanlı Kimlik Doğrulama** — Admin, Diyetisyen ve Üye rolleri (JWT + Google OAuth)
- **AI Beslenme Planı** — Yapay zekâ ile kişiye özel beslenme planı oluşturma
- **Günlük Beslenme Takibi** — Üyelerin günlük öğün ve kalori kaydı
- **AI Günlük Rapor** — Yapay zekâ destekli günlük beslenme analizi
- **Anlık Mesajlaşma** — Diyetisyen-danışan arası canlı sohbet
- **Kalori Hesaplayıcı** — Detaylı kalori ve makro besin hesaplama
- **Abonelik Yönetimi** — Üyelik paket ve süre yönetimi
- **Bildirim Sistemi** — Anlık bildirimler
- **Admin Paneli** — Kullanıcı ve diyetisyen onay yönetimi
- **Diyetisyen Dashboard** — Danışan listesi, plan oluşturma ve takip ekranı

## 🛠️ Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| **Frontend (Web)** | React, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **Frontend (Mobil)** | React Native, Expo |
| **Backend** | Python, FastAPI, Beanie (MongoDB ODM) |
| **Veritabanı** | MongoDB (Secured) |
| **Otomasyon & AI** | n8n (workflow otomasyon), AI API entegrasyonu |
| **DevOps & CI/CD** | Docker, Docker Compose, Nginx, GitHub Actions |

## 📁 Proje Yapısı

```
├── .github/workflows/        # CI/CD Pipeline (GitHub Actions - deploy.yml)
├── docker-compose.yml        # Multi-container Docker yapılandırması
├── backend/                  # FastAPI Backend
│   ├── app/
│   │   ├── api/api_v1/       # REST API endpoint'leri
│   │   ├── core/             # Konfigürasyon, veritabanı, güvenlik
│   │   ├── models/           # MongoDB doküman modelleri
│   │   ├── schemas/          # Pydantic request/response şemaları
│   │   └── services/         # İş mantığı (n8n, AI servisleri)
│   ├── scripts/              # Yardımcı scriptler (seed data)
│   ├── Dockerfile            # Backend uygulaması için Docker image config
├── frontend/                 # React Web Uygulaması
│   ├── src/
│   ├── Dockerfile            # Frontend (Nginx) için Docker image config
│   ├── nginx.conf            # Nginx sunucu yapılandırması
└── front-end-mobile/         # React Native Mobil Uygulama (Expo)
```

## 🐳 Docker ile Kurulum (Önerilen)

Projeyi Docker Compose kullanarak çok hızlı test edebilirsiniz.

```bash
docker-compose up -d --build
```
*   **Web Portal:** `http://localhost:3000`
*   **API Dökümantasyonu:** `http://localhost:3001/docs`

## 🛠️ GitHub Actions (Otomatik Deploy)

Sunucuya otomatik kurulum için GitHub repository sayfanızda **Settings > Secrets > Actions** altına şu değişkenleri ekleyin:
- `SERVER_HOST`, `SERVER_USER`, `SSH_PRIVATE_KEY`

## 🚀 Manuel Kurulum

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate # Windows için venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend (Web)
```bash
cd frontend
npm install
npm run dev
```

### Mobil Uygulama
```bash
cd front-end-mobile
npm install
npx expo start
```

> **Not:** `.env` dosyasını `.env.example` referans alarak oluşturun.

## 📸 Ekran Görüntüleri
*Yakında eklenecek.*

## 👤 Geliştirici
**Yusufcan Esener** — [GitHub](https://github.com/YusufcanEsener)
