const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Sistem Konfigürasyon Parametreleri
const SYSTEM_CONFIG = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '12345',
    database: process.env.DB_NAME || 'gelir_gider_takip',
    port: process.env.DB_PORT || 3306
  },
  application: {
    port: process.env.PORT || 5000,
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024',
    adminPassword: process.env.ADMIN_PASSWORD || '12345',
    sessionTimeout: process.env.SESSION_TIMEOUT || 3600,
    maxLoginAttempts: process.env.MAX_LOGIN_ATTEMPTS || 5,
    passwordMinLength: process.env.PASSWORD_MIN_LENGTH || 6
  },
  security: {
    bcryptRounds: process.env.BCRYPT_ROUNDS || 12,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    corsOrigin: process.env.CORS_ORIGIN || '*'
  }
};

const PORT = SYSTEM_CONFIG.application.port;
const JWT_SECRET = SYSTEM_CONFIG.application.jwtSecret;
const ADMIN_PASSWORD = SYSTEM_CONFIG.application.adminPassword;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required',
      code: 'TOKEN_MISSING'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err.message);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ 
          success: false, 
          message: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({ 
          success: false, 
          message: 'Invalid token',
          code: 'TOKEN_INVALID'
        });
      } else {
        return res.status(403).json({ 
          success: false, 
          message: 'Token verification failed',
          code: 'TOKEN_VERIFICATION_FAILED'
        });
      }
    }
    
    // Token geçerli, user bilgisini request'e ekle
    req.user = user;
    next();
  });
};

// Admin Authentication Middleware
const authenticateAdmin = (req, res, next) => {
  // POST request'lerde body'den, DELETE ve GET request'lerde header'dan adminPassword al
  let adminPassword;
  
  if (req.method === 'DELETE' || req.method === 'GET') {
    adminPassword = req.headers['admin-password'];
  } else {
    adminPassword = req.body.adminPassword;
  }
  
  if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Admin yetkisi gerekli' });
  }
  
  next();
};

// MySQL Bağlantısı
const connection = mysql.createConnection(SYSTEM_CONFIG.database);

// Veritabanı bağlantısı
connection.connect((err) => {
  if (err) {
    console.error('MySQL bağlantı hatası:', err);
    return;
  }
  console.log('✅ MySQL veritabanına başarıyla bağlandı');
  createTables();
});

// Tabloları oluştur
function createTables() {
  // Users tablosu
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  // Banks tablosu
  const createBanksTable = `
    CREATE TABLE IF NOT EXISTS banks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bank_name VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Accounts tablosu
  const createAccountsTable = `
    CREATE TABLE IF NOT EXISTS accounts (
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
    )
  `;

  // Credit Cards tablosu
  const createCreditCardsTable = `
    CREATE TABLE IF NOT EXISTS credit_cards (
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
    )
  `;

  // Incomes tablosu
  const createIncomesTable = `
    CREATE TABLE IF NOT EXISTS incomes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(100) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      source VARCHAR(100) NOT NULL,
      income_type ENUM('salary', 'part_time', 'rental', 'investment', 'food_card', 'other') NOT NULL,
      description TEXT,
      income_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  // Expense Categories tablosu
  const createExpenseCategoriesTable = `
    CREATE TABLE IF NOT EXISTS expense_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      color VARCHAR(7) DEFAULT '#007bff',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Expenses tablosu
  const createExpensesTable = `
    CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(100) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      category_id INT,
      expense_type VARCHAR(100),
      payment_method ENUM('cash', 'credit_card', 'bank_transfer', 'credit_account') NOT NULL,
      related_account_id INT,
      related_credit_card_id INT,
      related_credit_account_id INT,
      due_date DATE,
      payment_date DATE,
      description TEXT,
      is_paid BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL,
      FOREIGN KEY (related_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
      FOREIGN KEY (related_credit_card_id) REFERENCES credit_cards(id) ON DELETE SET NULL,
      FOREIGN KEY (related_credit_account_id) REFERENCES accounts(id) ON DELETE SET NULL
    )
  `;

  // Rent Expenses tablosu
  const createRentExpensesTable = `
    CREATE TABLE IF NOT EXISTS rent_expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      expense_id INT NOT NULL,
      rent_amount DECIMAL(15,2) NOT NULL,
      maintenance_fee DECIMAL(15,2) DEFAULT 0,
      property_tax DECIMAL(15,2) DEFAULT 0,
      insurance DECIMAL(15,2) DEFAULT 0,
      other_fees DECIMAL(15,2) DEFAULT 0,
      property_address TEXT,
      landlord_name VARCHAR(100),
      contract_start_date DATE,
      contract_end_date DATE,
      due_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE
    )
  `;

  // Credit Payments tablosu
  const createCreditPaymentsTable = `
    CREATE TABLE IF NOT EXISTS credit_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      expense_id INT NOT NULL,
      payment_type VARCHAR(50),
      principal_amount DECIMAL(15,2) DEFAULT 0,
      interest_amount DECIMAL(15,2) DEFAULT 0,
      late_fee DECIMAL(15,2) DEFAULT 0,
      minimum_payment DECIMAL(15,2) DEFAULT 0,
      statement_date DATE,
      due_date DATE,
      payment_date DATE,
      is_minimum_payment BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE
    )
  `;

  // Periodic Expenses tablosu
  const createPeriodicExpensesTable = `
    CREATE TABLE IF NOT EXISTS periodic_expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(100) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      frequency ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  // System Parameters tablosu
  const createSystemParametersTable = `
    CREATE TABLE IF NOT EXISTS system_parameters (
      id INT AUTO_INCREMENT PRIMARY KEY,
      param_key VARCHAR(100) UNIQUE NOT NULL,
      param_value TEXT,
      param_type ENUM('string', 'number', 'boolean', 'json', 'date') DEFAULT 'string',
      description TEXT,
      is_editable BOOLEAN DEFAULT TRUE,
      category VARCHAR(50) DEFAULT 'general',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  // Tabloları oluştur
  connection.query(createUsersTable, (err) => {
    if (err) {
      console.error('Users tablosu oluşturma hatası:', err);
    } else {
      console.log('✅ Users tablosu oluşturuldu');
    }
  });

  connection.query(createSystemParametersTable, (err) => {
    if (err) {
      console.error('System Parameters tablosu oluşturma hatası:', err);
    } else {
      console.log('✅ System Parameters tablosu oluşturuldu');
      initializeSystemParameters();
    }
  });

  connection.query(createBanksTable, (err) => {
    if (err) {
      console.error('Banks tablosu oluşturma hatası:', err);
    } else {
      console.log('✅ Banks tablosu oluşturuldu');
    }
  });

  connection.query(createAccountsTable, (err) => {
    if (err) {
      console.error('Accounts tablosu oluşturma hatası:', err);
    } else {
      console.log('✅ Accounts tablosu oluşturuldu');
    }
  });

  connection.query(createCreditCardsTable, (err) => {
    if (err) {
      console.error('Credit Cards tablosu oluşturma hatası:', err);
    } else {
      console.log('✅ Credit Cards tablosu oluşturuldu');
    }
  });

  connection.query(createIncomesTable, (err) => {
    if (err) {
      console.error('Incomes tablosu oluşturma hatası:', err);
    } else {
      console.log('✅ Incomes tablosu oluşturuldu');
    }
  });

  connection.query(createExpenseCategoriesTable, (err) => {
    if (err) {
      console.error('Expense Categories tablosu oluşturma hatası:', err);
    } else {
      console.log('✅ Expense Categories tablosu oluşturuldu');
    }
  });

  connection.query(createExpensesTable, (err) => {
    if (err) {
      console.error('Expenses tablosu oluşturma hatası:', err);
    } else {
      console.log('✅ Expenses tablosu oluşturuldu');
    }
  });

  connection.query(createRentExpensesTable, (err) => {
    if (err) {
      console.error('Rent Expenses tablosu oluşturma hatası:', err);
    } else {
      console.log('✅ Rent Expenses tablosu oluşturuldu');
    }
  });

  connection.query(createCreditPaymentsTable, (err) => {
    if (err) {
      console.error('Credit Payments tablosu oluşturma hatası:', err);
    } else {
      console.log('✅ Credit Payments tablosu oluşturuldu');
    }
  });

  connection.query(createPeriodicExpensesTable, (err) => {
    if (err) {
      console.error('Periodic Expenses tablosu oluşturma hatası:', err);
    } else {
      console.log('✅ Periodic Expenses tablosu oluşturuldu');
    }
  });

  // Varsayılan gider kategorileri setup_database.sql dosyasından ekleniyor
  // Burada tekrar eklemeye gerek yok
}

// Sistem parametrelerini başlat
function initializeSystemParameters() {
  const defaultParams = [
    // Genel Uygulama Parametreleri
    { param_key: 'app_name', param_value: 'Gelir Gider Takip', param_type: 'string', description: 'Uygulama adı', category: 'general' },
    { param_key: 'app_version', param_value: '1.0.0', param_type: 'string', description: 'Uygulama versiyonu', category: 'general' },
    { param_key: 'default_currency', param_value: 'TRY', param_type: 'string', description: 'Varsayılan para birimi', category: 'financial' },
    { param_key: 'tax_rate', param_value: '18', param_type: 'number', description: 'Varsayılan vergi oranı (%)', category: 'financial' },
    
    // Gelir Parametreleri
    { param_key: 'income_types', param_value: JSON.stringify(['salary', 'part_time', 'rental', 'investment', 'food_card', 'other']), param_type: 'json', description: 'Gelir türleri', category: 'income' },
    { param_key: 'income_sources', param_value: JSON.stringify(['Maaş', 'Yan Gelir', 'Kira Geliri', 'Yatırım', 'Yemek Kartı', 'Diğer']), param_type: 'json', description: 'Gelir kaynakları', category: 'income' },
    { param_key: 'min_income_amount', param_value: '0.01', param_type: 'number', description: 'Minimum gelir tutarı', category: 'income' },
    { param_key: 'max_income_amount', param_value: '999999999.99', param_type: 'number', description: 'Maksimum gelir tutarı', category: 'income' },
    
    // Gider Parametreleri
    { param_key: 'expense_categories', param_value: JSON.stringify(['Gıda', 'Ulaşım', 'Konut', 'Sağlık', 'Eğlence', 'Alışveriş', 'Faturalar', 'Diğer']), param_type: 'json', description: 'Gider kategorileri', category: 'expense' },
    { param_key: 'expense_types', param_value: JSON.stringify(['Günlük', 'Haftalık', 'Aylık', 'Yıllık', 'Tek Seferlik']), param_type: 'json', description: 'Gider türleri', category: 'expense' },
    { param_key: 'payment_methods', param_value: JSON.stringify(['cash', 'credit_card', 'bank_transfer', 'credit_account']), param_type: 'json', description: 'Ödeme yöntemleri', category: 'expense' },
    { param_key: 'payment_method_labels', param_value: JSON.stringify(['Nakit', 'Kredi Kartı', 'Banka Transferi', 'Kredi Hesabı']), param_type: 'json', description: 'Ödeme yöntemi etiketleri', category: 'expense' },
    { param_key: 'min_expense_amount', param_value: '0.01', param_type: 'number', description: 'Minimum gider tutarı', category: 'expense' },
    { param_key: 'max_expense_amount', param_value: '999999999.99', param_type: 'number', description: 'Maksimum gider tutarı', category: 'expense' },
    
    // Hesap Parametreleri
    { param_key: 'account_types', param_value: JSON.stringify(['vadeli', 'vadesiz']), param_type: 'json', description: 'Hesap türleri', category: 'account' },
    { param_key: 'account_type_labels', param_value: JSON.stringify(['Vadeli Hesap', 'Vadesiz Hesap']), param_type: 'json', description: 'Hesap türü etiketleri', category: 'account' },
    { param_key: 'min_account_balance', param_value: '0.00', param_type: 'number', description: 'Minimum hesap bakiyesi', category: 'account' },
    { param_key: 'max_account_balance', param_value: '999999999999.99', param_type: 'number', description: 'Maksimum hesap bakiyesi', category: 'account' },
    { param_key: 'iban_format', param_value: 'TR[0-9]{2}[0-9]{4}[0-9]{4}[0-9]{4}[0-9]{4}[0-9]{2}', param_type: 'string', description: 'IBAN format regex', category: 'account' },
    
    // Kredi Kartı Parametreleri
    { param_key: 'min_credit_limit', param_value: '100.00', param_type: 'number', description: 'Minimum kredi kartı limiti', category: 'credit_card' },
    { param_key: 'max_credit_limit', param_value: '999999999.99', param_type: 'number', description: 'Maksimum kredi kartı limiti', category: 'credit_card' },
    { param_key: 'statement_dates', param_value: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]), param_type: 'json', description: 'Kullanılabilir ekstre tarihleri', category: 'credit_card' },
    { param_key: 'card_number_format', param_value: '[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}', param_type: 'string', description: 'Kart numarası format regex', category: 'credit_card' },
    
    // Kredi Parametreleri
    { param_key: 'loan_types', param_value: JSON.stringify(['İhtiyaç Kredisi', 'Konut Kredisi', 'Taşıt Kredisi', 'Ticari Kredi', 'Öğrenci Kredisi']), param_type: 'json', description: 'Kredi türleri', category: 'loan' },
    { param_key: 'min_loan_amount', param_value: '1000.00', param_type: 'number', description: 'Minimum kredi tutarı', category: 'loan' },
    { param_key: 'max_loan_amount', param_value: '999999999.99', param_type: 'number', description: 'Maksimum kredi tutarı', category: 'loan' },
    { param_key: 'loan_terms', param_value: JSON.stringify([3, 6, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120]), param_type: 'json', description: 'Kredi vade seçenekleri (ay)', category: 'loan' },
    
    // Bildirim Parametreleri
    { param_key: 'email_notifications', param_value: 'true', param_type: 'boolean', description: 'E-posta bildirimleri aktif mi?', category: 'notifications' },
    { param_key: 'sms_notifications', param_value: 'false', param_type: 'boolean', description: 'SMS bildirimleri aktif mi?', category: 'notifications' },
    { param_key: 'push_notifications', param_value: 'true', param_type: 'boolean', description: 'Push bildirimleri aktif mi?', category: 'notifications' },
    { param_key: 'budget_alerts', param_value: 'true', param_type: 'boolean', description: 'Bütçe uyarıları aktif mi?', category: 'notifications' },
    { param_key: 'expense_reminders', param_value: 'true', param_type: 'boolean', description: 'Gider hatırlatıcıları aktif mi?', category: 'notifications' },
    { param_key: 'credit_card_alerts', param_value: 'true', param_type: 'boolean', description: 'Kredi kartı uyarıları aktif mi?', category: 'notifications' },
    { param_key: 'loan_alerts', param_value: 'true', param_type: 'boolean', description: 'Kredi uyarıları aktif mi?', category: 'notifications' },
    
    // Güvenlik Parametreleri
    { param_key: 'password_min_length', param_value: '8', param_type: 'number', description: 'Minimum şifre uzunluğu', category: 'security' },
    { param_key: 'max_login_attempts', param_value: '5', param_type: 'number', description: 'Maksimum giriş denemesi', category: 'security' },
    { param_key: 'lockout_duration', param_value: '900', param_type: 'number', description: 'Hesap kilitleme süresi (saniye)', category: 'security' },
    { param_key: 'session_timeout', param_value: '3600', param_type: 'number', description: 'Oturum zaman aşımı (saniye)', category: 'security' },
    { param_key: 'auto_logout', param_value: 'true', param_type: 'boolean', description: 'Otomatik çıkış aktif mi?', category: 'security' },
    
    // Sistem Parametreleri
    { param_key: 'maintenance_mode', param_value: 'false', param_type: 'boolean', description: 'Bakım modu aktif mi?', category: 'system' },
    { param_key: 'debug_mode', param_value: 'false', param_type: 'boolean', description: 'Debug modu aktif mi?', category: 'system' },
    { param_key: 'log_level', param_value: 'info', param_type: 'string', description: 'Log seviyesi', category: 'system' },
    { param_key: 'max_file_size', param_value: '5242880', param_type: 'number', description: 'Maksimum dosya boyutu (byte)', category: 'system' },
    { param_key: 'backup_frequency', param_value: 'daily', param_type: 'string', description: 'Yedekleme sıklığı', category: 'system' },
    
    // Lokalizasyon Parametreleri
    { param_key: 'language', param_value: 'tr', param_type: 'string', description: 'Varsayılan dil', category: 'localization' },
    { param_key: 'timezone', param_value: 'Europe/Istanbul', param_type: 'string', description: 'Varsayılan saat dilimi', category: 'localization' },
    { param_key: 'date_format', param_value: 'DD/MM/YYYY', param_type: 'string', description: 'Tarih formatı', category: 'localization' },
    { param_key: 'time_format', param_value: 'HH:mm', param_type: 'string', description: 'Saat formatı', category: 'localization' },
    
    // Raporlama Parametreleri
    { param_key: 'reporting_enabled', param_value: 'true', param_type: 'boolean', description: 'Raporlama özelliği aktif mi?', category: 'reporting' },
    { param_key: 'export_enabled', param_value: 'true', param_type: 'boolean', description: 'Dışa aktarma özelliği aktif mi?', category: 'reporting' },
    { param_key: 'export_format', param_value: 'excel', param_type: 'string', description: 'Varsayılan dışa aktarma formatı', category: 'reporting' },
    { param_key: 'data_retention_days', param_value: '2555', param_type: 'number', description: 'Veri saklama süresi (gün)', category: 'reporting' },
    
    // API Parametreleri
    { param_key: 'api_rate_limit', param_value: '100', param_type: 'number', description: 'API istek sınırı (dakikada)', category: 'api' },
    { param_key: 'api_timeout', param_value: '30000', param_type: 'number', description: 'API zaman aşımı (ms)', category: 'api' },
    
    // AI ve Otomasyon Parametreleri
    { param_key: 'auto_categorization', param_value: 'true', param_type: 'boolean', description: 'Otomatik kategorizasyon aktif mi?', category: 'ai' },
    { param_key: 'ai_analysis', param_value: 'true', param_type: 'boolean', description: 'AI analiz özelliği aktif mi?', category: 'ai' },
    { param_key: 'smart_budgeting', param_value: 'true', param_type: 'boolean', description: 'Akıllı bütçeleme aktif mi?', category: 'ai' },
    
    // Finansal Parametreleri
    { param_key: 'decimal_places', param_value: '2', param_type: 'number', description: 'Ondalık basamak sayısı', category: 'financial' },
    { param_key: 'rounding_method', param_value: 'round', param_type: 'string', description: 'Yuvarlama yöntemi', category: 'financial' },
    { param_key: 'currency_symbol', param_value: '₺', param_type: 'string', description: 'Para birimi sembolü', category: 'financial' },
    { param_key: 'thousand_separator', param_value: '.', param_type: 'string', description: 'Binlik ayırıcı', category: 'financial' },
    { param_key: 'decimal_separator', param_value: ',', param_type: 'string', description: 'Ondalık ayırıcı', category: 'financial' }
  ];

  defaultParams.forEach(param => {
    const checkQuery = 'SELECT id FROM system_parameters WHERE param_key = ?';
    connection.query(checkQuery, [param.param_key], (err, results) => {
      if (err) {
        console.error(`Parametre kontrol hatası (${param.param_key}):`, err);
        return;
      }
      
      if (results.length === 0) {
        const insertQuery = 'INSERT INTO system_parameters (param_key, param_value, param_type, description, category) VALUES (?, ?, ?, ?, ?)';
        connection.query(insertQuery, [param.param_key, param.param_value, param.param_type, param.description, param.category], (err) => {
          if (err) {
            console.error(`Parametre ekleme hatası (${param.param_key}):`, err);
          } else {
            console.log(`✅ Parametre eklendi: ${param.param_key}`);
          }
        });
      }
    });
  });
}

// API Routes

// Authentication Routes
// Kullanıcı kaydı
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    // Gerekli alanları kontrol et
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tüm alanlar zorunludur' 
      });
    }

    // Şifreyi hash'le
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Kullanıcıyı veritabanına ekle
    const query = `
      INSERT INTO users (username, email, password_hash, full_name) 
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await connection.promise().execute(query, [
      username, email, passwordHash, full_name
    ]);

    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla kaydedildi',
      user_id: result.insertId
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.message.includes('username')) {
        return res.status(400).json({ 
          success: false, 
          message: 'Bu kullanıcı adı zaten kullanılıyor' 
        });
      } else if (error.message.includes('email')) {
        return res.status(400).json({ 
          success: false, 
          message: 'Bu e-posta adresi zaten kullanılıyor' 
        });
      }
    }
    
    console.error('Kullanıcı kayıt hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Kullanıcı kaydedilirken hata oluştu' 
    });
  }
});

