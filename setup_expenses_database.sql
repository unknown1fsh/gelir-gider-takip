-- Gider Yönetimi için Yeni Tablolar ve Güncellemeler

USE income_expense_tracker;

-- 1. Gelir Tablosu
CREATE TABLE IF NOT EXISTS incomes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    income_type ENUM('salary', 'rental', 'investment', 'other') NOT NULL,
    source VARCHAR(255),
    description TEXT,
    income_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Gider Kategorileri Tablosu
CREATE TABLE IF NOT EXISTS expense_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('fixed', 'variable', 'periodic') NOT NULL,
    color VARCHAR(7) DEFAULT '#007bff',
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Giderler Tablosu
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    category_id INT NOT NULL,
    expense_type ENUM('rent', 'utilities', 'credit', 'credit_card', 'credit_account', 'food', 'transport', 'health', 'entertainment', 'other') NOT NULL,
    payment_method ENUM('cash', 'credit_card', 'bank_transfer', 'credit_account') NOT NULL,
    related_account_id INT NULL,
    related_credit_card_id INT NULL,
    related_credit_account_id INT NULL,
    due_date DATE NULL,
    payment_date DATE NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES expense_categories(id),
    FOREIGN KEY (related_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (related_credit_card_id) REFERENCES credit_cards(id) ON DELETE SET NULL,
    FOREIGN KEY (related_credit_account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

-- 4. Ev Kiraları ve Aidatlar Tablosu
CREATE TABLE IF NOT EXISTS rent_expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_id INT NOT NULL,
    rent_amount DECIMAL(15,2) NOT NULL,
    maintenance_fee DECIMAL(15,2) DEFAULT 0,
    property_tax DECIMAL(15,2) DEFAULT 0,
    insurance DECIMAL(15,2) DEFAULT 0,
    other_fees DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (rent_amount + maintenance_fee + property_tax + insurance + other_fees) STORED,
    property_address TEXT,
    landlord_name VARCHAR(255),
    contract_start_date DATE,
    contract_end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE
);

-- 5. Kredi ve Kredi Kartı Ödemeleri Tablosu
CREATE TABLE IF NOT EXISTS credit_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_id INT NOT NULL,
    payment_type ENUM('credit_card', 'credit_loan', 'credit_account') NOT NULL,
    principal_amount DECIMAL(15,2) NOT NULL,
    interest_amount DECIMAL(15,2) DEFAULT 0,
    late_fee DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (principal_amount + interest_amount + late_fee) STORED,
    minimum_payment DECIMAL(15,2) NULL,
    statement_date DATE NULL,
    due_date DATE NOT NULL,
    payment_date DATE NULL,
    is_minimum_payment BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE
);

-- 6. Dönemsel Giderler Tablosu
CREATE TABLE IF NOT EXISTS periodic_expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    expense_id INT NOT NULL,
    frequency ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') NOT NULL,
    next_due_date DATE NOT NULL,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE
);

-- Varsayılan Gider Kategorileri
INSERT INTO expense_categories (name, type, color, icon) VALUES
('Ev Kirası', 'fixed', '#dc3545', 'home'),
('Aidat', 'fixed', '#fd7e14', 'building'),
('Elektrik', 'variable', '#ffc107', 'bolt'),
('Su', 'variable', '#17a2b8', 'droplet'),
('Doğalgaz', 'variable', '#6f42c1', 'flame'),
('İnternet', 'fixed', '#20c997', 'wifi'),
('Telefon', 'fixed', '#6c757d', 'phone'),
('Kredi Kartı', 'periodic', '#e83e8c', 'credit-card'),
('Kredi Ödemesi', 'periodic', '#fd7e14', 'bank'),
('Market', 'variable', '#28a745', 'shopping-cart'),
('Ulaşım', 'variable', '#007bff', 'car'),
('Sağlık', 'variable', '#dc3545', 'heart'),
('Eğlence', 'variable', '#6f42c1', 'music'),
('Eğitim', 'variable', '#20c997', 'book'),
('Diğer', 'variable', '#6c757d', 'ellipsis-h');

-- Trigger: Kredi kartı limiti güncellendiğinde kullanılabilir limiti hesapla
DELIMITER //
CREATE TRIGGER update_credit_card_available_limit
AFTER UPDATE ON credit_cards
FOR EACH ROW
BEGIN
    UPDATE credit_cards 
    SET available_limit = NEW.card_limit - NEW.remaining_limit 
    WHERE id = NEW.id;
END//
DELIMITER ;

-- Trigger: Hesap limiti güncellendiğinde kullanılabilir limiti hesapla
DELIMITER //
CREATE TRIGGER update_account_available_limit
AFTER UPDATE ON accounts
FOR EACH ROW
BEGIN
    IF NEW.is_credit_account = 1 THEN
        UPDATE accounts 
        SET available_limit = NEW.credit_limit + NEW.current_balance 
        WHERE id = NEW.id;
    ELSE
        UPDATE accounts 
        SET available_limit = NEW.current_balance 
        WHERE id = NEW.id;
    END IF;
END//
DELIMITER ;

-- Trigger: Gider eklendiğinde ilgili hesapları güncelle
DELIMITER //
CREATE TRIGGER update_accounts_after_expense
AFTER INSERT ON expenses
FOR EACH ROW
BEGIN
    -- Kredi kartı ödemesi ise
    IF NEW.payment_method = 'credit_card' AND NEW.related_credit_card_id IS NOT NULL THEN
        UPDATE credit_cards 
        SET remaining_limit = remaining_limit - NEW.amount,
            available_limit = card_limit - (remaining_limit - NEW.amount)
        WHERE id = NEW.related_credit_card_id;
    END IF;
    
    -- Kredili hesap ödemesi ise
    IF NEW.payment_method = 'credit_account' AND NEW.related_credit_account_id IS NOT NULL THEN
        UPDATE accounts 
        SET current_balance = current_balance - NEW.amount,
            available_limit = credit_limit + (current_balance - NEW.amount)
        WHERE id = NEW.related_credit_account_id;
    END IF;
    
    -- Nakit hesap ödemesi ise
    IF NEW.payment_method = 'cash' AND NEW.related_account_id IS NOT NULL THEN
        UPDATE accounts 
        SET current_balance = current_balance - NEW.amount,
            available_limit = current_balance - NEW.amount
        WHERE id = NEW.related_account_id;
    END IF;
END//
DELIMITER ;

-- Trigger: Gelir eklendiğinde ilgili hesapları güncelle
DELIMITER //
CREATE TRIGGER update_accounts_after_income
AFTER INSERT ON incomes
FOR EACH ROW
BEGIN
    -- Varsayılan olarak ana hesaba ekle (ilk hesap)
    UPDATE accounts 
    SET current_balance = current_balance + NEW.amount,
        available_limit = CASE 
            WHEN is_credit_account = 1 THEN credit_limit + (current_balance + NEW.amount)
            ELSE current_balance + NEW.amount
        END
    WHERE id = (SELECT MIN(id) FROM accounts WHERE is_credit_account = 0);
END//
DELIMITER ;

-- İndeksler
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_type ON expenses(expense_type);
CREATE INDEX idx_expenses_payment_method ON expenses(payment_method);
CREATE INDEX idx_expenses_due_date ON expenses(due_date);
CREATE INDEX idx_expenses_payment_date ON expenses(payment_date);
CREATE INDEX idx_incomes_date ON incomes(income_date);
CREATE INDEX idx_credit_payments_due_date ON credit_payments(due_date);
