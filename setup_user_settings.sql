-- Kullanıcı ayarları tablosu
CREATE TABLE IF NOT EXISTS user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'tr',
    currency VARCHAR(10) DEFAULT 'TRY',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(10) DEFAULT '24h',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_settings (user_id)
);

-- Mevcut kullanıcılar için varsayılan ayarlar ekle
INSERT IGNORE INTO user_settings (user_id, theme, language, currency, date_format, time_format, notifications_enabled, email_notifications, push_notifications)
SELECT id, 'light', 'tr', 'TRY', 'DD/MM/YYYY', '24h', TRUE, TRUE, FALSE
FROM users
WHERE id NOT IN (SELECT user_id FROM user_settings);

-- Users tablosuna eksik sütunları ekle (eğer yoksa)
-- phone sütunu
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'gelir_gider_takip' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone') = 0,
    'ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL',
    'SELECT "phone column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- address sütunu
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'gelir_gider_takip' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'address') = 0,
    'ALTER TABLE users ADD COLUMN address TEXT NULL',
    'SELECT "address column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- birth_date sütunu
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'gelir_gider_takip' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'birth_date') = 0,
    'ALTER TABLE users ADD COLUMN birth_date DATE NULL',
    'SELECT "birth_date column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- bio sütunu
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'gelir_gider_takip' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'bio') = 0,
    'ALTER TABLE users ADD COLUMN bio TEXT NULL',
    'SELECT "bio column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- avatar sütunu
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'gelir_gider_takip' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'avatar') = 0,
    'ALTER TABLE users ADD COLUMN avatar VARCHAR(255) NULL',
    'SELECT "avatar column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- updated_at sütunu
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'gelir_gider_takip' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'updated_at') = 0,
    'ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    'SELECT "updated_at column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- email sütunu
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'gelir_gider_takip' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email') = 0,
    'ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL',
    'SELECT "email column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- full_name sütunu
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'gelir_gider_takip' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'full_name') = 0,
    'ALTER TABLE users ADD COLUMN full_name VARCHAR(255) NULL',
    'SELECT "full_name column already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Email için unique index ekle (eğer yoksa)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'gelir_gider_takip' AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_email') = 0,
    'CREATE UNIQUE INDEX idx_users_email ON users(email)',
    'SELECT "email index already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
