# 💰 Gelir Gider Takip Uygulaması

Modern, kapsamlı ve AI destekli gelir-gider takip uygulaması. Banka hesaplarınızı, kredi kartlarınızı, gelir ve giderlerinizi profesyonel bir şekilde yönetin. Finansal durumunuzu analiz edin ve AI destekli öneriler alın.

## 🚀 **YENİ ÖZELLİKLER (Güncel)**

### 🤖 **AI Destekli Finansal Analiz**
- **Akıllı finansal durum analizi** ve kategorilendirme
- **Kişiselleştirilmiş öneriler** ve uyarılar
- **Gelir-gider oranı** analizi
- **Kategori bazında** harcama analizi
- **Limit kullanım** analizi ve risk değerlendirmesi

### 👤 **Profesyonel Kullanıcı Yönetimi**
- **JWT tabanlı kimlik doğrulama** sistemi
- **Güvenli şifre hashleme** (bcrypt.js)
- **Kullanıcı oturum yönetimi** ve profil sistemi
- **Korumalı rotalar** ve yetkilendirme

### 🎯 **Gelişmiş Gelir-Gider Sistemi**
- **Gelir türleri**: Maaş, Ek İş, Kira Geliri, Yatırım, Yemek Kartı, Diğer
- **Gider kategorileri**: 15 farklı kategori (Market, Ulaşım, Sağlık, vb.)
- **Ödeme yöntemleri**: Nakit, Kredi Kartı, Banka Transferi, Kredili Hesap
- **Kira giderleri** ve bakım ücretleri takibi
- **Kredi faizleri** ve kredi kartı faizleri
- **Periyodik giderler** yönetimi

### 📊 **Kapsamlı Analiz ve Raporlama**
- **Detaylı finansal analiz** sayfası
- **Aylık trend** grafikleri
- **Kategori bazında** gider dağılımı
- **Kullanılabilir limit** takibi
- **Tasarruf oranı** hesaplamaları

### 🔧 **Admin Paneli**
- **Sistem yönetimi** ve kullanıcı kontrolü
- **Mock veri ekleme** (test1, test2, test3 kullanıcıları)
- **Veritabanı sıfırlama** ve yedekleme
- **Sistem parametreleri** yönetimi
- **Kullanıcı istatistikleri** ve detayları

## ✨ **Temel Özellikler**

### 🏦 **Banka Hesap Yönetimi**
- **Vadesiz/Vadeli Hesap** desteği
- **Kredili Mevduat** hesap türü
- **IBAN** ve hesap numarası takibi
- **Hesap limiti** ve **kredi limiti** yönetimi
- **Negatif bakiye** desteği (kredili hesaplar için)
- **Dinamik form** alanları (kredi hesabı seçimine göre)

### 💳 **Kredi Kartı Takibi**
- **Kart limiti** ve **kalan limit** yönetimi
- **Hesap kesim tarihi** takibi
- **Kullanım oranı** hesaplama
- **Risk analizi** ve limit uyarıları

### 📱 **Modern Kullanıcı Arayüzü**
- **Responsive tasarım** (mobil uyumlu)
- **React Bootstrap** bileşenleri
- **Gradient header** tasarımları
- **İkon entegrasyonu** (React Icons)
- **Profesyonel navigasyon** menüsü
- **Kullanıcı profil dropdown** menüsü

## 🛠️ **Teknolojiler**

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MySQL** - Veritabanı (UTF8MB4 collation)
- **mysql2** - MySQL driver (Promise-based)
- **JWT** - JSON Web Token authentication
- **bcrypt.js** - Şifre hashleme
- **CORS** - Cross-origin resource sharing
- **Body-parser** - Request parsing

### **Frontend**
- **React 18** - UI framework
- **React Router v6** - Sayfa yönlendirme
- **React Bootstrap** - UI bileşenleri
- **Bootstrap 5** - CSS framework
- **Axios** - HTTP client (interceptors)
- **React Icons** - İkon kütüphanesi
- **Context API** - State management

## 📋 **Gereksinimler**

- **Node.js** 16.0+
- **MySQL** 8.0+ (root/12345)
- **npm** veya **yarn**

## 🚀 **Kurulum**

### 1. **Projeyi Klonlayın**
```bash
git clone https://github.com/unknown1fsh/gelir-gider-takip.git
cd gelir-gider-takip
```

