@echo off
title Gelir Gider Takip Uygulaması Başlatıcı
color 0A

echo.
echo ========================================
echo    💰 Gelir Gider Takip Uygulaması
echo ========================================
echo.

echo 🔧 Backend bağımlılıkları yükleniyor...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Backend bağımlılıkları yüklenemedi!
    pause
    exit /b 1
)

echo.
echo 📱 Frontend bağımlılıkları yükleniyor...
cd client
call npm install
if %errorlevel% neq 0 (
    echo ❌ Frontend bağımlılıkları yüklenemedi!
    pause
    exit /b 1
)
cd ..

echo.
echo ✅ Tüm bağımlılıklar başarıyla yüklendi!
echo.

echo 🚀 Uygulama başlatılıyor...
echo.
echo 📋 Açılan terminal pencereleri:
echo    - Terminal 1: Backend (Port 5000)
echo    - Terminal 2: Frontend (Port 3000)
echo.

echo ⏳ 3 saniye sonra başlatılıyor...
timeout /t 3 /nobreak >nul

echo.
echo 🔧 Backend başlatılıyor...
start "Backend - Gelir Gider Takip" cmd /k "npm run dev"

echo.
echo 📱 Frontend başlatılıyor...
start "Frontend - Gelir Gider Takip" cmd /k "cd client && npm start"

echo.
echo 🎉 Uygulama başlatıldı!
echo.
echo 🌐 Erişim adresleri:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:5000
echo.
echo 💡 Her iki terminal de açıldıktan sonra uygulamayı kullanabilirsiniz.
echo.
pause
