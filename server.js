const express = require('express');
const { neon } = require('@neondatabase/serverless');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

// Logging setup
console.log('🚀 Server başlatılıyor...');
console.log('📊 Environment:', process.env.NODE_ENV || 'development');
console.log('⏰ Başlatma zamanı:', new Date().toISOString());

const app = express();

// Sistem Konfigürasyon Parametreleri
const SYSTEM_CONFIG = {
  database: {
    host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
    user: process.env.POSTGRES_USER || process.env.DB_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || 'password',
    database: process.env.POSTGRES_DATABASE || process.env.DB_NAME || 'gelir_gider_takip',
    port: process.env.POSTGRES_PORT || process.env.DB_PORT || 5432,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
app.use(cors({
  origin: true, // Tüm origin'lere izin ver
  credentials: true, // CORS credentials'ı aç
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With', 'Origin', 'Accept', 'admin-password']
}));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.headers['user-agent']}`);
  next();
});

// OPTIONS request'leri için özel handler
app.options('*', cors());

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check endpoint çağrıldı');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'Connected' : 'Not configured'
  });
});

// Static files için
app.use(express.static(path.join(__dirname, 'client/build')));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - User Agent: ${req.headers['user-agent']}`);
  next();
});

// Neon veritabanı bağlantısı
const sql = neon('postgresql://neondb_owner:npg_JptIgQh2fP5L@ep-winter-river-a2ecm56m-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require');