// Kullanıcı girişi
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Gerekli alanları kontrol et
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Kullanıcı adı ve şifre zorunludur' 
      });
    }

    // Kullanıcıyı veritabanından bul
    const query = 'SELECT * FROM users WHERE username = ? AND is_active = TRUE';
    const [users] = await connection.promise().execute(query, [username]);

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz kullanıcı adı veya şifre' 
      });
    }

    const user = users[0];

    // Şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz kullanıcı adı veya şifre' 
      });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { 
        user_id: user.id, 
        username: user.username, 
        email: user.email,
        full_name: user.full_name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Son giriş tarihini güncelle
    await connection.promise().execute(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    res.json({
      success: true,
      message: 'Giriş başarılı',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name
      }
    });

  } catch (error) {
    console.error('Kullanıcı giriş hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Giriş yapılırken hata oluştu' 
    });
  }
});

// Kullanıcı profilini getir
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// ==================== ADMIN API ENDPOINTS ====================

// Admin Giriş Endpoint'i
app.post('/api/admin/login', async (req, res) => {
  try {
    const { adminPassword } = req.body;
    
    if (!adminPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin şifresi gerekli' 
      });
    }
    
    if (adminPassword === SYSTEM_CONFIG.application.adminPassword) {
      res.json({
        success: true,
        message: 'Admin girişi başarılı',
        adminPassword: SYSTEM_CONFIG.application.adminPassword
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Geçersiz admin şifresi'
      });
    }
  } catch (error) {
    console.error('Admin giriş hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Admin girişi sırasında hata oluştu'
    });
  }
});

// Admin Dashboard İstatistikleri
app.post('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
  try {
    // Toplam kullanıcı sayısı
    const [usersResult] = await connection.promise().execute('SELECT COUNT(*) as total FROM users');
    const totalUsers = usersResult[0].total;

    // Aktif kullanıcı sayısı
    const [activeUsersResult] = await connection.promise().execute('SELECT COUNT(*) as total FROM users WHERE is_active = TRUE');
    const activeUsers = activeUsersResult[0].total;

    // Toplam hesap sayısı
    const [accountsResult] = await connection.promise().execute('SELECT COUNT(*) as total FROM accounts');
    const totalAccounts = accountsResult[0].total;

    // Toplam kredi kartı sayısı
    const [creditCardsResult] = await connection.promise().execute('SELECT COUNT(*) as total FROM credit_cards');
    const totalCreditCards = creditCardsResult[0].total;

    // Toplam gelir sayısı
    const [incomesResult] = await connection.promise().execute('SELECT COUNT(*) as total FROM incomes');
    const totalIncomes = incomesResult[0].total;

    // Toplam gider sayısı
    const [expensesResult] = await connection.promise().execute('SELECT COUNT(*) as total FROM expenses');
    const totalExpenses = expensesResult[0].total;

    // Toplam kira gideri sayısı
    const [rentExpensesResult] = await connection.promise().execute('SELECT COUNT(*) as total FROM rent_expenses');
    const totalRentExpenses = rentExpensesResult[0].total;

    // Son 7 gün kayıt olan kullanıcılar
    const [recentUsersResult] = await connection.promise().execute(`
      SELECT COUNT(*) as total FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    const recentUsers = recentUsersResult[0].total;

    // Son giriş yapan kullanıcılar
    const [lastLoginResult] = await connection.promise().execute(`
      SELECT username, full_name, last_login 
      FROM users 
      WHERE last_login IS NOT NULL 
      ORDER BY last_login DESC 
      LIMIT 5
    `);
    const lastLoginUsers = lastLoginResult;

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalAccounts,
        totalCreditCards,
        totalIncomes,
        totalExpenses,
        totalRentExpenses,
        recentUsers
      },
      lastLoginUsers
    });

  } catch (error) {
    console.error('Admin dashboard hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Admin dashboard verileri alınırken hata oluştu' 
    });
  }
});

// Tüm Kullanıcıları Getir
app.post('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const [users] = await connection.promise().execute(`
      SELECT 
        id, username, email, full_name, is_active, 
        last_login, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Kullanıcı listesi hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Kullanıcı listesi alınırken hata oluştu' 
    });
  }
});

// Kullanıcı Durumunu Değiştir
app.post('/api/admin/users/toggle-status', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    
    const [result] = await connection.promise().execute(`
      UPDATE users SET is_active = NOT is_active WHERE id = ?
    `, [userId]);

    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: 'Kullanıcı durumu güncellendi'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

  } catch (error) {
    console.error('Kullanıcı durum güncelleme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Kullanıcı durumu güncellenirken hata oluştu' 
    });
  }
});

