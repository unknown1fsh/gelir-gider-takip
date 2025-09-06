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
4. Proje ayarlarını yapılandırın:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `./` (root)

## 🔧 Adım 3: Environment Variables Ayarlama

Vercel Dashboard'da proje ayarlarında şu environment variables'ları ekleyin:

```env
DATABASE_URL=postgresql://neondb_owner:npg_JptIgQh2fP5L@ep-winter-river-a2ecm56m-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=b18cd445dda2f037bad52251f8869a0938f2b0d8ea85728c3670e1139ab7a3f27fa3128346e85fa297c92e0e4e2526811eb17ac09b09e790d2edf382a54414fc
ADMIN_PASSWORD=12345
NODE_ENV=production
```

### Vercel Dashboard'da Environment Variables Ekleme:
1. Vercel Dashboard'a gidin
2. Projenizi seçin
3. "Settings" sekmesine tıklayın
4. "Environment Variables" bölümüne gidin
5. Her bir variable'ı ekleyin:
   - **Name**: `DATABASE_URL`
   - **Value**: `postgresql://neondb_owner:npg_JptIgQh2fP5L@ep-winter-river-a2ecm56m-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require`
   - **Environment**: Production, Preview, Development (hepsini seçin)

### Neon Database URL Formatı:
```
postgresql://username:password@host:port/database?sslmode=require
```

## 🔧 Adım 4: Build Ayarları

Vercel otomatik olarak `server.js` dosyasını algılayacak ve deploy edecektir.

### Build Komutları (Otomatik):
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `./` (root directory)
- **Install Command**: `npm install`

### Önemli Notlar:
- Bu deployment sadece **backend API** içindir
- Frontend ayrı bir Vercel projesi olarak deploy edilmelidir
- `vercel.json` dosyası backend için optimize edilmiştir

## 🔧 Adım 5: Domain Ayarları

Deploy tamamlandıktan sonra:
1. Vercel size bir `.vercel.app` domain'i verecek
2. Custom domain ekleyebilirsiniz
3. SSL sertifikası otomatik olarak sağlanır

## 🧪 Test Etme

Deploy tamamlandıktan sonra:

1. **API Test**: `https://your-domain.vercel.app/api/auth/register`
2. **Landing Page**: `https://your-domain.vercel.app/`
3. **Health Check**: `https://your-domain.vercel.app/api/health`
4. **Admin Panel**: `https://your-domain.vercel.app/admin`

### Test Komutları:
```bash
# API endpoint test
curl https://your-domain.vercel.app/api/health

# Database test
curl -X POST https://your-domain.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"123456"}'
```

## 🔍 Sorun Giderme

### Yaygın Sorunlar:

1. **Database Connection Error**
   - DATABASE_URL'in doğru olduğundan emin olun
   - Neon database'in aktif olduğunu kontrol edin
   - Environment variables'ın Vercel'de doğru ayarlandığını kontrol edin

2. **Build Error**
   - Node.js versiyonunun 18+ olduğundan emin olun
   - Package.json'daki script'leri kontrol edin
   - `vercel.json` dosyasının doğru yapılandırıldığını kontrol edin

3. **CORS Error**
   - Frontend domain'ini CORS ayarlarına ekleyin

4. **Log Görünmüyor**
   - Vercel Dashboard'da "Functions" sekmesine gidin
   - "View Function Logs" butonuna tıklayın
   - Real-time logları görebilirsiniz

5. **API Endpoint'leri Çalışmıyor**
   - `vercel.json` dosyasında routes'ları kontrol edin
   - Environment variables'ın doğru ayarlandığını kontrol edin

### Log Kontrolü:
```bash
vercel logs your-project-name
```

### Vercel Dashboard'da Log Kontrolü:
1. Vercel Dashboard'a gidin
2. Projenizi seçin
3. "Functions" sekmesine tıklayın
4. "View Function Logs" butonuna tıklayın
5. Real-time logları görebilirsiniz

### Test Komutu:
```bash
# Environment variables ile test
DATABASE_URL="postgresql://neondb_owner:npg_JptIgQh2fP5L@ep-winter-river-a2ecm56m-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require" JWT_SECRET="b18cd445dda2f037bad52251f8869a0938f2b0d8ea85728c3670e1139ab7a3f27fa3128346e85fa297c92e0e4e2526811eb17ac09b09e790d2edf382a54414fc" ADMIN_PASSWORD="12345" NODE_ENV="production" node -e "console.log('Environment test:', process.env.NODE_ENV, process.env.DATABASE_URL ? 'DB OK' : 'DB MISSING')"
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

## 📋 Deployment Sonrası Kontrol Listesi

Deploy tamamlandıktan sonra şunları kontrol edin:

### ✅ Environment Variables
- [ ] DATABASE_URL doğru ayarlandı
- [ ] JWT_SECRET doğru ayarlandı
- [ ] ADMIN_PASSWORD doğru ayarlandı
- [ ] NODE_ENV production olarak ayarlandı

### ✅ API Endpoints
- [ ] `/api/health` endpoint'i çalışıyor
- [ ] `/api/auth/register` endpoint'i çalışıyor
- [ ] `/api/admin/system-parameters` endpoint'i çalışıyor

### ✅ Database
- [ ] Database bağlantısı başarılı
- [ ] Tablolar mevcut
- [ ] Test verisi eklenebiliyor

### ✅ Logging
- [ ] Vercel Dashboard'da loglar görünüyor
- [ ] Error logları yakalanıyor
- [ ] Request logları görünüyor

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

## 🎯 Özet

Bu rehber ile Vercel'de backend API'nizi başarıyla deploy edebilirsiniz. Ana adımlar:

1. **Environment Variables** ayarlayın
2. **vercel.json** dosyasını doğru yapılandırın
3. **Logging** ekleyin
4. **Test** edin
5. **Monitor** edin

### 🚀 Hızlı Başlangıç

```bash
# 1. Environment variables ayarlayın (Vercel Dashboard'da)
# 2. Deploy edin
vercel

# 3. Test edin
curl https://your-domain.vercel.app/api/health
```

**Not**: Bu rehber sadece backend API deployment'ı içerir. Frontend için ayrı bir deployment gerekebilir.