// Neon serverless driver için query wrapper
const query = async (sqlQuery, params = []) => {
  try {
    // MySQL ? placeholder'larını PostgreSQL $1, $2 formatına çevir
    let paramIndex = 1;
    const convertedSql = sqlQuery.replace(/\?/g, () => `$${paramIndex++}`);
    const result = await sql.query(convertedSql, params);
    return { rows: result, rowCount: result.length };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

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

// Tabloları oluştur
async function createTables() {
  // Users tablosu
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Banks tablosu
  const createBanksTable = `
    CREATE TABLE IF NOT EXISTS banks (
      id SERIAL PRIMARY KEY,
      bank_name VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Accounts tablosu
  const createAccountsTable = `
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      bank_id INTEGER NOT NULL,
      account_name VARCHAR(100) NOT NULL,
      account_number VARCHAR(50),
      iban VARCHAR(32) NOT NULL,
      account_type VARCHAR(20) DEFAULT 'vadesiz' CHECK (account_type IN ('vadeli', 'vadesiz')),
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
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      bank_id INTEGER NOT NULL,
      card_name VARCHAR(100) NOT NULL,
      card_number VARCHAR(20),
      card_limit DECIMAL(15,2) NOT NULL,
      remaining_limit DECIMAL(15,2) NOT NULL,
      statement_date INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
    )
  `;

  // Incomes tablosu
  const createIncomesTable = `
    CREATE TABLE IF NOT EXISTS incomes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title VARCHAR(100) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      source VARCHAR(100) NOT NULL,
      income_type VARCHAR(20) NOT NULL CHECK (income_type IN ('salary', 'part_time', 'rental', 'investment', 'food_card', 'other')),
      description TEXT,
      income_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;

  // Expense Categories tablosu
  const createExpenseCategoriesTable = `
    CREATE TABLE IF NOT EXISTS expense_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      color VARCHAR(7) DEFAULT '#007bff',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Expenses tablosu
  const createExpensesTable = `
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title VARCHAR(100) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      category_id INTEGER,
      expense_type VARCHAR(100),
      payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'credit_card', 'bank_transfer', 'credit_account')),
      related_account_id INTEGER,
      related_credit_card_id INTEGER,
      related_credit_account_id INTEGER,
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

  // System Parameters tablosu
  const createSystemParametersTable = `
    CREATE TABLE IF NOT EXISTS system_parameters (
      id SERIAL PRIMARY KEY,
      param_key VARCHAR(100) UNIQUE NOT NULL,
      param_value TEXT,
      param_type VARCHAR(20) DEFAULT 'string' CHECK (param_type IN ('string', 'number', 'boolean', 'json', 'date')),
      description TEXT,
      is_editable BOOLEAN DEFAULT TRUE,
      is_sensitive BOOLEAN DEFAULT FALSE,
      category VARCHAR(50) DEFAULT 'general',
      validation_rules TEXT,
      default_value TEXT,
      min_value VARCHAR(50),
      max_value VARCHAR(50),
      options TEXT,
      is_required BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Tabloları oluştur
  try {
    await query(createUsersTable);
    console.log('✅ Users tablosu oluşturuldu');
    
    await query(createSystemParametersTable);
    console.log('✅ System Parameters tablosu oluşturuldu');
    await initializeSystemParameters();
    
    await query(createBanksTable);
    console.log('✅ Banks tablosu oluşturuldu');
    
    await query(createAccountsTable);
    console.log('✅ Accounts tablosu oluşturuldu');
    
    await query(createCreditCardsTable);
    console.log('✅ Credit Cards tablosu oluşturuldu');
    
    await query(createIncomesTable);
    console.log('✅ Incomes tablosu oluşturuldu');
    
    await query(createExpenseCategoriesTable);
    console.log('✅ Expense Categories tablosu oluşturuldu');
    
    await query(createExpensesTable);
    console.log('✅ Expenses tablosu oluşturuldu');
  } catch (error) {
    console.error('Tablo oluşturma hatası:', error);
  }
}

// Sistem parametrelerini başlat
async function initializeSystemParameters() {
  const defaultParams = [
    // Genel Uygulama Parametreleri
    { param_key: 'app_name', param_value: 'Gelir Gider Takip', param_type: 'string', description: 'Uygulama adı', category: 'general', is_required: true },
    { param_key: 'app_version', param_value: '1.0.0', param_type: 'string', description: 'Uygulama versiyonu', category: 'general' },
    { param_key: 'app_description', param_value: 'Kişisel gelir gider takip uygulaması', param_type: 'string', description: 'Uygulama açıklaması', category: 'general' },
    { param_key: 'app_author', param_value: 'Admin', param_type: 'string', description: 'Uygulama geliştiricisi', category: 'general' },
    { param_key: 'app_contact_email', param_value: 'admin@gelirgidertakip.com', param_type: 'string', description: 'İletişim e-posta adresi', category: 'general' },
    
    // Finansal Parametreler
    { param_key: 'default_currency', param_value: 'TRY', param_type: 'string', description: 'Varsayılan para birimi', category: 'financial', is_required: true },
    { param_key: 'currency_symbol', param_value: '₺', param_type: 'string', description: 'Para birimi sembolü', category: 'financial' },
    { param_key: 'decimal_places', param_value: '2', param_type: 'number', description: 'Ondalık basamak sayısı', category: 'financial', min_value: '0', max_value: '4' },
    { param_key: 'thousand_separator', param_value: '.', param_type: 'string', description: 'Binlik ayırıcı', category: 'financial', options: '.,' },
    { param_key: 'decimal_separator', param_value: ',', param_type: 'string', description: 'Ondalık ayırıcı', category: 'financial', options: '.,' },
    
    // Tarih ve Zaman Parametreleri
    { param_key: 'timezone', param_value: 'Europe/Istanbul', param_type: 'string', description: 'Varsayılan zaman dilimi', category: 'datetime', is_required: true },
    { param_key: 'date_format', param_value: 'DD/MM/YYYY', param_type: 'string', description: 'Tarih formatı', category: 'datetime', options: 'DD/MM/YYYY,MM/DD/YYYY,YYYY-MM-DD' },
    { param_key: 'time_format', param_value: 'HH:mm:ss', param_type: 'string', description: 'Saat formatı', category: 'datetime', options: 'HH:mm:ss,hh:mm:ss A,HH:mm' },
    { param_key: 'week_start', param_value: 'monday', param_type: 'string', description: 'Haftanın başlangıç günü', category: 'datetime', options: 'monday,sunday' },
    
    // Güvenlik Parametreleri
    { param_key: 'jwt_secret', param_value: 'your-super-secret-jwt-key-2024', param_type: 'string', description: 'JWT gizli anahtarı', category: 'security', is_sensitive: true, is_required: true },
    { param_key: 'jwt_expires_in', param_value: '7d', param_type: 'string', description: 'JWT geçerlilik süresi', category: 'security', options: '1h,24h,7d,30d' },
    { param_key: 'bcrypt_rounds', param_value: '12', param_type: 'number', description: 'Bcrypt hash turu', category: 'security', min_value: '8', max_value: '16' },
    { param_key: 'password_min_length', param_value: '8', param_type: 'number', description: 'Minimum şifre uzunluğu', category: 'security', min_value: '6', max_value: '20' },
    { param_key: 'password_require_uppercase', param_value: 'true', param_type: 'boolean', description: 'Şifre büyük harf gerektirir', category: 'security' },
    { param_key: 'password_require_lowercase', param_value: 'true', param_type: 'boolean', description: 'Şifre küçük harf gerektirir', category: 'security' },
    { param_key: 'password_require_numbers', param_value: 'true', param_type: 'boolean', description: 'Şifre rakam gerektirir', category: 'security' },
    { param_key: 'password_require_symbols', param_value: 'false', param_type: 'boolean', description: 'Şifre sembol gerektirir', category: 'security' },
    { param_key: 'max_login_attempts', param_value: '5', param_type: 'number', description: 'Maksimum giriş denemesi', category: 'security', min_value: '3', max_value: '10' },
    { param_key: 'lockout_duration', param_value: '15', param_type: 'number', description: 'Hesap kilitleme süresi (dakika)', category: 'security', min_value: '5', max_value: '60' },
    { param_key: 'session_timeout', param_value: '3600', param_type: 'number', description: 'Oturum zaman aşımı (saniye)', category: 'security', min_value: '300', max_value: '86400' },
    
    // E-posta Parametreleri
    { param_key: 'smtp_host', param_value: '', param_type: 'string', description: 'SMTP sunucu adresi', category: 'email' },
    { param_key: 'smtp_port', param_value: '587', param_type: 'number', description: 'SMTP port numarası', category: 'email', min_value: '25', max_value: '587' },
    { param_key: 'smtp_secure', param_value: 'true', param_type: 'boolean', description: 'SMTP güvenli bağlantı', category: 'email' },
    { param_key: 'smtp_user', param_value: '', param_type: 'string', description: 'SMTP kullanıcı adı', category: 'email' },
    { param_key: 'smtp_password', param_value: '', param_type: 'string', description: 'SMTP şifresi', category: 'email', is_sensitive: true },
    { param_key: 'smtp_from_address', param_value: '', param_type: 'string', description: 'Gönderen e-posta adresi', category: 'email' },
    { param_key: 'smtp_from_name', param_value: '', param_type: 'string', description: 'Gönderen adı', category: 'email' },
    { param_key: 'enable_email_notifications', param_value: 'false', param_type: 'boolean', description: 'E-posta bildirimlerini etkinleştir', category: 'email' },
    
    // UI Parametreleri
    { param_key: 'ui_theme', param_value: 'light', param_type: 'string', description: 'Kullanıcı arayüzü teması', category: 'ui', options: 'light,dark,auto' },
    { param_key: 'ui_primary_color', param_value: '#007bff', param_type: 'string', description: 'Ana renk', category: 'ui' },
    { param_key: 'ui_secondary_color', param_value: '#6c757d', param_type: 'string', description: 'İkincil renk', category: 'ui' },
    { param_key: 'ui_accent_color', param_value: '#28a745', param_type: 'string', description: 'Vurgu rengi', category: 'ui' },
    { param_key: 'ui_font_family', param_value: 'Inter', param_type: 'string', description: 'Font ailesi', category: 'ui' },
    { param_key: 'ui_font_size', param_value: '14px', param_type: 'string', description: 'Font boyutu', category: 'ui' },
    { param_key: 'ui_enable_animations', param_value: 'true', param_type: 'boolean', description: 'Animasyonları etkinleştir', category: 'ui' },
    { param_key: 'ui_enable_tooltips', param_value: 'true', param_type: 'boolean', description: 'Tooltip\'leri etkinleştir', category: 'ui' },
    { param_key: 'ui_sidebar_position', param_value: 'left', param_type: 'string', description: 'Kenar çubuğu pozisyonu', category: 'ui', options: 'left,right' },
    { param_key: 'ui_sidebar_width', param_value: '250', param_type: 'number', description: 'Kenar çubuğu genişliği (px)', category: 'ui', min_value: '200', max_value: '400' },
    
    // Veritabanı Parametreleri
    { param_key: 'db_connection_pool_size', param_value: '10', param_type: 'number', description: 'Veritabanı bağlantı havuzu boyutu', category: 'database', min_value: '5', max_value: '50' },
    { param_key: 'db_max_connections', param_value: '100', param_type: 'number', description: 'Maksimum veritabanı bağlantısı', category: 'database', min_value: '10', max_value: '200' },
    { param_key: 'db_timeout', param_value: '30000', param_type: 'number', description: 'Veritabanı zaman aşımı (ms)', category: 'database', min_value: '5000', max_value: '60000' },
    
    // İzleme Parametreleri
    { param_key: 'monitoring_enabled', param_value: 'true', param_type: 'boolean', description: 'Sistem izlemeyi etkinleştir', category: 'monitoring' },
    { param_key: 'monitoring_interval', param_value: '60', param_type: 'number', description: 'İzleme aralığı (saniye)', category: 'monitoring', min_value: '30', max_value: '300' },
    { param_key: 'alert_cpu_threshold', param_value: '80', param_type: 'number', description: 'CPU kullanım uyarı eşiği (%)', category: 'monitoring', min_value: '50', max_value: '95' },
    { param_key: 'alert_memory_threshold', param_value: '85', param_type: 'number', description: 'Bellek kullanım uyarı eşiği (%)', category: 'monitoring', min_value: '50', max_value: '95' },
    { param_key: 'alert_disk_threshold', param_value: '90', param_type: 'number', description: 'Disk kullanım uyarı eşiği (%)', category: 'monitoring', min_value: '50', max_value: '95' },
    { param_key: 'alert_response_time_threshold', param_value: '5000', param_type: 'number', description: 'Yanıt süresi uyarı eşiği (ms)', category: 'monitoring', min_value: '1000', max_value: '10000' },
    { param_key: 'alert_error_rate_threshold', param_value: '5', param_type: 'number', description: 'Hata oranı uyarı eşiği (%)', category: 'monitoring', min_value: '1', max_value: '20' },
    
    // Yedekleme Parametreleri
    { param_key: 'backup_enabled', param_value: 'false', param_type: 'boolean', description: 'Otomatik yedeklemeyi etkinleştir', category: 'backup' },
    { param_key: 'backup_frequency', param_value: 'daily', param_type: 'string', description: 'Yedekleme sıklığı', category: 'backup', options: 'hourly,daily,weekly,monthly' },
    { param_key: 'backup_retention', param_value: '30', param_type: 'number', description: 'Yedekleme saklama süresi (gün)', category: 'backup', min_value: '7', max_value: '365' },
    { param_key: 'backup_compression', param_value: 'true', param_type: 'boolean', description: 'Yedekleme sıkıştırması', category: 'backup' },
    { param_key: 'backup_encryption', param_value: 'false', param_type: 'boolean', description: 'Yedekleme şifrelemesi', category: 'backup' },
    
    // Bildirim Parametreleri
    { param_key: 'notification_email_enabled', param_value: 'false', param_type: 'boolean', description: 'E-posta bildirimlerini etkinleştir', category: 'notification' },
    { param_key: 'notification_sms_enabled', param_value: 'false', param_type: 'boolean', description: 'SMS bildirimlerini etkinleştir', category: 'notification' },
    { param_key: 'notification_push_enabled', param_value: 'false', param_type: 'boolean', description: 'Push bildirimlerini etkinleştir', category: 'notification' },
    { param_key: 'notification_webhook_enabled', param_value: 'false', param_type: 'boolean', description: 'Webhook bildirimlerini etkinleştir', category: 'notification' },
    { param_key: 'notification_webhook_url', param_value: '', param_type: 'string', description: 'Webhook URL', category: 'notification' },
    { param_key: 'notification_user_registration', param_value: 'true', param_type: 'boolean', description: 'Kullanıcı kaydı bildirimi', category: 'notification' },
    { param_key: 'notification_password_reset', param_value: 'true', param_type: 'boolean', description: 'Şifre sıfırlama bildirimi', category: 'notification' },
    { param_key: 'notification_account_locked', param_value: 'true', param_type: 'boolean', description: 'Hesap kilitleme bildirimi', category: 'notification' },
    { param_key: 'notification_unusual_activity', param_value: 'true', param_type: 'boolean', description: 'Olağandışı aktivite bildirimi', category: 'notification' },
    { param_key: 'notification_system_alerts', param_value: 'true', param_type: 'boolean', description: 'Sistem uyarı bildirimi', category: 'notification' }
  ];

  for (const param of defaultParams) {
    try {
      const checkQuery = 'SELECT id FROM system_parameters WHERE param_key = $1';
      const checkResult = await query(checkQuery, [param.param_key]);
      
      if (checkResult.rows.length === 0) {
        const insertQuery = `
          INSERT INTO system_parameters (
            param_key, param_value, param_type, description, category, 
            is_editable, is_sensitive, validation_rules, default_value, 
            min_value, max_value, options, is_required
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `;
        await query(insertQuery, [
          param.param_key, 
          param.param_value, 
          param.param_type, 
          param.description, 
          param.category,
          param.is_editable !== undefined ? param.is_editable : true,
          param.is_sensitive !== undefined ? param.is_sensitive : false,
          param.validation_rules || null,
          param.default_value || param.param_value,
          param.min_value || null,
          param.max_value || null,
          param.options || null,
          param.is_required !== undefined ? param.is_required : false
        ]);
        console.log(`✅ Parametre eklendi: ${param.param_key}`);
      }
    } catch (error) {
      console.error(`Parametre işleme hatası (${param.param_key}):`, error);
    }
  }
}

// Veritabanı bağlantısını test et ve tabloları oluştur
const testConnection = async () => {
  try {
    // Test query çalıştır
    await sql`SELECT 1 as test`;
    console.log('✅ Neon veritabanına bağlandı');
    
    // Tabloları oluştur
    await createTables();
    console.log('✅ Veritabanı tabloları hazır');
  } catch (err) {
    console.error('❌ Veritabanı bağlantı hatası:', err);
  }
};

testConnection();

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
    const insertQuery = `
      INSERT INTO users (username, email, password_hash, full_name) 
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;

    const result = await query(insertQuery, [
      username, email, passwordHash, full_name
    ]);

    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla kaydedildi',
      user_id: result.rows[0].id
    });

  } catch (error) {
    if (error.code === '23505') { // PostgreSQL unique constraint violation
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
    console.log('🔍 LOGIN API çağrıldı');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔑 JWT_SECRET var mı:', !!JWT_SECRET);
    console.log('🌐 NODE_ENV:', process.env.NODE_ENV);
    
    const { username, password } = req.body;

    // Gerekli alanları kontrol et
    if (!username || !password) {
      console.log('❌ Eksik alanlar - username:', !!username, 'password:', !!password);
      return res.status(400).json({ 
        success: false, 
        message: 'Kullanıcı adı ve şifre zorunludur' 
      });
    }

    console.log('✅ Alanlar tamam, veritabanı sorgusu başlıyor...');

    // Kullanıcıyı veritabanından bul
    const selectQuery = 'SELECT * FROM users WHERE username = $1 AND is_active = TRUE';
    console.log('🔍 SQL Query:', selectQuery);
    console.log('🔍 Username:', username);
    
    const result = await query(selectQuery, [username]);
    console.log('📊 Veritabanı sonucu:', result.rows.length, 'kullanıcı bulundu');

    if (result.rows.length === 0) {
      console.log('❌ Kullanıcı bulunamadı');
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz kullanıcı adı veya şifre' 
      });
    }

    const user = result.rows[0];
    console.log('✅ Kullanıcı bulundu - ID:', user.id, 'Username:', user.username);

    // Şifreyi kontrol et
    console.log('🔐 Şifre kontrolü başlıyor...');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log('🔐 Şifre geçerli mi:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Şifre geçersiz');
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz kullanıcı adı veya şifre' 
      });
    }

    console.log('✅ Şifre doğru, JWT token oluşturuluyor...');

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

    console.log('✅ JWT token oluşturuldu');

    // Son giriş tarihini güncelle
    console.log('📅 Son giriş tarihi güncelleniyor...');
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    console.log('✅ Login başarılı - Response gönderiliyor');
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
    console.error('❌ Kullanıcı giriş hatası:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });
    res.status(500).json({ 
      success: false, 
      message: 'Giriş yapılırken hata oluştu',
      error: error.message
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

// ==================== ACCOUNTS API ENDPOINTS ====================

// Hesapları getir
app.get('/api/accounts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const selectQuery = `
      SELECT a.*, b.bank_name 
      FROM accounts a 
      JOIN banks b ON a.bank_id = b.id 
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
    `;
    
    const result = await query(selectQuery, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Hesaplar getirme hatası:', error);
    res.status(500).json({ error: 'Hesaplar getirilemedi' });
  }
});

// Yeni hesap ekle
app.post('/api/accounts', authenticateToken, async (req, res) => {
  try {
    const { bank_id, account_name, account_number, iban, account_type, account_limit, current_balance, is_credit_account, credit_limit } = req.body;
    const userId = req.user.user_id;
    
    // Boş string değerleri NULL veya 0 olarak değiştir
    const cleanAccountLimit = account_limit === '' ? null : parseFloat(account_limit) || 0;
    const cleanCreditLimit = credit_limit === '' ? null : parseFloat(credit_limit) || 0;
    const cleanCurrentBalance = parseFloat(current_balance) || 0;
    
    const insertQuery = `
      INSERT INTO accounts (user_id, bank_id, account_name, account_number, iban, account_type, account_limit, current_balance, is_credit_account, credit_limit) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;
    
    const result = await query(insertQuery, [userId, bank_id, account_name, account_number, iban, account_type, cleanAccountLimit, cleanCurrentBalance, is_credit_account, cleanCreditLimit]);
    
    res.json({ id: result.rows[0].id, message: 'Hesap başarıyla eklendi' });
  } catch (error) {
    console.error('Hesap ekleme hatası:', error);
    res.status(500).json({ error: 'Hesap eklenemedi' });
  }
});

// ==================== CREDIT CARDS API ENDPOINTS ====================

// Kredi kartlarını getir
app.get('/api/credit-cards', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const selectQuery = `
      SELECT c.*, b.bank_name 
      FROM credit_cards c 
      JOIN banks b ON c.bank_id = b.id 
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `;
    
    const result = await query(selectQuery, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Kredi kartları getirme hatası:', error);
    res.status(500).json({ error: 'Kredi kartları getirilemedi' });
  }
});

