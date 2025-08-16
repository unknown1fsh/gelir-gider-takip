const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
  // Banks tablosu
  const createBanksTable = `
    CREATE TABLE IF NOT EXISTS banks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bank_name VARCHAR(100) NOT NULL,
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
      total_limit DECIMAL(15,2) NOT NULL,
      remaining_limit DECIMAL(15,2) NOT NULL,
      statement_date INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
    )
  `;

  // Tabloları oluştur
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
}

// API Routes

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
  
  const query = `
    INSERT INTO accounts (bank_id, account_name, account_number, iban, account_type, account_limit, current_balance, is_credit_account, credit_limit) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  connection.query(query, [bank_id, account_name, account_number, iban, account_type, account_limit, current_balance, is_credit_account, credit_limit], (err, result) => {
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
  
  const query = 'UPDATE accounts SET current_balance = ?, account_limit = ?, credit_limit = ? WHERE id = ?';
  
  connection.query(query, [current_balance, account_limit, credit_limit, id], (err, result) => {
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
  const { bank_id, card_name, card_number, total_limit, remaining_limit, statement_date } = req.body;
  
  const query = `
    INSERT INTO credit_cards (bank_id, card_name, card_number, total_limit, remaining_limit, statement_date) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  connection.query(query, [bank_id, card_name, card_number, total_limit, remaining_limit, statement_date], (err, result) => {
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
  
  const query = 'UPDATE credit_cards SET remaining_limit = ? WHERE id = ?';
  
  connection.query(query, [remaining_limit, id], (err, result) => {
    if (err) {
      console.error('Kredi kartı güncelleme hatası:', err);
      res.status(500).json({ error: 'Kredi kartı güncellenemedi' });
      return;
    }
    res.json({ message: 'Kredi kartı başarıyla güncellendi' });
  });
});

// Dashboard istatistikleri
app.get('/api/dashboard', (req, res) => {
  const queries = {
    totalAccounts: 'SELECT COUNT(*) as count FROM accounts',
    totalCreditCards: 'SELECT COUNT(*) as count FROM credit_cards',
    totalBalance: 'SELECT SUM(current_balance) as total FROM accounts',
    totalCreditLimit: 'SELECT SUM(total_limit) as total FROM credit_cards',
    totalRemainingCredit: 'SELECT SUM(remaining_limit) as total FROM credit_cards'
  };

  const results = {};
  let completedQueries = 0;

  Object.keys(queries).forEach(key => {
    connection.query(queries[key], (err, result) => {
      if (err) {
        console.error(`${key} sorgu hatası:`, err);
        results[key] = 0;
      } else {
        results[key] = result[0].total || result[0].count || 0;
      }
      
      completedQueries++;
      if (completedQueries === Object.keys(queries).length) {
        res.json(results);
      }
    });
  });
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
