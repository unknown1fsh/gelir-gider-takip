const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '12345';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Admin Authentication Middleware
const authenticateAdmin = (req, res, next) => {
  const { adminPassword } = req.body;
  
  if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Admin yetkisi gerekli' });
  }
  
  next();
};

// MySQL Bağlantısı
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345',
  database: 'income_expense_tracker'
});

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
      bank_name VARCHAR(100) NOT NULL,
      bank_code VARCHAR(10),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Accounts tablosu
  const createAccountsTable = `
    CREATE TABLE IF NOT EXISTS accounts (
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
    )
  `;

  // Credit Cards tablosu
  const createCreditCardsTable = `
    CREATE TABLE IF NOT EXISTS credit_cards (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bank_id INT NOT NULL,
      card_name VARCHAR(100) NOT NULL,
      card_number VARCHAR(20),
      card_limit DECIMAL(15,2) NOT NULL,
      remaining_limit DECIMAL(15,2) NOT NULL,
      statement_date INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
    )
  `;

  // Incomes tablosu
  const createIncomesTable = `
    CREATE TABLE IF NOT EXISTS incomes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      source VARCHAR(100) NOT NULL,
      income_type ENUM('salary', 'part_time', 'rental', 'investment', 'food_card', 'other') NOT NULL,
      description TEXT,
      income_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      title VARCHAR(100) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      frequency ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

  // Varsayılan gider kategorileri ekle
  const insertDefaultCategories = `
    INSERT IGNORE INTO expense_categories (name, color) VALUES
    ('Gıda', '#28a745'),
    ('Ulaşım', '#007bff'),
    ('Ev Giderleri', '#dc3545'),
    ('Sağlık', '#ffc107'),
    ('Eğlence', '#6f42c1'),
    ('Giyim', '#fd7e14'),
    ('Eğitim', '#20c997'),
    ('Spor', '#e83e8c'),
    ('Teknoloji', '#6c757d'),
    ('Seyahat', '#17a2b8'),
    ('Sigorta', '#6610f2'),
    ('Vergi', '#dc3545'),
    ('Kredi Ödemeleri', '#fd7e14'),
    ('Yatırım', '#28a745'),
    ('Diğer', '#6c757d')
  `;

  connection.query(insertDefaultCategories, (err) => {
    if (err) {
      console.error('Varsayılan kategoriler ekleme hatası:', err);
    } else {
      console.log('✅ Varsayılan gider kategorileri eklendi');
    }
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
    // Tüm tabloları temizle (foreign key constraint'ler nedeniyle sıralı silme)
    await connection.promise().execute('DELETE FROM rent_expenses');
    await connection.promise().execute('DELETE FROM credit_payments');
    await connection.promise().execute('DELETE FROM periodic_expenses');
    await connection.promise().execute('DELETE FROM expenses');
    await connection.promise().execute('DELETE FROM incomes');
    await connection.promise().execute('DELETE FROM credit_cards');
    await connection.promise().execute('DELETE FROM accounts');
    await connection.promise().execute('DELETE FROM users');
    await connection.promise().execute('DELETE FROM banks');

    res.json({
      success: true,
      message: 'Veritabanı başarıyla sıfırlandı'
    });

  } catch (error) {
    console.error('Veritabanı reset hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Veritabanı sıfırlanırken hata oluştu' 
    });
  }
});

// Mock Veri Ekle (3 test kullanıcısı)
app.post('/api/admin/insert-mock-data', authenticateAdmin, async (req, res) => {
  try {
    // Önce mevcut verileri temizle (foreign key constraint'ler nedeniyle sıralı silme)
    await connection.promise().execute('DELETE FROM rent_expenses');
    await connection.promise().execute('DELETE FROM credit_payments');
    await connection.promise().execute('DELETE FROM periodic_expenses');
    await connection.promise().execute('DELETE FROM expenses');
    await connection.promise().execute('DELETE FROM incomes');
    await connection.promise().execute('DELETE FROM credit_cards');
    await connection.promise().execute('DELETE FROM accounts');
    await connection.promise().execute('DELETE FROM users');
    await connection.promise().execute('DELETE FROM banks');

    // Test kullanıcıları ekle
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

    // Test bankaları ekle
    const testBanks = [
      { bank_name: 'Test Bankası 1', bank_code: 'TB1' },
      { bank_name: 'Test Bankası 2', bank_code: 'TB2' },
      { bank_name: 'Test Bankası 3', bank_code: 'TB3' }
    ];

    for (const bank of testBanks) {
      await connection.promise().execute(`
        INSERT INTO banks (bank_name, bank_code) VALUES (?, ?)
      `, [bank.bank_name, bank.bank_code]);
    }

    // Banka ID'lerini al
    const [bankResults] = await connection.promise().execute('SELECT id FROM banks ORDER BY id');
    const bankIds = bankResults.map(bank => bank.id);

    // Test hesapları ekle
    const testAccounts = [
      { account_name: 'Test Hesabı 1', account_number: 'TR123456789012345678901234', iban: 'TR123456789012345678901234', account_type: 'vadesiz', current_balance: 50000, is_credit_account: 0, account_limit: 0, credit_limit: 0 },
      { account_name: 'Test Hesabı 2', account_number: 'TR987654321098765432109876', iban: 'TR987654321098765432109876', account_type: 'vadeli', current_balance: 100000, is_credit_account: 0, account_limit: 0, credit_limit: 0 },
      { account_name: 'Test Hesabı 3', account_number: 'TR111111111111111111111111', iban: 'TR111111111111111111111111', account_type: 'vadesiz', current_balance: 25000, is_credit_account: 1, account_limit: 50000, credit_limit: 0 }
    ];

    for (let i = 0; i < testAccounts.length; i++) {
      const account = testAccounts[i];
      await connection.promise().execute(`
        INSERT INTO accounts (bank_id, account_name, account_number, iban, account_type, current_balance, is_credit_account, account_limit, credit_limit) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [bankIds[i], account.account_name, account.account_number, account.iban, account.account_type, account.current_balance, account.is_credit_account, account.account_limit, account.credit_limit]);
    }

    // Test kredi kartları ekle
    const testCreditCards = [
      { card_name: 'Test Kartı 1', card_number: '1234567890123456', card_limit: 30000, remaining_limit: 25000, statement_date: 15 },
      { card_name: 'Test Kartı 2', card_number: '9876543210987654', card_limit: 50000, remaining_limit: 40000, statement_date: 20 },
      { card_name: 'Test Kartı 3', card_number: '1111111111111111', card_limit: 20000, remaining_limit: 15000, statement_date: 25 }
    ];

    for (let i = 0; i < testCreditCards.length; i++) {
      const card = testCreditCards[i];
      await connection.promise().execute(`
        INSERT INTO credit_cards (bank_id, card_name, card_number, card_limit, remaining_limit, statement_date) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [bankIds[i], card.card_name, card.card_number, card.card_limit, card.remaining_limit, card.statement_date]);
    }

    // Test gelirleri ekle
    const testIncomes = [
      { title: 'Maaş', amount: 15000, source: 'Maaş', income_type: 'salary', description: 'Aylık maaş', income_date: '2024-01-15' },
      { title: 'Ek İş', amount: 8000, source: 'Ek İş', income_type: 'part_time', description: 'Ek iş geliri', income_date: '2024-01-20' },
      { title: 'Kira Geliri', amount: 5000, source: 'Kira Geliri', income_type: 'rental', description: 'Kira geliri', income_date: '2024-01-25' }
    ];

    for (const income of testIncomes) {
      await connection.promise().execute(`
        INSERT INTO incomes (title, amount, source, income_type, description, income_date) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [income.title, income.amount, income.source, income.income_type, income.description, income.income_date]);
    }

         // Kategori ID'lerini al
     const [categoryResults] = await connection.promise().execute('SELECT id FROM expense_categories ORDER BY id LIMIT 3');
     const categoryIds = categoryResults.map(cat => cat.id);

     // Test giderleri ekle
     const testExpenses = [
       { title: 'Market Alışverişi', amount: 3000, expense_type: 'Gıda', payment_method: 'cash', description: 'Market alışverişi', payment_date: '2024-01-10' },
       { title: 'Benzin', amount: 1500, expense_type: 'Ulaşım', payment_method: 'credit_card', description: 'Benzin alımı', payment_date: '2024-01-12' },
       { title: 'Elektrik Faturası', amount: 2000, expense_type: 'Ev Giderleri', payment_method: 'bank_transfer', description: 'Elektrik faturası', payment_date: '2024-01-15' }
     ];

     for (let i = 0; i < testExpenses.length; i++) {
       const expense = testExpenses[i];
       await connection.promise().execute(`
         INSERT INTO expenses (title, amount, category_id, expense_type, payment_method, description, payment_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?)
       `, [expense.title, expense.amount, categoryIds[i], expense.expense_type, expense.payment_method, expense.description, expense.payment_date]);
     }

    // Expense ID'lerini al
    const [expenseResults] = await connection.promise().execute('SELECT id FROM expenses ORDER BY id LIMIT 2');

    // Test kira giderleri ekle
    const testRentExpenses = [
      { rent_amount: 8000, maintenance_fee: 500, property_tax: 300, insurance: 200, other_fees: 0, due_date: '2024-01-05' },
      { rent_amount: 12000, maintenance_fee: 800, property_tax: 500, insurance: 300, other_fees: 0, due_date: '2024-01-10' }
    ];

    for (let i = 0; i < testRentExpenses.length; i++) {
      const rent = testRentExpenses[i];
      await connection.promise().execute(`
        INSERT INTO rent_expenses (expense_id, rent_amount, maintenance_fee, property_tax, insurance, other_fees, due_date) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [expenseResults[i].id, rent.rent_amount, rent.maintenance_fee, rent.property_tax, rent.insurance, rent.other_fees, rent.due_date]);
    }

    res.json({
      success: true,
      message: 'Mock veriler başarıyla eklendi',
      details: {
        users: 3,
        banks: 3,
        accounts: 3,
        creditCards: 3,
        incomes: 3,
        expenses: 3,
        rentExpenses: 2
      }
    });

  } catch (error) {
    console.error('Mock veri ekleme hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Mock veriler eklenirken hata oluştu' 
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
        }
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

// Bankaları getir
app.get('/api/banks', (req, res) => {
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

// Yeni banka ekle
app.post('/api/banks', (req, res) => {
  const { bank_name } = req.body;
  const query = 'INSERT INTO banks (bank_name) VALUES (?)';
  
  connection.query(query, [bank_name], (err, result) => {
    if (err) {
      console.error('Banka ekleme hatası:', err);
      res.status(500).json({ error: 'Banka eklenemedi' });
      return;
    }
    res.json({ id: result.insertId, bank_name });
  });
});

// Hesapları getir
app.get('/api/accounts', (req, res) => {
  const query = `
    SELECT a.*, b.bank_name 
    FROM accounts a 
    JOIN banks b ON a.bank_id = b.id 
    ORDER BY a.created_at DESC
  `;
  
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Hesaplar getirme hatası:', err);
      res.status(500).json({ error: 'Hesaplar getirilemedi' });
      return;
    }
    res.json(results);
  });
});

// Yeni hesap ekle
app.post('/api/accounts', (req, res) => {
  const { bank_id, account_name, account_number, iban, account_type, account_limit, current_balance, is_credit_account, credit_limit } = req.body;
  
  // Boş string değerleri NULL veya 0 olarak değiştir
  const cleanAccountLimit = account_limit === '' ? null : parseFloat(account_limit) || 0;
  const cleanCreditLimit = credit_limit === '' ? null : parseFloat(credit_limit) || 0;
  const cleanCurrentBalance = parseFloat(current_balance) || 0;
  
  const query = `
    INSERT INTO accounts (bank_id, account_name, account_number, iban, account_type, account_limit, current_balance, is_credit_account, credit_limit) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  connection.query(query, [bank_id, account_name, account_number, iban, account_type, cleanAccountLimit, cleanCurrentBalance, is_credit_account, cleanCreditLimit], (err, result) => {
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
app.get('/api/credit-cards', (req, res) => {
  const query = `
    SELECT c.*, b.bank_name 
    FROM credit_cards c 
    JOIN banks b ON c.bank_id = b.id 
    ORDER BY c.created_at DESC
  `;
  
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Kredi kartları getirme hatası:', err);
      res.status(500).json({ error: 'Kredi kartları getirilemedi' });
      return;
    }
    res.json(results);
  });
});

// Yeni kredi kartı ekle
app.post('/api/credit-cards', (req, res) => {
  const { bank_id, card_name, card_number, card_limit, remaining_limit, statement_date } = req.body;
  
  // Boş string değerleri 0 olarak değiştir
  const cleanCardLimit = parseFloat(card_limit) || 0;
  const cleanRemainingLimit = parseFloat(remaining_limit) || 0;
  
  const query = `
    INSERT INTO credit_cards (bank_id, card_name, card_number, card_limit, remaining_limit, statement_date) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  connection.query(query, [bank_id, card_name, card_number, cleanCardLimit, cleanRemainingLimit, statement_date], (err, result) => {
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



// Gelir ekleme
app.post('/api/incomes', async (req, res) => {
    try {
        const { title, amount, income_type, source, description, income_date } = req.body;
        
        const query = `
            INSERT INTO incomes (title, amount, income_type, source, description, income_date) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await connection.promise().execute(query, [title, amount, income_type, source, description, income_date]);
        
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
app.get('/api/incomes', async (req, res) => {
    try {
        const query = 'SELECT * FROM incomes ORDER BY income_date DESC';
        const [rows] = await connection.promise().execute(query);
        res.json({ success: true, incomes: rows });
    } catch (error) {
        console.error('Gelir listeleme hatası:', error);
        res.status(500).json({ success: false, message: 'Gelirler listelenirken hata oluştu' });
    }
});

// Gider kategorilerini listele
app.get('/api/expense-categories', async (req, res) => {
    try {
        const query = 'SELECT * FROM expense_categories ORDER BY name';
        const [rows] = await connection.promise().execute(query);
        res.json({ success: true, categories: rows });
    } catch (error) {
        console.error('Kategori listeleme hatası:', error);
        res.status(500).json({ success: false, message: 'Kategoriler listelenirken hata oluştu' });
    }
});

// Gider ekleme
app.post('/api/expenses', async (req, res) => {
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
            INSERT INTO expenses (title, amount, category_id, expense_type, payment_method,
                                related_account_id, related_credit_card_id, related_credit_account_id,
                                due_date, payment_date, description, is_paid) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const is_paid = cleanPaymentDate ? true : false;
        
        const [result] = await connection.promise().execute(query, [
            title, amount, category_id, expense_type, payment_method,
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
        
        const query = `
            INSERT INTO rent_expenses (expense_id, rent_amount, maintenance_fee, property_tax, 
                                     insurance, other_fees, property_address, landlord_name, 
                                     contract_start_date, contract_end_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await connection.promise().execute(query, [
            expense_id, cleanRentAmount, cleanMaintenanceFee, cleanPropertyTax, 
            cleanInsurance, cleanOtherFees, cleanPropertyAddress, cleanLandlordName, 
            cleanContractStartDate, cleanContractEndDate
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
app.get('/api/expenses', async (req, res) => {
    try {
        const query = `
            SELECT e.*, ec.name as category_name, ec.color as category_color,
                   a.account_name, cc.card_name
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            LEFT JOIN accounts a ON e.related_account_id = a.id
            LEFT JOIN credit_cards cc ON e.related_credit_card_id = cc.id
            ORDER BY e.created_at DESC
        `;
        const [rows] = await connection.promise().execute(query);
        res.json({ success: true, expenses: rows });
    } catch (error) {
        console.error('Gider listeleme hatası:', error);
        res.status(500).json({ success: false, message: 'Giderler listelenirken hata oluştu' });
    }
});

// Detaylı analiz verileri
app.get('/api/analytics', async (req, res) => {
    try {
        // Toplam gelir
        const [totalIncomeResult] = await connection.promise().execute('SELECT SUM(amount) as total FROM incomes');
        const totalIncome = totalIncomeResult[0].total || 0;
        
        // Toplam gider
        const [totalExpenseResult] = await connection.promise().execute('SELECT SUM(amount) as total FROM expenses');
        const totalExpense = totalExpenseResult[0].total || 0;
        
        // Net gelir
        const netIncome = totalIncome - totalExpense;
        
        // Kategori bazında gider dağılımı
        const [categoryExpenses] = await connection.promise().execute(`
            SELECT ec.name, ec.color, SUM(e.amount) as total
            FROM expenses e
            JOIN expense_categories ec ON e.category_id = ec.id
            GROUP BY ec.id, ec.name, ec.color
            ORDER BY total DESC
        `);
        
        // Aylık gelir-gider trendi (yemek kartı hariç)
        const [monthlyTrend] = await connection.promise().execute(`
            SELECT 
                months.month,
                SUM(COALESCE(i.amount, 0)) as income,
                SUM(COALESCE(e.amount, 0)) as expense
            FROM (
                SELECT DISTINCT DATE_FORMAT(income_date, '%Y-%m') as month FROM incomes WHERE income_type != 'food_card'
                UNION
                SELECT DISTINCT DATE_FORMAT(created_at, '%Y-%m') as month FROM expenses
            ) months
            LEFT JOIN incomes i ON DATE_FORMAT(i.income_date, '%Y-%m') = months.month AND i.income_type != 'food_card'
            LEFT JOIN expenses e ON DATE_FORMAT(e.created_at, '%Y-%m') = months.month
            GROUP BY months.month
            ORDER BY months.month DESC
            LIMIT 12
        `);
        
        // Kullanılabilir limitler
        const [availableLimits] = await connection.promise().execute(`
            SELECT 
                'accounts' as type,
                SUM(current_balance) as total_available,
                COUNT(*) as count
            FROM accounts
            UNION ALL
            SELECT 
                'credit_cards' as type,
                SUM(remaining_limit) as total_available,
                COUNT(*) as count
            FROM credit_cards
        `);
        
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
        // Toplam hesap sayısı
        const [accountsResult] = await connection.promise().execute('SELECT COUNT(*) as total FROM accounts');
        const totalAccounts = accountsResult[0].total;
        
        // Toplam kredi kartı sayısı
        const [creditCardsResult] = await connection.promise().execute('SELECT COUNT(*) as total FROM credit_cards');
        const totalCreditCards = creditCardsResult[0].total;
        
        // Toplam hesap bakiyesi
        const [totalBalanceResult] = await connection.promise().execute('SELECT SUM(current_balance) as total FROM accounts');
        const totalBalance = totalBalanceResult[0].total || 0;
        
        // Toplam kredi kartı limiti
        const [totalCreditLimitResult] = await connection.promise().execute('SELECT SUM(card_limit) as total FROM credit_cards');
        const totalCreditLimit = totalCreditLimitResult[0].total || 0;
        
        // Kullanılabilir kredi kartı limiti
        const [availableCreditLimitResult] = await connection.promise().execute('SELECT SUM(remaining_limit) as total FROM credit_cards');
        const availableCreditLimit = availableCreditLimitResult[0].total || 0;
        
        // Toplam gelir (yemek kartı hariç)
        const [totalIncomeResult] = await connection.promise().execute('SELECT SUM(amount) as total FROM incomes WHERE income_type != "food_card"');
        const totalIncome = totalIncomeResult[0].total || 0;
        
        // Toplam gider
        const [totalExpenseResult] = await connection.promise().execute('SELECT SUM(amount) as total FROM expenses');
        const totalExpense = totalExpenseResult[0].total || 0;
        
        // Net gelir
        const netIncome = totalIncome - totalExpense;
        
        // Yemek kartı geliri (ayrı hesaplama)
        const [foodCardIncomeResult] = await connection.promise().execute('SELECT SUM(amount) as total FROM incomes WHERE income_type = "food_card"');
        const foodCardIncome = foodCardIncomeResult[0].total || 0;
        
        // Son işlemler - Son 5 gelir
        const [recentIncomes] = await connection.promise().execute(`
            SELECT id, title, amount, income_type, source, income_date, created_at
            FROM incomes 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        // Son işlemler - Son 5 gider
        const [recentExpenses] = await connection.promise().execute(`
            SELECT e.id, e.title, e.amount, e.expense_type, e.payment_method, e.created_at,
                   ec.name as category_name, ec.color as category_color
            FROM expenses e
            LEFT JOIN expense_categories ec ON e.category_id = ec.id
            ORDER BY e.created_at DESC 
            LIMIT 5
        `);
        
        // Son işlemler - Son 5 hesap işlemi
        const [recentAccounts] = await connection.promise().execute(`
            SELECT a.id, a.account_name, a.current_balance, a.created_at, b.bank_name
            FROM accounts a
            LEFT JOIN banks b ON a.bank_id = b.id
            ORDER BY a.created_at DESC 
            LIMIT 5
        `);
        
        // Son işlemler - Son 5 kredi kartı işlemi
        const [recentCreditCards] = await connection.promise().execute(`
            SELECT cc.id, cc.card_name, cc.remaining_limit, cc.created_at, b.bank_name
            FROM credit_cards cc
            LEFT JOIN banks b ON cc.bank_id = b.id
            ORDER BY cc.created_at DESC 
            LIMIT 5
        `);
        
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
