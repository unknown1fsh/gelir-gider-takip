-- Gelir Gider Takip Uygulaması Veritabanı Kurulum Scripti
-- MySQL 8.0+ için uyumlu

-- Veritabanını oluştur
CREATE DATABASE IF NOT EXISTS `income_expense_tracker` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Veritabanını kullan
USE `income_expense_tracker`;

-- Banks tablosu
CREATE TABLE IF NOT EXISTS `banks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bank_name` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Accounts tablosu
CREATE TABLE IF NOT EXISTS `accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
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
  FOREIGN KEY (`bank_id`) REFERENCES `banks`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Credit Cards tablosu
CREATE TABLE IF NOT EXISTS `credit_cards` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bank_id` INT NOT NULL,
  `card_name` VARCHAR(100) NOT NULL,
  `card_number` VARCHAR(20),
  `total_limit` DECIMAL(15,2) NOT NULL,
  `remaining_limit` DECIMAL(15,2) NOT NULL,
  `statement_date` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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

-- İndeksler ekle (performans için)
CREATE INDEX `idx_accounts_bank_id` ON `accounts`(`bank_id`);
CREATE INDEX `idx_accounts_account_type` ON `accounts`(`account_type`);
CREATE INDEX `idx_accounts_is_credit_account` ON `accounts`(`is_credit_account`);
CREATE INDEX `idx_credit_cards_bank_id` ON `credit_cards`(`bank_id`);
CREATE INDEX `idx_credit_cards_statement_date` ON `credit_cards`(`statement_date`);

-- Veritabanı kullanıcı yetkileri (güvenlik için)
-- Bu komutları sadece gerekirse çalıştırın
-- GRANT ALL PRIVILEGES ON `income_expense_tracker`.* TO 'root'@'localhost';
-- FLUSH PRIVILEGES;

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
WHERE table_schema = 'income_expense_tracker';
