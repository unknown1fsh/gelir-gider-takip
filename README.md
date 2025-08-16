# 💰 Gelir Gider Takip Uygulaması

Modern ve kullanıcı dostu bir gelir-gider takip uygulaması. Banka hesaplarınızı ve kredi kartlarınızı kolayca yönetin, finansal durumunuzu takip edin.

## ✨ Özellikler

### 🏦 Banka Hesap Yönetimi
- **Vadesiz/Vadeli Hesap** desteği
- **Kredili Mevduat** hesap türü
- **IBAN** ve hesap numarası takibi
- **Hesap limiti** ve **kredi limiti** yönetimi
- **Negatif bakiye** desteği (kredili hesaplar için)

### 💳 Kredi Kartı Takibi
- **Toplam limit** ve **kalan limit** yönetimi
- **Hesap kesim tarihi** takibi
- **Kullanım oranı** hesaplama
- **Risk analizi** (düşük/orta/yüksek risk)

### 📊 Dashboard ve Raporlama
- **Toplam bakiye** görüntüleme
- **Hesap sayısı** istatistikleri
- **Kredi kartı** kullanım oranları
- **Finansal özet** bilgileri

### 🔧 Teknik Özellikler
- **Responsive tasarım** (mobil uyumlu)
- **Real-time** veri güncelleme
- **Form validasyonu** ve hata yönetimi
- **Modern UI/UX** tasarımı

## 🛠️ Teknolojiler

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MySQL** - Veritabanı
- **mysql2** - MySQL driver
- **CORS** - Cross-origin resource sharing
- **Body-parser** - Request parsing

### Frontend
- **React** - UI framework
- **React Router** - Sayfa yönlendirme
- **React Bootstrap** - UI bileşenleri
- **Bootstrap 5** - CSS framework
- **Axios** - HTTP client

## 📋 Gereksinimler

- **Node.js** 16.0+
- **MySQL** 8.0+
- **npm** veya **yarn**

## 🚀 Kurulum

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/unknown1fsh/gelir-gider-takip.git
cd gelir-gider-takip
```

### 2. Veritabanını Kurun
```bash
# MySQL'e bağlanın
mysql -u root -p

# Kurulum scriptini çalıştırın
source setup_database.sql
```

### 3. Backend Bağımlılıklarını Yükleyin
```bash
npm install
```

### 4. Frontend Bağımlılıklarını Yükleyin
```bash
cd client
npm install
cd ..
```

### 5. Uygulamayı Başlatın

#### Terminal 1 - Backend
```bash
npm run dev
```

#### Terminal 2 - Frontend
```bash
cd client
npm start
```

## 🌐 Erişim

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/api

## 📚 API Endpoints

### Bankalar
- `GET /api/banks` - Tüm bankaları listele
- `POST /api/banks` - Yeni banka ekle

### Hesaplar
- `GET /api/accounts` - Tüm hesapları listele
- `POST /api/accounts` - Yeni hesap ekle
- `PUT /api/accounts/:id` - Hesap güncelle

### Kredi Kartları
- `GET /api/credit-cards` - Tüm kredi kartlarını listele
- `POST /api/credit-cards` - Yeni kredi kartı ekle
- `PUT /api/credit-cards/:id` - Kredi kartı güncelle

### Dashboard
- `GET /api/dashboard` - Dashboard istatistikleri

## 🗄️ Veritabanı Yapısı

### Banks Tablosu
```sql
CREATE TABLE banks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bank_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Accounts Tablosu
```sql
CREATE TABLE accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bank_id INT NOT NULL,
  account_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50),
  iban VARCHAR(32) NOT NULL,
  account_type ENUM('vadeli', 'vadesiz') DEFAULT 'vadesiz',
  account_limit DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) NOT NULL,
  is_credit_account BOOLEAN DEFAULT FALSE,
  credit_limit DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
);
```

