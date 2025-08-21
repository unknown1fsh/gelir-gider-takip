-- Gelir Gider Takip Uygulaması Veritabanı Kurulum Scripti
-- MySQL 8.0+ için uyumlu

-- Veritabanını oluştur
CREATE DATABASE IF NOT EXISTS `gelir_gider_takip` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Veritabanını kullan
USE `gelir_gider_takip`;

-- Banks tablosu
CREATE TABLE IF NOT EXISTS `banks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bank_name` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users tablosu
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) UNIQUE NOT NULL,
  `email` VARCHAR(100) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `last_login` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Accounts tablosu
CREATE TABLE IF NOT EXISTS `accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `bank_id` INT NOT NULL,
  `account_name` VARCHAR(100) NOT NULL,
  `account_number` VARCHAR(50),
  `iban` VARCHAR(32) NOT NULL,
  `account_type` ENUM('vadeli', 'vadesiz') DEFAULT 'vadesiz',
  `account_limit` DECIMAL(15,2) DEFAULT 0,
  `current_balance` DECIMAL(15,2) NOT NULL,
  `is_credit_account` BOOLEAN DEFAULT FALSE,
  `credit_limit` DECIMAL(15,2) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bank_id`) REFERENCES `banks`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Credit Cards tablosu
CREATE TABLE IF NOT EXISTS `credit_cards` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `bank_id` INT NOT NULL,
  `card_name` VARCHAR(100) NOT NULL,
  `card_number` VARCHAR(20),
  `card_limit` DECIMAL(15,2) NOT NULL,
  `remaining_limit` DECIMAL(15,2) NOT NULL,
  `statement_date` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`bank_id`) REFERENCES `banks`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Türkiye'deki özel bankaları ekle
INSERT INTO `banks` (`bank_name`) VALUES
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
('Goldman Sachs');

-- Incomes tablosu
CREATE TABLE IF NOT EXISTS `incomes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `income_type` ENUM('salary', 'part_time', 'rental', 'investment', 'food_card', 'other') DEFAULT 'other',
  `source` VARCHAR(100),
  `description` TEXT,
  `income_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expense Categories tablosu
CREATE TABLE IF NOT EXISTS `expense_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `color` VARCHAR(7) DEFAULT '#007bff',
  `icon` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expenses tablosu
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `category_id` INT,
  `expense_type` VARCHAR(100),
  `payment_method` ENUM('cash', 'credit_card', 'bank_transfer', 'credit_account') DEFAULT 'cash',
  `related_account_id` INT,
  `related_credit_card_id` INT,
  `related_credit_account_id` INT,
  `due_date` DATE,
  `payment_date` DATE,
  `description` TEXT,
  `is_paid` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `expense_categories`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`related_account_id`) REFERENCES `accounts`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`related_credit_card_id`) REFERENCES `credit_cards`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- İndeksler ekle (performans için)
-- CREATE INDEX `idx_accounts_user_id` ON `accounts`(`user_id`);
-- CREATE INDEX `idx_accounts_bank_id` ON `accounts`(`bank_id`);
-- CREATE INDEX `idx_accounts_account_type` ON `accounts`(`account_type`);
-- CREATE INDEX `idx_accounts_is_credit_account` ON `accounts`(`is_credit_account`);
-- CREATE INDEX `idx_credit_cards_user_id` ON `credit_cards`(`user_id`);
-- CREATE INDEX `idx_credit_cards_bank_id` ON `credit_cards`(`bank_id`);
-- CREATE INDEX `idx_credit_cards_statement_date` ON `credit_cards`(`statement_date`);
-- CREATE INDEX `idx_incomes_user_id` ON `incomes`(`user_id`);
-- CREATE INDEX `idx_incomes_income_date` ON `incomes`(`income_date`);
-- CREATE INDEX `idx_expenses_user_id` ON `expenses`(`user_id`);
-- CREATE INDEX `idx_expenses_payment_date` ON `expenses`(`payment_date`);
-- CREATE INDEX `idx_expenses_category_id` ON `expenses`(`category_id`);

-- Veritabanı kullanıcı yetkileri (güvenlik için)
-- Bu komutları sadece gerekirse çalıştırın
-- GRANT ALL PRIVILEGES ON `gelir_gider_takip`.* TO 'root'@'localhost';
-- FLUSH PRIVILEGES;

-- Temel gider kategorilerini ekle (sadece yoksa)
INSERT IGNORE INTO `expense_categories` (`name`, `color`, `icon`) VALUES
('Gıda', '#28a745', '🍽️'),
('Ulaşım', '#007bff', '🚗'),
('Ev Giderleri', '#ffc107', '🏠'),
('Sağlık', '#dc3545', '🏥'),
('Eğlence', '#6f42c1', '🎮'),
('Alışveriş', '#fd7e14', '🛍️'),
('Faturalar', '#20c997', '📄'),
('Diğer', '#6c757d', '📌');

-- Veritabanı durumunu kontrol et
SELECT 
  'Database Status' as Info,
  DATABASE() as Current_Database,
  COUNT(*) as Total_Banks
FROM banks;

SELECT 
  'Tables Created' as Info,
  COUNT(*) as Table_Count
FROM information_schema.tables 
WHERE table_schema = 'gelir_gider_takip';
