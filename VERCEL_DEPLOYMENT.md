# 🚀 Vercel Deployment Rehberi

Bu rehber, Gelir Gider Takip uygulamasını Vercel'de nasıl deploy edeceğinizi açıklar.

## 📋 Ön Gereksinimler

- Vercel hesabı
- GitHub/GitLab hesabı
- Neon PostgreSQL veritabanı

## 🔧 Adım 1: Veritabanı Kurulumu

### Neon PostgreSQL Kurulumu

1. [Neon.tech](https://neon.tech) sitesine gidin
2. Yeni bir proje oluşturun
3. Veritabanı bağlantı bilgilerini not edin

## 🔧 Adım 2: Vercel Projesi Oluşturma

### Yöntem 1: Vercel CLI ile (Önerilen)

```bash
# Vercel CLI kurulumu
npm i -g vercel

# Proje dizininde login
vercel login

# Proje deploy et
vercel
```

### Yöntem 2: Vercel Dashboard ile

1. [Vercel Dashboard](https://vercel.com/dashboard) açın
2. "New Project" tıklayın
3. GitHub/GitLab reponuzu seçin
4. Proje ayarlarını yapılandırın

## 🔧 Adım 3: Environment Variables Ayarlama

Vercel Dashboard'da proje ayarlarında şu environment variables'ları ekleyin:

```env
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-2024
ADMIN_PASSWORD=12345
NODE_ENV=production
```

### Neon Database URL Formatı:
```
postgresql://username:password@host:port/database?sslmode=require
```

## 🔧 Adım 4: Build Ayarları

Vercel otomatik olarak `server.js` dosyasını algılayacak ve deploy edecektir.

### Build Komutları (Otomatik):
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `client/build`
- **Install Command**: `npm install`

## 🔧 Adım 5: Domain Ayarları

Deploy tamamlandıktan sonra:
1. Vercel size bir `.vercel.app` domain'i verecek
2. Custom domain ekleyebilirsiniz
3. SSL sertifikası otomatik olarak sağlanır

## 🧪 Test Etme

Deploy tamamlandıktan sonra:

1. **API Test**: `https://your-domain.vercel.app/api/auth/register`
2. **Landing Page**: `https://your-domain.vercel.app/`

## 🔍 Sorun Giderme

### Yaygın Sorunlar:

1. **Database Connection Error**
   - DATABASE_URL'in doğru olduğundan emin olun
   - Neon database'in aktif olduğunu kontrol edin

2. **Build Error**
   - Node.js versiyonunun 18+ olduğundan emin olun
   - Package.json'daki script'leri kontrol edin

3. **CORS Error**
   - Frontend domain'ini CORS ayarlarına ekleyin

### Log Kontrolü:
```bash
vercel logs your-project-name
```

## 📱 Frontend Deployment

Frontend'i ayrı bir proje olarak deploy etmek için:

1. `client` klasörünü ayrı bir repo'ya taşıyın
2. Vercel'de yeni bir proje oluşturun
3. Environment variable olarak backend URL'ini ekleyin:
   ```env
   REACT_APP_API_URL=https://your-backend-domain.vercel.app/api
   ```

## 🔄 Otomatik Deploy

GitHub'a push yaptığınızda Vercel otomatik olarak yeni versiyonu deploy edecektir.

## 📊 Monitoring

Vercel Dashboard'da:
- Function execution logs
- Performance metrics
- Error tracking
- Analytics

## 🆘 Destek

Sorun yaşarsanız:
1. Vercel documentation: https://vercel.com/docs
2. Vercel community: https://github.com/vercel/vercel/discussions
3. Proje issues: GitHub repo'nuzda issue açın

---

**Not**: Bu rehber sadece backend API deployment'ı içerir. Frontend için ayrı bir deployment gerekebilir.
