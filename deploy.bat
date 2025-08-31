@echo off
echo ========================================
echo Gelir Gider Takip Uygulamasi Deploy Ediliyor
echo ========================================
echo.

echo 📦 Backend deploy ediliyor...
vercel --prod

echo.
echo 📦 Frontend deploy ediliyor...
cd client
vercel --prod
cd ..

echo.
echo ========================================
echo ✅ Deploy tamamlandi!
echo ========================================
echo.
echo 🌐 Backend URL: https://gelir-gider-takip-3ht231pu7-unknown1fshs-projects.vercel.app
echo 🌐 Frontend URL: (yukarida gosterilen URL)
echo.
echo 📋 Sonraki adimlar:
echo 1. Frontend URL'ini not edin
echo 2. Backend'deki CORS ayarlarini guncelleyin
echo 3. Frontend'deki API URL'ini guncelleyin
echo.
pause
