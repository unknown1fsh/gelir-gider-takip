# 🚀 Vercel Deployment Rehberi

## 📋 Tek Script'te Hem Backend Hem Frontend Deploy Etme

### 🔧 Adım 1: Backend'i Düzeltelim

Vercel serverless function'ları için doğru yapılandırma:

1. **api/index.js** dosyasını oluşturun (ana API endpoint'i)
2. **vercel.json** dosyasını oluşturun
3. **package.json**'da build script'lerini güncelleyin

### 🔧 Adım 2: Frontend'i Deploy Edin

```bash
cd client
vercel --prod
```

### 🔧 Adım 3: CORS Ayarlarını Güncelleyin

Frontend URL'ini aldıktan sonra backend'deki CORS ayarlarını güncelleyin.

## 🎯 Tek Komutla Deploy Script'i

```bash
# deploy.sh (Linux/Mac) veya deploy.bat (Windows)
#!/bin/bash

echo "🚀 Gelir Gider Takip Uygulaması Deploy Ediliyor..."

# 1. Backend'i deploy et
echo "📦 Backend deploy ediliyor..."
vercel --prod

# 2. Frontend'i deploy et
echo "📦 Frontend deploy ediliyor..."
cd client
vercel --prod
cd ..

echo "✅ Deploy tamamlandı!"
```

## 🔧 Manuel Adımlar

### Backend Deploy:
```bash
vercel --prod
```

### Frontend Deploy:
```bash
cd client
vercel --prod
```

## 🌐 URL'lerinizi Not Edin

- **Backend URL**: https://gelir-gider-takip-3ht231pu7-unknown1fshs-projects.vercel.app
- **Frontend URL**: (deploy ettikten sonra alacaksınız)

## ⚠️ Önemli Notlar

1. Backend ve frontend ayrı projeler olarak deploy edilmelidir
2. CORS ayarları her iki URL'i de içermelidir
3. Environment variables backend projesinde ayarlanmalıdır
