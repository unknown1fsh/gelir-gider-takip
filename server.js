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
  const { bank_id, card_name, card_number, total_limit, remaining_limit, statement_date } = req.body;
  
  // Boş string değerleri 0 olarak değiştir
  const cleanTotalLimit = parseFloat(total_limit) || 0;
  const cleanRemainingLimit = parseFloat(remaining_limit) || 0;
  
  const query = `
    INSERT INTO credit_cards (bank_id, card_name, card_number, total_limit, remaining_limit, statement_date) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  connection.query(query, [bank_id, card_name, card_number, cleanTotalLimit, cleanRemainingLimit, statement_date], (err, result) => {
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
        
        // Aylık gelir-gider trendi
        const [monthlyTrend] = await connection.promise().execute(`
            SELECT 
                months.month,
                SUM(COALESCE(i.amount, 0)) as income,
                SUM(COALESCE(e.amount, 0)) as expense
            FROM (
                SELECT DISTINCT DATE_FORMAT(income_date, '%Y-%m') as month FROM incomes
                UNION
                SELECT DISTINCT DATE_FORMAT(created_at, '%Y-%m') as month FROM expenses
            ) months
            LEFT JOIN incomes i ON DATE_FORMAT(i.income_date, '%Y-%m') = months.month
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
app.get('/api/dashboard', async (req, res) => {
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
        
        // Toplam gelir
        const [totalIncomeResult] = await connection.promise().execute('SELECT SUM(amount) as total FROM incomes');
        const totalIncome = totalIncomeResult[0].total || 0;
        
        // Toplam gider
        const [totalExpenseResult] = await connection.promise().execute('SELECT SUM(amount) as total FROM expenses');
        const totalExpense = totalExpenseResult[0].total || 0;
        
        // Net gelir
        const netIncome = totalIncome - totalExpense;
        
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