// Veritabanı Reset (Tüm verileri sil)
app.post('/api/admin/reset-database', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔄 Veritabanı sıfırlama başlatılıyor...');
    
    // Foreign key constraint'leri geçici olarak devre dışı bırak
    await connection.promise().execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Tüm tabloları temizle (foreign key constraint'ler nedeniyle sıralı silme)
    const tablesToClean = [
      'rent_expenses',
      'credit_payments', 
      'periodic_expenses',
      'expenses',
      'incomes',
      'credit_cards',
      'accounts',
      'users',
      'banks',
      'expense_categories'
    ];
    
    for (const table of tablesToClean) {
      try {
        await connection.promise().execute(`TRUNCATE TABLE ${table}`);
        console.log(`✅ ${table} tablosu temizlendi`);
      } catch (error) {
        console.error(`❌ ${table} tablosu temizlenirken hata:`, error);
        // Tablo yoksa oluştur
        if (error.code === 'ER_NO_SUCH_TABLE') {
          console.log(`📋 ${table} tablosu bulunamadı, oluşturulacak`);
        }
      }
    }
    
    // Foreign key constraint'leri tekrar etkinleştir
    await connection.promise().execute('SET FOREIGN_KEY_CHECKS = 1');
    
    // Auto increment değerlerini sıfırla
    for (const table of tablesToClean) {
      try {
        await connection.promise().execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
      } catch (error) {
        // Tablo yoksa hata verme
      }
    }
    
    console.log('✅ Veritabanı başarıyla sıfırlandı');
    
    res.json({
      success: true,
      message: 'Veritabanı başarıyla sıfırlandı. Tüm tablolar temizlendi ve auto increment değerleri sıfırlandı.',
      details: {
        tablesCleaned: tablesToClean.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Veritabanı reset hatası:', error);
    
    // Foreign key constraint'leri tekrar etkinleştirmeye çalış
    try {
      await connection.promise().execute('SET FOREIGN_KEY_CHECKS = 1');
    } catch (fkError) {
      console.error('Foreign key constraint etkinleştirme hatası:', fkError);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Veritabanı sıfırlanırken hata oluştu: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Detaylar loglarda'
    });
  }
});

// Mock Veri Ekle (Profesyonel Test Verileri - Sistem Tamamen Dolu)
app.post('/api/admin/insert-mock-data', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔄 Profesyonel test verileri ekleniyor...');
    
    // Önce mevcut verileri temizle ve tabloları yeniden oluştur
    await connection.promise().execute('SET FOREIGN_KEY_CHECKS = 0');
    
    const tablesToClean = [
      'rent_expenses',
      'credit_payments', 
      'periodic_expenses',
      'expenses',
      'incomes',
      'credit_cards',
      'accounts',
      'users',
      'banks',
      'expense_categories'
    ];
    
    for (const table of tablesToClean) {
      try {
        await connection.promise().execute(`DROP TABLE IF EXISTS ${table}`);
        console.log(`🗑️ ${table} tablosu silindi`);
      } catch (error) {
        console.log(`📋 ${table} tablosu silinemedi:`, error.message);
      }
    }
    
    await connection.promise().execute('SET FOREIGN_KEY_CHECKS = 1');
    
    // Tabloları yeniden oluştur
    console.log('🔨 Tablolar yeniden oluşturuluyor...');
    createTables();
    
    // Tabloların oluşturulmasını bekle
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 1. Gider Kategorileri Ekle (8 temel kategori)
    const expenseCategories = [
      { name: 'Gıda', color: '#28a745' },
      { name: 'Ulaşım', color: '#007bff' },
      { name: 'Ev Giderleri', color: '#ffc107' },
      { name: 'Sağlık', color: '#dc3545' },
      { name: 'Eğlence', color: '#6f42c1' },
      { name: 'Alışveriş', color: '#fd7e14' },
      { name: 'Faturalar', color: '#20c997' },
      { name: 'Diğer', color: '#6c757d' }
    ];
    
    for (const category of expenseCategories) {
      await connection.promise().execute(`
        INSERT INTO expense_categories (name, color) VALUES (?, ?)
      `, [category.name, category.color]);
    }
    console.log('✅ Gider kategorileri eklendi (8 adet)');
    
    // 2. Test Kullanıcıları Ekle (3 kullanıcı - test1, test2, test3)
    const testUsers = [
      { username: 'test1', email: 'test1@example.com', full_name: 'Test Kullanıcı 1', password: '12345' },
      { username: 'test2', email: 'test2@example.com', full_name: 'Test Kullanıcı 2', password: '12345' },
      { username: 'test3', email: 'test3@example.com', full_name: 'Test Kullanıcı 3', password: '12345' }
    ];

    for (const user of testUsers) {
      const passwordHash = await bcrypt.hash(user.password, 12);
      await connection.promise().execute(`
        INSERT INTO users (username, email, password_hash, full_name) 
        VALUES (?, ?, ?, ?)
      `, [user.username, user.email, passwordHash, user.full_name]);
    }
    console.log('✅ Test kullanıcıları eklendi (3 adet)');
    
    // Kullanıcı ID'lerini al
    const [userResults] = await connection.promise().execute('SELECT id FROM users ORDER BY id');
    const userIds = userResults.map(user => user.id);

    // 3. Türk Bankaları Ekle (3 banka)
    const turkishBanks = [
      { bank_name: 'Test Bankası 1' },
      { bank_name: 'Test Bankası 2' },
      { bank_name: 'Test Bankası 3' }
    ];

    for (const bank of turkishBanks) {
      await connection.promise().execute(`
        INSERT INTO banks (bank_name) VALUES (?)
      `, [bank.bank_name]);
    }
    console.log('✅ Test bankaları eklendi (3 adet)');

    // 4. Banka ID'lerini al
    const [bankResults] = await connection.promise().execute('SELECT id FROM banks ORDER BY id');
    const bankIds = bankResults.map(bank => bank.id);

    // 5. Test Hesapları Ekle (3 hesap)
    const testAccounts = [
      { account_name: 'Test Hesabı 1', account_number: 'TR123456789012345678901234', iban: 'TR123456789012345678901234', account_type: 'vadesiz', current_balance: 50000, is_credit_account: false, account_limit: 0, credit_limit: 0 },
      { account_name: 'Test Hesabı 2', account_number: 'TR987654321098765432109876', iban: 'TR987654321098765432109876', account_type: 'vadeli', current_balance: 100000, is_credit_account: false, account_limit: 0, credit_limit: 0 },
      { account_name: 'Test Hesabı 3', account_number: 'TR111111111111111111111111', iban: 'TR111111111111111111111111', account_type: 'vadesiz', current_balance: 25000, is_credit_account: true, account_limit: 50000, credit_limit: 0 }
    ];

    for (let i = 0; i < testAccounts.length; i++) {
      const account = testAccounts[i];
      await connection.promise().execute(`
        INSERT INTO accounts (user_id, bank_id, account_name, account_number, iban, account_type, current_balance, is_credit_account, account_limit, credit_limit) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [userIds[i % userIds.length], bankIds[i % bankIds.length], account.account_name, account.account_number, account.iban, account.account_type, account.current_balance, account.is_credit_account, account.account_limit, account.credit_limit]);
    }
    console.log('✅ Test hesapları eklendi (3 adet)');

    // 6. Test Kredi Kartları Ekle (3 kart)
    const testCreditCards = [
      { card_name: 'Test Kartı 1', card_number: '1234567890123456', card_limit: 30000, remaining_limit: 25000, statement_date: 15 },
      { card_name: 'Test Kartı 2', card_number: '9876543210987654', card_limit: 50000, remaining_limit: 40000, statement_date: 20 },
      { card_name: 'Test Kartı 3', card_number: '1111111111111111', card_limit: 20000, remaining_limit: 15000, statement_date: 25 }
    ];

    for (let i = 0; i < testCreditCards.length; i++) {
      const card = testCreditCards[i];
      await connection.promise().execute(`
        INSERT INTO credit_cards (user_id, bank_id, card_name, card_number, card_limit, remaining_limit, statement_date) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [userIds[i % userIds.length], bankIds[i % bankIds.length], card.card_name, card.card_number, card.card_limit, card.remaining_limit, card.statement_date]);
    }
    console.log('✅ Test kredi kartları eklendi (3 adet)');

    // 7. Test Gelirleri Ekle (3 gelir)
    const testIncomes = [
      { title: 'Maaş', amount: 15000, source: 'Maaş', income_type: 'salary', description: 'Aylık maaş', income_date: '2024-01-15' },
      { title: 'Ek İş', amount: 8000, source: 'Ek İş', income_type: 'part_time', description: 'Ek iş geliri', income_date: '2024-01-20' },
      { title: 'Kira Geliri', amount: 5000, source: 'Kira Geliri', income_type: 'rental', description: 'Kira geliri', income_date: '2024-01-25' }
    ];

    for (let i = 0; i < testIncomes.length; i++) {
      const income = testIncomes[i];
      await connection.promise().execute(`
        INSERT INTO incomes (user_id, title, amount, source, income_type, description, income_date) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [userIds[i % userIds.length], income.title, income.amount, income.source, income.income_type, income.description, income.income_date]);
    }
    console.log('✅ Test gelirleri eklendi (3 adet)');

    // 8. Kategori ID'lerini al
    const [categoryResults] = await connection.promise().execute('SELECT id FROM expense_categories ORDER BY id LIMIT 3');
    const categoryIds = categoryResults.map(cat => cat.id);

    // 9. Test Giderleri Ekle (3 gider)
    const testExpenses = [
      { title: 'Market Alışverişi', amount: 3000, category_id: categoryIds[0], expense_type: 'Gıda', payment_method: 'cash', description: 'Market alışverişi', payment_date: '2024-01-10', is_paid: true },
      { title: 'Benzin', amount: 1500, category_id: categoryIds[1], expense_type: 'Ulaşım', payment_method: 'credit_card', description: 'Benzin alımı', payment_date: '2024-01-12', is_paid: true },
      { title: 'Elektrik Faturası', amount: 2000, category_id: categoryIds[2], expense_type: 'Ev Giderleri', payment_method: 'bank_transfer', description: 'Elektrik faturası', payment_date: '2024-01-15', is_paid: true }
    ];

    for (let i = 0; i < testExpenses.length; i++) {
      const expense = testExpenses[i];
      await connection.promise().execute(`
        INSERT INTO expenses (user_id, title, amount, category_id, expense_type, payment_method, description, payment_date, is_paid) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [userIds[i % userIds.length], expense.title, expense.amount, expense.category_id, expense.expense_type, expense.payment_method, expense.description, expense.payment_date, expense.is_paid]);
    }
    console.log('✅ Test giderleri eklendi (3 adet)');

    // 10. Expense ID'lerini al
    const [expenseResults] = await connection.promise().execute('SELECT id FROM expenses ORDER BY id LIMIT 2');

    // 11. Test Kira Giderleri Ekle (2 kira gideri)
    const testRentExpenses = [
      { rent_amount: 8000, maintenance_fee: 500, property_tax: 300, insurance: 200, other_fees: 0, property_address: 'Test Adres 1', landlord_name: 'Test Ev Sahibi 1', contract_start_date: '2023-01-01', contract_end_date: '2024-12-31', due_date: '2024-02-01' },
      { rent_amount: 12000, maintenance_fee: 800, property_tax: 500, insurance: 300, other_fees: 150, property_address: 'Test Adres 2', landlord_name: 'Test Ev Sahibi 2', contract_start_date: '2023-06-01', contract_end_date: '2024-05-31', due_date: '2024-02-01' }
    ];

    for (let i = 0; i < testRentExpenses.length; i++) {
      const rent = testRentExpenses[i];
      await connection.promise().execute(`
        INSERT INTO rent_expenses (expense_id, rent_amount, maintenance_fee, property_tax, insurance, other_fees, property_address, landlord_name, contract_start_date, contract_end_date, due_date) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [expenseResults[i].id, rent.rent_amount, rent.maintenance_fee, rent.property_tax, rent.insurance, rent.other_fees, rent.property_address, rent.landlord_name, rent.contract_start_date, rent.contract_end_date, rent.due_date]);
    }
    console.log('✅ Test kira giderleri eklendi (2 adet)');

    // 12. Test Kredi Ödemeleri Ekle (2 kredi ödemesi)
    const testCreditPayments = [
      { payment_type: 'Minimum Ödeme', principal_amount: 2000, interest_amount: 300, late_fee: 0, minimum_payment: 2300, statement_date: '2024-01-15', due_date: '2024-02-15', payment_date: '2024-02-10', is_minimum_payment: true },
      { payment_type: 'Tam Ödeme', principal_amount: 5000, interest_amount: 450, late_fee: 0, minimum_payment: 5450, statement_date: '2024-01-20', due_date: '2024-02-20', payment_date: '2024-02-18', is_minimum_payment: false }
    ];

    for (let i = 0; i < testCreditPayments.length; i++) {
      const payment = testCreditPayments[i];
      await connection.promise().execute(`
        INSERT INTO credit_payments (expense_id, payment_type, principal_amount, interest_amount, late_fee, minimum_payment, statement_date, due_date, payment_date, is_minimum_payment) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [expenseResults[i].id, payment.payment_type, payment.principal_amount, payment.interest_amount, payment.late_fee, payment.minimum_payment, payment.statement_date, payment.due_date, payment.payment_date, payment.is_minimum_payment]);
    }
    console.log('✅ Test kredi ödemeleri eklendi (2 adet)');

    // 13. Test Periyodik Giderler Ekle (3 periyodik gider)
    const testPeriodicExpenses = [
      { title: 'Spor Salonu Üyeliği', amount: 600, frequency: 'monthly', start_date: '2024-01-01', end_date: '2024-12-31', is_active: true },
      { title: 'İnternet Faturası', amount: 300, frequency: 'monthly', start_date: '2024-01-01', end_date: null, is_active: true },
      { title: 'Telefon Faturası', amount: 250, frequency: 'monthly', start_date: '2024-01-01', end_date: null, is_active: true }
    ];

    for (let i = 0; i < testPeriodicExpenses.length; i++) {
      const periodic = testPeriodicExpenses[i];
      await connection.promise().execute(`
        INSERT INTO periodic_expenses (user_id, title, amount, frequency, start_date, end_date, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [userIds[i % userIds.length], periodic.title, periodic.amount, periodic.frequency, periodic.start_date, periodic.end_date, periodic.is_active]);
    }
    console.log('✅ Test periyodik giderler eklendi (3 adet)');

    console.log('🎉 Tüm test verileri başarıyla eklendi!');
    console.log('📊 Özet:');
    console.log(`   - Gider Kategorileri: ${expenseCategories.length} adet`);
    console.log(`   - Kullanıcılar: ${testUsers.length} adet (test1, test2, test3)`);
    console.log(`   - Bankalar: ${turkishBanks.length} adet`);
    console.log(`   - Hesaplar: ${testAccounts.length} adet`);
    console.log(`   - Kredi Kartları: ${testCreditCards.length} adet`);
    console.log(`   - Gelirler: ${testIncomes.length} adet`);
    console.log(`   - Giderler: ${testExpenses.length} adet`);
    console.log(`   - Kira Giderleri: ${testRentExpenses.length} adet`);
    console.log(`   - Kredi Ödemeleri: ${testCreditPayments.length} adet`);
    console.log(`   - Periyodik Giderler: ${testPeriodicExpenses.length} adet`);
    
    res.json({
      success: true,
      message: 'Test verileri başarıyla eklendi! Sistem tamamen dolu ve test edilmeye hazır.',
      details: {
        users: testUsers.length,
        banks: turkishBanks.length,
        accounts: testAccounts.length,
        creditCards: testCreditCards.length,
        incomes: testIncomes.length,
        expenses: testExpenses.length,
        rentExpenses: testRentExpenses.length,
        creditPayments: testCreditPayments.length,
        periodicExpenses: testPeriodicExpenses.length,
        expenseCategories: expenseCategories.length,
        totalRecords: testUsers.length + turkishBanks.length + testAccounts.length + testCreditCards.length + testIncomes.length + testExpenses.length + testRentExpenses.length + testCreditPayments.length + testPeriodicExpenses.length + expenseCategories.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Mock veri ekleme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Mock veriler eklenirken hata oluştu: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Detaylar loglarda'
    });
  }
 });

// Sistem Parametrelerini Getir
app.post('/api/admin/system-params', authenticateAdmin, async (req, res) => {
  try {
    // Veritabanı boyutu
    const [dbSizeResult] = await connection.promise().execute(`
      SELECT 
        table_schema AS 'Database',
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
      FROM information_schema.tables 
      WHERE table_schema = 'income_expense_tracker'
      GROUP BY table_schema
    `);

    // Tablo boyutları
    const [tableSizesResult] = await connection.promise().execute(`
      SELECT 
        table_name AS 'Table',
        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)',
        table_rows AS 'Rows'
      FROM information_schema.tables 
      WHERE table_schema = 'income_expense_tracker'
      ORDER BY (data_length + index_length) DESC
    `);

    // Aktif bağlantılar
    const [connectionsResult] = await connection.promise().execute(`
      SHOW STATUS LIKE 'Threads_connected'
    `);

    res.json({
      success: true,
      systemParams: {
        databaseSize: dbSizeResult[0] || { 'Size (MB)': 0 },
        tableSizes: tableSizesResult,
        activeConnections: connectionsResult[0]?.Value || 0,
        serverInfo: {
          version: process.version,
          platform: process.platform,
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage()
        },
        systemConfig: SYSTEM_CONFIG
      }
    });

  } catch (error) {
    console.error('Sistem parametreleri hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sistem parametreleri alınırken hata oluştu' 
    });
  }
});

// Sistem parametrelerini güncelle
app.post('/api/admin/update-system-params', authenticateAdmin, (req, res) => {
  try {
    const { database, application, security } = req.body;
    
    // Veritabanı parametrelerini güncelle
    if (database) {
      Object.assign(SYSTEM_CONFIG.database, database);
      
      // Yeni veritabanı bağlantısı oluştur
      const newConnection = mysql.createConnection(SYSTEM_CONFIG.database);
      newConnection.connect((err) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: 'Veritabanı bağlantısı kurulamadı: ' + err.message 
          });
        }
        
        // Eski bağlantıyı kapat ve yenisini ata
        connection.end();
        global.connection = newConnection;
        
        res.json({ 
          success: true, 
          message: 'Veritabanı parametreleri güncellendi ve yeni bağlantı kuruldu' 
        });
      });
      return;
    }
    
    // Uygulama parametrelerini güncelle
    if (application) {
      Object.assign(SYSTEM_CONFIG.application, application);
      
      // Port değişikliği varsa sunucuyu yeniden başlat
      if (application.port && application.port !== PORT) {
        res.json({ 
          success: true, 
          message: 'Port değişikliği için sunucu yeniden başlatılmalı',
          requiresRestart: true
        });
        return;
      }
    }
    
    // Güvenlik parametrelerini güncelle
    if (security) {
      Object.assign(SYSTEM_CONFIG.security, security);
    }
    
    res.json({ 
      success: true, 
      message: 'Sistem parametreleri başarıyla güncellendi' 
    });
    
  } catch (error) {
    console.error('Sistem parametreleri güncelleme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sistem parametreleri güncellenemedi: ' + error.message 
    });
  }
});

// Sistem parametrelerini sıfırla (varsayılan değerlere)
app.post('/api/admin/reset-system-params', authenticateAdmin, (req, res) => {
  try {
    // Varsayılan değerlere sıfırla
    SYSTEM_CONFIG.database = {
      host: 'localhost',
      user: 'root',
      password: '12345',
      database: 'income_expense_tracker',
      port: 3306
    };
    
    SYSTEM_CONFIG.application = {
      port: 5000,
      jwtSecret: 'your-super-secret-jwt-key-2024',
      adminPassword: '12345',
      sessionTimeout: 3600,
      maxLoginAttempts: 5,
      passwordMinLength: 6
    };
    
    SYSTEM_CONFIG.security = {
      bcryptRounds: 12,
      jwtExpiresIn: '24h',
      corsOrigin: '*'
    };
    
    res.json({ 
      success: true, 
      message: 'Sistem parametreleri varsayılan değerlere sıfırlandı' 
    });
    
  } catch (error) {
    console.error('Sistem parametreleri sıfırlama hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sistem parametreleri sıfırlanamadı: ' + error.message 
    });
  }
});

// Tüm sistem parametrelerini getir (CRUD için)
app.post('/api/admin/parameters', authenticateAdmin, async (req, res) => {
  try {
    const [parameters] = await connection.promise().execute(`
      SELECT * FROM system_parameters 
      ORDER BY category, param_key
    `);
    
    res.json({
      success: true,
      parameters: parameters
    });
  } catch (error) {
    console.error('Parametreler getirme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Parametreler alınırken hata oluştu' 
    });
  }
});

// Tek bir parametreyi getir
app.post('/api/admin/parameters/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [parameters] = await connection.promise().execute(`
      SELECT * FROM system_parameters WHERE id = ?
    `, [id]);
    
    if (parameters.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parametre bulunamadı'
      });
    }
    
    res.json({
      success: true,
      parameter: parameters[0]
    });
  } catch (error) {
    console.error('Parametre getirme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Parametre alınırken hata oluştu' 
    });
  }
});

// Yeni parametre ekle
app.post('/api/admin/parameters/add', authenticateAdmin, async (req, res) => {
  try {
    const { param_key, param_value, param_type, description, category, is_editable } = req.body;
    
    // Gerekli alanları kontrol et
    if (!param_key || param_type === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Parametre anahtarı ve türü zorunludur'
      });
    }
    
    // Parametre anahtarının benzersiz olduğunu kontrol et
    const [existing] = await connection.promise().execute(`
      SELECT id FROM system_parameters WHERE param_key = ?
    `, [param_key]);
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu parametre anahtarı zaten mevcut'
      });
    }
    
    // Yeni parametreyi ekle
    const [result] = await connection.promise().execute(`
      INSERT INTO system_parameters (param_key, param_value, param_type, description, category, is_editable)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [param_key, param_value || '', param_type, description || '', category || 'general', is_editable !== undefined ? is_editable : true]);
    
    res.status(201).json({
      success: true,
      message: 'Parametre başarıyla eklendi',
      parameter_id: result.insertId
    });
  } catch (error) {
    console.error('Parametre ekleme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Parametre eklenirken hata oluştu' 
    });
  }
});