// Yeni kredi kartı ekle
app.post('/api/credit-cards', authenticateToken, async (req, res) => {
  try {
    const { bank_id, card_name, card_number, card_limit, remaining_limit, statement_date } = req.body;
    const userId = req.user.user_id;
    
    // Boş string değerleri 0 olarak değiştir
    const cleanCardLimit = parseFloat(card_limit) || 0;
    const cleanRemainingLimit = parseFloat(remaining_limit) || 0;
    
    const insertQuery = `
      INSERT INTO credit_cards (user_id, bank_id, card_name, card_number, card_limit, remaining_limit, statement_date) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    
    const result = await query(insertQuery, [userId, bank_id, card_name, card_number, cleanCardLimit, cleanRemainingLimit, statement_date]);
    
    res.json({ id: result.rows[0].id, message: 'Kredi kartı başarıyla eklendi' });
  } catch (error) {
    console.error('Kredi kartı ekleme hatası:', error);
    res.status(500).json({ error: 'Kredi kartı eklenemedi' });
  }
});

// ==================== INCOMES API ENDPOINTS ====================

// Gelir ekleme
app.post('/api/incomes', authenticateToken, async (req, res) => {
  try {
    const { title, amount, income_type, source, description, income_date } = req.body;
    const userId = req.user.user_id;
    
    const insertQuery = `
      INSERT INTO incomes (user_id, title, amount, income_type, source, description, income_date) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    
    const result = await query(insertQuery, [userId, title, amount, income_type, source, description, income_date]);
    
    res.status(201).json({
      success: true,
      message: 'Gelir başarıyla eklendi',
      income_id: result.rows[0].id
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
    const selectQuery = 'SELECT * FROM incomes WHERE user_id = $1 ORDER BY income_date DESC';
    const result = await query(selectQuery, [userId]);
    res.json({ success: true, incomes: result.rows });
  } catch (error) {
    console.error('Gelir listeleme hatası:', error);
    res.status(500).json({ success: false, message: 'Gelirler listelenirken hata oluştu' });
  }
});

// ==================== EXPENSES API ENDPOINTS ====================

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
    
    // Önce tabloyu temizle ve sadece 8 kategori ekle (PostgreSQL için)
    await query('DELETE FROM expense_categories');
    
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
    
    await query(insertQuery);
    
    // Şimdi kategorileri al
    const selectQuery = 'SELECT id, name, color FROM expense_categories ORDER BY name';
    const result = await query(selectQuery);
    
    console.log(`📊 Kategoriler yeniden oluşturuldu: ${result.rows.length} adet`);
    
    res.json({ success: true, categories: result.rows });
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
    
    // Boş string değerleri NULL olarak değiştir ve precision hatasını düzelt
    const cleanAmount = Math.round(Number(amount) * 100) / 100;
    const cleanRelatedAccountId = related_account_id === '' ? null : parseInt(related_account_id);
    const cleanRelatedCreditCardId = related_credit_card_id === '' ? null : parseInt(related_credit_card_id);
    const cleanRelatedCreditAccountId = related_credit_account_id === '' ? null : parseInt(related_credit_account_id);
    
    // Tarih alanlarını temizle
    const cleanDueDate = due_date === '' ? null : due_date;
    const cleanPaymentDate = payment_date === '' ? null : payment_date;
    
    const insertQuery = `
      INSERT INTO expenses (user_id, title, amount, category_id, expense_type, payment_method,
                          related_account_id, related_credit_card_id, related_credit_account_id,
                          due_date, payment_date, description, is_paid) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `;
    
    const is_paid = cleanPaymentDate ? true : false;
    const userId = req.user.user_id;
    
    const result = await query(insertQuery, [
      userId, title, cleanAmount, category_id, expense_type, payment_method,
      cleanRelatedAccountId, cleanRelatedCreditCardId, cleanRelatedCreditAccountId,
      cleanDueDate, cleanPaymentDate, description, is_paid
    ]);
    
    const expenseId = result.rows[0].id;
    
    // Seçilen ödeme yöntemine göre hesap/karttan tutar düş
    if (cleanRelatedAccountId && payment_method === 'bank_transfer') {
      // Mevduat hesabından tutar düş
      await query(
        'UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2',
        [cleanAmount, cleanRelatedAccountId]
      );
      console.log(`💰 ${cleanAmount}₺ tutarı hesap ID:${cleanRelatedAccountId}'den düşüldü`);
    } else if (cleanRelatedCreditCardId && payment_method === 'credit_card') {
      // Kredi kartından tutar düş
      await query(
        'UPDATE credit_cards SET remaining_limit = remaining_limit - $1 WHERE id = $2',
        [cleanAmount, cleanRelatedCreditCardId]
      );
      console.log(`💳 ${cleanAmount}₺ tutarı kredi kartı ID:${cleanRelatedCreditCardId}'den düşüldü`);
    } else if (cleanRelatedCreditAccountId && payment_method === 'credit_account') {
      // Kredili hesaptan tutar düş
      await query(
        'UPDATE accounts SET credit_limit = credit_limit - $1 WHERE id = $2',
        [cleanAmount, cleanRelatedCreditAccountId]
      );
      console.log(`🏦 ${cleanAmount}₺ tutarı kredili hesap ID:${cleanRelatedCreditAccountId}'den düşüldü`);
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

// Ev kirası detaylarını ekle
app.post('/api/rent-expenses', authenticateToken, async (req, res) => {
  try {
    const {
      expense_id, rent_amount, maintenance_fee, property_tax, insurance,
      other_fees, property_address, landlord_name, contract_start_date,
      contract_end_date, due_date
    } = req.body;
    
    console.log('🏠 Rent expenses verisi alındı:', req.body);
    
    // Rent expenses tablosunu oluştur (eğer yoksa)
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS rent_expenses (
        id SERIAL PRIMARY KEY,
        expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rent_amount DECIMAL(10,2),
        maintenance_fee DECIMAL(10,2),
        property_tax DECIMAL(10,2),
        insurance DECIMAL(10,2),
        other_fees DECIMAL(10,2),
        property_address TEXT,
        landlord_name TEXT,
        contract_start_date DATE,
        contract_end_date DATE,
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await query(createTableQuery);
    console.log('✅ Rent expenses tablosu oluşturuldu/kontrol edildi');
    
    // Boş string değerleri NULL olarak temizle ve precision hatasını düzelt
    const cleanRentAmount = rent_amount === '' ? null : Math.round(Number(rent_amount) * 100) / 100;
    const cleanMaintenanceFee = maintenance_fee === '' ? null : Math.round(Number(maintenance_fee) * 100) / 100;
    const cleanPropertyTax = property_tax === '' ? null : Math.round(Number(property_tax) * 100) / 100;
    const cleanInsurance = insurance === '' ? null : Math.round(Number(insurance) * 100) / 100;
    const cleanOtherFees = other_fees === '' ? null : Math.round(Number(other_fees) * 100) / 100;
    const cleanPropertyAddress = property_address === '' ? null : property_address;
    const cleanLandlordName = landlord_name === '' ? null : landlord_name;
    const cleanContractStartDate = contract_start_date === '' ? null : contract_start_date;
    const cleanContractEndDate = contract_end_date === '' ? null : contract_end_date;
    const cleanDueDate = due_date === '' ? null : due_date;
    
    const insertQuery = `
      INSERT INTO rent_expenses (
        expense_id, user_id, rent_amount, maintenance_fee, property_tax,
        insurance, other_fees, property_address, landlord_name,
        contract_start_date, contract_end_date, due_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;
    
    const userId = req.user.user_id;
    
    console.log('📝 Rent expenses insert parametreleri:', [
      expense_id, userId, cleanRentAmount, cleanMaintenanceFee, cleanPropertyTax,
      cleanInsurance, cleanOtherFees, cleanPropertyAddress, cleanLandlordName,
      cleanContractStartDate, cleanContractEndDate, cleanDueDate
    ]);
    
    const result = await query(insertQuery, [
      expense_id, userId, cleanRentAmount, cleanMaintenanceFee, cleanPropertyTax,
      cleanInsurance, cleanOtherFees, cleanPropertyAddress, cleanLandlordName,
      cleanContractStartDate, cleanContractEndDate, cleanDueDate
    ]);
    
    console.log('✅ Rent expenses başarıyla eklendi:', result.rows[0].id);
    
    res.status(201).json({
      success: true,
      message: 'Ev kirası detayları başarıyla eklendi',
      rent_expense_id: result.rows[0].id
    });
  } catch (error) {
    console.error('❌ Ev kirası detayları ekleme hatası:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      success: false, 
      message: 'Ev kirası detayları eklenirken hata oluştu',
      error: error.message 
    });
  }
});

// Giderleri listele
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const selectQuery = `
      SELECT e.*, ec.name as category_name, ec.color as category_color,
             a.account_name, cc.card_name
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      LEFT JOIN accounts a ON e.related_account_id = a.id
      LEFT JOIN credit_cards cc ON e.related_credit_card_id = cc.id
      WHERE e.user_id = $1
      ORDER BY e.created_at DESC
    `;
    const result = await query(selectQuery, [userId]);
    res.json({ success: true, expenses: result.rows });
  } catch (error) {
    console.error('Gider listeleme hatası:', error);
    res.status(500).json({ success: false, message: 'Giderler listelenirken hata oluştu' });
  }
});

// ==================== DASHBOARD API ENDPOINTS ====================

// Dashboard verilerini getir
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Dashboard API çağrıldı - User ID:', req.user.user_id);
    const userId = req.user.user_id;
    
    // Toplam gelir
    console.log('📊 Toplam gelir hesaplanıyor...');
    const totalIncomeQuery = 'SELECT COALESCE(SUM(amount), 0) as total FROM incomes WHERE user_id = $1';
    const totalIncomeResult = await query(totalIncomeQuery, [userId]);
    const totalIncome = totalIncomeResult.rows[0].total;
    console.log('✅ Toplam gelir:', totalIncome);
    
    // Toplam gider
    console.log('📊 Toplam gider hesaplanıyor...');
    const totalExpenseQuery = 'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = $1';
    const totalExpenseResult = await query(totalExpenseQuery, [userId]);
    const totalExpense = totalExpenseResult.rows[0].total;
    console.log('✅ Toplam gider:', totalExpense);
    
    // Hesap bakiyeleri
    console.log('📊 Hesap bakiyeleri getiriliyor...');
    const accountsQuery = 'SELECT account_name, current_balance FROM accounts WHERE user_id = $1';
    const accountsResult = await query(accountsQuery, [userId]);
    console.log('✅ Hesap sayısı:', accountsResult.rows.length);
    
    // Kredi kartı limitleri
    console.log('📊 Kredi kartı limitleri getiriliyor...');
    const creditCardsQuery = 'SELECT card_name, remaining_limit FROM credit_cards WHERE user_id = $1';
    const creditCardsResult = await query(creditCardsQuery, [userId]);
    console.log('✅ Kredi kartı sayısı:', creditCardsResult.rows.length);
    
    const dashboardData = {
      totalIncome,
      totalExpense,
      accounts: accountsResult.rows,
      creditCards: creditCardsResult.rows
    };
    
    console.log('✅ Dashboard verileri başarıyla hazırlandı');
    res.json({ dashboard: dashboardData });
  } catch (error) {
    console.error('❌ Dashboard veri getirme hatası:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      error: 'Dashboard verileri getirilemedi',
      details: error.message 
    });
  }
});

// ==================== BANKS API ENDPOINTS ====================

// Bankaları getir (Tüm kullanıcılar erişebilir)
app.get('/api/banks', async (req, res) => {
  try {
    console.log('🔍 Banks API çağrıldı');
    const selectQuery = 'SELECT * FROM banks ORDER BY bank_name';
    const result = await query(selectQuery);
    console.log('✅ Bankalar başarıyla getirildi:', result.rows.length, 'adet');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Bankalar getirme hatası:', error);
    res.status(500).json({ error: 'Bankalar getirilemedi' });
  }
});

// Yeni banka ekle (Admin Only)
app.post('/api/banks', authenticateAdmin, async (req, res) => {
  try {
    const { bank_name } = req.body;
    
    if (!bank_name || bank_name.trim() === '') {
      return res.status(400).json({ error: 'Banka adı boş olamaz' });
    }
    
    // Önce banka adının zaten var olup olmadığını kontrol et
    const checkQuery = 'SELECT id FROM banks WHERE bank_name = $1';
    const checkResult = await query(checkQuery, [bank_name.trim()]);
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: 'Bu banka adı zaten mevcut' });
    }
    
    // Banka yoksa ekle
    const insertQuery = 'INSERT INTO banks (bank_name) VALUES ($1) RETURNING id';
    const insertResult = await query(insertQuery, [bank_name.trim()]);
    
    res.json({ id: insertResult.rows[0].id, bank_name: bank_name.trim() });
  } catch (error) {
    console.error('Banka ekleme hatası:', error);
    res.status(500).json({ error: 'Banka eklenemedi' });
  }
});

// ==================== ADMIN API ENDPOINTS ====================

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    console.log('🔍 ADMIN LOGIN API çağrıldı');
    const { adminPassword } = req.body;
    
    if (!adminPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin şifresi gerekli' 
      });
    }
    
    if (adminPassword !== ADMIN_PASSWORD) {
      console.log('❌ Yanlış admin şifresi:', adminPassword);
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz admin şifresi' 
      });
    }
    
    console.log('✅ Admin girişi başarılı');
    res.json({
      success: true,
      message: 'Admin girişi başarılı',
      admin: true
    });
    
  } catch (error) {
    console.error('❌ Admin login hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Admin girişi sırasında hata oluştu' 
    });
  }
});

// Admin dashboard verileri
app.post('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 ADMIN DASHBOARD API çağrıldı');
    
    // Toplam kullanıcı sayısı
    const totalUsersQuery = 'SELECT COUNT(*) as count FROM users';
    const totalUsersResult = await query(totalUsersQuery);
    const totalUsers = totalUsersResult.rows[0].count;
    
    // Toplam hesap sayısı
    const totalAccountsQuery = 'SELECT COUNT(*) as count FROM accounts';
    const totalAccountsResult = await query(totalAccountsQuery);
    const totalAccounts = totalAccountsResult.rows[0].count;
    
    // Toplam kredi kartı sayısı
    const totalCreditCardsQuery = 'SELECT COUNT(*) as count FROM credit_cards';
    const totalCreditCardsResult = await query(totalCreditCardsQuery);
    const totalCreditCards = totalCreditCardsResult.rows[0].count;
    
    // Toplam gelir
    const totalIncomeQuery = 'SELECT COALESCE(SUM(amount), 0) as total FROM incomes';
    const totalIncomeResult = await query(totalIncomeQuery);
    const totalIncome = totalIncomeResult.rows[0].total;
    
    // Toplam gider
    const totalExpenseQuery = 'SELECT COALESCE(SUM(amount), 0) as total FROM expenses';
    const totalExpenseResult = await query(totalExpenseQuery);
    const totalExpense = totalExpenseResult.rows[0].total;
    
    const dashboardData = {
      totalUsers: parseInt(totalUsers),
      totalAccounts: parseInt(totalAccounts),
      totalCreditCards: parseInt(totalCreditCards),
      totalIncome: parseFloat(totalIncome),
      totalExpense: parseFloat(totalExpense),
      netIncome: parseFloat(totalIncome) - parseFloat(totalExpense)
    };
    
    console.log('✅ Admin dashboard verileri hazırlandı:', dashboardData);
    res.json({ success: true, dashboard: dashboardData });
    
  } catch (error) {
    console.error('❌ Admin dashboard hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Dashboard verileri alınamadı' 
    });
  }
});

// Tüm kullanıcıları listele
app.post('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 ADMIN USERS API çağrıldı');
    
    const selectQuery = `
      SELECT id, username, email, full_name, is_active, 
             last_login, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `;
    const result = await query(selectQuery);
    
    console.log('✅ Kullanıcılar başarıyla getirildi:', result.rows.length, 'adet');
    res.json({ success: true, users: result.rows });
    
  } catch (error) {
    console.error('❌ Admin users hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Kullanıcılar listelenirken hata oluştu' 
    });
  }
});

// Sistem parametrelerini getir
app.post('/api/admin/system-parameters', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 ADMIN SYSTEM PARAMETERS API çağrıldı');
    
    const selectQuery = 'SELECT * FROM system_parameters ORDER BY category, param_key';
    const result = await query(selectQuery);
    
    console.log('✅ Sistem parametreleri başarıyla getirildi:', result.rows.length, 'adet');
    res.json({ 
      success: true, 
      parameters: result.rows 
    });
    
  } catch (error) {
    console.error('❌ Admin system parameters hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sistem parametreleri listelenirken hata oluştu' 
    });
  }
});

// Sistem parametrelerini güncelle
app.post('/api/admin/update-system-parameters', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 ADMIN UPDATE SYSTEM PARAMETERS API çağrıldı');
    const { paramId, paramValue } = req.body;
    
    if (!paramId || paramValue === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Parametre ID ve değeri gerekli' 
      });
    }
    
    const updateQuery = 'UPDATE system_parameters SET param_value = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    await query(updateQuery, [paramValue, paramId]);
    
    console.log('✅ Sistem parametresi güncellendi:', paramId);
    res.json({ 
      success: true, 
      message: 'Sistem parametresi başarıyla güncellendi' 
    });
    
  } catch (error) {
    console.error('❌ Admin update system parameters hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sistem parametresi güncellenirken hata oluştu' 
    });
  }
});

// Yeni sistem parametresi ekle
app.post('/api/admin/add-system-parameter', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 ADMIN ADD SYSTEM PARAMETER API çağrıldı');
    const { param_key, param_value, param_type, description, category, is_editable, is_sensitive } = req.body;
    
    if (!param_key || param_value === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Parametre anahtarı ve değeri gerekli' 
      });
    }
    
    // Parametre anahtarının benzersiz olup olmadığını kontrol et
    const checkQuery = 'SELECT id FROM system_parameters WHERE param_key = $1';
    const checkResult = await query(checkQuery, [param_key]);
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bu parametre anahtarı zaten mevcut' 
      });
    }
    
    const insertQuery = `
      INSERT INTO system_parameters (param_key, param_value, param_type, description, category, is_editable, is_sensitive) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    
    const result = await query(insertQuery, [
      param_key, 
      param_value, 
      param_type || 'string', 
      description || '', 
      category || 'general',
      is_editable !== undefined ? is_editable : true,
      is_sensitive !== undefined ? is_sensitive : false
    ]);
    
    console.log('✅ Yeni sistem parametresi eklendi:', param_key);
    res.json({ 
      success: true, 
      message: 'Sistem parametresi başarıyla eklendi',
      parameter_id: result.rows[0].id
    });
    
  } catch (error) {
    console.error('❌ Admin add system parameter hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sistem parametresi eklenirken hata oluştu' 
    });
  }
});

// Sistem parametresi sil
app.delete('/api/admin/delete-system-parameter', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 ADMIN DELETE SYSTEM PARAMETER API çağrıldı');
    const { paramId } = req.body;
    
    if (!paramId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Parametre ID gerekli' 
      });
    }
    
    // Önce parametrenin var olup olmadığını kontrol et
    const checkQuery = 'SELECT param_key FROM system_parameters WHERE id = $1';
    const checkResult = await query(checkQuery, [paramId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Parametre bulunamadı' 
      });
    }
    
    const deleteQuery = 'DELETE FROM system_parameters WHERE id = $1';
    await query(deleteQuery, [paramId]);
    
    console.log('✅ Sistem parametresi silindi:', paramId);
    res.json({ 
      success: true, 
      message: 'Sistem parametresi başarıyla silindi' 
    });
    
  } catch (error) {
    console.error('❌ Admin delete system parameter hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sistem parametresi silinirken hata oluştu' 
    });
  }
});