### 2. **Veritabanını Kurun**
```bash
# MySQL'e bağlanın
mysql -u root -p12345

# Veritabanı otomatik olarak oluşturulacak
# Backend başlatıldığında tüm tablolar otomatik oluşturulur
```

### 3. **Backend Bağımlılıklarını Yükleyin**
```bash
npm install
```

### 4. **Frontend Bağımlılıklarını Yükleyin**
```bash
cd client
npm install
cd ..
```

### 5. **Uygulamayı Başlatın**

#### **Terminal 1 - Backend**
```bash
npm start
# veya geliştirme modu için
npm run dev
```

#### **Terminal 2 - Frontend**
```bash
cd client
npm start
```

## 🌐 **Erişim**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Admin Panel**: http://localhost:3000/admin (şifre: 12345)

## 📚 **API Endpoints**

### **Kimlik Doğrulama**
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/profile` - Kullanıcı profili

### **Admin API**
- `POST /api/admin/dashboard` - Admin dashboard
- `POST /api/admin/users` - Kullanıcı listesi
- `POST /api/admin/users/toggle-status` - Kullanıcı durumu değiştir
- `POST /api/admin/reset-database` - Veritabanını sıfırla
- `POST /api/admin/insert-mock-data` - Test verisi ekle
- `POST /api/admin/system-params` - Sistem parametreleri

### **Temel API**
- `GET /api/banks` - Tüm bankaları listele
- `POST /api/banks` - Yeni banka ekle
- `GET /api/accounts` - Tüm hesapları listele
- `POST /api/accounts` - Yeni hesap ekle
- `PUT /api/accounts/:id` - Hesap güncelle
- `DELETE /api/accounts/:id` - Hesap sil
- `GET /api/credit-cards` - Tüm kredi kartlarını listele
- `POST /api/credit-cards` - Yeni kredi kartı ekle
- `PUT /api/credit-cards/:id` - Kredi kartı güncelle
- `DELETE /api/credit-cards/:id` - Kredi kartı sil

### **Gelir-Gider API**
- `GET /api/incomes` - Tüm gelirleri listele
- `POST /api/incomes` - Yeni gelir ekle
- `PUT /api/incomes/:id` - Gelir güncelle
- `DELETE /api/incomes/:id` - Gelir sil
- `GET /api/expenses` - Tüm giderleri listele
- `POST /api/expenses` - Yeni gider ekle
- `PUT /api/expenses/:id` - Gider güncelle
- `DELETE /api/expenses/:id` - Gider sil

### **Analiz API**
- `GET /api/dashboard` - Dashboard istatistikleri
- `GET /api/analytics` - Detaylı analiz verileri

## 🗄️ **Veritabanı Yapısı**

### **Users Tablosu**
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Banks Tablosu**
```sql
CREATE TABLE banks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bank_name VARCHAR(100) NOT NULL,
  bank_code VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Accounts Tablosu**
```sql
CREATE TABLE accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
);
```

### **Credit Cards Tablosu**
```sql
CREATE TABLE credit_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bank_id INT NOT NULL,
  card_name VARCHAR(100) NOT NULL,
  card_number VARCHAR(20),
  card_limit DECIMAL(15,2) NOT NULL,
  remaining_limit DECIMAL(15,2) NOT NULL,
  statement_date INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
);
```

### **Incomes Tablosu**
```sql
CREATE TABLE incomes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  income_type ENUM('salary', 'part_time', 'rental', 'investment', 'food_card', 'other') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  source VARCHAR(100) NOT NULL,
  description TEXT,
  income_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### **Expense Categories Tablosu**
```sql
CREATE TABLE expense_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#007bff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Expenses Tablosu**
```sql
CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  payment_method ENUM('cash', 'credit_card', 'bank_transfer', 'credit_account') NOT NULL,
  expense_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE CASCADE
);
```

### **Rent Expenses Tablosu**
```sql
CREATE TABLE rent_expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  rent_amount DECIMAL(15,2) NOT NULL,
  maintenance_fee DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  rent_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### **Credit Payments Tablosu**
```sql
CREATE TABLE credit_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  payment_type ENUM('credit_interest', 'credit_card_interest') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  payment_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### **Periodic Expenses Tablosu**
```sql
CREATE TABLE periodic_expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  frequency ENUM('monthly', 'quarterly', 'yearly') DEFAULT 'monthly',
  next_due_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE CASCADE
);
```

## 🎯 **Kullanım Kılavuzu**

