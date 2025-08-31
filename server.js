const express = require('express');
const { neon } = require('@neondatabase/serverless');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

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
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With', 'Origin', 'Accept']
}));

// OPTIONS request'leri için özel handler
app.options('*', cors());

// Static files için
app.use(express.static(path.join(__dirname, 'client/build')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - User Agent: ${req.headers['user-agent']}`);
  next();
});

// Neon veritabanı bağlantısı
const sql = neon(process.env.DATABASE_URL || `postgresql://${SYSTEM_CONFIG.database.user}:${SYSTEM_CONFIG.database.password}@${SYSTEM_CONFIG.database.host}:${SYSTEM_CONFIG.database.port}/${SYSTEM_CONFIG.database.database}`);

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
      category VARCHAR(50) DEFAULT 'general',
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
    { param_key: 'app_name', param_value: 'Gelir Gider Takip', param_type: 'string', description: 'Uygulama adı', category: 'general' },
    { param_key: 'app_version', param_value: '1.0.0', param_type: 'string', description: 'Uygulama versiyonu', category: 'general' },
    { param_key: 'default_currency', param_value: 'TRY', param_type: 'string', description: 'Varsayılan para birimi', category: 'financial' }
  ];

  for (const param of defaultParams) {
    try {
      const checkQuery = 'SELECT id FROM system_parameters WHERE param_key = $1';
      const checkResult = await query(checkQuery, [param.param_key]);
      
      if (checkResult.rows.length === 0) {
        const insertQuery = 'INSERT INTO system_parameters (param_key, param_value, param_type, description, category) VALUES ($1, $2, $3, $4, $5)';
        await query(insertQuery, [param.param_key, param.param_value, param.param_type, param.description, param.category]);
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
    
    // Boş string değerleri NULL olarak değiştir
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
      userId, title, amount, category_id, expense_type, payment_method,
      cleanRelatedAccountId, cleanRelatedCreditCardId, cleanRelatedCreditAccountId,
      cleanDueDate, cleanPaymentDate, description, is_paid
    ]);
    
    const expenseId = result.rows[0].id;
    
    // Seçilen ödeme yöntemine göre hesap/karttan tutar düş
    if (cleanRelatedAccountId && payment_method === 'bank_transfer') {
      // Mevduat hesabından tutar düş
      await query(
        'UPDATE accounts SET current_balance = current_balance - $1 WHERE id = $2',
        [amount, cleanRelatedAccountId]
      );
      console.log(`💰 ${amount}₺ tutarı hesap ID:${cleanRelatedAccountId}'den düşüldü`);
    } else if (cleanRelatedCreditCardId && payment_method === 'credit_card') {
      // Kredi kartından tutar düş
      await query(
        'UPDATE credit_cards SET remaining_limit = remaining_limit - $1 WHERE id = $2',
        [amount, cleanRelatedCreditCardId]
      );
      console.log(`💳 ${amount}₺ tutarı kredi kartı ID:${cleanRelatedCreditCardId}'den düşüldü`);
    } else if (cleanRelatedCreditAccountId && payment_method === 'credit_account') {
      // Kredili hesaptan tutar düş
      await query(
        'UPDATE accounts SET credit_limit = credit_limit - $1 WHERE id = $2',
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
app.get('/api/banks', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Banks API çağrıldı - User ID:', req.user.id);
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
}

// Graceful shutdown (sadece local development için)
if (process.env.NODE_ENV !== 'production') {
  process.on('SIGINT', () => {
    console.log('\n🛑 Server kapatılıyor...');
    process.exit(0);
  });
}