// Sistem parametrelerini toplu güncelle
app.post('/api/admin/bulk-update-system-parameters', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 ADMIN BULK UPDATE SYSTEM PARAMETERS API çağrıldı');
    const { parameters } = req.body;
    
    if (!parameters || !Array.isArray(parameters)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Parametre listesi gerekli' 
      });
    }
    
    let updatedCount = 0;
    
    for (const param of parameters) {
      if (param.id && param.param_value !== undefined) {
        const updateQuery = 'UPDATE system_parameters SET param_value = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
        await query(updateQuery, [param.param_value, param.id]);
        updatedCount++;
      }
    }
    
    console.log('✅ Toplu güncelleme tamamlandı:', updatedCount, 'parametre güncellendi');
    res.json({ 
      success: true, 
      message: `${updatedCount} parametre başarıyla güncellendi` 
    });
    
  } catch (error) {
    console.error('❌ Admin bulk update system parameters hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Parametreler toplu güncellenirken hata oluştu' 
    });
  }
});

// Sistem parametrelerini dışa aktar
app.post('/api/admin/export-system-parameters', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 ADMIN EXPORT SYSTEM PARAMETERS API çağrıldı');
    
    const selectQuery = 'SELECT * FROM system_parameters ORDER BY category, param_key';
    const result = await query(selectQuery);
    
    const exportData = {
      export_date: new Date().toISOString(),
      total_parameters: result.rows.length,
      parameters: result.rows
    };
    
    console.log('✅ Sistem parametreleri dışa aktarıldı:', result.rows.length, 'parametre');
    res.json({ 
      success: true, 
      data: exportData 
    });
    
  } catch (error) {
    console.error('❌ Admin export system parameters hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sistem parametreleri dışa aktarılırken hata oluştu' 
    });
  }
});

