# DietPlatform - Mobil Uygulama (front-mobile)

React Native + Expo ile geliştirilmiş, Online Diyetisyen Platformu'nun mobil versiyonu.

---

## 📋 Gereksinimler

- Node.js 18+
- npm veya yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (Android için) veya Xcode (iOS için)
- Expo Go uygulaması (gerçek cihaz testi için)

---

## 🚀 Kurulum

### 1. Bağımlılıkları Yükle

```bash
cd "Bitirme Projesi Uygulama/front-mobile"
npm install
```

### 2. Backend URL'ini Ayarla

`src/constants/api.ts` dosyasını açın ve `API_BASE_URL`'i ayarlayın:

```ts
// Android Emülatör için:
export const API_BASE_URL = 'http://10.0.2.2:8000/api/v1';

// iOS Simülatör veya Expo Go (gerçek cihaz) için:
// Bilgisayarınızın yerel IP adresini kullanın
export const API_BASE_URL = 'http://192.168.1.100:8000/api/v1';
// (IP adresinizi öğrenmek için: ipconfig komutunu çalıştırın)
```

---

## 📱 Çalıştırma

### Expo Dev Server Başlat
```bash
npm start
# veya
expo start
```

### Android
```bash
npm run android
# veya
expo start --android
```

### iOS
```bash
npm run ios
# veya
expo start --ios
```

### Gerçek Cihaz (Expo Go)
1. Expo Go uygulamasını indirin (App Store / Google Play)
2. `npm start` komutunu çalıştırın
3. Gösterilen QR kodu Expo Go ile tarayın
4. ⚠️ `API_BASE_URL`'i bilgisayarınızın LAN IP adresiyle güncelleyin

---

## 🔧 Backend Bağlantısı

Backend'i başlatmak için:
```bash
cd "Bitirme Projesi Uygulama/backend"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

> `--host 0.0.0.0` parametresi, yerel ağdaki cihazların backend'e erişmesi için gereklidir.

---

## 📁 Proje Yapısı

```
front-mobile/
├── App.tsx                  # Uygulama giriş noktası
├── app.json                 # Expo yapılandırması
├── src/
│   ├── constants/
│   │   ├── api.ts           # ⚙️ Backend URL (buradan değiştirin)
│   │   ├── colors.ts        # Renk paleti (web ile aynı tema)
│   │   └── theme.ts         # Typography, Spacing, Radius, Shadows
│   ├── services/
│   │   ├── api.ts           # Axios instance (interceptors)
│   │   ├── authService.ts
│   │   ├── memberService.ts
│   │   ├── dietitianService.ts
│   │   ├── dietitianDashboardService.ts
│   │   ├── chatService.ts
│   │   ├── adminService.ts
│   │   ├── dailyLogService.ts
│   │   └── aiService.ts
│   ├── context/
│   │   └── AuthContext.tsx  # JWT + AsyncStorage auth yönetimi
│   ├── navigation/
│   │   ├── index.tsx        # Root navigator (rol bazlı yönlendirme)
│   │   ├── AuthNavigator.tsx
│   │   ├── MemberNavigator.tsx
│   │   ├── DietitianNavigator.tsx
│   │   └── AdminNavigator.tsx
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── member/
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── ExpertsScreen.tsx
│   │   │   ├── MessagesScreen.tsx
│   │   │   ├── ChatDetailScreen.tsx
│   │   │   ├── ProgressScreen.tsx
│   │   │   ├── ProfileScreen.tsx
│   │   │   ├── MyPlanScreen.tsx
│   │   │   └── CalorieCalculatorScreen.tsx
│   │   ├── dietitian/
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── MembersScreen.tsx
│   │   │   ├── MemberDetailScreen.tsx
│   │   │   ├── CreatePlanScreen.tsx
│   │   │   ├── MessagesScreen.tsx
│   │   │   ├── AgenticAIScreen.tsx
│   │   │   ├── DailyReportScreen.tsx
│   │   │   └── ProfileScreen.tsx
│   │   └── admin/
│   │       └── AdminDashboardScreen.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── LoadingScreen.tsx
│   │   │   └── Widgets.tsx  (EmptyState, Badge, StatCard)
│   │   └── layout/
│   │       └── Header.tsx
│   └── utils/
│       └── storage.ts       # AsyncStorage helpers
```

---

## 🎨 Tasarım Sistemi

Web frontend ile aynı tema:
- **Primary**: `#4dfa2d` (Neon Yeşil)
- **Background**: `#0c1a0c` (Koyu Siyah-Yeşil)
- **Card**: `#172517`
- **Font**: System font (Manrope benzeri ağırlıklar)
- **Radius**: 16-24px (yuvarlatılmış köşeler)

---

## 🔐 Kimlik Doğrulama

- JWT token → `AsyncStorage`'da saklanır
- Her API isteğine otomatik `Authorization: Bearer <token>` eklenir
- 401 yanıtında otomatik çıkış yapılır
- Uygulama açılışında token varsa kullanıcı geri yüklenir

---

## 📲 Kullanıcı Rolleri

| Rol | Ekranlar |
|-----|----------|
| **Üye** | Dashboard, Uzmanlar, Mesajlar, İlerleme, Profil, Programım, Kalori |
| **Diyetisyen** | Panel, Danışanlar, Mesajlar, AI Asistan, Profil |
| **Admin** | İstatistikler, Kullanıcı Yönetimi, Bekleyen Onaylar |

---

## ❗ Sorun Giderme

**"Network Error" alıyorum:**
- Backend'in `--host 0.0.0.0` ile başlatıldığından emin olun
- `API_BASE_URL`'deki IP adresini kontrol edin
- Android Emülatörde `10.0.2.2` kullanın (localhost yerine)

**"Module not found" hatası:**
```bash
npm install
npx expo install
```

**Metro bundle hatası:**
```bash
npx expo start --clear
```
