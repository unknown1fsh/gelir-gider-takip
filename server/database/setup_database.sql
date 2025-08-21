-- Gelir Gider Takip Uygulaması Veritabanı Kurulum Scripti
-- MySQL 8.0+ için uyumlu

-- Veritabanını oluştur
CREATE DATABASE IF NOT EXISTS `income_expense_tracker` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Veritabanını kullan
USE `income_expense_tracker`;

-- System Parameters tablosu
CREATE TABLE IF NOT EXISTS `system_parameters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `param_key` VARCHAR(100) UNIQUE NOT NULL,
  `param_value` TEXT,
  `param_type` ENUM('string', 'number', 'boolean', 'json', 'date') DEFAULT 'string',
  `description` TEXT,
  `is_editable` BOOLEAN DEFAULT TRUE,
  `category` VARCHAR(50) DEFAULT 'general',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Varsayılan sistem parametreleri
INSERT INTO `system_parameters` (`param_key`, `param_value`, `param_type`, `description`, `category`) VALUES
('app_name', 'Gelir Gider Takip', 'string', 'Uygulama adı', 'general'),
('app_version', '1.0.0', 'string', 'Uygulama versiyonu', 'general'),
('default_currency', 'TRY', 'string', 'Varsayılan para birimi', 'financial'),
('tax_rate', '18', 'number', 'Varsayılan vergi oranı (%)', 'financial'),
('maintenance_mode', 'false', 'boolean', 'Bakım modu aktif mi?', 'system'),
('max_file_size', '5242880', 'number', 'Maksimum dosya boyutu (byte)', 'system'),
('session_timeout', '3600', 'number', 'Oturum zaman aşımı (saniye)', 'system'),
('email_notifications', 'true', 'boolean', 'E-posta bildirimleri aktif mi?', 'notifications'),
('sms_notifications', 'false', 'boolean', 'SMS bildirimleri aktif mi?', 'notifications'),
('backup_frequency', 'daily', 'string', 'Yedekleme sıklığı', 'system'),
('auto_logout', 'true', 'boolean', 'Otomatik çıkış aktif mi?', 'security'),
('password_min_length', '8', 'number', 'Minimum şifre uzunluğu', 'security'),
('login_attempts', '3', 'number', 'Maksimum giriş denemesi', 'security'),
('lockout_duration', '900', 'number', 'Hesap kilitleme süresi (saniye)', 'security'),
('data_retention_days', '2555', 'number', 'Veri saklama süresi (gün)', 'data'),
('export_format', 'excel', 'string', 'Varsayılan dışa aktarma formatı', 'export'),
('language', 'tr', 'string', 'Varsayılan dil', 'localization'),
('timezone', 'Europe/Istanbul', 'string', 'Varsayılan saat dilimi', 'localization'),
('date_format', 'DD/MM/YYYY', 'string', 'Tarih formatı', 'localization'),
('decimal_places', '2', 'number', 'Ondalık basamak sayısı', 'financial'),
('rounding_method', 'round', 'string', 'Yuvarlama yöntemi', 'financial'),
('auto_categorization', 'true', 'boolean', 'Otomatik kategorizasyon aktif mi?', 'ai'),
('ai_analysis', 'true', 'boolean', 'AI analiz özelliği aktif mi?', 'ai'),
('budget_alerts', 'true', 'boolean', 'Bütçe uyarıları aktif mi?', 'notifications'),
('expense_reminders', 'true', 'boolean', 'Gider hatırlatıcıları aktif mi?', 'notifications'),
('income_reminders', 'true', 'boolean', 'Gelir hatırlatıcıları aktif mi?', 'notifications'),
('credit_card_alerts', 'true', 'boolean', 'Kredi kartı uyarıları aktif mi?', 'notifications'),
('loan_alerts', 'true', 'boolean', 'Kredi uyarıları aktif mi?', 'notifications'),
('reporting_enabled', 'true', 'boolean', 'Raporlama özelliği aktif mi?', 'reporting'),
('export_enabled', 'true', 'boolean', 'Dışa aktarma özelliği aktif mi?', 'export'),
('api_rate_limit', '100', 'number', 'API istek sınırı (dakikada)', 'api'),
('log_level', 'info', 'string', 'Log seviyesi', 'system'),
('debug_mode', 'false', 'boolean', 'Debug modu aktif mi?', 'system');

-- Banks tablosu
CREATE TABLE IF NOT EXISTS `banks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bank_name` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
