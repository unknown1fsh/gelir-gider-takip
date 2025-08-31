# Gelir Gider Takip Uygulaması

Bu proje, kişisel finans yönetimi için geliştirilmiş full-stack bir web uygulamasıdır.

## 🚀 Vercel Deployment

Bu proje Vercel üzerinde tek parça halinde çalışacak şekilde yapılandırılmıştır.

### Gereksinimler

- Node.js 18+
- Vercel Postgres veritabanı
- Vercel hesabı

### Deployment Adımları

1. **Vercel CLI kurulumu:**
   ```bash
   npm i -g vercel
   ```

2. **Proje dizininde login:**
   ```bash
   vercel login
   ```

3. **Vercel Postgres veritabanı oluşturma:**
   - Vercel Dashboard'da "Storage" > "Create Database" > "Postgres"
   - Veritabanı adı: `gelir_gider_takip`
   - Region seçimi

4. **Environment variables ayarlama:**
   Vercel Dashboard'da proje ayarlarında şu environment variables'ları ekleyin:
   ```
   POSTGRES_HOST=your_postgres_host
   POSTGRES_USER=your_postgres_user
   POSTGRES_PASSWORD=your_postgres_password
   POSTGRES_DATABASE=gelir_gider_takip
   POSTGRES_PORT=5432
   JWT_SECRET=your-super-secret-jwt-key-2024
   ADMIN_PASSWORD=12345
   NODE_ENV=production
   ```

5. **Deploy:**
   ```bash
   vercel --prod
   ```

### Proje Yapısı

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React bileşenleri
│   │   ├── contexts/      # React context'leri
│   │   └── config.js      # API konfigürasyonu
│   └── package.json
├── server.js              # Express backend + API
├── package.json           # Ana package.json
├── vercel.json           # Vercel konfigürasyonu
└── README.md
```

### Teknolojiler

- **Frontend:** React, Bootstrap, Axios
- **Backend:** Node.js, Express
- **Veritabanı:** PostgreSQL (Vercel Postgres)
- **Authentication:** JWT
- **Deployment:** Vercel

### Özellikler

- ✅ Kullanıcı kayıt/giriş sistemi
- ✅ Gelir/gider takibi
- ✅ Banka hesapları yönetimi
- ✅ Kredi kartı yönetimi
- ✅ Otomatik ödeme planları
- ✅ Analitik ve raporlama
- ✅ Responsive tasarım

### API Endpoints

Tüm API endpoint'leri `/api` prefix'i ile başlar:
- `/api/auth/*` - Kimlik doğrulama
- `/api/users/*` - Kullanıcı yönetimi
- `/api/accounts/*` - Hesap yönetimi
- `/api/expenses/*` - Gider yönetimi
- `/api/incomes/*` - Gelir yönetimi
- `/api/analytics/*` - Analitik veriler

### Geliştirme

Lokal geliştirme için birkaç seçenek var:

#### 🚀 Tek Komutla Başlatma (Önerilen)
```bash
# Windows için
start.bat

# Linux/Mac için
chmod +x start.sh
./start.sh

# Veya npm script ile
npm run dev:full
```

#### 🔧 Manuel Başlatma
```bash
# Backend
npm run dev

# Frontend (yeni terminal)
cd client && npm start
```

#### 📋 Mevcut Script'ler
- `npm run dev:full` - Hem frontend hem backend'i aynı anda başlatır
- `npm run dev:backend` - Sadece backend'i başlatır
- `npm run dev:frontend` - Sadece frontend'i başlatır

### Production Build

```bash
npm run build
```

Bu komut client'ı build eder ve production için hazırlar.

## 📝 Lisans

MIT License