### Credit Cards Tablosu
```sql
CREATE TABLE credit_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bank_id INT NOT NULL,
  card_name VARCHAR(100) NOT NULL,
  card_number VARCHAR(20),
  total_limit DECIMAL(15,2) NOT NULL,
  remaining_limit DECIMAL(15,2) NOT NULL,
  statement_date INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
);
```

## 🎯 Kullanım Kılavuzu

### Hesap Ekleme
1. **Hesap Ekle** sayfasına gidin
2. **Banka seçin** ve **hesap adı** girin
3. **IBAN** ve **hesap numarası** bilgilerini ekleyin
4. **Hesap türünü** seçin (vadesiz/vadeli)
5. **Mevcut bakiyeyi** girin
6. **Kredili mevduat** seçeneğini işaretleyin (gerekirse)
7. **Kredi limitini** belirleyin (kredili hesaplar için)

### Kredi Kartı Ekleme
1. **Kredi Kartı Ekle** sayfasına gidin
2. **Banka seçin** ve **kart adı** girin
3. **Kart numarası** ve **hesap kesim tarihi** ekleyin
4. **Toplam limit** ve **kalan limit** bilgilerini girin
5. **Kartı kaydedin**

### Dashboard Kullanımı
- **Ana sayfa** üzerinden genel finansal durumu görüntüleyin
- **Hesaplar** sayfasından hesap detaylarını inceleyin
- **Kredi Kartları** sayfasından kart kullanım oranlarını takip edin

## 🔒 Güvenlik

- **SQL Injection** koruması
- **Input validation** ve sanitization
- **CORS** yapılandırması
- **Environment variables** kullanımı

## 🚧 Geliştirme

### Proje Yapısı
```
gelir-gider-takip/
├── server.js              # Backend ana dosyası
├── package.json           # Backend bağımlılıkları
├── setup_database.sql     # Veritabanı kurulum scripti
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React bileşenleri
│   │   ├── App.js         # Ana uygulama
│   │   └── index.js       # Giriş noktası
│   ├── public/            # Statik dosyalar
│   └── package.json       # Frontend bağımlılıkları
└── README.md              # Proje dokümantasyonu
```

### Geliştirme Komutları
```bash
# Backend geliştirme modu
npm run dev

# Frontend geliştirme modu
cd client && npm start

# Production build
cd client && npm run build
```

## 🐛 Sorun Giderme

### Yaygın Hatalar

#### 1. MySQL Bağlantı Hatası
```bash
# MySQL servisinin çalıştığından emin olun
# Windows: services.msc > MySQL80
# Linux: sudo systemctl status mysql
```

#### 2. Port Çakışması
```bash
# Port 5000 kullanımdaysa
# server.js'de PORT değişkenini değiştirin
```

#### 3. Bağımlılık Hataları
```bash
# node_modules'ı silin ve yeniden yükleyin
rm -rf node_modules package-lock.json
npm install
```

## 📈 Gelecek Özellikler

- [ ] **Gelir/Gider kategorileri**
- [ ] **Bütçe planlama**
- [ ] **Grafik raporları**
- [ ] **Mobil uygulama**
- [ ] **Push bildirimleri**
- [ ] **Çoklu kullanıcı desteği**
- [ ] **Veri yedekleme**
- [ ] **Export/Import özellikleri**

## 🤝 Katkıda Bulunma

1. Projeyi **fork** edin
2. Yeni bir **branch** oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi **commit** edin (`git commit -am 'Yeni özellik eklendi'`)
4. Branch'inizi **push** edin (`git push origin feature/yeni-ozellik`)
5. **Pull Request** oluşturun

## 📄 Lisans

Bu proje **MIT** lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 👨‍💻 Geliştirici

**unknown1fsh** - [GitHub Profili](https://github.com/unknown1fsh)

## 📞 İletişim

- **GitHub**: [@unknown1fsh](https://github.com/unknown1fsh)
- **Proje**: [Gelir Gider Takip](https://github.com/unknown1fsh/gelir-gider-takip)

## 🙏 Teşekkürler

Bu projeyi geliştirmemde yardımcı olan tüm açık kaynak topluluğuna teşekkürler!

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
