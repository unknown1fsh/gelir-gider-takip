const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

// Uygulamada kullanılan tüm parametreler
const applicationParameters = [
  // ==================== UYGULAMA KONFİGÜRASYONU ====================
  { param_key: 'app_name', param_value: 'Gelir Gider Takip', param_type: 'string', description: 'Uygulama adı', category: 'application', is_required: true },
  { param_key: 'app_version', param_value: '1.0.0', param_type: 'string', description: 'Uygulama versiyonu', category: 'application' },
  { param_key: 'app_description', param_value: 'Kişisel gelir gider takip uygulaması', param_type: 'string', description: 'Uygulama açıklaması', category: 'application' },
  { param_key: 'app_author', param_value: 'Admin', param_type: 'string', description: 'Uygulama geliştiricisi', category: 'application' },
  { param_key: 'app_contact_email', param_value: 'admin@gelirgidertakip.com', param_type: 'string', description: 'İletişim e-posta adresi', category: 'application' },
  
  // ==================== LOKALİZASYON VE DİL ====================
  { param_key: 'default_language', param_value: 'tr', param_type: 'string', description: 'Varsayılan dil', category: 'localization', is_required: true },
  { param_key: 'default_locale', param_value: 'tr-TR', param_type: 'string', description: 'Varsayılan locale', category: 'localization', is_required: true },
  { param_key: 'timezone', param_value: 'Europe/Istanbul', param_type: 'string', description: 'Varsayılan zaman dilimi', category: 'localization', is_required: true },
  { param_key: 'date_format', param_value: 'DD/MM/YYYY', param_type: 'string', description: 'Tarih formatı', category: 'localization', options: 'DD/MM/YYYY,MM/DD/YYYY,YYYY-MM-DD' },
  { param_key: 'time_format', param_value: 'HH:mm:ss', param_type: 'string', description: 'Saat formatı', category: 'localization', options: 'HH:mm:ss,hh:mm:ss A,HH:mm' },
  { param_key: 'week_start', param_value: 'monday', param_type: 'string', description: 'Haftanın başlangıç günü', category: 'localization', options: 'monday,sunday' },
  
  // ==================== FİNANSAL AYARLAR ====================
  { param_key: 'default_currency', param_value: 'TRY', param_type: 'string', description: 'Varsayılan para birimi', category: 'financial', is_required: true },
  { param_key: 'currency_symbol', param_value: '₺', param_type: 'string', description: 'Para birimi sembolü', category: 'financial' },
  { param_key: 'decimal_places', param_value: '2', param_type: 'number', description: 'Ondalık basamak sayısı', category: 'financial', min_value: '0', max_value: '4' },
  { param_key: 'thousand_separator', param_value: '.', param_type: 'string', description: 'Binlik ayırıcı', category: 'financial', options: '.,' },
  { param_key: 'decimal_separator', param_value: ',', param_type: 'string', description: 'Ondalık ayırıcı', category: 'financial', options: '.,' },
  { param_key: 'currency_position', param_value: 'after', param_type: 'string', description: 'Para birimi pozisyonu', category: 'financial', options: 'before,after' },
  
  // ==================== SAYFALAMA AYARLARI ====================
  { param_key: 'default_page_size', param_value: '10', param_type: 'number', description: 'Varsayılan sayfa boyutu', category: 'pagination', min_value: '5', max_value: '50' },
  { param_key: 'max_page_size', param_value: '100', param_type: 'number', description: 'Maksimum sayfa boyutu', category: 'pagination', min_value: '50', max_value: '500' },
  { param_key: 'page_size_options', param_value: '5,10,25,50,100', param_type: 'string', description: 'Sayfa boyutu seçenekleri', category: 'pagination' },
  
  // ==================== API KONFİGÜRASYONU ====================
  { param_key: 'api_base_url_dev', param_value: 'http://localhost:5000/api', param_type: 'string', description: 'Geliştirme ortamı API URL', category: 'api' },
  { param_key: 'api_base_url_prod', param_value: '/api', param_type: 'string', description: 'Üretim ortamı API URL', category: 'api' },
  { param_key: 'api_timeout', param_value: '30000', param_type: 'number', description: 'API zaman aşımı (ms)', category: 'api', min_value: '5000', max_value: '60000' },
  { param_key: 'api_retry_attempts', param_value: '3', param_type: 'number', description: 'API yeniden deneme sayısı', category: 'api', min_value: '1', max_value: '10' },
  
  // ==================== GÜVENLİK AYARLARI ====================
  { param_key: 'jwt_secret', param_value: 'your-super-secret-jwt-key-2024', param_type: 'string', description: 'JWT gizli anahtarı', category: 'security', is_sensitive: true, is_required: true },
  { param_key: 'jwt_expires_in', param_value: '7d', param_type: 'string', description: 'JWT geçerlilik süresi', category: 'security', options: '1h,24h,7d,30d' },
  { param_key: 'bcrypt_rounds', param_value: '12', param_type: 'number', description: 'Bcrypt hash turu', category: 'security', min_value: '8', max_value: '16' },
  { param_key: 'password_min_length', param_value: '8', param_type: 'number', description: 'Minimum şifre uzunluğu', category: 'security', min_value: '6', max_value: '20' },
  { param_key: 'password_require_uppercase', param_value: 'true', param_type: 'boolean', description: 'Şifre büyük harf gerektirir', category: 'security' },
  { param_key: 'password_require_lowercase', param_value: 'true', param_type: 'boolean', description: 'Şifre küçük harf gerektirir', category: 'security' },
  { param_key: 'password_require_numbers', param_value: 'true', param_type: 'boolean', description: 'Şifre rakam gerektirir', category: 'security' },
  { param_key: 'password_require_symbols', param_value: 'false', param_type: 'boolean', description: 'Şifre sembol gerektirir', category: 'security' },
  { param_key: 'max_login_attempts', param_value: '5', param_type: 'number', description: 'Maksimum giriş denemesi', category: 'security', min_value: '3', max_value: '10' },
  { param_key: 'lockout_duration', param_value: '15', param_type: 'number', description: 'Hesap kilitleme süresi (dakika)', category: 'security', min_value: '5', max_value: '60' },
  { param_key: 'session_timeout', param_value: '3600', param_type: 'number', description: 'Oturum zaman aşımı (saniye)', category: 'security', min_value: '300', max_value: '86400' },
  { param_key: 'admin_password', param_value: '12345', param_type: 'string', description: 'Admin panel şifresi', category: 'security', is_sensitive: true, is_required: true },
  
  // ==================== VERİTABANI AYARLARI ====================
  { param_key: 'db_host', param_value: 'localhost', param_type: 'string', description: 'Veritabanı sunucu adresi', category: 'database' },
  { param_key: 'db_port', param_value: '5432', param_type: 'number', description: 'Veritabanı port numarası', category: 'database', min_value: '1024', max_value: '65535' },
  { param_key: 'db_name', param_value: 'gelir_gider_takip', param_type: 'string', description: 'Veritabanı adı', category: 'database' },
  { param_key: 'db_user', param_value: 'postgres', param_type: 'string', description: 'Veritabanı kullanıcı adı', category: 'database' },
  { param_key: 'db_connection_pool_size', param_value: '10', param_type: 'number', description: 'Veritabanı bağlantı havuzu boyutu', category: 'database', min_value: '5', max_value: '50' },
  { param_key: 'db_max_connections', param_value: '100', param_type: 'number', description: 'Maksimum veritabanı bağlantısı', category: 'database', min_value: '10', max_value: '200' },
  { param_key: 'db_timeout', param_value: '30000', param_type: 'number', description: 'Veritabanı zaman aşımı (ms)', category: 'database', min_value: '5000', max_value: '60000' },
  { param_key: 'db_ssl_mode', param_value: 'require', param_type: 'string', description: 'Veritabanı SSL modu', category: 'database', options: 'disable,require,verify-ca,verify-full' },
  
  // ==================== E-POSTA AYARLARI ====================
  { param_key: 'smtp_host', param_value: '', param_type: 'string', description: 'SMTP sunucu adresi', category: 'email' },
  { param_key: 'smtp_port', param_value: '587', param_type: 'number', description: 'SMTP port numarası', category: 'email', min_value: '25', max_value: '587' },
  { param_key: 'smtp_secure', param_value: 'true', param_type: 'boolean', description: 'SMTP güvenli bağlantı', category: 'email' },
  { param_key: 'smtp_user', param_value: '', param_type: 'string', description: 'SMTP kullanıcı adı', category: 'email' },
  { param_key: 'smtp_password', param_value: '', param_type: 'string', description: 'SMTP şifresi', category: 'email', is_sensitive: true },
  { param_key: 'smtp_from_address', param_value: '', param_type: 'string', description: 'Gönderen e-posta adresi', category: 'email' },
  { param_key: 'smtp_from_name', param_value: '', param_type: 'string', description: 'Gönderen adı', category: 'email' },
  { param_key: 'enable_email_notifications', param_value: 'false', param_type: 'boolean', description: 'E-posta bildirimlerini etkinleştir', category: 'email' },
  
  // ==================== KULLANICI ARAYÜZÜ AYARLARI ====================
  { param_key: 'ui_theme', param_value: 'light', param_type: 'string', description: 'Kullanıcı arayüzü teması', category: 'ui', options: 'light,dark,auto' },
  { param_key: 'ui_primary_color', param_value: '#007bff', param_type: 'string', description: 'Ana renk', category: 'ui' },
  { param_key: 'ui_secondary_color', param_value: '#6c757d', param_type: 'string', description: 'İkincil renk', category: 'ui' },
  { param_key: 'ui_accent_color', param_value: '#28a745', param_type: 'string', description: 'Vurgu rengi', category: 'ui' },
  { param_key: 'ui_font_family', param_value: 'Inter', param_type: 'string', description: 'Font ailesi', category: 'ui' },
  { param_key: 'ui_font_size', param_value: '14px', param_type: 'string', description: 'Font boyutu', category: 'ui' },
  { param_key: 'ui_enable_animations', param_value: 'true', param_type: 'boolean', description: 'Animasyonları etkinleştir', category: 'ui' },
  { param_key: 'ui_enable_tooltips', param_value: 'true', param_type: 'boolean', description: 'Tooltip\'leri etkinleştir', category: 'ui' },
  { param_key: 'ui_sidebar_position', param_value: 'left', param_type: 'string', description: 'Kenar çubuğu pozisyonu', category: 'ui', options: 'left,right' },
  { param_key: 'ui_sidebar_width', param_value: '250', param_type: 'number', description: 'Kenar çubuğu genişliği (px)', category: 'ui', min_value: '200', max_value: '400' },
  { param_key: 'ui_enable_breadcrumbs', param_value: 'true', param_type: 'boolean', description: 'Breadcrumb\'ları etkinleştir', category: 'ui' },
  { param_key: 'ui_enable_search', param_value: 'true', param_type: 'boolean', description: 'Arama özelliğini etkinleştir', category: 'ui' },
  
  // ==================== İZLEME AYARLARI ====================
  { param_key: 'monitoring_enabled', param_value: 'true', param_type: 'boolean', description: 'Sistem izlemeyi etkinleştir', category: 'monitoring' },
  { param_key: 'monitoring_interval', param_value: '60', param_type: 'number', description: 'İzleme aralığı (saniye)', category: 'monitoring', min_value: '30', max_value: '300' },
  { param_key: 'alert_cpu_threshold', param_value: '80', param_type: 'number', description: 'CPU kullanım uyarı eşiği (%)', category: 'monitoring', min_value: '50', max_value: '95' },
  { param_key: 'alert_memory_threshold', param_value: '85', param_type: 'number', description: 'Bellek kullanım uyarı eşiği (%)', category: 'monitoring', min_value: '50', max_value: '95' },
  { param_key: 'alert_disk_threshold', param_value: '90', param_type: 'number', description: 'Disk kullanım uyarı eşiği (%)', category: 'monitoring', min_value: '50', max_value: '95' },
  { param_key: 'alert_response_time_threshold', param_value: '5000', param_type: 'number', description: 'Yanıt süresi uyarı eşiği (ms)', category: 'monitoring', min_value: '1000', max_value: '10000' },
  { param_key: 'alert_error_rate_threshold', param_value: '5', param_type: 'number', description: 'Hata oranı uyarı eşiği (%)', category: 'monitoring', min_value: '1', max_value: '20' },
  
  // ==================== YEDEKLEME AYARLARI ====================
  { param_key: 'backup_enabled', param_value: 'false', param_type: 'boolean', description: 'Otomatik yedeklemeyi etkinleştir', category: 'backup' },
  { param_key: 'backup_frequency', param_value: 'daily', param_type: 'string', description: 'Yedekleme sıklığı', category: 'backup', options: 'hourly,daily,weekly,monthly' },
  { param_key: 'backup_retention', param_value: '30', param_type: 'number', description: 'Yedekleme saklama süresi (gün)', category: 'backup', min_value: '7', max_value: '365' },
  { param_key: 'backup_compression', param_value: 'true', param_type: 'boolean', description: 'Yedekleme sıkıştırması', category: 'backup' },
  { param_key: 'backup_encryption', param_value: 'false', param_type: 'boolean', description: 'Yedekleme şifrelemesi', category: 'backup' },
  
  // ==================== BİLDİRİM AYARLARI ====================
  { param_key: 'notification_email_enabled', param_value: 'false', param_type: 'boolean', description: 'E-posta bildirimlerini etkinleştir', category: 'notification' },
  { param_key: 'notification_sms_enabled', param_value: 'false', param_type: 'boolean', description: 'SMS bildirimlerini etkinleştir', category: 'notification' },
  { param_key: 'notification_push_enabled', param_value: 'false', param_type: 'boolean', description: 'Push bildirimlerini etkinleştir', category: 'notification' },
  { param_key: 'notification_webhook_enabled', param_value: 'false', param_type: 'boolean', description: 'Webhook bildirimlerini etkinleştir', category: 'notification' },
  { param_key: 'notification_webhook_url', param_value: '', param_type: 'string', description: 'Webhook URL', category: 'notification' },
  { param_key: 'notification_user_registration', param_value: 'true', param_type: 'boolean', description: 'Kullanıcı kaydı bildirimi', category: 'notification' },
  { param_key: 'notification_password_reset', param_value: 'true', param_type: 'boolean', description: 'Şifre sıfırlama bildirimi', category: 'notification' },
  { param_key: 'notification_account_locked', param_value: 'true', param_type: 'boolean', description: 'Hesap kilitleme bildirimi', category: 'notification' },
  { param_key: 'notification_unusual_activity', param_value: 'true', param_type: 'boolean', description: 'Olağandışı aktivite bildirimi', category: 'notification' },
  { param_key: 'notification_system_alerts', param_value: 'true', param_type: 'boolean', description: 'Sistem uyarı bildirimi', category: 'notification' },
  
  // ==================== UYGULAMA ÖZEL AYARLARI ====================
  { param_key: 'enable_automatic_payments', param_value: 'true', param_type: 'boolean', description: 'Otomatik ödemeleri etkinleştir', category: 'app_features' },
  { param_key: 'enable_loan_tracking', param_value: 'true', param_type: 'boolean', description: 'Kredi takibini etkinleştir', category: 'app_features' },
  { param_key: 'enable_expense_categories', param_value: 'true', param_type: 'boolean', description: 'Gider kategorilerini etkinleştir', category: 'app_features' },
  { param_key: 'enable_income_sources', param_value: 'true', param_type: 'boolean', description: 'Gelir kaynaklarını etkinleştir', category: 'app_features' },
  { param_key: 'enable_credit_cards', param_value: 'true', param_type: 'boolean', description: 'Kredi kartı yönetimini etkinleştir', category: 'app_features' },
  { param_key: 'enable_bank_accounts', param_value: 'true', param_type: 'boolean', description: 'Banka hesabı yönetimini etkinleştir', category: 'app_features' },
  { param_key: 'enable_analytics', param_value: 'true', param_type: 'boolean', description: 'Analitik özelliklerini etkinleştir', category: 'app_features' },
  { param_key: 'enable_reports', param_value: 'true', param_type: 'boolean', description: 'Rapor özelliklerini etkinleştir', category: 'app_features' },
  { param_key: 'enable_export_import', param_value: 'true', param_type: 'boolean', description: 'Dışa/İçe aktarma özelliklerini etkinleştir', category: 'app_features' },
  { param_key: 'enable_user_profiles', param_value: 'true', param_type: 'boolean', description: 'Kullanıcı profil özelliklerini etkinleştir', category: 'app_features' },
  
  // ==================== PERFORMANS AYARLARI ====================
  { param_key: 'cache_enabled', param_value: 'true', param_type: 'boolean', description: 'Önbelleği etkinleştir', category: 'performance' },
  { param_key: 'cache_ttl', param_value: '3600', param_type: 'number', description: 'Önbellek yaşam süresi (saniye)', category: 'performance', min_value: '300', max_value: '86400' },
  { param_key: 'rate_limiting_enabled', param_value: 'true', param_type: 'boolean', description: 'Hız sınırlamasını etkinleştir', category: 'performance' },
  { param_key: 'rate_limit_window', param_value: '900', param_type: 'number', description: 'Hız sınırı penceresi (saniye)', category: 'performance', min_value: '60', max_value: '3600' },
  { param_key: 'rate_limit_max_requests', param_value: '100', param_type: 'number', description: 'Maksimum istek sayısı', category: 'performance', min_value: '10', max_value: '1000' },
  
  // ==================== LOGLAMA AYARLARI ====================
  { param_key: 'logging_enabled', param_value: 'true', param_type: 'boolean', description: 'Loglamayı etkinleştir', category: 'logging' },
  { param_key: 'log_level', param_value: 'info', param_type: 'string', description: 'Log seviyesi', category: 'logging', options: 'error,warn,info,debug' },
  { param_key: 'log_retention', param_value: '90', param_type: 'number', description: 'Log saklama süresi (gün)', category: 'logging', min_value: '7', max_value: '365' },
  { param_key: 'log_file_path', param_value: './logs', param_type: 'string', description: 'Log dosya yolu', category: 'logging' },
  { param_key: 'enable_audit_log', param_value: 'true', param_type: 'boolean', description: 'Denetim logunu etkinleştir', category: 'logging' }
];

