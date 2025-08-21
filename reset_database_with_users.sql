-- Gelir Gider Takip Uygulaması Veritabanı Sıfırlama Scripti
-- MySQL 8.0+ için uyumlu
-- Bu script mevcut veritabanını sıfırlar ve yeni yapıyı oluşturur

-- Veritabanını kullan
USE `income_expense_tracker`;

-- Mevcut tabloları sırayla sil (foreign key constraint'ler nedeniyle)
DROP TABLE IF EXISTS `rent_expenses`;
DROP TABLE IF EXISTS `periodic_expenses`;
DROP TABLE IF EXISTS `expenses`;
DROP TABLE IF EXISTS `incomes`;
DROP TABLE IF EXISTS `credit_cards`;
DROP TABLE IF EXISTS `accounts`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `expense_categories`;
DROP TABLE IF EXISTS `banks`;

-- Veritabanını yeniden oluştur
SOURCE setup_database.sql;

-- Veritabanı durumunu kontrol et
SELECT 
  'Database Reset Complete' as Info,
  DATABASE() as Current_Database,
  COUNT(*) as Total_Banks
FROM banks;

SELECT 
  'Tables Created' as Info,
  COUNT(*) as Table_Count
FROM information_schema.tables 
WHERE table_schema = 'income_expense_tracker';

SELECT 
  'Users Table' as Info,
  COUNT(*) as User_Count
FROM users;

SELECT 
  'Categories Table' as Info,
  COUNT(*) as Category_Count
FROM expense_categories;