### **İlk Kurulum**
1. **Uygulamayı başlatın** (backend + frontend)
2. **Admin paneline** gidin: `/admin`
3. **Şifre ile giriş** yapın: `12345`
4. **"Mock Veri Ekle"** butonuna tıklayın
5. **Test kullanıcıları** oluşturulacak (test1, test2, test3)

### **Kullanıcı Girişi**
1. **"Giriş Yap"** butonuna tıklayın
2. **Kullanıcı adı**: `test1`, **Şifre**: `12345`
3. **Ay ve yıl** seçin
4. **Dashboard'a** yönlendirileceksiniz

### **Hesap Ekleme**
1. **"Hesap Ekle"** sayfasına gidin
2. **Banka seçin** ve **hesap adı** girin
3. **IBAN** ve **hesap numarası** bilgilerini ekleyin
4. **Hesap türünü** seçin (vadesiz/vadeli)
5. **Mevcut bakiyeyi** girin
6. **Kredili mevduat** seçeneğini işaretleyin (gerekirse)
7. **Hesap limiti** ve **kredi limiti** belirleyin

### **Kredi Kartı Ekleme**
1. **"Kredi Kartı Ekle"** sayfasına gidin
2. **Banka seçin** ve **kart adı** girin
3. **Kart numarası** ve **hesap kesim tarihi** ekleyin
4. **Kart limiti** ve **kalan limit** bilgilerini girin

### **Gelir Ekleme**
1. **"Gelir Ekle"** sayfasına gidin
2. **Gelir türünü** seçin (Maaş, Ek İş, Kira Geliri, vb.)
3. **Tutar** ve **kaynak** bilgilerini girin
4. **Gelir tarihi** ve **açıklama** ekleyin

### **Gider Ekleme**
1. **"Gider Ekle"** sayfasına gidin
2. **Gider kategorisini** seçin
3. **Tutar** ve **açıklama** girin
4. **Ödeme yöntemini** seçin
5. **Gider tarihi** belirleyin

### **AI Analiz Kullanımı**
1. **"Analiz"** sayfasına gidin
2. **"🧠 Analiz Notu Al"** butonuna tıklayın
3. **AI analiz sonuçlarını** inceleyin
4. **Önerileri** ve **uyarıları** takip edin

## 🔒 **Güvenlik Özellikleri**

- **JWT tabanlı** kimlik doğrulama
- **Bcrypt.js** ile şifre hashleme
- **SQL Injection** koruması
- **Input validation** ve sanitization
- **CORS** yapılandırması
- **Protected routes** ve yetkilendirme
- **Session management** ve token kontrolü

## 🚧 **Geliştirme**

### **Proje Yapısı**
```
gelir-gider-takip/
├── server.js                    # Backend ana dosyası
├── package.json                 # Backend bağımlılıkları
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/          # React bileşenleri
│   │   │   ├── Navigation.js    # Navigasyon menüsü
│   │   │   ├── Dashboard.js     # Ana dashboard
│   │   │   ├── Analytics.js     # Analiz sayfası (AI destekli)
│   │   │   ├── AdminPanel.js    # Admin paneli
│   │   │   ├── LoginPage.js     # Giriş sayfası
│   │   │   ├── RegisterPage.js  # Kayıt sayfası
│   │   │   ├── WelcomePage.js   # Hoş geldin sayfası
│   │   │   ├── IncomesList.js   # Gelir listesi
│   │   │   ├── ExpensesList.js  # Gider listesi
│   │   │   └── ...              # Diğer bileşenler
│   │   ├── contexts/            # React Context'ler
│   │   │   └── AuthContext.js   # Kimlik doğrulama context'i
│   │   ├── App.js               # Ana uygulama
│   │   └── index.js             # Giriş noktası
│   ├── public/                  # Statik dosyalar
│   └── package.json             # Frontend bağımlılıkları
└── README.md                    # Proje dokümantasyonu
```

### **Geliştirme Komutları**
```bash
# Backend geliştirme modu
npm run dev

# Frontend geliştirme modu
cd client && npm start

# Production build
cd client && npm run build

# Veritabanı sıfırlama (Admin panel üzerinden)
# Admin Panel > "Veritabanını Sıfırla" butonu
```

## 🐛 **Sorun Giderme**

### **Yaygın Hatalar**

#### 1. **MySQL Bağlantı Hatası**
```bash
# MySQL servisinin çalıştığından emin olun
# Windows: services.msc > MySQL80
# Linux: sudo systemctl status mysql

# Bağlantı bilgileri: root/12345
```

