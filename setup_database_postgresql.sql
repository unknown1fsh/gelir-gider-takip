-- Gelir Gider Takip Uygulaması Veritabanı Kurulum Scripti
-- PostgreSQL için uyumlu

-- Banks tablosu
CREATE TABLE IF NOT EXISTS banks (
  id SERIAL PRIMARY KEY,
  bank_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users tablosu
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
);

-- Accounts tablosu
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
);

-- Credit Cards tablosu
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
);

-- Türkiye'deki özel bankaları ekle
INSERT INTO banks (bank_name) VALUES
('Ziraat Bank'),
('İş Bank'),
('Garanti BBVA'),
('Yapı Kredi'),
('Akbank'),
('VakıfBank'),
('Halkbank'),
('QNB Finansbank'),
('Denizbank'),
('TEB'),
('Şekerbank'),
('Türk Ekonomi Bankası'),
('Alternatif Bank'),
('ING Bank'),
('HSBC'),
('Citibank'),
('Standard Chartered'),
('Deutsche Bank'),
('JP Morgan'),
('Goldman Sachs')
ON CONFLICT DO NOTHING;

-- Incomes tablosu
CREATE TABLE IF NOT EXISTS incomes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  income_type VARCHAR(20) DEFAULT 'other' CHECK (income_type IN ('salary', 'part_time', 'rental', 'investment', 'food_card', 'other')),
  source VARCHAR(100),
  description TEXT,
  income_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Expense Categories tablosu
CREATE TABLE IF NOT EXISTS expense_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#007bff',
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses tablosu
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  category_id INTEGER,
  expense_type VARCHAR(100),
  payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'credit_card', 'bank_transfer', 'credit_account')),
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
  FOREIGN KEY (related_credit_card_id) REFERENCES credit_cards(id) ON DELETE SET NULL
);

-- İndeksler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_bank_id ON accounts(bank_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_type ON accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_accounts_is_credit_account ON accounts(is_credit_account);
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_bank_id ON credit_cards(bank_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_statement_date ON credit_cards(statement_date);
CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(income_date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_date ON expenses(payment_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);

-- Temel gider kategorilerini ekle (sadece yoksa)
INSERT INTO expense_categories (name, color, icon) VALUES
('Gıda', '#28a745', '🍽️'),
('Ulaşım', '#007bff', '🚗'),
('Ev Giderleri', '#ffc107', '🏠'),
('Sağlık', '#dc3545', '🏥'),
('Eğlence', '#6f42c1', '🎮'),
('Alışveriş', '#fd7e14', '🛍️'),
('Faturalar', '#20c997', '📄'),
('Diğer', '#6c757d', '📌')
ON CONFLICT (name) DO NOTHING;

-- Veritabanı durumunu kontrol et
SELECT 
  'Database Status' as Info,
  current_database() as Current_Database,
  COUNT(*) as Total_Banks
FROM banks;

SELECT 
  'Tables Created' as Info,
  COUNT(*) as Table_Count
FROM information_schema.tables 
WHERE table_schema = 'public';