// Sistem parametrelerini içe aktar
app.post('/api/admin/import-system-parameters', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 ADMIN IMPORT SYSTEM PARAMETERS API çağrıldı');
    const { parameters, overwrite } = req.body;
    
    if (!parameters || !Array.isArray(parameters)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Parametre listesi gerekli' 
      });
    }
    
    let importedCount = 0;
    let updatedCount = 0;
    
    for (const param of parameters) {
      if (param.param_key && param.param_value !== undefined) {
        // Parametrenin var olup olmadığını kontrol et
        const checkQuery = 'SELECT id FROM system_parameters WHERE param_key = $1';
        const checkResult = await query(checkQuery, [param.param_key]);
        
        if (checkResult.rows.length > 0) {
          if (overwrite) {
            // Mevcut parametreyi güncelle
            const updateQuery = 'UPDATE system_parameters SET param_value = $1, updated_at = CURRENT_TIMESTAMP WHERE param_key = $2';
            await query(updateQuery, [param.param_value, param.param_key]);
            updatedCount++;
          }
        } else {
          // Yeni parametre ekle
          const insertQuery = `
            INSERT INTO system_parameters (param_key, param_value, param_type, description, category, is_editable, is_sensitive) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `;
          await query(insertQuery, [
            param.param_key,
            param.param_value,
            param.param_type || 'string',
            param.description || '',
            param.category || 'general',
            param.is_editable !== undefined ? param.is_editable : true,
            param.is_sensitive !== undefined ? param.is_sensitive : false
          ]);
          importedCount++;
        }
      }
    }
    
    console.log('✅ İçe aktarma tamamlandı:', importedCount, 'yeni,', updatedCount, 'güncellendi');
    res.json({ 
      success: true, 
      message: `${importedCount} yeni parametre eklendi, ${updatedCount} parametre güncellendi` 
    });
    
  } catch (error) {
    console.error('❌ Admin import system parameters hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sistem parametreleri içe aktarılırken hata oluştu' 
    });
  }
});

