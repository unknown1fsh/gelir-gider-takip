-- Veritabanını sıfırla ve yeniden oluştur
USE income_expense_tracker;

-- Mevcut tabloları sil (foreign key constraint'ler nedeniyle sıralı silme)
DROP TABLE IF EXISTS rent_expenses;
DROP TABLE IF EXISTS credit_payments;
DROP TABLE IF EXISTS periodic_expenses;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS incomes;
DROP TABLE IF EXISTS credit_cards;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS banks;

-- Users tablosu
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Banks tablosu
CREATE TABLE banks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bank_name VARCHAR(100) NOT NULL,
  bank_code VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts tablosu
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

-- Credit Cards tablosu
CREATE TABLE credit_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bank_id INT NOT NULL,
  card_name VARCHAR(100) NOT NULL,
  card_number VARCHAR(20),
  card_limit DECIMAL(15,2) NOT NULL,
  remaining_limit DECIMAL(15,2) NOT NULL,
  statement_date INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
);

-- Incomes tablosu
CREATE TABLE incomes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  source VARCHAR(100) NOT NULL,
  income_type ENUM('salary', 'part_time', 'rental', 'investment', 'food_card', 'other') NOT NULL,
  description TEXT,
  income_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expense Categories tablosu
CREATE TABLE expense_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#007bff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses tablosu
CREATE TABLE expenses (
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
);

-- Rent Expenses tablosu
CREATE TABLE rent_expenses (
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
);

-- Credit Payments tablosu
CREATE TABLE credit_payments (
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
);

-- Periodic Expenses tablosu
CREATE TABLE periodic_expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  frequency ENUM('daily', 'weekly', 'monthly', 'yearly') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Varsayılan gider kategorileri ekle
INSERT INTO expense_categories (name, color) VALUES
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
('Diğer', '#6c757d');

SELECT 'Veritabanı başarıyla sıfırlandı ve yeniden oluşturuldu!' as message;
