-- Otomatik Ödeme Talimatları Sistemi
-- Bu script otomatik ödeme talimatları için gerekli tabloları oluşturur

USE gelir_gider_takip;

-- Otomatik ödeme kategorileri tablosu
CREATE TABLE IF NOT EXISTS automatic_payment_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT '💳',
    color VARCHAR(7) DEFAULT '#007bff',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Otomatik ödeme talimatları ana tablosu
CREATE TABLE IF NOT EXISTS automatic_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    
    -- Ödeme sıklığı
    frequency_type ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom') NOT NULL,
    frequency_value INT DEFAULT 1, -- Her X gün/hafta/ay
    
    -- Tarih bilgileri
    start_date DATE NOT NULL,
    end_date DATE NULL, -- NULL ise süresiz
    next_payment_date DATE NOT NULL,
    last_payment_date DATE NULL,
    
    -- Hesap bilgileri
    account_type ENUM('bank_account', 'credit_card') NOT NULL,
    account_id INT NOT NULL, -- bank_accounts.id veya credit_cards.id
    
    -- Durum ve ayarlar
    is_active BOOLEAN DEFAULT TRUE,
    auto_execute BOOLEAN DEFAULT FALSE, -- Otomatik yürütme
    reminder_days INT DEFAULT 3, -- Kaç gün önce hatırlatma
    
    -- Takip bilgileri
    total_payments INT DEFAULT 0,
    total_amount_paid DECIMAL(15,2) DEFAULT 0.00,
    missed_payments INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES automatic_payment_categories(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_category_id (category_id),
    INDEX idx_next_payment_date (next_payment_date),
    INDEX idx_is_active (is_active),
    INDEX idx_account (account_type, account_id)
);