// Parametre güncelle
app.post('/api/admin/parameters/update', authenticateAdmin, async (req, res) => {
  try {
    const { id, param_key, param_value, param_type, description, category, is_editable } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Parametre ID\'si zorunludur'
      });
    }
    
    // Parametrenin mevcut olduğunu kontrol et
    const [existing] = await connection.promise().execute(`
      SELECT * FROM system_parameters WHERE id = ?
    `, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parametre bulunamadı'
      });
    }
    
    // Parametre anahtarının benzersiz olduğunu kontrol et (kendi ID'si hariç)
    if (param_key && param_key !== existing[0].param_key) {
      const [duplicate] = await connection.promise().execute(`
        SELECT id FROM system_parameters WHERE param_key = ? AND id != ?
      `, [param_key, id]);
      
      if (duplicate.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bu parametre anahtarı zaten mevcut'
        });
      }
    }
    
    // Parametreyi güncelle
    await connection.promise().execute(`
      UPDATE system_parameters 
      SET param_key = ?, param_value = ?, param_type = ?, description = ?, category = ?, is_editable = ?
      WHERE id = ?
    `, [
      param_key || existing[0].param_key,
      param_value !== undefined ? param_value : existing[0].param_value,
      param_type || existing[0].param_type,
      description !== undefined ? description : existing[0].description,
      category || existing[0].category,
      is_editable !== undefined ? is_editable : existing[0].is_editable,
      id
    ]);
    
    res.json({
      success: true,
      message: 'Parametre başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Parametre güncelleme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Parametre güncellenirken hata oluştu' 
    });
  }
});

// Parametre sil
app.post('/api/admin/parameters/delete', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Parametre ID\'si zorunludur'
      });
    }
    
    // Parametrenin mevcut olduğunu kontrol et
    const [existing] = await connection.promise().execute(`
      SELECT * FROM system_parameters WHERE id = ?
    `, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parametre bulunamadı'
      });
    }
    
    // Parametreyi sil
    await connection.promise().execute(`
      DELETE FROM system_parameters WHERE id = ?
    `, [id]);
    
    res.json({
      success: true,
      message: 'Parametre başarıyla silindi'
    });
  } catch (error) {
    console.error('Parametre silme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Parametre silinirken hata oluştu' 
    });
  }
});

// Parametreleri kategoriye göre getir
app.post('/api/admin/parameters/category/:category', authenticateAdmin, async (req, res) => {
  try {
    const { category } = req.params;
    
    const [parameters] = await connection.promise().execute(`
      SELECT * FROM system_parameters 
      WHERE category = ?
      ORDER BY param_key
    `, [category]);
    
    res.json({
      success: true,
      parameters: parameters
    });
  } catch (error) {
    console.error('Kategori parametreleri getirme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Kategori parametreleri alınırken hata oluştu' 
    });
  }
});