// Uygulama parametrelerini güncelle
app.post('/api/admin/update-application-parameters', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 ADMIN UPDATE APPLICATION PARAMETERS API çağrıldı');
    
    // Varsayılan uygulama parametreleri
    const defaultParameters = [
      {
        param_key: 'app_name',
        param_value: 'Gelir Gider Takip',
        param_type: 'string',
        description: 'Uygulama adı',
        category: 'general',
        is_editable: true,
        is_sensitive: false
      },
      {
        param_key: 'app_version',
        param_value: '1.0.0',
        param_type: 'string',
        description: 'Uygulama versiyonu',
        category: 'general',
        is_editable: true,
        is_sensitive: false
      },
      {
        param_key: 'default_currency',
        param_value: 'TRY',
        param_type: 'string',
        description: 'Varsayılan para birimi',
        category: 'financial',
        is_editable: true,
        is_sensitive: false
      },
      {
        param_key: 'jwt_secret',
        param_value: 'your-super-secret-jwt-key-2024',
        param_type: 'string',
        description: 'JWT gizli anahtarı',
        category: 'security',
        is_editable: true,
        is_sensitive: true
      },
      {
        param_key: 'jwt_expires_in',
        param_value: '24h',
        param_type: 'string',
        description: 'JWT geçerlilik süresi',
        category: 'security',
        is_editable: true,
        is_sensitive: false
      },
      {
        param_key: 'bcrypt_rounds',
        param_value: '12',
        param_type: 'number',
        description: 'BCrypt hash turu',
        category: 'security',
        is_editable: true,
        is_sensitive: false
      },
      {
        param_key: 'password_min_length',
        param_value: '6',
        param_type: 'number',
        description: 'Minimum şifre uzunluğu',
        category: 'security',
        is_editable: true,
        is_sensitive: false
      },
      {
        param_key: 'max_login_attempts',
        param_value: '5',
        param_type: 'number',
        description: 'Maksimum giriş denemesi',
        category: 'security',
        is_editable: true,
        is_sensitive: false
      },
      {
        param_key: 'session_timeout',
        param_value: '3600',
        param_type: 'number',
        description: 'Oturum zaman aşımı (saniye)',
        category: 'security',
        is_editable: true,
        is_sensitive: false
      },
      {
        param_key: 'enable_email_notifications',
        param_value: 'false',
        param_type: 'boolean',
        description: 'E-posta bildirimlerini etkinleştir',
        category: 'notification',
        is_editable: true,
        is_sensitive: false
      },
      {
        param_key: 'enable_sms_notifications',
        param_value: 'false',
        param_type: 'boolean',
        description: 'SMS bildirimlerini etkinleştir',
        category: 'notification',
        is_editable: true,
        is_sensitive: false
      },
      {
        param_key: 'enable_auto_backup',
        param_value: 'false',
        param_type: 'boolean',
        description: 'Otomatik yedeklemeyi etkinleştir',
        category: 'backup',
        is_editable: true,
        is_sensitive: false
      },
      {
        param_key: 'backup_frequency',
        param_value: 'daily',
        param_type: 'string',
        description: 'Yedekleme sıklığı',
        category: 'backup',
        is_editable: true,
        is_sensitive: false
      },
      {
        param_key: 'enable_monitoring',
        param_value: 'true',
        param_type: 'boolean',
        description: 'Sistem izlemeyi etkinleştir',
        category: 'monitoring',
        is_editable: true,
        is_sensitive: false
      },
      {
        param_key: 'monitoring_interval',
        param_value: '60',
        param_type: 'number',
        description: 'İzleme aralığı (saniye)',
        category: 'monitoring',
        is_editable: true,
        is_sensitive: false
      },
      {
        param_key: 'ui_theme',
        param_value: 'light',
        param_type: 'string',
        description: 'Kullanıcı arayüzü teması',
        category: 'ui',
        is_editable: true,
        is_sensitive: false
      },
      {
        param_key: 'ui_language',
        param_value: 'tr',
        param_type: 'string',
        description: 'Kullanıcı arayüzü dili',
        category: 'ui',
        is_editable: true,
        is_sensitive: false
      },
      {
        param_key: 'timezone',
        param_value: 'Europe/Istanbul',
        param_type: 'string',
        description: 'Sistem zaman dilimi',
        category: 'datetime',
        is_editable: true,
        is_sensitive: false
      },
      {
        param_key: 'date_format',
        param_value: 'DD/MM/YYYY',
        param_type: 'string',
        description: 'Tarih formatı',
        category: 'datetime',
        is_editable: true,
        is_sensitive: false
      },
      {
        param_key: 'time_format',
        param_value: 'HH:mm:ss',
        param_type: 'string',
        description: 'Saat formatı',
        category: 'datetime',
        is_editable: true,
        is_sensitive: false
      }
    ];
    
    let addedCount = 0;
    let updatedCount = 0;
    const categories = new Map();
    
    for (const param of defaultParameters) {
      // Parametrenin var olup olmadığını kontrol et
      const checkQuery = 'SELECT id FROM system_parameters WHERE param_key = $1';
      const checkResult = await query(checkQuery, [param.param_key]);
      
      if (checkResult.rows.length === 0) {
        // Yeni parametre ekle
        const insertQuery = `
          INSERT INTO system_parameters (param_key, param_value, param_type, description, category, is_editable, is_sensitive) 
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        await query(insertQuery, [
          param.param_key,
          param.param_value,
          param.param_type,
          param.description,
          param.category,
          param.is_editable,
          param.is_sensitive
        ]);
        addedCount++;
      } else {
        // Mevcut parametreyi güncelle
        const updateQuery = `
          UPDATE system_parameters 
          SET param_value = $1, param_type = $2, description = $3, category = $4, is_editable = $5, is_sensitive = $6, updated_at = CURRENT_TIMESTAMP 
          WHERE param_key = $7
        `;
        await query(updateQuery, [
          param.param_value,
          param.param_type,
          param.description,
          param.category,
          param.is_editable,
          param.is_sensitive,
          param.param_key
        ]);
        updatedCount++;
      }
      
      // Kategori sayısını hesapla
      if (!categories.has(param.category)) {
        categories.set(param.category, 0);
      }
      categories.set(param.category, categories.get(param.category) + 1);
    }
    
    // Kategori istatistiklerini hazırla
    const categoryStats = Array.from(categories.entries()).map(([name, count]) => ({ name, count }));
    
    console.log('✅ Uygulama parametreleri güncellendi:', addedCount, 'yeni,', updatedCount, 'güncellendi');
    res.json({ 
      success: true, 
      message: 'Uygulama parametreleri başarıyla güncellendi',
      summary: {
        added: addedCount,
        updated: updatedCount,
        total: addedCount + updatedCount,
        categories: categoryStats
      }
    });
    
  } catch (error) {
    console.error('❌ Admin update application parameters hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Uygulama parametreleri güncellenirken hata oluştu' 
    });
  }
});

// Sistem konfigürasyonunu getir
app.post('/api/admin/system-config', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 ADMIN SYSTEM CONFIG API çağrıldı');
    
    // Sistem parametrelerinden konfigürasyon oluştur
    const selectQuery = 'SELECT * FROM system_parameters ORDER BY category, param_key';
    const result = await query(selectQuery);
    
    const config = {
      database: {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: process.env.POSTGRES_PORT || 5432,
        name: process.env.POSTGRES_DATABASE || 'gelir_gider_takip',
        user: process.env.POSTGRES_USER || 'postgres',
        ssl_mode: 'require',
        connection_pool_size: 10,
        max_connections: 100,
        timeout: 30000
      },
      application: {
        name: 'Gelir Gider Takip',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        debug: false,
        log_level: 'info',
        timezone: 'Europe/Istanbul',
        locale: 'tr-TR',
        currency: 'TRY',
        date_format: 'DD/MM/YYYY',
        time_format: 'HH:mm:ss'
      },
      security: {
        jwt_secret: 'your-super-secret-jwt-key-2024',
        jwt_expires_in: '24h',
        bcrypt_rounds: 12,
        password_min_length: 6,
        password_require_uppercase: true,
        password_require_lowercase: true,
        password_require_numbers: true,
        password_require_symbols: false,
        max_login_attempts: 5,
        lockout_duration: 15,
        session_timeout: 3600,
        enable_2fa: false,
        enable_captcha: false,
        enable_rate_limiting: true,
        rate_limit_window: 900,
        rate_limit_max_requests: 100
      },
      email: {
        provider: 'smtp',
        host: '',
        port: 587,
        secure: true,
        user: '',
        password: '',
        from_address: '',
        from_name: '',
        enable_notifications: false
      },
      notification: {
        enable_email: false,
        enable_sms: false,
        enable_push: false,
        enable_webhook: false,
        webhook_url: '',
        notification_types: {
          user_registration: true,
          password_reset: true,
          account_locked: true,
          unusual_activity: true,
          system_alerts: true
        }
      },
      backup: {
        enable_auto_backup: false,
        backup_frequency: 'daily',
        backup_retention: 30,
        backup_location: 'local',
        backup_encryption: false,
        backup_compression: true
      },
      monitoring: {
        enable_monitoring: true,
        monitoring_interval: 60,
        alert_thresholds: {
          cpu_usage: 80,
          memory_usage: 85,
          disk_usage: 90,
          response_time: 5000,
          error_rate: 5
        },
        enable_logging: true,
        log_retention: 90,
        enable_analytics: true
      },
      ui: {
        theme: 'light',
        primary_color: '#007bff',
        secondary_color: '#6c757d',
        accent_color: '#28a745',
        font_family: 'Inter',
        font_size: '14px',
        enable_animations: true,
        enable_tooltips: true,
        enable_shortcuts: true,
        sidebar_position: 'left',
        sidebar_width: 250,
        enable_breadcrumbs: true,
        enable_search: true
      }
    };
    
    // Sistem parametrelerinden değerleri güncelle
    result.rows.forEach(param => {
      if (param.param_key === 'app_name') config.application.name = param.param_value;
      if (param.param_key === 'app_version') config.application.version = param.param_value;
      if (param.param_key === 'default_currency') config.application.currency = param.param_value;
      if (param.param_key === 'jwt_secret') config.security.jwt_secret = param.param_value;
      if (param.param_key === 'jwt_expires_in') config.security.jwt_expires_in = param.param_value;
      if (param.param_key === 'bcrypt_rounds') config.security.bcrypt_rounds = parseInt(param.param_value);
      if (param.param_key === 'password_min_length') config.security.password_min_length = parseInt(param.param_value);
      if (param.param_key === 'max_login_attempts') config.security.max_login_attempts = parseInt(param.param_value);
      if (param.param_key === 'session_timeout') config.security.session_timeout = parseInt(param.param_value);
      if (param.param_key === 'timezone') config.application.timezone = param.param_value;
      if (param.param_key === 'ui_theme') config.ui.theme = param.param_value;
      if (param.param_key === 'ui_language') config.application.locale = param.param_value;
      if (param.param_key === 'date_format') config.application.date_format = param.param_value;
      if (param.param_key === 'time_format') config.application.time_format = param.param_value;
      if (param.param_key === 'enable_email_notifications') config.notification.enable_email = param.param_value === 'true';
      if (param.param_key === 'enable_sms_notifications') config.notification.enable_sms = param.param_value === 'true';
      if (param.param_key === 'enable_auto_backup') config.backup.enable_auto_backup = param.param_value === 'true';
      if (param.param_key === 'backup_frequency') config.backup.backup_frequency = param.param_value;
      if (param.param_key === 'enable_monitoring') config.monitoring.enable_monitoring = param.param_value === 'true';
      if (param.param_key === 'monitoring_interval') config.monitoring.monitoring_interval = parseInt(param.param_value);
    });
    
    console.log('✅ Sistem konfigürasyonu başarıyla getirildi');
    res.json({ 
      success: true, 
      config: config 
    });
    
  } catch (error) {
    console.error('❌ Admin system config hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sistem konfigürasyonu getirilirken hata oluştu' 
    });
  }
});

// Uygulama parametrelerini toplu güncelle
app.post('/api/admin/update-application-parameters', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 ADMIN UPDATE APPLICATION PARAMETERS API çağrıldı');
    
    // Uygulamada kullanılan tüm parametreler
    const applicationParameters = [
      // ==================== UYGULAMA KONFİGÜRASYONU ====================
      { param_key: 'app_name', param_value: 'Gelir Gider Takip', param_type: 'string', description: 'Uygulama adı', category: 'application', is_required: true },
      { param_key: 'app_version', param_value: '1.0.0', param_type: 'string', description: 'Uygulama versiyonu', category: 'application' },
      { param_key: 'app_description', param_value: 'Kişisel gelir gider takip uygulaması', param_type: 'string', description: 'Uygulama açıklaması', category: 'application' },
      { param_key: 'app_author', param_value: 'Admin', param_type: 'string', description: 'Uygulama geliştiricisi', category: 'application' },
      { param_key: 'app_contact_email', param_value: 'admin@gelirgidertakip.com', param_type: 'string', description: 'İletişim e-posta adresi', category: 'application' },
      
      // ==================== LOKALİZASYON VE DİL ====================
      { param_key: 'default_language', param_value: 'tr', param_type: 'string', description: 'Varsayılan dil', category: 'localization', is_required: true },
      { param_key: 'default_locale', param_value: 'tr-TR', param_type: 'string', description: 'Varsayılan locale', category: 'localization', is_required: true },
      { param_key: 'timezone', param_value: 'Europe/Istanbul', param_type: 'string', description: 'Varsayılan zaman dilimi', category: 'localization', is_required: true },
      { param_key: 'date_format', param_value: 'DD/MM/YYYY', param_type: 'string', description: 'Tarih formatı', category: 'localization', options: 'DD/MM/YYYY,MM/DD/YYYY,YYYY-MM-DD' },
      { param_key: 'time_format', param_value: 'HH:mm:ss', param_type: 'string', description: 'Saat formatı', category: 'localization', options: 'HH:mm:ss,hh:mm:ss A,HH:mm' },
      { param_key: 'week_start', param_value: 'monday', param_type: 'string', description: 'Haftanın başlangıç günü', category: 'localization', options: 'monday,sunday' },
      
      // ==================== FİNANSAL AYARLAR ====================
      { param_key: 'default_currency', param_value: 'TRY', param_type: 'string', description: 'Varsayılan para birimi', category: 'financial', is_required: true },
      { param_key: 'currency_symbol', param_value: '₺', param_type: 'string', description: 'Para birimi sembolü', category: 'financial' },
      { param_key: 'decimal_places', param_value: '2', param_type: 'number', description: 'Ondalık basamak sayısı', category: 'financial', min_value: '0', max_value: '4' },
      { param_key: 'thousand_separator', param_value: '.', param_type: 'string', description: 'Binlik ayırıcı', category: 'financial', options: '.,' },
      { param_key: 'decimal_separator', param_value: ',', param_type: 'string', description: 'Ondalık ayırıcı', category: 'financial', options: '.,' },
      { param_key: 'currency_position', param_value: 'after', param_type: 'string', description: 'Para birimi pozisyonu', category: 'financial', options: 'before,after' },
      
      // ==================== SAYFALAMA AYARLARI ====================
      { param_key: 'default_page_size', param_value: '10', param_type: 'number', description: 'Varsayılan sayfa boyutu', category: 'pagination', min_value: '5', max_value: '50' },
      { param_key: 'max_page_size', param_value: '100', param_type: 'number', description: 'Maksimum sayfa boyutu', category: 'pagination', min_value: '50', max_value: '500' },
      { param_key: 'page_size_options', param_value: '5,10,25,50,100', param_type: 'string', description: 'Sayfa boyutu seçenekleri', category: 'pagination' },
      
      // ==================== API KONFİGÜRASYONU ====================
      { param_key: 'api_base_url_dev', param_value: 'http://localhost:5000/api', param_type: 'string', description: 'Geliştirme ortamı API URL', category: 'api' },
      { param_key: 'api_base_url_prod', param_value: '/api', param_type: 'string', description: 'Üretim ortamı API URL', category: 'api' },
      { param_key: 'api_timeout', param_value: '30000', param_type: 'number', description: 'API zaman aşımı (ms)', category: 'api', min_value: '5000', max_value: '60000' },
      { param_key: 'api_retry_attempts', param_value: '3', param_type: 'number', description: 'API yeniden deneme sayısı', category: 'api', min_value: '1', max_value: '10' },
      
      // ==================== GÜVENLİK AYARLARI ====================
      { param_key: 'jwt_secret', param_value: 'your-super-secret-jwt-key-2024', param_type: 'string', description: 'JWT gizli anahtarı', category: 'security', is_sensitive: true, is_required: true },
      { param_key: 'jwt_expires_in', param_value: '7d', param_type: 'string', description: 'JWT geçerlilik süresi', category: 'security', options: '1h,24h,7d,30d' },
      { param_key: 'bcrypt_rounds', param_value: '12', param_type: 'number', description: 'Bcrypt hash turu', category: 'security', min_value: '8', max_value: '16' },
      { param_key: 'password_min_length', param_value: '8', param_type: 'number', description: 'Minimum şifre uzunluğu', category: 'security', min_value: '6', max_value: '20' },
      { param_key: 'password_require_uppercase', param_value: 'true', param_type: 'boolean', description: 'Şifre büyük harf gerektirir', category: 'security' },
      { param_key: 'password_require_lowercase', param_value: 'true', param_type: 'boolean', description: 'Şifre küçük harf gerektirir', category: 'security' },
      { param_key: 'password_require_numbers', param_value: 'true', param_type: 'boolean', description: 'Şifre rakam gerektirir', category: 'security' },
      { param_key: 'password_require_symbols', param_value: 'false', param_type: 'boolean', description: 'Şifre sembol gerektirir', category: 'security' },
      { param_key: 'max_login_attempts', param_value: '5', param_type: 'number', description: 'Maksimum giriş denemesi', category: 'security', min_value: '3', max_value: '10' },
      { param_key: 'lockout_duration', param_value: '15', param_type: 'number', description: 'Hesap kilitleme süresi (dakika)', category: 'security', min_value: '5', max_value: '60' },
      { param_key: 'session_timeout', param_value: '3600', param_type: 'number', description: 'Oturum zaman aşımı (saniye)', category: 'security', min_value: '300', max_value: '86400' },
      { param_key: 'admin_password', param_value: '12345', param_type: 'string', description: 'Admin panel şifresi', category: 'security', is_sensitive: true, is_required: true },
      
      // ==================== VERİTABANI AYARLARI ====================
      { param_key: 'db_host', param_value: 'localhost', param_type: 'string', description: 'Veritabanı sunucu adresi', category: 'database' },
      { param_key: 'db_port', param_value: '5432', param_type: 'number', description: 'Veritabanı port numarası', category: 'database', min_value: '1024', max_value: '65535' },
      { param_key: 'db_name', param_value: 'gelir_gider_takip', param_type: 'string', description: 'Veritabanı adı', category: 'database' },
      { param_key: 'db_user', param_value: 'postgres', param_type: 'string', description: 'Veritabanı kullanıcı adı', category: 'database' },
      { param_key: 'db_connection_pool_size', param_value: '10', param_type: 'number', description: 'Veritabanı bağlantı havuzu boyutu', category: 'database', min_value: '5', max_value: '50' },
      { param_key: 'db_max_connections', param_value: '100', param_type: 'number', description: 'Maksimum veritabanı bağlantısı', category: 'database', min_value: '10', max_value: '200' },
      { param_key: 'db_timeout', param_value: '30000', param_type: 'number', description: 'Veritabanı zaman aşımı (ms)', category: 'database', min_value: '5000', max_value: '60000' },
      { param_key: 'db_ssl_mode', param_value: 'require', param_type: 'string', description: 'Veritabanı SSL modu', category: 'database', options: 'disable,require,verify-ca,verify-full' },
      
      // ==================== E-POSTA AYARLARI ====================
      { param_key: 'smtp_host', param_value: '', param_type: 'string', description: 'SMTP sunucu adresi', category: 'email' },
      { param_key: 'smtp_port', param_value: '587', param_type: 'number', description: 'SMTP port numarası', category: 'email', min_value: '25', max_value: '587' },
      { param_key: 'smtp_secure', param_value: 'true', param_type: 'boolean', description: 'SMTP güvenli bağlantı', category: 'email' },
      { param_key: 'smtp_user', param_value: '', param_type: 'string', description: 'SMTP kullanıcı adı', category: 'email' },
      { param_key: 'smtp_password', param_value: '', param_type: 'string', description: 'SMTP şifresi', category: 'email', is_sensitive: true },
      { param_key: 'smtp_from_address', param_value: '', param_type: 'string', description: 'Gönderen e-posta adresi', category: 'email' },
      { param_key: 'smtp_from_name', param_value: '', param_type: 'string', description: 'Gönderen adı', category: 'email' },
      { param_key: 'enable_email_notifications', param_value: 'false', param_type: 'boolean', description: 'E-posta bildirimlerini etkinleştir', category: 'email' },
      
      // ==================== KULLANICI ARAYÜZÜ AYARLARI ====================
      { param_key: 'ui_theme', param_value: 'light', param_type: 'string', description: 'Kullanıcı arayüzü teması', category: 'ui', options: 'light,dark,auto' },
      { param_key: 'ui_primary_color', param_value: '#007bff', param_type: 'string', description: 'Ana renk', category: 'ui' },
      { param_key: 'ui_secondary_color', param_value: '#6c757d', param_type: 'string', description: 'İkincil renk', category: 'ui' },
      { param_key: 'ui_accent_color', param_value: '#28a745', param_type: 'string', description: 'Vurgu rengi', category: 'ui' },
      { param_key: 'ui_font_family', param_value: 'Inter', param_type: 'string', description: 'Font ailesi', category: 'ui' },
      { param_key: 'ui_font_size', param_value: '14px', param_type: 'string', description: 'Font boyutu', category: 'ui' },
      { param_key: 'ui_enable_animations', param_value: 'true', param_type: 'boolean', description: 'Animasyonları etkinleştir', category: 'ui' },
      { param_key: 'ui_enable_tooltips', param_value: 'true', param_type: 'boolean', description: 'Tooltip\'leri etkinleştir', category: 'ui' },
      { param_key: 'ui_sidebar_position', param_value: 'left', param_type: 'string', description: 'Kenar çubuğu pozisyonu', category: 'ui', options: 'left,right' },
      { param_key: 'ui_sidebar_width', param_value: '250', param_type: 'number', description: 'Kenar çubuğu genişliği (px)', category: 'ui', min_value: '200', max_value: '400' },
      { param_key: 'ui_enable_breadcrumbs', param_value: 'true', param_type: 'boolean', description: 'Breadcrumb\'ları etkinleştir', category: 'ui' },
      { param_key: 'ui_enable_search', param_value: 'true', param_type: 'boolean', description: 'Arama özelliğini etkinleştir', category: 'ui' },
      
      // ==================== İZLEME AYARLARI ====================
      { param_key: 'monitoring_enabled', param_value: 'true', param_type: 'boolean', description: 'Sistem izlemeyi etkinleştir', category: 'monitoring' },
      { param_key: 'monitoring_interval', param_value: '60', param_type: 'number', description: 'İzleme aralığı (saniye)', category: 'monitoring', min_value: '30', max_value: '300' },
      { param_key: 'alert_cpu_threshold', param_value: '80', param_type: 'number', description: 'CPU kullanım uyarı eşiği (%)', category: 'monitoring', min_value: '50', max_value: '95' },
      { param_key: 'alert_memory_threshold', param_value: '85', param_type: 'number', description: 'Bellek kullanım uyarı eşiği (%)', category: 'monitoring', min_value: '50', max_value: '95' },
      { param_key: 'alert_disk_threshold', param_value: '90', param_type: 'number', description: 'Disk kullanım uyarı eşiği (%)', category: 'monitoring', min_value: '50', max_value: '95' },
      { param_key: 'alert_response_time_threshold', param_value: '5000', param_type: 'number', description: 'Yanıt süresi uyarı eşiği (ms)', category: 'monitoring', min_value: '1000', max_value: '10000' },
      { param_key: 'alert_error_rate_threshold', param_value: '5', param_type: 'number', description: 'Hata oranı uyarı eşiği (%)', category: 'monitoring', min_value: '1', max_value: '20' },
      
      // ==================== YEDEKLEME AYARLARI ====================
      { param_key: 'backup_enabled', param_value: 'false', param_type: 'boolean', description: 'Otomatik yedeklemeyi etkinleştir', category: 'backup' },
      { param_key: 'backup_frequency', param_value: 'daily', param_type: 'string', description: 'Yedekleme sıklığı', category: 'backup', options: 'hourly,daily,weekly,monthly' },
      { param_key: 'backup_retention', param_value: '30', param_type: 'number', description: 'Yedekleme saklama süresi (gün)', category: 'backup', min_value: '7', max_value: '365' },
      { param_key: 'backup_compression', param_value: 'true', param_type: 'boolean', description: 'Yedekleme sıkıştırması', category: 'backup' },
      { param_key: 'backup_encryption', param_value: 'false', param_type: 'boolean', description: 'Yedekleme şifrelemesi', category: 'backup' },
      
      // ==================== BİLDİRİM AYARLARI ====================
      { param_key: 'notification_email_enabled', param_value: 'false', param_type: 'boolean', description: 'E-posta bildirimlerini etkinleştir', category: 'notification' },
      { param_key: 'notification_sms_enabled', param_value: 'false', param_type: 'boolean', description: 'SMS bildirimlerini etkinleştir', category: 'notification' },
      { param_key: 'notification_push_enabled', param_value: 'false', param_type: 'boolean', description: 'Push bildirimlerini etkinleştir', category: 'notification' },
      { param_key: 'notification_webhook_enabled', param_value: 'false', param_type: 'boolean', description: 'Webhook bildirimlerini etkinleştir', category: 'notification' },
      { param_key: 'notification_webhook_url', param_value: '', param_type: 'string', description: 'Webhook URL', category: 'notification' },
      { param_key: 'notification_user_registration', param_value: 'true', param_type: 'boolean', description: 'Kullanıcı kaydı bildirimi', category: 'notification' },
      { param_key: 'notification_password_reset', param_value: 'true', param_type: 'boolean', description: 'Şifre sıfırlama bildirimi', category: 'notification' },
      { param_key: 'notification_account_locked', param_value: 'true', param_type: 'boolean', description: 'Hesap kilitleme bildirimi', category: 'notification' },
      { param_key: 'notification_unusual_activity', param_value: 'true', param_type: 'boolean', description: 'Olağandışı aktivite bildirimi', category: 'notification' },
      { param_key: 'notification_system_alerts', param_value: 'true', param_type: 'boolean', description: 'Sistem uyarı bildirimi', category: 'notification' },
      
      // ==================== UYGULAMA ÖZEL AYARLARI ====================
      { param_key: 'enable_automatic_payments', param_value: 'true', param_type: 'boolean', description: 'Otomatik ödemeleri etkinleştir', category: 'app_features' },
      { param_key: 'enable_loan_tracking', param_value: 'true', param_type: 'boolean', description: 'Kredi takibini etkinleştir', category: 'app_features' },
      { param_key: 'enable_expense_categories', param_value: 'true', param_type: 'boolean', description: 'Gider kategorilerini etkinleştir', category: 'app_features' },
      { param_key: 'enable_income_sources', param_value: 'true', param_type: 'boolean', description: 'Gelir kaynaklarını etkinleştir', category: 'app_features' },
      { param_key: 'enable_credit_cards', param_value: 'true', param_type: 'boolean', description: 'Kredi kartı yönetimini etkinleştir', category: 'app_features' },
      { param_key: 'enable_bank_accounts', param_value: 'true', param_type: 'boolean', description: 'Banka hesabı yönetimini etkinleştir', category: 'app_features' },
      { param_key: 'enable_analytics', param_value: 'true', param_type: 'boolean', description: 'Analitik özelliklerini etkinleştir', category: 'app_features' },
      { param_key: 'enable_reports', param_value: 'true', param_type: 'boolean', description: 'Rapor özelliklerini etkinleştir', category: 'app_features' },
      { param_key: 'enable_export_import', param_value: 'true', param_type: 'boolean', description: 'Dışa/İçe aktarma özelliklerini etkinleştir', category: 'app_features' },
      { param_key: 'enable_user_profiles', param_value: 'true', param_type: 'boolean', description: 'Kullanıcı profil özelliklerini etkinleştir', category: 'app_features' },
      
      // ==================== PERFORMANS AYARLARI ====================
      { param_key: 'cache_enabled', param_value: 'true', param_type: 'boolean', description: 'Önbelleği etkinleştir', category: 'performance' },
      { param_key: 'cache_ttl', param_value: '3600', param_type: 'number', description: 'Önbellek yaşam süresi (saniye)', category: 'performance', min_value: '300', max_value: '86400' },
      { param_key: 'rate_limiting_enabled', param_value: 'true', param_type: 'boolean', description: 'Hız sınırlamasını etkinleştir', category: 'performance' },
      { param_key: 'rate_limit_window', param_value: '900', param_type: 'number', description: 'Hız sınırı penceresi (saniye)', category: 'performance', min_value: '60', max_value: '3600' },
      { param_key: 'rate_limit_max_requests', param_value: '100', param_type: 'number', description: 'Maksimum istek sayısı', category: 'performance', min_value: '10', max_value: '1000' },
      
      // ==================== LOGLAMA AYARLARI ====================
      { param_key: 'logging_enabled', param_value: 'true', param_type: 'boolean', description: 'Loglamayı etkinleştir', category: 'logging' },
      { param_key: 'log_level', param_value: 'info', param_type: 'string', description: 'Log seviyesi', category: 'logging', options: 'error,warn,info,debug' },
      { param_key: 'log_retention', param_value: '90', param_type: 'number', description: 'Log saklama süresi (gün)', category: 'logging', min_value: '7', max_value: '365' },
      { param_key: 'log_file_path', param_value: './logs', param_type: 'string', description: 'Log dosya yolu', category: 'logging' },
      { param_key: 'enable_audit_log', param_value: 'true', param_type: 'boolean', description: 'Denetim logunu etkinleştir', category: 'logging' }
    ];

    let addedCount = 0;
    let updatedCount = 0;

    for (const param of applicationParameters) {
      try {
        // Parametrenin var olup olmadığını kontrol et
        const checkQuery = 'SELECT id, param_value FROM system_parameters WHERE param_key = $1';
        const checkResult = await query(checkQuery, [param.param_key]);
        
        if (checkResult.rows.length === 0) {
          // Yeni parametre ekle
          const insertQuery = `
            INSERT INTO system_parameters (
              param_key, param_value, param_type, description, category, 
              is_editable, is_sensitive, validation_rules, default_value, 
              min_value, max_value, options, is_required
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `;
          
          await query(insertQuery, [
            param.param_key, 
            param.param_value, 
            param.param_type, 
            param.description, 
            param.category,
            param.is_editable !== undefined ? param.is_editable : true,
            param.is_sensitive !== undefined ? param.is_sensitive : false,
            param.validation_rules || null,
            param.default_value || param.param_value,
            param.min_value || null,
            param.max_value || null,
            param.options || null,
            param.is_required !== undefined ? param.is_required : false
          ]);
          
          console.log(`✅ Yeni parametre eklendi: ${param.param_key}`);
          addedCount++;
        } else {
          // Mevcut parametreyi güncelle (sadece değer değişmişse)
          const existingParam = checkResult.rows[0];
          if (existingParam.param_value !== param.param_value) {
            const updateQuery = 'UPDATE system_parameters SET param_value = $1, updated_at = CURRENT_TIMESTAMP WHERE param_key = $2';
            await query(updateQuery, [param.param_value, param.param_key]);
            console.log(`🔄 Parametre güncellendi: ${param.param_key} (${existingParam.param_value} → ${param.param_value})`);
            updatedCount++;
          } else {
            console.log(`⏭️ Parametre zaten güncel: ${param.param_key}`);
          }
        }
      } catch (error) {
        console.error(`❌ Parametre işleme hatası (${param.param_key}):`, error.message);
      }
    }

    console.log(`\n📊 Özet:`);
    console.log(`  ✅ Yeni eklenen: ${addedCount}`);
    console.log(`  🔄 Güncellenen: ${updatedCount}`);
    console.log(`  📋 Toplam işlenen: ${applicationParameters.length}`);

    // Kategorilere göre özet
    const categories = [...new Set(applicationParameters.map(p => p.category))];
    console.log(`\n📂 Kategoriler:`);
    categories.forEach(category => {
      const count = applicationParameters.filter(p => p.category === category).length;
      console.log(`  - ${category}: ${count} parametre`);
    });

    res.json({ 
      success: true, 
      message: `${addedCount} yeni parametre eklendi, ${updatedCount} parametre güncellendi`,
      summary: {
        added: addedCount,
        updated: updatedCount,
        total: applicationParameters.length,
        categories: categories.map(category => ({
          name: category,
          count: applicationParameters.filter(p => p.category === category).length
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Admin update application parameters hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Uygulama parametreleri güncellenirken hata oluştu' 
    });
  }
});

// Sistem parametrelerini getir (eski endpoint)
app.post('/api/admin/system-params', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 ADMIN SYSTEM PARAMS API çağrıldı');
    
    const selectQuery = 'SELECT * FROM system_parameters ORDER BY category, param_key';
    const result = await query(selectQuery);
    
    console.log('✅ Sistem parametreleri başarıyla getirildi:', result.rows.length, 'adet');
    res.json({ 
      success: true, 
      systemParams: {
        systemConfig: {
          app_name: 'Gelir Gider Takip',
          app_version: '1.0.0',
          default_currency: 'TRY'
        },
        parameters: result.rows
      }
    });
    
  } catch (error) {
    console.error('❌ Admin system params hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sistem parametreleri listelenirken hata oluştu' 
    });
  }
});

// Sistem konfigürasyonu getir
app.post('/api/admin/system-config', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 ADMIN SYSTEM CONFIG API çağrıldı');
    
    // Sistem konfigürasyonunu döndür
    const config = {
      database: {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: process.env.POSTGRES_PORT || 5432,
        name: process.env.POSTGRES_DATABASE || 'gelir_gider_takip',
        user: process.env.POSTGRES_USER || 'postgres',
        ssl_mode: process.env.NODE_ENV === 'production' ? 'require' : 'disable',
        connection_pool_size: 10,
        max_connections: 100,
        timeout: 30000
      },
      application: {
        name: 'Gelir Gider Takip',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        debug: process.env.NODE_ENV !== 'production',
        log_level: 'info',
        timezone: 'Europe/Istanbul',
        locale: 'tr-TR',
        currency: 'TRY',
        date_format: 'DD/MM/YYYY',
        time_format: 'HH:mm:ss'
      },
      security: {
        jwt_secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024',
        jwt_expires_in: '7d',
        bcrypt_rounds: 12,
        password_min_length: 8,
        password_require_uppercase: true,
        password_require_lowercase: true,
        password_require_numbers: true,
        password_require_symbols: false,
        max_login_attempts: 5,
        lockout_duration: 15,
        session_timeout: 3600,
        enable_2fa: false,
        enable_captcha: false,
        enable_rate_limiting: true,
        rate_limit_window: 900,
        rate_limit_max_requests: 100
      },
      email: {
        provider: 'smtp',
        host: process.env.SMTP_HOST || '',
        port: process.env.SMTP_PORT || 587,
        secure: true,
        user: process.env.SMTP_USER || '',
        password: process.env.SMTP_PASSWORD || '',
        from_address: process.env.SMTP_FROM || '',
        from_name: process.env.SMTP_FROM_NAME || '',
        enable_notifications: false
      },
      notification: {
        enable_email: false,
        enable_sms: false,
        enable_push: false,
        enable_webhook: false,
        webhook_url: '',
        notification_types: {
          user_registration: true,
          password_reset: true,
          account_locked: true,
          unusual_activity: true,
          system_alerts: true
        }
      },
      backup: {
        enable_auto_backup: false,
        backup_frequency: 'daily',
        backup_retention: 30,
        backup_location: 'local',
        backup_encryption: false,
        backup_compression: true
      },
      monitoring: {
        enable_monitoring: true,
        monitoring_interval: 60,
        alert_thresholds: {
          cpu_usage: 80,
          memory_usage: 85,
          disk_usage: 90,
          response_time: 5000,
          error_rate: 5
        },
        enable_logging: true,
        log_retention: 90,
        enable_analytics: true
      },
      ui: {
        theme: 'light',
        primary_color: '#007bff',
        secondary_color: '#6c757d',
        accent_color: '#28a745',
        font_family: 'Inter',
        font_size: '14px',
        enable_animations: true,
        enable_tooltips: true,
        enable_shortcuts: true,
        sidebar_position: 'left',
        sidebar_width: 250,
        enable_breadcrumbs: true,
        enable_search: true
      }
    };
    
    console.log('✅ Sistem konfigürasyonu başarıyla getirildi');
    res.json({ 
      success: true, 
      config: config
    });
    
  } catch (error) {
    console.error('❌ Admin system config hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sistem konfigürasyonu alınırken hata oluştu' 
    });
  }
});

// Sistem konfigürasyonu güncelle
app.post('/api/admin/update-system-config', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 ADMIN UPDATE SYSTEM CONFIG API çağrıldı');
    const { config } = req.body;
    
    if (!config) {
      return res.status(400).json({ 
        success: false, 
        message: 'Konfigürasyon verisi gerekli' 
      });
    }
    
    // Burada konfigürasyon güncelleme işlemleri yapılabilir
    // Örneğin environment variables güncelleme, dosya yazma vs.
    
    console.log('✅ Sistem konfigürasyonu güncellendi');
    res.json({ 
      success: true, 
      message: 'Sistem konfigürasyonu başarıyla güncellendi' 
    });
    
  } catch (error) {
    console.error('❌ Admin update system config hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sistem konfigürasyonu güncellenirken hata oluştu' 
    });
  }
});

// Sistem performans metrikleri getir
app.post('/api/admin/system-metrics', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔍 ADMIN SYSTEM METRICS API çağrıldı');
    
    // Sistem performans metrikleri
    const metrics = {
      cpu: {
        usage: Math.random() * 100, // Gerçek uygulamada os.cpuUsage() kullanılır
        cores: require('os').cpus().length
      },
      memory: {
        total: require('os').totalmem(),
        free: require('os').freemem(),
        usage: ((require('os').totalmem() - require('os').freemem()) / require('os').totalmem()) * 100
      },
      disk: {
        total: 1000000000000, // 1TB (örnek)
        free: 800000000000,   // 800GB (örnek)
        usage: 20 // %20 kullanım
      },
      network: {
        bytesIn: 0,
        bytesOut: 0
      },
      uptime: process.uptime(),
      loadAverage: require('os').loadavg(),
      activeConnections: 0,
      errorRate: 0,
      responseTime: 0
    };
    
    console.log('✅ Sistem metrikleri başarıyla getirildi');
    res.json({ 
      success: true, 
      metrics: metrics
    });
    
  } catch (error) {
    console.error('❌ Admin system metrics hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Sistem metrikleri alınırken hata oluştu' 
    });
  }
});

// Vercel production ortamında basit bir landing page göster
if (process.env.NODE_ENV === 'production') {
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Gelir Gider Takip - API</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #2c3e50; text-align: center; }
          .status { background: #27ae60; color: white; padding: 10px; border-radius: 5px; text-align: center; margin: 20px 0; }
          .endpoint { background: #ecf0f1; padding: 15px; border-radius: 5px; margin: 10px 0; }
          code { background: #34495e; color: white; padding: 2px 6px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 Gelir Gider Takip API</h1>
          <div class="status">✅ Backend API Başarıyla Çalışıyor!</div>
          
          <h3>📋 Mevcut API Endpoint'leri:</h3>
          <div class="endpoint">
            <strong>Kimlik Doğrulama:</strong><br>
            <code>POST /api/auth/register</code> - Kullanıcı kaydı<br>
            <code>POST /api/auth/login</code> - Kullanıcı girişi
          </div>
          
          <div class="endpoint">
            <strong>Kullanıcı Yönetimi:</strong><br>
            <code>GET /api/users/profile</code> - Profil bilgileri<br>
            <code>PUT /api/users/profile</code> - Profil güncelleme
          </div>
          
          <div class="endpoint">
            <strong>Gelir/Gider Yönetimi:</strong><br>
            <code>GET /api/expenses</code> - Giderleri listele<br>
            <code>POST /api/expenses</code> - Yeni gider ekle<br>
            <code>GET /api/incomes</code> - Gelirleri listele<br>
            <code>POST /api/incomes</code> - Yeni gelir ekle
          </div>
          
          <div class="endpoint">
            <strong>Analitik:</strong><br>
            <code>GET /api/analytics/dashboard</code> - Dashboard verileri
          </div>
          
          <p style="text-align: center; margin-top: 30px; color: #7f8c8d;">
            Frontend uygulaması ayrı bir proje olarak deploy edilecek.
          </p>
        </div>
      </body>
      </html>
    `);
  });
}

// React Router için catch-all route
app.get('*', (req, res) => {
  console.log('🔄 React Router catch-all:', req.path);
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Vercel için export
module.exports = app;

// Server başlat (sadece local development için)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server ${PORT} portunda çalışıyor`);
    console.log(`📱 Frontend: http://localhost:3000`);
    console.log(`🔧 Backend API: http://localhost:${PORT}/api`);
  });
}

// Vercel serverless function için
if (process.env.NODE_ENV === 'production') {
  // Vercel'de çalışırken bu kısım çalışacak
  console.log('🚀 Vercel production ortamında çalışıyor');
  console.log('📊 Environment Variables:', {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'SET' : 'NOT SET'
  });
}

// Graceful shutdown (sadece local development için)
if (process.env.NODE_ENV !== 'production') {
  process.on('SIGINT', () => {
    console.log('\n🛑 Server kapatılıyor...');
    process.exit(0);
  });
}