async function updateSystemParameters() {
  try {
    console.log('🔄 Sistem parametreleri güncelleniyor...\n');

    let addedCount = 0;
    let updatedCount = 0;

    for (const param of applicationParameters) {
      try {
        // Parametrenin var olup olmadığını kontrol et
        const checkQuery = 'SELECT id, param_value FROM system_parameters WHERE param_key = $1';
        const checkResult = await sql.query(checkQuery, [param.param_key]);
        
        if (checkResult.length === 0) {
          // Yeni parametre ekle
          const insertQuery = `
            INSERT INTO system_parameters (
              param_key, param_value, param_type, description, category, 
              is_editable, is_sensitive, validation_rules, default_value, 
              min_value, max_value, options, is_required
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `;
          
          await sql.query(insertQuery, [
            param.param_key, 
            param.param_value, 
            param.param_type, 
            param.description, 
            param.category,
            param.is_editable !== undefined ? param.is_editable : true,
            param.is_sensitive !== undefined ? param.is_sensitive : false,
            param.validation_rules || null,
            param.default_value || param.param_value,
            param.min_value || null,
            param.max_value || null,
            param.options || null,
            param.is_required !== undefined ? param.is_required : false
          ]);
          
          console.log(`✅ Yeni parametre eklendi: ${param.param_key}`);
          addedCount++;
        } else {
          // Mevcut parametreyi güncelle (sadece değer değişmişse)
          const existingParam = checkResult[0];
          if (existingParam.param_value !== param.param_value) {
            const updateQuery = 'UPDATE system_parameters SET param_value = $1, updated_at = CURRENT_TIMESTAMP WHERE param_key = $2';
            await sql.query(updateQuery, [param.param_value, param.param_key]);
            console.log(`🔄 Parametre güncellendi: ${param.param_key} (${existingParam.param_value} → ${param.param_value})`);
            updatedCount++;
          } else {
            console.log(`⏭️ Parametre zaten güncel: ${param.param_key}`);
          }
        }
      } catch (error) {
        console.error(`❌ Parametre işleme hatası (${param.param_key}):`, error.message);
      }
    }

    console.log(`\n📊 Özet:`);
    console.log(`  ✅ Yeni eklenen: ${addedCount}`);
    console.log(`  🔄 Güncellenen: ${updatedCount}`);
    console.log(`  📋 Toplam işlenen: ${applicationParameters.length}`);

    // Kategorilere göre özet
    const categories = [...new Set(applicationParameters.map(p => p.category))];
    console.log(`\n📂 Kategoriler:`);
    categories.forEach(category => {
      const count = applicationParameters.filter(p => p.category === category).length;
      console.log(`  - ${category}: ${count} parametre`);
    });

  } catch (error) {
    console.error('❌ Sistem parametreleri güncelleme hatası:', error);
  }
}

updateSystemParameters();