// Parametreleri toplu güncelle
app.post('/api/admin/parameters/bulk-update', authenticateAdmin, async (req, res) => {
  try {
    const { parameters } = req.body;
    
    if (!Array.isArray(parameters) || parameters.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Güncellenecek parametreler gerekli'
      });
    }
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const param of parameters) {
      try {
        await connection.promise().execute(`
          UPDATE system_parameters 
          SET param_value = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [param.param_value, param.id]);
        updatedCount++;
      } catch (error) {
        console.error(`Parametre güncelleme hatası (ID: ${param.id}):`, error);
        errorCount++;
      }
    }
    
    res.json({
      success: true,
      message: `${updatedCount} parametre güncellendi, ${errorCount} hata oluştu`,
      updatedCount,
      errorCount
    });
  } catch (error) {
    console.error('Toplu güncelleme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Toplu güncelleme sırasında hata oluştu' 
    });
  }
});

// Parametreleri dışa aktar (JSON)
app.post('/api/admin/parameters/export', authenticateAdmin, async (req, res) => {
  try {
    const [parameters] = await connection.promise().execute(`
      SELECT * FROM system_parameters 
      ORDER BY category, param_key
    `);
    
    const exportData = {
      exportDate: new Date().toISOString(),
      totalParameters: parameters.length,
      parameters: parameters
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="system_parameters.json"');
    res.json(exportData);
  } catch (error) {
    console.error('Parametre dışa aktarma hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Parametreler dışa aktarılırken hata oluştu' 
    });
  }
});

// Parametreleri içe aktar (JSON)
app.post('/api/admin/parameters/import', authenticateAdmin, async (req, res) => {
  try {
    const { parameters, overwrite } = req.body;
    
    if (!Array.isArray(parameters) || parameters.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'İçe aktarılacak parametreler gerekli'
      });
    }
    
    let importedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const param of parameters) {
      try {
        if (overwrite) {
          // Mevcut parametreyi güncelle veya yeni ekle
          await connection.promise().execute(`
            INSERT INTO system_parameters (param_key, param_value, param_type, description, category, is_editable)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            param_value = VALUES(param_value),
            param_type = VALUES(param_type),
            description = VALUES(description),
            category = VALUES(category),
            is_editable = VALUES(is_editable),
            updated_at = CURRENT_TIMESTAMP
          `, [param.param_key, param.param_value, param.param_type, param.description, param.category, param.is_editable]);
          
          if (param.id) {
            updatedCount++;
          } else {
            importedCount++;
          }
        } else {
          // Sadece yeni parametreleri ekle
          const [existing] = await connection.promise().execute(`
            SELECT id FROM system_parameters WHERE param_key = ?
          `, [param.param_key]);
          
          if (existing.length === 0) {
            await connection.promise().execute(`
              INSERT INTO system_parameters (param_key, param_value, param_type, description, category, is_editable)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [param.param_key, param.param_value, param.param_type, param.description, param.category, param.is_editable]);
            importedCount++;
          }
        }
      } catch (error) {
        console.error(`Parametre işleme hatası (${param.param_key}):`, error);
        errorCount++;
      }
    }
    
    res.json({
      success: true,
      message: `${importedCount} yeni parametre eklendi, ${updatedCount} güncellendi, ${errorCount} hata oluştu`,
      importedCount,
      updatedCount,
      errorCount
    });
  } catch (error) {
    console.error('Parametre içe aktarma hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Parametreler içe aktarılırken hata oluştu' 
    });
  }
});

// Bankaları getir (Admin Only)
app.get('/api/banks', authenticateAdmin, (req, res) => {
  const query = 'SELECT * FROM banks ORDER BY bank_name';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Bankalar getirme hatası:', err);
      res.status(500).json({ error: 'Bankalar getirilemedi' });
      return;
    }
    res.json(results);
  });
});

// Duplicate bankaları temizle (Admin Only)
app.post('/api/banks/clean-duplicates', authenticateAdmin, (req, res) => {
  const cleanQuery = `
    DELETE b1 FROM banks b1
    INNER JOIN banks b2 
    WHERE b1.id > b2.id 
    AND b1.bank_name = b2.bank_name
  `;
  
  connection.query(cleanQuery, (err, result) => {
    if (err) {
      console.error('Duplicate temizleme hatası:', err);
      res.status(500).json({ error: 'Duplicate\'lar temizlenemedi' });
      return;
    }
    
    const deletedCount = result.affectedRows;
    res.json({ 
      success: true, 
      message: `${deletedCount} adet duplicate banka temizlendi`,
      deletedCount 
    });
  });
});

// Tüm bankaları temizle ve yeniden oluştur (Admin Only)
app.post('/api/banks/reset', authenticateAdmin, (req, res) => {
  try {
    // Önce tüm bankaları sil
    connection.query('DELETE FROM banks', (err) => {
      if (err) {
        console.error('Bankalar silinirken hata:', err);
        res.status(500).json({ error: 'Bankalar silinemedi' });
        return;
      }
      
      // Auto increment'i sıfırla
      connection.query('ALTER TABLE banks AUTO_INCREMENT = 1', (err) => {
        if (err) {
          console.error('Auto increment sıfırlama hatası:', err);
        }
        
        // Temiz banka listesi ekle - Türkiye'deki aktif çalışan bankalar
        const cleanBanks = [
          'Adabank',
          'Akbank',
          'Aktif Yatırım Bankası',
          'Albaraka Türk',
          'Alternatif Bank',
          'Anadolubank',
          'Arap Türk Bankası',
          'Bank Mellat',
          'Bank of Tokyo-Mitsubishi UFJ',
          'BankPozitif',
          'BNP Paribas',
          'Burgan Bank',
          'Citibank',
          'Credit Agricole',
          'DBS Bank',
          'Denizbank',
          'Deutsche Bank',
          'Emirates NBD',
          'Fibabanka',
          'First Gulf Bank',
          'Garanti BBVA',
          'Goldman Sachs',
          'Gulf Bank',
          'Habib Bank',
          'Halkbank',
          'HSBC',
          'ICBC Turkey Bank',
          'Industrial Bank of Korea',
          'ING Bank',
          'İş Bank',
          'JP Morgan',
          'Kuveyt Türk',
          'Mizuho Bank',
          'MNG Bank',
          'National Bank of Pakistan',
          'Nova Bank',
          'Odeabank',
          'Oman Arab Bank',
          'Pakistani International Bank',
          'Pamukbank',
          'Qatar National Bank',
          'QNB Finansbank',
          'Rabobank',
          'Royal Bank of Scotland',
          'Sberbank',
          'Şekerbank',
          'Société Générale',
          'Standard Chartered',
          'Sumitomo Mitsui Banking Corporation',
          'TEB',
          'Türk Ekonomi Bankası',
          'Türkiye Kalkınma Bankası',
          'Türkiye Vakıflar Bankası',
          'UBS Bank',
          'Vakıf Yatırım Bankası',
          'VakıfBank',
          'Yapı Kredi',
          'Yapı Yatırım Bankası',
          'Ziraat Bank'
        ];
        
        let insertedCount = 0;
        const insertPromises = cleanBanks.map(bankName => {
          return new Promise((resolve, reject) => {
            connection.query(
              'INSERT INTO banks (bank_name) VALUES (?)',
              [bankName],
              (err) => {
                if (err) {
                  console.error(`${bankName} eklenirken hata:`, err);
                  reject(err);
                } else {
                  insertedCount++;
                  resolve();
                }
              }
            );
          });
        });
        
        Promise.all(insertPromises)
          .then(() => {
            res.json({ 
              success: true, 
              message: `Banka listesi temizlendi ve ${insertedCount} adet temiz banka eklendi`,
              insertedCount 
            });
          })
          .catch(error => {
            console.error('Banka ekleme hatası:', error);
            res.status(500).json({ error: 'Bankalar eklenirken hata oluştu' });
          });
      });
    });
    
  } catch (error) {
    console.error('Banka reset hatası:', error);
    res.status(500).json({ error: 'Banka listesi sıfırlanırken hata oluştu' });
  }
});

// Yeni banka ekle (Admin Only)
app.post('/api/banks', authenticateAdmin, (req, res) => {
  const { bank_name } = req.body;
  
  if (!bank_name || bank_name.trim() === '') {
    return res.status(400).json({ error: 'Banka adı boş olamaz' });
  }
  
  // Önce banka adının zaten var olup olmadığını kontrol et
  const checkQuery = 'SELECT id FROM banks WHERE bank_name = ?';
  connection.query(checkQuery, [bank_name.trim()], (err, results) => {
    if (err) {
      console.error('Banka kontrol hatası:', err);
      res.status(500).json({ error: 'Banka kontrol edilemedi' });
      return;
    }
    
    if (results.length > 0) {
      res.status(400).json({ error: 'Bu banka adı zaten mevcut' });
      return;
    }
    
    // Banka yoksa ekle
    const insertQuery = 'INSERT INTO banks (bank_name) VALUES (?)';
    connection.query(insertQuery, [bank_name.trim()], (err, result) => {
      if (err) {
        console.error('Banka ekleme hatası:', err);
        res.status(500).json({ error: 'Banka eklenemedi' });
        return;
      }
      res.json({ id: result.insertId, bank_name: bank_name.trim() });
    });
  });
});

// Banka sil (Admin Only)
app.delete('/api/banks/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'Geçersiz banka ID' });
  }
  
  // Önce bu bankanın herhangi bir hesapta kullanılıp kullanılmadığını kontrol et
  const checkUsageQuery = 'SELECT COUNT(*) as usage_count FROM accounts WHERE bank_id = ?';
  connection.query(checkUsageQuery, [id], (err, results) => {
    if (err) {
      console.error('Banka kullanım kontrol hatası:', err);
      res.status(500).json({ error: 'Banka kullanım kontrol edilemedi' });
      return;
    }
    
    if (results[0].usage_count > 0) {
      res.status(400).json({ 
        error: 'Bu banka hesap kayıtlarında kullanılıyor. Önce ilgili hesapları silmelisiniz.' 
      });
      return;
    }
    
    // Banka kullanılmıyorsa sil
    const deleteQuery = 'DELETE FROM banks WHERE id = ?';
    connection.query(deleteQuery, [id], (err, result) => {
      if (err) {
        console.error('Banka silme hatası:', err);
        res.status(500).json({ error: 'Banka silinemedi' });
        return;
      }
      
      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Banka bulunamadı' });
        return;
      }
      
      res.json({ message: 'Banka başarıyla silindi' });
    });
  });
});

// Hesapları getir
app.get('/api/accounts', authenticateToken, (req, res) => {
  const userId = req.user.user_id;
  const query = `
    SELECT a.*, b.bank_name 
    FROM accounts a 
    JOIN banks b ON a.bank_id = b.id 
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC
  `;
  
  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Hesaplar getirme hatası:', err);
      res.status(500).json({ error: 'Hesaplar getirilemedi' });
      return;
    }
    res.json(results);
  });
});

// Yeni hesap ekle
app.post('/api/accounts', authenticateToken, (req, res) => {
  const { bank_id, account_name, account_number, iban, account_type, account_limit, current_balance, is_credit_account, credit_limit } = req.body;
  const userId = req.user.user_id;
  
  // Boş string değerleri NULL veya 0 olarak değiştir
  const cleanAccountLimit = account_limit === '' ? null : parseFloat(account_limit) || 0;
  const cleanCreditLimit = credit_limit === '' ? null : parseFloat(credit_limit) || 0;
  const cleanCurrentBalance = parseFloat(current_balance) || 0;
  
  const query = `
    INSERT INTO accounts (user_id, bank_id, account_name, account_number, iban, account_type, account_limit, current_balance, is_credit_account, credit_limit) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  connection.query(query, [userId, bank_id, account_name, account_number, iban, account_type, cleanAccountLimit, cleanCurrentBalance, is_credit_account, cleanCreditLimit], (err, result) => {
    if (err) {
      console.error('Hesap ekleme hatası:', err);
      res.status(500).json({ error: 'Hesap eklenemedi' });
      return;
    }
    res.json({ id: result.insertId, message: 'Hesap başarıyla eklendi' });
  });
});

// Hesap güncelle
app.put('/api/accounts/:id', (req, res) => {
  const { id } = req.params;
  const { current_balance, account_limit, credit_limit } = req.body;
  
  // Boş string değerleri NULL veya 0 olarak değiştir
  const cleanAccountLimit = account_limit === '' ? null : parseFloat(account_limit) || 0;
  const cleanCreditLimit = credit_limit === '' ? null : parseFloat(credit_limit) || 0;
  const cleanCurrentBalance = parseFloat(current_balance) || 0;
  
  const query = 'UPDATE accounts SET current_balance = ?, account_limit = ?, credit_limit = ? WHERE id = ?';
  
  connection.query(query, [cleanCurrentBalance, cleanAccountLimit, cleanCreditLimit, id], (err, result) => {
    if (err) {
      console.error('Hesap güncelleme hatası:', err);
      res.status(500).json({ error: 'Hesap güncellenemedi' });
      return;
    }
    res.json({ message: 'Hesap başarıyla güncellendi' });
  });
});

// Kredi kartlarını getir
app.get('/api/credit-cards', authenticateToken, (req, res) => {
  const userId = req.user.user_id;
  const query = `
    SELECT c.*, b.bank_name 
    FROM credit_cards c 
    JOIN banks b ON c.bank_id = b.id 
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `;
  
  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Kredi kartları getirme hatası:', err);
      res.status(500).json({ error: 'Kredi kartları getirilemedi' });
      return;
    }
    res.json(results);
  });
});

// Yeni kredi kartı ekle
app.post('/api/credit-cards', authenticateToken, (req, res) => {
  const { bank_id, card_name, card_number, card_limit, remaining_limit, statement_date } = req.body;
  const userId = req.user.user_id;
  
  // Boş string değerleri 0 olarak değiştir
  const cleanCardLimit = parseFloat(card_limit) || 0;
  const cleanRemainingLimit = parseFloat(remaining_limit) || 0;
  
  const query = `
    INSERT INTO credit_cards (user_id, bank_id, card_name, card_number, card_limit, remaining_limit, statement_date) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  connection.query(query, [userId, bank_id, card_name, card_number, cleanCardLimit, cleanRemainingLimit, statement_date], (err, result) => {
    if (err) {
      console.error('Kredi kartı ekleme hatası:', err);
      res.status(500).json({ error: 'Kredi kartı eklenemedi' });
      return;
    }
    res.json({ id: result.insertId, message: 'Kredi kartı başarıyla eklendi' });
  });
});

