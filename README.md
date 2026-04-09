# 🥗 Online Diyetisyen Platformu

Diyetisyen ve danışanları bir araya getiren, yapay zekâ destekli online beslenme takip platformu.

## 📌 Proje Hakkında

Bu platform, diyetisyenlerin danışanlarını uzaktan takip etmesini, kişiye özel beslenme planları oluşturmasını ve yapay zekâ desteğiyle beslenme süreçlerini yönetmesini sağlar. Üç farklı kullanıcı rolü (Admin, Diyetisyen, Üye) desteklenmektedir.

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
| **Veritabanı** | MongoDB |
| **Otomasyon & AI** | n8n (workflow otomasyon), AI API entegrasyonu |
| **Kimlik Doğrulama** | JWT, Google OAuth |

## 📁 Proje Yapısı

```
├── backend/                  # FastAPI Backend
│   ├── app/
│   │   ├── api/api_v1/       # REST API endpoint'leri
│   │   │   └── endpoints/    # auth, members, dietitians, chat, ai, admin...
│   │   ├── core/             # Konfigürasyon, veritabanı, güvenlik
│   │   ├── models/           # MongoDB doküman modelleri
│   │   ├── schemas/          # Pydantic request/response şemaları
│   │   └── services/         # İş mantığı (n8n, AI servisleri)
│   ├── scripts/              # Yardımcı scriptler (seed data)
│   └── requirements.txt
│
├── frontend/                 # React Web Uygulaması
│   ├── src/
│   │   ├── components/       # UI bileşenleri (dashboard, layout, ai, ui)
│   │   ├── pages/            # Sayfa bileşenleri (24 sayfa)
│   │   ├── services/         # API servis katmanı
│   │   ├── contexts/         # Auth & Notification context
│   │   └── hooks/            # Custom React hook'ları
│   └── package.json
│
└── front-end-mobile/         # React Native Mobil Uygulama (Expo)
```

## 🚀 Kurulum

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
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