#### 2. **Port Çakışması**
```bash
# Port 5000 kullanımdaysa
taskkill /f /im node.exe

# veya server.js'de PORT değişkenini değiştirin
```

#### 3. **Bağımlılık Hataları**
```bash
# node_modules'ı silin ve yeniden yükleyin
rm -rf node_modules package-lock.json
npm install
```

#### 4. **Veritabanı Tabloları Eksik**
```bash
# Admin panel üzerinden "Mock Veri Ekle" butonuna tıklayın
# veya backend'i yeniden başlatın
```

#### 5. **Kullanıcı Girişi Yapılamıyor**
```bash
# Admin panel > "Mock Veri Ekle" ile test kullanıcıları oluşturun
# Kullanıcı adı: test1, Şifre: 12345
```

## 📈 **AI Analiz Sistemi**

### **Analiz Kategorileri**
- **Mükemmel** 🟢 (Net gelir > %30)
- **İyi** 🔵 (Pozitif net gelir)
- **Dengeli** 🟡 (Gelir = Gider)
- **Uyarı** 🟠 (Negatif net gelir)
- **Kritik** 🔴 (Büyük negatif net gelir)

### **Analiz Özellikleri**
- **Gelir-gider oranı** analizi
- **Kategori bazında** harcama analizi
- **Limit kullanım** analizi
- **Kişiselleştirilmiş öneriler**
- **Risk uyarıları** ve tavsiyeler

### **Örnek AI Çıktısı**
```
📋 Finansal Durum Özeti
Mükemmel! Finansal durumunuz çok iyi.

✅ Güçlü Yönleriniz
• Mükemmel tasarruf oranı! Gelirlerinizin %40'ından fazlasını tasarruf ediyorsunuz

💡 Öneriler
• Mevcut tasarruf alışkanlığınızı sürdürün
• Yatırım yapmayı düşünebilirsiniz
• Acil durum fonu oluşturmayı hedefleyin
```

## 🔮 **Gelecek Özellikler**

- [x] **AI destekli finansal analiz** ✅
- [x] **Kullanıcı yönetimi ve oturum sistemi** ✅
- [x] **Gelir-gider kategorileri** ✅
- [x] **Admin paneli** ✅
- [x] **Mock veri sistemi** ✅
- [ ] **Gerçek AI entegrasyonu** (OpenAI, Google Gemini)
- [ ] **Bütçe planlama** ve hedef belirleme
- [ ] **Grafik raporları** (Chart.js, D3.js)
- [ ] **Mobil uygulama** (React Native)
- [ ] **Push bildirimleri** ve hatırlatıcılar
- [ ] **Çoklu para birimi** desteği
- [ ] **Veri yedekleme** ve export/import
- [ ] **API rate limiting** ve güvenlik
- [ ] **Unit testler** ve CI/CD

## 🤝 **Katkıda Bulunma**

1. Projeyi **fork** edin
2. Yeni bir **branch** oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi **commit** edin (`git commit -am 'Yeni özellik eklendi'`)
4. Branch'inizi **push** edin (`git push origin feature/yeni-ozellik`)
5. **Pull Request** oluşturun

## 📄 **Lisans**

Bu proje **MIT** lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 👨‍💻 **Geliştirici**

**unknown1fsh** - [GitHub Profili](https://github.com/unknown1fsh)

## 📞 **İletişim**

- **GitHub**: [@unknown1fsh](https://github.com/unknown1fsh)
- **Proje**: [Gelir Gider Takip](https://github.com/unknown1fsh/gelir-gider-takip)

## 🙏 **Teşekkürler**

Bu projeyi geliştirmemde yardımcı olan tüm açık kaynak topluluğuna ve AI asistanlarına teşekkürler!

---

⭐ **Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!**

## 📝 **Güncelleme Geçmişi**

### **v2.0.0 (Güncel)**
- ✅ AI destekli finansal analiz sistemi
- ✅ Kullanıcı yönetimi ve JWT authentication
- ✅ Gelir-gider kategorileri ve yönetimi
- ✅ Admin paneli ve mock veri sistemi
- ✅ Modern UI/UX tasarımı
- ✅ Responsive tasarım ve mobil uyumluluk

### **v1.0.0 (İlk Sürüm)**
- ✅ Temel banka hesap yönetimi
- ✅ Kredi kartı takibi
- ✅ Basit dashboard
- ✅ MySQL veritabanı entegrasyonu