// Kredi kartı güncelle
app.put('/api/credit-cards/:id', (req, res) => {
  const { id } = req.params;
  const { remaining_limit } = req.body;
  
  // Boş string değerleri 0 olarak değiştir
  const cleanRemainingLimit = parseFloat(remaining_limit) || 0;
  
  const query = 'UPDATE credit_cards SET remaining_limit = ? WHERE id = ?';
  
  connection.query(query, [cleanRemainingLimit, id], (err, result) => {
    if (err) {
      console.error('Kredi kartı güncelleme hatası:', err);
      res.status(500).json({ error: 'Kredi kartı güncellenemedi' });
      return;
    }
    res.json({ message: 'Kredi kartı başarıyla güncellendi' });
  });
});

// ============ AdminPanel için sistem parametreleri endpoint'leri ============

// AdminPanel için sistem parametrelerini getir
app.post('/api/admin/system-parameters', authenticateAdmin, async (req, res) => {
  try {
    // Mevcut sistem parametrelerini al
    const [parameters] = await connection.promise().execute(`
      SELECT * FROM system_parameters 
      ORDER BY category, param_key
    `);
    
    // Gider kategorilerini al ve sistem parametrelerine ekle
    const [expenseCategories] = await connection.promise().execute(`
      SELECT id, name, color FROM expense_categories ORDER BY name
    `);
    
    // Banka listesini al ve sistem parametrelerine ekle
    const [banks] = await connection.promise().execute(`
      SELECT id, bank_name FROM banks ORDER BY bank_name
    `);
    
    // Dinamik parametreleri ekle
    const dynamicParams = [
      {
        id: 'expense_categories_dynamic',
        param_key: 'expense_categories_list',
        param_value: JSON.stringify(expenseCategories),
        param_type: 'json',
        description: 'Gider kategorileri listesi (dinamik)',
        category: 'expense',
        is_editable: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'banks_list_dynamic',
        param_key: 'banks_list',
        param_value: JSON.stringify(banks),
        param_type: 'json',
        description: 'Banka listesi (dinamik)',
        category: 'financial',
        is_editable: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    // Tüm parametreleri birleştir
    const allParameters = [...parameters, ...dynamicParams];
    
    res.json({
      success: true,
      parameters: allParameters
    });
  } catch (error) {
    console.error('Sistem parametreleri getirme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sistem parametreleri alınırken hata oluştu' 
    });
  }
});

// AdminPanel için parametre ekleme (POST) - farklı endpoint
app.post('/api/admin/system-parameters/add', authenticateAdmin, async (req, res) => {
  try {
    const { param_key, param_value, param_type, description, category, is_editable } = req.body;
    
    // Gerekli alanları kontrol et
    if (!param_key || param_type === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Parametre anahtarı ve türü zorunludur'
      });
    }
    
    // Parametre anahtarının benzersiz olduğunu kontrol et
    const [existing] = await connection.promise().execute(`
      SELECT id FROM system_parameters WHERE param_key = ?
    `, [param_key]);
    
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu parametre anahtarı zaten mevcut'
      });
    }
    
    // Yeni parametreyi ekle
    const [result] = await connection.promise().execute(`
      INSERT INTO system_parameters (param_key, param_value, param_type, description, category, is_editable)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [param_key, param_value || '', param_type, description || '', category || 'general', is_editable !== undefined ? is_editable : true]);
    
    res.status(201).json({
      success: true,
      message: 'Parametre başarıyla eklendi',
      parameter_id: result.insertId
    });
  } catch (error) {
    console.error('Parametre ekleme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Parametre eklenirken hata oluştu' 
    });
  }
});

// AdminPanel için parametre güncelleme (PUT)
app.put('/api/admin/system-parameters/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { param_key, param_value, param_type, description, category, is_editable } = req.body;
    
    // Parametrenin mevcut olduğunu kontrol et
    const [existing] = await connection.promise().execute(`
      SELECT * FROM system_parameters WHERE id = ?
    `, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parametre bulunamadı'
      });
    }
    
    // Parametre anahtarının benzersiz olduğunu kontrol et (kendi ID'si hariç)
    if (param_key && param_key !== existing[0].param_key) {
      const [duplicate] = await connection.promise().execute(`
        SELECT id FROM system_parameters WHERE param_key = ? AND id != ?
      `, [param_key, id]);
      
      if (duplicate.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bu parametre anahtarı zaten mevcut'
        });
      }
    }
    
    // Parametreyi güncelle
    await connection.promise().execute(`
      UPDATE system_parameters 
      SET param_key = ?, param_value = ?, param_type = ?, description = ?, category = ?, is_editable = ?
      WHERE id = ?
    `, [
      param_key || existing[0].param_key,
      param_value !== undefined ? param_value : existing[0].param_value,
      param_type || existing[0].param_type,
      description !== undefined ? description : existing[0].description,
      category || existing[0].category,
      is_editable !== undefined ? is_editable : existing[0].is_editable,
      id
    ]);
    
    res.json({
      success: true,
      message: 'Parametre başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Parametre güncelleme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Parametre güncellenirken hata oluştu' 
    });
  }
});

// AdminPanel için parametre silme (DELETE)
app.delete('/api/admin/system-parameters/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Parametrenin mevcut olduğunu kontrol et
    const [existing] = await connection.promise().execute(`
      SELECT * FROM system_parameters WHERE id = ?
    `, [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parametre bulunamadı'
      });
    }
    
    // Parametreyi sil
    await connection.promise().execute(`
      DELETE FROM system_parameters WHERE id = ?
    `, [id]);
    
    res.json({
      success: true,
      message: 'Parametre başarıyla silindi'
    });
  } catch (error) {
    console.error('Parametre silme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Parametre silinirken hata oluştu' 
    });
  }
});

// AdminPanel için toplu parametre güncelleme (PUT)
app.put('/api/admin/system-parameters/bulk-update', authenticateAdmin, async (req, res) => {
  try {
    const { parameters } = req.body;
    
    if (!Array.isArray(parameters) || parameters.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Güncellenecek parametreler gerekli'
      });
    }
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const param of parameters) {
      try {
        await connection.promise().execute(`
          UPDATE system_parameters 
          SET param_value = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [param.param_value, param.id]);
        updatedCount++;
      } catch (error) {
        console.error(`Parametre güncelleme hatası (ID: ${param.id}):`, error);
        errorCount++;
      }
    }
    
    res.json({
      success: true,
      message: `${updatedCount} parametre güncellendi, ${errorCount} hata oluştu`,
      updatedCount,
      errorCount
    });
  } catch (error) {
    console.error('Toplu güncelleme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Toplu güncelleme sırasında hata oluştu' 
    });
  }
});

// AdminPanel için parametre içe aktarma (POST)
app.post('/api/admin/system-parameters/import', authenticateAdmin, async (req, res) => {
  try {
    const { parameters, overwrite } = req.body;
    
    if (!Array.isArray(parameters) || parameters.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'İçe aktarılacak parametreler gerekli'
      });
    }
    
    let insertedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const param of parameters) {
      try {
        // Parametre zaten var mı kontrol et
        const [existing] = await connection.promise().execute(`
          SELECT id FROM system_parameters WHERE param_key = ?
        `, [param.param_key]);
        
        if (existing.length > 0) {
          if (overwrite) {
            // Mevcut parametreyi güncelle
            await connection.promise().execute(`
              UPDATE system_parameters 
              SET param_value = ?, param_type = ?, description = ?, category = ?, is_editable = ?
              WHERE param_key = ?
            `, [
              param.param_value, 
              param.param_type, 
              param.description, 
              param.category, 
              param.is_editable !== undefined ? param.is_editable : true,
              param.param_key
            ]);
            updatedCount++;
          } else {
            console.log(`Parametre zaten mevcut, atlandı: ${param.param_key}`);
          }
        } else {
          // Yeni parametre ekle
          await connection.promise().execute(`
            INSERT INTO system_parameters (param_key, param_value, param_type, description, category, is_editable)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [
            param.param_key, 
            param.param_value || '', 
            param.param_type, 
            param.description || '', 
            param.category || 'general', 
            param.is_editable !== undefined ? param.is_editable : true
          ]);
          insertedCount++;
        }
      } catch (error) {
        console.error(`Parametre işleme hatası (${param.param_key}):`, error);
        errorCount++;
      }
    }
    
    res.json({
      success: true,
      message: `${insertedCount} yeni parametre eklendi, ${updatedCount} parametre güncellendi, ${errorCount} hata oluştu`,
      insertedCount,
      updatedCount,
      errorCount
    });
  } catch (error) {
    console.error('Parametre içe aktarma hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Parametreler içe aktarılırken hata oluştu' 
    });
  }
});

// ============ Dinamik parametreleri düzenleme endpoint'leri ============

// Gider kategorilerini güncelle (AdminPanel için)
app.put('/api/admin/expense-categories/update', authenticateAdmin, async (req, res) => {
  try {
    const { categories } = req.body;
    
    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Güncellenecek kategoriler gerekli'
      });
    }
    
    // Var olan kategorileri sil
    await connection.promise().execute('DELETE FROM expense_categories');
    await connection.promise().execute('ALTER TABLE expense_categories AUTO_INCREMENT = 1');
    
    // Yeni kategorileri ekle
    for (const category of categories) {
      await connection.promise().execute(`
        INSERT INTO expense_categories (name, color) 
        VALUES (?, ?)
      `, [category.name, category.color || '#007bff']);
    }
    
    res.json({
      success: true,
      message: 'Gider kategorileri başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Gider kategorileri güncelleme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Gider kategorileri güncellenirken hata oluştu' 
    });
  }
});

// Banka listesini güncelle (AdminPanel için)
app.put('/api/admin/banks/update', authenticateAdmin, async (req, res) => {
  try {
    const { banks } = req.body;
    
    if (!Array.isArray(banks) || banks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Güncellenecek bankalar gerekli'
      });
    }
    
    // Var olan bankaları sil (kullanılmayanları)
    await connection.promise().execute('DELETE FROM banks WHERE id NOT IN (SELECT DISTINCT bank_id FROM accounts UNION SELECT DISTINCT bank_id FROM credit_cards)');
    
    // Yeni bankaları ekle
    for (const bank of banks) {
      if (!bank.id || bank.id.toString().startsWith('new_')) {
        // Yeni banka ekle
        await connection.promise().execute(`
          INSERT INTO banks (bank_name) 
          VALUES (?)
        `, [bank.bank_name]);
      } else {
        // Mevcut bankayı güncelle
        await connection.promise().execute(`
          UPDATE banks 
          SET bank_name = ? 
          WHERE id = ?
        `, [bank.bank_name, bank.id]);
      }
    }
    
    res.json({
      success: true,
      message: 'Banka listesi başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Banka listesi güncelleme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Banka listesi güncellenirken hata oluştu' 
    });
  }
});

// Gelir kategorilerini güncelle (AdminPanel için)
app.put('/api/admin/income-categories/update', authenticateAdmin, async (req, res) => {
  try {
    const { income_types, income_sources } = req.body;
    
    // Sistem parametrelerini güncelle
    if (income_types && Array.isArray(income_types)) {
      await connection.promise().execute(`
        UPDATE system_parameters 
        SET param_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE param_key = 'income_types'
      `, [JSON.stringify(income_types)]);
    }
    
    if (income_sources && Array.isArray(income_sources)) {
      await connection.promise().execute(`
        UPDATE system_parameters 
        SET param_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE param_key = 'income_sources'
      `, [JSON.stringify(income_sources)]);
    }
    
    res.json({
      success: true,
      message: 'Gelir kategorileri başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Gelir kategorileri güncelleme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Gelir kategorileri güncellenirken hata oluştu' 
    });
  }
});

// Gelir ekleme
app.post('/api/incomes', authenticateToken, async (req, res) => {
    try {
        const { title, amount, income_type, source, description, income_date } = req.body;
        const userId = req.user.user_id;
        
        const query = `
            INSERT INTO incomes (user_id, title, amount, income_type, source, description, income_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await connection.promise().execute(query, [userId, title, amount, income_type, source, description, income_date]);
        
        res.status(201).json({
            success: true,
            message: 'Gelir başarıyla eklendi',
            income_id: result.insertId
        });
    } catch (error) {
        console.error('Gelir ekleme hatası:', error);
        res.status(500).json({ success: false, message: 'Gelir eklenirken hata oluştu' });
    }
});

// Gelirleri listele
app.get('/api/incomes', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const query = 'SELECT * FROM incomes WHERE user_id = ? ORDER BY income_date DESC';
        const [rows] = await connection.promise().execute(query, [userId]);
        res.json({ success: true, incomes: rows });
    } catch (error) {
        console.error('Gelir listeleme hatası:', error);
        res.status(500).json({ success: false, message: 'Gelirler listelenirken hata oluştu' });
    }
});

