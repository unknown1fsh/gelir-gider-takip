-- Sistem parametreleri tablosunu güncelle
-- Eksik sütunları ekle

-- is_sensitive sütunu ekle
ALTER TABLE system_parameters 
ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN DEFAULT FALSE;

-- is_required sütunu ekle
ALTER TABLE system_parameters 
ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT FALSE;

-- validation_rules sütunu ekle
ALTER TABLE system_parameters 
ADD COLUMN IF NOT EXISTS validation_rules TEXT;

-- default_value sütunu ekle
ALTER TABLE system_parameters 
ADD COLUMN IF NOT EXISTS default_value TEXT;

-- min_value sütunu ekle
ALTER TABLE system_parameters 
ADD COLUMN IF NOT EXISTS min_value TEXT;

-- max_value sütunu ekle
ALTER TABLE system_parameters 
ADD COLUMN IF NOT EXISTS max_value TEXT;

-- options sütunu ekle
ALTER TABLE system_parameters 
ADD COLUMN IF NOT EXISTS options TEXT;

-- Mevcut parametreleri güncelle
UPDATE system_parameters 
SET is_sensitive = TRUE 
WHERE param_key IN ('jwt_secret', 'admin_password', 'database_password');

UPDATE system_parameters 
SET is_required = TRUE 
WHERE param_key IN ('app_name', 'app_version', 'default_currency');

-- Tablo yapısını kontrol et
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'system_parameters' 
ORDER BY ordinal_position;