-- Otomatik ödeme geçmişi tablosu
CREATE TABLE IF NOT EXISTS automatic_payment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    automatic_payment_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Ödeme detayları
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    
    -- Durum
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    execution_method ENUM('automatic', 'manual') DEFAULT 'manual',
    
    -- Hata bilgileri
    error_message TEXT NULL,
    retry_count INT DEFAULT 0,
    
    -- Manuel ödeme bilgileri
    manual_payment_id INT NULL, -- expenses.id ile ilişki
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (automatic_payment_id) REFERENCES automatic_payments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (manual_payment_id) REFERENCES expenses(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_automatic_payment_id (automatic_payment_id),
    INDEX idx_user_id (user_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_status (status)
);

-- Otomatik ödeme şablonları tablosu
CREATE TABLE IF NOT EXISTS automatic_payment_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INT NOT NULL,
    
    -- Şablon ayarları
    default_amount DECIMAL(15,2) NULL,
    default_frequency_type ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom') NOT NULL,
    default_frequency_value INT DEFAULT 1,
    default_reminder_days INT DEFAULT 3,
    
    -- Kullanım istatistikleri
    usage_count INT DEFAULT 0,
    is_popular BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (category_id) REFERENCES automatic_payment_categories(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_category_id (category_id),
    INDEX idx_is_popular (is_popular)
);

-- Varsayılan kategorileri ekle
INSERT IGNORE INTO automatic_payment_categories (name, description, icon, color) VALUES
('🏠 Ev Kirası', 'Ev kirası ödemeleri', '🏠', '#dc3545'),
('🏢 Aidat', 'Site, apartman aidatları', '🏢', '#28a745'),
('💡 Elektrik', 'Elektrik faturası', '💡', '#ffc107'),
('💧 Su', 'Su faturası', '💧', '#17a2b8'),
('🔥 Doğalgaz', 'Doğalgaz faturası', '🔥', '#fd7e14'),
('📱 Telefon', 'Telefon faturası', '📱', '#6f42c1'),
('🌐 İnternet', 'İnternet aboneliği', '🌐', '#20c997'),
('📺 TV', 'TV aboneliği', '📺', '#e83e8c'),
('🚗 Araç Kredisi', 'Araç kredi ödemeleri', '🚗', '#6c757d'),
('🏦 Banka Kredisi', 'Banka kredi ödemeleri', '🏦', '#495057'),
('💳 Kredi Kartı', 'Kredi kartı ödemeleri', '💳', '#6610f2'),
('📚 Eğitim', 'Okul, kurs ödemeleri', '📚', '#fd7e14'),
('🏥 Sağlık', 'Sağlık sigortası, ilaç', '🏥', '#e83e8c'),
('🎯 Diğer', 'Diğer düzenli ödemeler', '🎯', '#6c757d');

-- Varsayılan şablonları ekle
INSERT IGNORE INTO automatic_payment_templates (name, description, category_id, default_amount, default_frequency_type, default_frequency_value, default_reminder_days) VALUES
('Aylık Kira', 'Standart aylık ev kirası', 1, NULL, 'monthly', 1, 5),
('Aylık Aidat', 'Standart aylık site aidatı', 2, NULL, 'monthly', 1, 3),
('Aylık Elektrik', 'Standart aylık elektrik faturası', 3, NULL, 'monthly', 1, 7),
('Aylık Su', 'Standart aylık su faturası', 4, NULL, 'monthly', 1, 7),
('Aylık Doğalgaz', 'Standart aylık doğalgaz faturası', 5, NULL, 'monthly', 1, 7),
('Aylık Telefon', 'Standart aylık telefon faturası', 6, NULL, 'monthly', 1, 5),
('Aylık İnternet', 'Standart aylık internet aboneliği', 7, NULL, 'monthly', 1, 5),
('Yıllık Sigorta', 'Yıllık araç/sağlık sigortası', 13, NULL, 'yearly', 1, 30);

-- Mevcut kullanıcılar için otomatik ödeme kategorileri erişimi sağla
-- (Bu kısım zaten foreign key ile sağlanıyor)

-- Trigger: Otomatik ödeme eklendiğinde next_payment_date'i güncelle
DELIMITER //
CREATE TRIGGER IF NOT EXISTS update_next_payment_date
BEFORE INSERT ON automatic_payments
FOR EACH ROW
BEGIN
    IF NEW.next_payment_date IS NULL THEN
        SET NEW.next_payment_date = NEW.start_date;
    END IF;
END//
DELIMITER ;

-- Trigger: Otomatik ödeme güncellendiğinde next_payment_date'i güncelle
DELIMITER //
CREATE TRIGGER IF NOT EXISTS update_next_payment_date_on_update
BEFORE UPDATE ON automatic_payments
FOR EACH ROW
BEGIN
    IF NEW.start_date != OLD.start_date OR NEW.frequency_type != OLD.frequency_type OR NEW.frequency_value != OLD.frequency_value THEN
        -- Yeni başlangıç tarihinden itibaren hesapla
        SET NEW.next_payment_date = NEW.start_date;
    END IF;
END//
DELIMITER ;

-- View: Aktif otomatik ödemeler
CREATE OR REPLACE VIEW v_active_automatic_payments AS
SELECT 
    ap.*,
    apc.name as category_name,
    apc.icon as category_icon,
    apc.color as category_color,
        CASE 
      WHEN ap.account_type = 'bank_account' THEN a.account_name
      WHEN ap.account_type = 'credit_card' THEN cc.card_name
    END as account_name,
    DATEDIFF(ap.next_payment_date, CURDATE()) as days_until_payment,
    CASE 
        WHEN DATEDIFF(ap.next_payment_date, CURDATE()) <= 0 THEN 'overdue'
        WHEN DATEDIFF(ap.next_payment_date, CURDATE()) <= ap.reminder_days THEN 'due_soon'
        ELSE 'upcoming'
    END as payment_status
FROM automatic_payments ap
JOIN automatic_payment_categories apc ON ap.category_id = apc.id
LEFT JOIN accounts a ON ap.account_type = 'bank_account' AND ap.account_id = a.id
LEFT JOIN credit_cards cc ON ap.account_type = 'credit_card' AND ap.account_id = cc.id
WHERE ap.is_active = TRUE;

-- View: Otomatik ödeme özeti
CREATE OR REPLACE VIEW v_automatic_payment_summary AS
SELECT 
    user_id,
    COUNT(*) as total_payments,
    COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_payments,
    SUM(CASE WHEN is_active = TRUE THEN amount ELSE 0 END) as total_monthly_amount,
    SUM(CASE WHEN DATEDIFF(next_payment_date, CURDATE()) <= 0 THEN 1 ELSE 0 END) as overdue_payments,
    SUM(CASE WHEN DATEDIFF(next_payment_date, CURDATE()) <= reminder_days THEN 1 ELSE 0 END) as due_soon_payments
FROM automatic_payments
GROUP BY user_id;

-- Stored Procedure: Sonraki ödeme tarihini hesapla
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CalculateNextPaymentDate(
    IN p_payment_id INT,
    IN p_current_date DATE
)
BEGIN
    DECLARE v_frequency_type VARCHAR(20);
    DECLARE v_frequency_value INT;
    DECLARE v_next_date DATE;
    
    SELECT frequency_type, frequency_value INTO v_frequency_type, v_frequency_value
    FROM automatic_payments WHERE id = p_payment_id;
    
    CASE v_frequency_type
        WHEN 'daily' THEN
            SET v_next_date = DATE_ADD(p_current_date, INTERVAL v_frequency_value DAY);
        WHEN 'weekly' THEN
            SET v_next_date = DATE_ADD(p_current_date, INTERVAL v_frequency_value WEEK);
        WHEN 'monthly' THEN
            SET v_next_date = DATE_ADD(p_current_date, INTERVAL v_frequency_value MONTH);
        WHEN 'quarterly' THEN
            SET v_next_date = DATE_ADD(p_current_date, INTERVAL v_frequency_value * 3 MONTH);
        WHEN 'yearly' THEN
            SET v_next_date = DATE_ADD(p_current_date, INTERVAL v_frequency_value YEAR);
        ELSE
            SET v_next_date = DATE_ADD(p_current_date, INTERVAL v_frequency_value DAY);
    END CASE;
    
    UPDATE automatic_payments 
    SET next_payment_date = v_next_date, 
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_payment_id;
    
    SELECT v_next_date as next_payment_date;
END//
DELIMITER ;

-- Stored Procedure: Otomatik ödeme yürüt
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS ExecuteAutomaticPayment(
    IN p_payment_id INT,
    IN p_execution_date DATE
)
BEGIN
    DECLARE v_user_id INT;
    DECLARE v_amount DECIMAL(15,2);
    DECLARE v_currency VARCHAR(3);
    DECLARE v_account_type VARCHAR(20);
    DECLARE v_account_id INT;
    DECLARE v_title VARCHAR(200);
    DECLARE v_category_id INT;
    
    -- Ödeme bilgilerini al
    SELECT user_id, amount, currency, account_type, account_id, title, category_id
    INTO v_user_id, v_amount, v_currency, v_account_type, v_account_id, v_title, v_category_id
    FROM automatic_payments WHERE id = p_payment_id;
    
    -- Geçmiş kaydı oluştur
    INSERT INTO automatic_payment_history (
        automatic_payment_id, user_id, payment_date, amount, currency, 
        status, execution_method
    ) VALUES (
        p_payment_id, v_user_id, p_execution_date, v_amount, v_currency,
        'completed', 'automatic'
    );
    
    -- Ana tabloyu güncelle
    UPDATE automatic_payments 
    SET last_payment_date = p_execution_date,
        total_payments = total_payments + 1,
        total_amount_paid = total_amount_paid + v_amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_payment_id;
    
    -- Sonraki ödeme tarihini hesapla
    CALL CalculateNextPaymentDate(p_payment_id, p_execution_date);
    
    SELECT 'Payment executed successfully' as result;
END//
DELIMITER ;

-- Indexes for performance
CREATE INDEX idx_automatic_payments_user_status ON automatic_payments(user_id, is_active);
CREATE INDEX idx_automatic_payments_next_date ON automatic_payments(next_payment_date);
CREATE INDEX idx_payment_history_payment_date ON automatic_payment_history(payment_date);
CREATE INDEX idx_payment_history_status ON automatic_payment_history(status);

-- Comments
ALTER TABLE automatic_payments COMMENT = 'Otomatik ödeme talimatları ana tablosu';
ALTER TABLE automatic_payment_history COMMENT = 'Otomatik ödeme geçmişi ve takibi';
ALTER TABLE automatic_payment_categories COMMENT = 'Otomatik ödeme kategorileri';
ALTER TABLE automatic_payment_templates COMMENT = 'Otomatik ödeme şablonları';

-- Grant permissions (if needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON gelir_gider_takip.automatic_payments TO 'app_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON gelir_gider_takip.automatic_payment_history TO 'app_user'@'localhost';
-- GRANT SELECT ON gelir_gider_takip.automatic_payment_categories TO 'app_user'@'localhost';
-- GRANT SELECT ON gelir_gider_takip.automatic_payment_templates TO 'app_user'@'localhost';