// Gelir getir (ID ile)
app.get('/api/incomes/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        
        const query = 'SELECT * FROM incomes WHERE id = ? AND user_id = ?';
        const [rows] = await connection.promise().execute(query, [id, userId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Gelir bulunamadı' });
        }
        
        res.json({ success: true, income: rows[0] });
    } catch (error) {
        console.error('Gelir getirme hatası:', error);
        res.status(500).json({ success: false, message: 'Gelir getirilirken hata oluştu' });
    }
});

// Gelir güncelle
app.put('/api/incomes/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        const { title, amount, income_type, source, description, income_date } = req.body;
        
        // Önce gelirin kullanıcıya ait olup olmadığını kontrol et
        const checkQuery = 'SELECT id FROM incomes WHERE id = ? AND user_id = ?';
        const [checkRows] = await connection.promise().execute(checkQuery, [id, userId]);
        
        if (checkRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Gelir bulunamadı' });
        }
        
        const updateQuery = `
            UPDATE incomes 
            SET title = ?, amount = ?, income_type = ?, source = ?, description = ?, income_date = ?
            WHERE id = ? AND user_id = ?
        `;
        
        await connection.promise().execute(updateQuery, [
            title, amount, income_type, source, description, income_date, id, userId
        ]);
        
        res.json({ success: true, message: 'Gelir başarıyla güncellendi' });
    } catch (error) {
        console.error('Gelir güncelleme hatası:', error);
        res.status(500).json({ success: false, message: 'Gelir güncellenirken hata oluştu' });
    }
});

// Gelir sil
app.delete('/api/incomes/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        
        // Önce gelirin kullanıcıya ait olup olmadığını kontrol et
        const checkQuery = 'SELECT id FROM incomes WHERE id = ? AND user_id = ?';
        const [checkRows] = await connection.promise().execute(checkQuery, [id, userId]);
        
        if (checkRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Gelir bulunamadı' });
        }
        
        const deleteQuery = 'DELETE FROM incomes WHERE id = ? AND user_id = ?';
        await connection.promise().execute(deleteQuery, [id, userId]);
        
        res.json({ success: true, message: 'Gelir başarıyla silindi' });
    } catch (error) {
        console.error('Gelir silme hatası:', error);
        res.status(500).json({ success: false, message: 'Gelir silinirken hata oluştu' });
    }
});

// Gider kategorilerini listele
app.get('/api/expense-categories', async (req, res) => {
    try {
        // Force cache devre dışı bırak
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Last-Modified': new Date().toUTCString(),
            'ETag': `"${Date.now()}"`
        });
        
        // Önce tabloyu temizle ve sadece 8 kategori ekle
        await connection.promise().execute('DELETE FROM expense_categories');
        await connection.promise().execute('ALTER TABLE expense_categories AUTO_INCREMENT = 1');
        
        // Sadece 8 temel kategoriyi ekle
        const insertQuery = `
            INSERT INTO expense_categories (name, color) VALUES 
            ('Gıda', '#28a745'),
            ('Ulaşım', '#007bff'),
            ('Ev Giderleri', '#ffc107'),
            ('Sağlık', '#dc3545'),
            ('Eğlence', '#6f42c1'),
            ('Alışveriş', '#fd7e14'),
            ('Faturalar', '#20c997'),
            ('Diğer', '#6c757d')
        `;
        
        await connection.promise().execute(insertQuery);
        
        // Şimdi kategorileri al
        const query = 'SELECT id, name, color FROM expense_categories ORDER BY name';
        const [rows] = await connection.promise().execute(query);
        
        console.log(`📊 Kategoriler yeniden oluşturuldu: ${rows.length} adet`);
        
        res.json({ success: true, categories: rows });
    } catch (error) {
        console.error('❌ Kategori listeleme hatası:', error);
        res.status(500).json({ success: false, message: 'Kategoriler listelenirken hata oluştu' });
    }
});

// Gider ekleme
app.post('/api/expenses', authenticateToken, async (req, res) => {
    try {
        const {
            title, amount, category_id, expense_type, payment_method,
            related_account_id, related_credit_card_id, related_credit_account_id,
            due_date, payment_date, description
        } = req.body;
        
        // Boş string değerleri NULL olarak değiştir
        const cleanRelatedAccountId = related_account_id === '' ? null : parseInt(related_account_id);
        const cleanRelatedCreditCardId = related_credit_card_id === '' ? null : parseInt(related_credit_card_id);
        const cleanRelatedCreditAccountId = related_credit_account_id === '' ? null : parseInt(related_credit_account_id);
        
        // Tarih alanlarını temizle
        const cleanDueDate = due_date === '' ? null : due_date;
        const cleanPaymentDate = payment_date === '' ? null : payment_date;
        
        const query = `
            INSERT INTO expenses (user_id, title, amount, category_id, expense_type, payment_method,
                                related_account_id, related_credit_card_id, related_credit_account_id,
                                due_date, payment_date, description, is_paid) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const is_paid = cleanPaymentDate ? true : false;
        const userId = req.user.user_id;
        
        const [result] = await connection.promise().execute(query, [
            userId, title, amount, category_id, expense_type, payment_method,
            cleanRelatedAccountId, cleanRelatedCreditCardId, cleanRelatedCreditAccountId,
            cleanDueDate, cleanPaymentDate, description, is_paid
        ]);
        
        const expenseId = result.insertId;
        
        // Seçilen ödeme yöntemine göre hesap/karttan tutar düş
        if (cleanRelatedAccountId && payment_method === 'bank_transfer') {
            // Mevduat hesabından tutar düş
            await connection.promise().execute(
                'UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?',
                [amount, cleanRelatedAccountId]
            );
            console.log(`💰 ${amount}₺ tutarı hesap ID:${cleanRelatedAccountId}'den düşüldü`);
        } else if (cleanRelatedCreditCardId && payment_method === 'credit_card') {
            // Kredi kartından tutar düş
            await connection.promise().execute(
                'UPDATE credit_cards SET remaining_limit = remaining_limit - ? WHERE id = ?',
                [amount, cleanRelatedCreditCardId]
            );
            console.log(`💳 ${amount}₺ tutarı kredi kartı ID:${cleanRelatedCreditCardId}'den düşüldü`);
        } else if (cleanRelatedCreditAccountId && payment_method === 'credit_account') {
            // Kredili hesaptan tutar düş
            await connection.promise().execute(
                'UPDATE accounts SET credit_limit = credit_limit - ? WHERE id = ?',
                [amount, cleanRelatedCreditAccountId]
            );
            console.log(`🏦 ${amount}₺ tutarı kredili hesap ID:${cleanRelatedCreditAccountId}'den düşüldü`);
        }
        
        res.status(201).json({
            success: true,
            message: 'Gider başarıyla eklendi ve seçilen hesap/karttan tutar düşüldü',
            expense_id: expenseId
        });
    } catch (error) {
        console.error('Gider ekleme hatası:', error);
        res.status(500).json({ success: false, message: 'Gider eklenirken hata oluştu' });
    }
});

// Ev kirası ve aidat ekleme
app.post('/api/rent-expenses', async (req, res) => {
    try {
        const {
            expense_id, rent_amount, maintenance_fee, property_tax, insurance, other_fees,
            property_address, landlord_name, contract_start_date, contract_end_date
        } = req.body;
        
        // Decimal alanları temizle - boş string değerleri 0 olarak değiştir
        const cleanRentAmount = rent_amount === '' ? 0 : parseFloat(rent_amount) || 0;
        const cleanMaintenanceFee = maintenance_fee === '' ? 0 : parseFloat(maintenance_fee) || 0;
        const cleanPropertyTax = property_tax === '' ? 0 : parseFloat(property_tax) || 0;
        const cleanInsurance = insurance === '' ? 0 : parseFloat(insurance) || 0;
        const cleanOtherFees = other_fees === '' ? 0 : parseFloat(other_fees) || 0;
        
        // String alanları temizle - boş string değerleri NULL olarak değiştir
        const cleanPropertyAddress = property_address === '' ? null : property_address;
        const cleanLandlordName = landlord_name === '' ? null : landlord_name;
        const cleanContractStartDate = contract_start_date === '' ? null : contract_start_date;
        const cleanContractEndDate = contract_end_date === '' ? null : contract_end_date;
        
        // due_date alanı için formData'dan due_date'i al
        const dueDate = req.body.due_date || new Date().toISOString().split('T')[0];
        
        const query = `
            INSERT INTO rent_expenses (expense_id, rent_amount, maintenance_fee, property_tax, 
                                     insurance, other_fees, property_address, landlord_name, 
                                     contract_start_date, contract_end_date, due_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await connection.promise().execute(query, [
            expense_id, cleanRentAmount, cleanMaintenanceFee, cleanPropertyTax, 
            cleanInsurance, cleanOtherFees, cleanPropertyAddress, cleanLandlordName, 
            cleanContractStartDate, cleanContractEndDate, dueDate
        ]);
        
        res.status(201).json({
            success: true,
            message: 'Ev kirası ve aidat başarıyla eklendi',
            rent_expense_id: result.insertId
        });
    } catch (error) {
        console.error('Ev kirası ekleme hatası:', error);
        res.status(500).json({ success: false, message: 'Ev kirası eklenirken hata oluştu' });
    }
});

// Kredi ödemesi ekleme
app.post('/api/credit-payments', async (req, res) => {
    try {
        const {
            expense_id, payment_type, principal_amount, interest_amount, late_fee,
            minimum_payment, statement_date, due_date, payment_date, is_minimum_payment
        } = req.body;
        
        // Decimal alanları temizle - boş string değerleri 0 olarak değiştir
        const cleanPrincipalAmount = principal_amount === '' ? 0 : parseFloat(principal_amount) || 0;
        const cleanInterestAmount = interest_amount === '' ? 0 : parseFloat(interest_amount) || 0;
        const cleanLateFee = late_fee === '' ? 0 : parseFloat(late_fee) || 0;
        const cleanMinimumPayment = minimum_payment === '' ? 0 : parseFloat(minimum_payment) || 0;
        
        // String alanları temizle - boş string değerleri NULL olarak değiştir
        const cleanPaymentType = payment_type === '' ? null : payment_type;
        const cleanStatementDate = statement_date === '' ? null : statement_date;
        const cleanDueDate = due_date === '' ? null : due_date;
        const cleanPaymentDate = payment_date === '' ? null : payment_date;
        
        const query = `
            INSERT INTO credit_payments (expense_id, payment_type, principal_amount, interest_amount,
                                       late_fee, minimum_payment, statement_date, due_date, 
                                       payment_date, is_minimum_payment) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await connection.promise().execute(query, [
            expense_id, cleanPaymentType, cleanPrincipalAmount, cleanInterestAmount, cleanLateFee,
            cleanMinimumPayment, cleanStatementDate, cleanDueDate, cleanPaymentDate, is_minimum_payment
        ]);
        
        res.status(201).json({
            success: true,
            message: 'Kredi ödemesi başarıyla eklendi',
            credit_payment_id: result.insertId
        });
    } catch (error) {
        console.error('Kredi ödemesi ekleme hatası:', error);
        res.status(500).json({ success: false, message: 'Kredi ödemesi eklenirken hata oluştu' });
    }
});

// Giderleri listele
app.get('/api/expenses', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const query = `
            SELECT e.*, ec.name as category_name, ec.color as category_color,
                   a.account_name, cc.card_name
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            LEFT JOIN accounts a ON e.related_account_id = a.id
            LEFT JOIN credit_cards cc ON e.related_credit_card_id = cc.id
            WHERE e.user_id = ?
            ORDER BY e.created_at DESC
        `;
        const [rows] = await connection.promise().execute(query, [userId]);
        res.json({ success: true, expenses: rows });
    } catch (error) {
        console.error('Gider listeleme hatası:', error);
        res.status(500).json({ success: false, message: 'Giderler listelenirken hata oluştu' });
    }
});

// Detaylı analiz verileri
app.get('/api/analytics', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        // Toplam gelir (sadece kullanıcının)
        const [totalIncomeResult] = await connection.promise().execute('SELECT SUM(amount) as total FROM incomes WHERE user_id = ?', [userId]);
        const totalIncome = totalIncomeResult[0].total || 0;
        
        // Toplam gider (sadece kullanıcının)
        const [totalExpenseResult] = await connection.promise().execute('SELECT SUM(amount) as total FROM expenses WHERE user_id = ?', [userId]);
        const totalExpense = totalExpenseResult[0].total || 0;
        
        // Net gelir
        const netIncome = totalIncome - totalExpense;
        
        // Kategori bazında gider dağılımı (sadece kullanıcının)
        const [categoryExpenses] = await connection.promise().execute(`
            SELECT ec.name, ec.color, SUM(e.amount) as total
            FROM expenses e
            JOIN expense_categories ec ON e.category_id = ec.id
            WHERE e.user_id = ?
            GROUP BY ec.id, ec.name, ec.color
            ORDER BY total DESC
        `, [userId]);
        
        // Aylık gelir-gider trendi (sadece kullanıcının, yemek kartı hariç)
        const [monthlyTrend] = await connection.promise().execute(`
            SELECT 
                months.month,
                SUM(COALESCE(i.amount, 0)) as income,
                SUM(COALESCE(e.amount, 0)) as expense
            FROM (
                SELECT DISTINCT DATE_FORMAT(income_date, '%Y-%m') as month FROM incomes WHERE user_id = ? AND income_type != 'food_card'
                UNION
                SELECT DISTINCT DATE_FORMAT(created_at, '%Y-%m') as month FROM expenses WHERE user_id = ?
            ) months
            LEFT JOIN incomes i ON DATE_FORMAT(i.income_date, '%Y-%m') = months.month AND i.user_id = ? AND i.income_type != 'food_card'
            LEFT JOIN expenses e ON DATE_FORMAT(e.created_at, '%Y-%m') = months.month AND e.user_id = ?
            GROUP BY months.month
            ORDER BY months.month DESC
            LIMIT 12
        `, [userId, userId, userId, userId]);
        
        // Kullanılabilir limitler (sadece kullanıcının)
        const [availableLimits] = await connection.promise().execute(`
            SELECT 
                'accounts' as type,
                SUM(current_balance) as total_available,
                COUNT(*) as count
            FROM accounts
            WHERE user_id = ?
            UNION ALL
            SELECT 
                'credit_cards' as type,
                SUM(remaining_limit) as total_available,
                COUNT(*) as count
            FROM credit_cards
            WHERE user_id = ?
        `, [userId, userId]);
        
        res.json({
            success: true,
            analytics: {
                totalIncome,
                totalExpense,
                netIncome,
                categoryExpenses,
                monthlyTrend,
                availableLimits
            }
        });
    } catch (error) {
        console.error('Analiz hatası:', error);
        res.status(500).json({ success: false, message: 'Analiz verileri alınırken hata oluştu' });
    }
});

// Dashboard verilerini güncelle
app.get('/api/dashboard', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        // Toplam hesap sayısı (sadece kullanıcının)
        const [accountsResult] = await connection.promise().execute('SELECT COUNT(*) as total FROM accounts WHERE user_id = ?', [userId]);
        const totalAccounts = accountsResult[0].total;
        
        // Toplam kredi kartı sayısı (sadece kullanıcının)
        const [creditCardsResult] = await connection.promise().execute('SELECT COUNT(*) as total FROM credit_cards WHERE user_id = ?', [userId]);
        const totalCreditCards = creditCardsResult[0].total;
        
        // Toplam hesap bakiyesi (sadece kullanıcının)
        const [totalBalanceResult] = await connection.promise().execute('SELECT SUM(current_balance) as total FROM accounts WHERE user_id = ?', [userId]);
        const totalBalance = totalBalanceResult[0].total || 0;
        
        // Toplam kredi kartı limiti (sadece kullanıcının)
        const [totalCreditLimitResult] = await connection.promise().execute('SELECT SUM(card_limit) as total FROM credit_cards WHERE user_id = ?', [userId]);
        const totalCreditLimit = totalCreditLimitResult[0].total || 0;
        
        // Kullanılabilir kredi kartı limiti (sadece kullanıcının)
        const [availableCreditLimitResult] = await connection.promise().execute('SELECT SUM(remaining_limit) as total FROM credit_cards WHERE user_id = ?', [userId]);
        const availableCreditLimit = availableCreditLimitResult[0].total || 0;
        
        // Toplam gelir (sadece kullanıcının, yemek kartı hariç)
        const [totalIncomeResult] = await connection.promise().execute('SELECT SUM(amount) as total FROM incomes WHERE user_id = ? AND income_type != "food_card"', [userId]);
        const totalIncome = totalIncomeResult[0].total || 0;
        
        // Toplam gider (sadece kullanıcının)
        const [totalExpenseResult] = await connection.promise().execute('SELECT SUM(amount) as total FROM expenses WHERE user_id = ?', [userId]);
        const totalExpense = totalExpenseResult[0].total || 0;
        
        // Net gelir
        const netIncome = totalIncome - totalExpense;
        
        // Yemek kartı geliri (sadece kullanıcının)
        const [foodCardIncomeResult] = await connection.promise().execute('SELECT SUM(amount) as total FROM incomes WHERE user_id = ? AND income_type = "food_card"', [userId]);
        const foodCardIncome = foodCardIncomeResult[0].total || 0;
        
        // Son işlemler - Son 5 gelir (sadece kullanıcının)
        const [recentIncomes] = await connection.promise().execute(`
            SELECT id, title, amount, income_type, source, income_date, created_at
            FROM incomes 
            WHERE user_id = ?
            ORDER BY created_at DESC 
            LIMIT 5
        `, [userId]);
        
        // Son işlemler - Son 5 gider (sadece kullanıcının)
        const [recentExpenses] = await connection.promise().execute(`
            SELECT e.id, e.title, e.amount, e.expense_type, e.payment_method, e.created_at,
                   ec.name as category_name, ec.color as category_color
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            WHERE e.user_id = ?
            ORDER BY e.created_at DESC 
            LIMIT 5
        `, [userId]);
        
        // Son işlemler - Son 5 hesap işlemi (sadece kullanıcının)
        const [recentAccounts] = await connection.promise().execute(`
            SELECT a.id, a.account_name, a.current_balance, a.created_at, b.bank_name
            FROM accounts a
            LEFT JOIN banks b ON a.bank_id = b.id
            WHERE a.user_id = ?
            ORDER BY a.created_at DESC 
            LIMIT 5
        `, [userId]);
        
        // Son işlemler - Son 5 kredi kartı işlemi (sadece kullanıcının)
        const [recentCreditCards] = await connection.promise().execute(`
            SELECT cc.id, cc.card_name, cc.remaining_limit, cc.created_at, b.bank_name
            FROM credit_cards cc
            LEFT JOIN banks b ON cc.bank_id = b.id
            WHERE cc.user_id = ?
            ORDER BY cc.created_at DESC 
            LIMIT 5
        `, [userId]);
        
        res.json({
            success: true,
            dashboard: {
                totalAccounts,
                totalCreditCards,
                totalBalance,
                totalCreditLimit,
                availableCreditLimit,
                totalIncome,
                totalExpense,
                netIncome,
                foodCardIncome,
                recentIncomes,
                recentExpenses,
                recentAccounts,
                recentCreditCards
            }
        });
    } catch (error) {
        console.error('Dashboard veri hatası:', error);
        res.status(500).json({ success: false, message: 'Dashboard verileri alınırken hata oluştu' });
    }
});

// ==================== USER PROFILE & SETTINGS API ENDPOINTS ====================

// Kullanıcı profilini güncelle
app.put('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { full_name, email, phone, address, birth_date, bio } = req.body;
        
        // E-posta benzersizlik kontrolü (kendi e-postası hariç)
        if (email) {
            const [existingUser] = await connection.promise().execute(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, userId]
            );
            
            if (existingUser.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor'
                });
            }
        }
        
        // Profil bilgilerini güncelle
        const updateQuery = `
            UPDATE users 
            SET full_name = COALESCE(?, full_name),
                email = COALESCE(?, email),
                phone = COALESCE(?, phone),
                address = COALESCE(?, address),
                birth_date = COALESCE(?, birth_date),
                bio = COALESCE(?, bio),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        await connection.promise().execute(updateQuery, [
            full_name, email, phone, address, birth_date, bio, userId
        ]);
        
        // Güncellenmiş kullanıcı bilgilerini al
        const [updatedUser] = await connection.promise().execute(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );
        
        res.json({
            success: true,
            message: 'Profil başarıyla güncellendi',
            user: updatedUser[0]
        });
    } catch (error) {
        console.error('Profil güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Profil güncellenirken hata oluştu'
        });
    }
});

// Kullanıcı şifresini güncelle
app.put('/api/user/password', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { current_password, new_password } = req.body;
        
        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: 'Mevcut şifre ve yeni şifre gerekli'
            });
        }
        
        // Mevcut şifreyi kontrol et
        const [user] = await connection.promise().execute(
            'SELECT password FROM users WHERE id = ?',
            [userId]
        );
        
        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }
        
        const isPasswordValid = await bcrypt.compare(current_password, user[0].password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Mevcut şifre yanlış'
            });
        }
        
        // Yeni şifreyi hash'le
        const hashedPassword = await bcrypt.hash(new_password, 10);
        
        // Şifreyi güncelle
        await connection.promise().execute(
            'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [hashedPassword, userId]
        );
        
        res.json({
            success: true,
            message: 'Şifre başarıyla güncellendi'
        });
    } catch (error) {
        console.error('Şifre güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Şifre güncellenirken hata oluştu'
        });
    }
});

// Kullanıcı görünüm ayarlarını güncelle
app.put('/api/user/appearance', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { theme, language, currency, date_format, time_format, notifications_enabled, email_notifications, push_notifications } = req.body;
        
        // Kullanıcı ayarlarını güncelle veya ekle
        const upsertQuery = `
            INSERT INTO user_settings (user_id, theme, language, currency, date_format, time_format, notifications_enabled, email_notifications, push_notifications, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE
                theme = VALUES(theme),
                language = VALUES(language),
                currency = VALUES(currency),
                date_format = VALUES(date_format),
                time_format = VALUES(time_format),
                notifications_enabled = VALUES(notifications_enabled),
                email_notifications = VALUES(email_notifications),
                push_notifications = VALUES(push_notifications),
                updated_at = CURRENT_TIMESTAMP
        `;
        
        await connection.promise().execute(upsertQuery, [
            userId, theme, language, currency, date_format, time_format, 
            notifications_enabled, email_notifications, push_notifications
        ]);
        
        res.json({
            success: true,
            message: 'Görünüm ayarları başarıyla güncellendi'
        });
    } catch (error) {
        console.error('Görünüm ayarları güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Görünüm ayarları güncellenirken hata oluştu'
        });
    }
});

// Kullanıcı verilerini dışa aktar
app.get('/api/user/export-data', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        // Kullanıcı bilgileri
        const [userData] = await connection.promise().execute(
            'SELECT id, username, full_name, email, phone, address, birth_date, bio, created_at FROM users WHERE id = ?',
            [userId]
        );
        
        // Hesaplar
        const [accounts] = await connection.promise().execute(
            'SELECT * FROM accounts WHERE user_id = ?',
            [userId]
        );
        
        // Kredi kartları
        const [creditCards] = await connection.promise().execute(
            'SELECT * FROM credit_cards WHERE user_id = ?',
            [userId]
        );
        
        // Gelirler
        const [incomes] = await connection.promise().execute(
            'SELECT * FROM incomes WHERE user_id = ?',
            [userId]
        );
        
        // Giderler
        const [expenses] = await connection.promise().execute(
            'SELECT * FROM expenses WHERE user_id = ?',
            [userId]
        );
        
        // Dışa aktarılacak veri
        const exportData = {
            export_date: new Date().toISOString(),
            user: userData[0],
            accounts,
            credit_cards: creditCards,
            incomes,
            expenses,
            total_records: {
                accounts: accounts.length,
                credit_cards: creditCards.length,
                incomes: incomes.length,
                expenses: expenses.length
            }
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="user-data-${userData[0].username}.json"`);
        res.json(exportData);
    } catch (error) {
        console.error('Veri dışa aktarma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Veri dışa aktarılırken hata oluştu'
        });
    }
});

// Kullanıcı hesabını sil
app.delete('/api/user/account', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        // Tüm kullanıcı verilerini sil
        await connection.promise().execute('DELETE FROM expenses WHERE user_id = ?', [userId]);
        await connection.promise().execute('DELETE FROM incomes WHERE user_id = ?', [userId]);
        await connection.promise().execute('DELETE FROM credit_cards WHERE user_id = ?', [userId]);
        await connection.promise().execute('DELETE FROM accounts WHERE user_id = ?', [userId]);
        await connection.promise().execute('DELETE FROM user_settings WHERE user_id = ?', [userId]);
        await connection.promise().execute('DELETE FROM users WHERE id = ?', [userId]);
        
        res.json({
            success: true,
            message: 'Hesap başarıyla silindi'
        });
    } catch (error) {
        console.error('Hesap silme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Hesap silinirken hata oluştu'
        });
    }
});

// Server başlat
app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portunda çalışıyor`);
  console.log(`📱 Frontend: http://localhost:3000`);
  console.log(`🔧 Backend API: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Server kapatılıyor...');
  connection.end();
  process.exit(0);
});
