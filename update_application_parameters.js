const { neon } = require('@neondatabase/serverless');

async function updateApplicationParameters() {
  try {
    console.log('🔍 Uygulama parametreleri güncelleniyor...');
    
    // Neon veritabanı bağlantısı
    const DATABASE_URL = 'postgresql://neondb_owner:npg_JptIgQh2fP5L@ep-winter-river-a2ecm56m-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require';
    const sql = neon(DATABASE_URL);
    
    console.log('✅ Veritabanına bağlantı başarılı!');
    
    // Varsayılan uygulama parametreleri
    const defaultParameters = [
      {
        param_key: 'jwt_secret',
        param_value: 'your-super-secret-jwt-key-2024',
        param_type: 'string',
        description: 'JWT gizli anahtarı',
        category: 'security',
        is_editable: true,
        is_sensitive: true,
        is_required: true
      },
      {
        param_key: 'jwt_expires_in',
        param_value: '24h',
        param_type: 'string',
        description: 'JWT geçerlilik süresi',
        category: 'security',
        is_editable: true,
        is_sensitive: false,
        is_required: false
      },
      {
        param_key: 'bcrypt_rounds',
        param_value: '12',
        param_type: 'number',
        description: 'BCrypt hash turu',
        category: 'security',
        is_editable: true,
        is_sensitive: false,
        is_required: false
      },
      {
        param_key: 'password_min_length',
        param_value: '6',
        param_type: 'number',
        description: 'Minimum şifre uzunluğu',
        category: 'security',
        is_editable: true,
        is_sensitive: false,
        is_required: false
      },
      {
        param_key: 'max_login_attempts',
        param_value: '5',
        param_type: 'number',
        description: 'Maksimum giriş denemesi',
        category: 'security',
        is_editable: true,
        is_sensitive: false,
        is_required: false
      },
      {
        param_key: 'session_timeout',
        param_value: '3600',
        param_type: 'number',
        description: 'Oturum zaman aşımı (saniye)',
        category: 'security',
        is_editable: true,
        is_sensitive: false,
        is_required: false
      },
      {
        param_key: 'enable_email_notifications',
        param_value: 'false',
        param_type: 'boolean',
        description: 'E-posta bildirimlerini etkinleştir',
        category: 'notification',
        is_editable: true,
        is_sensitive: false,
        is_required: false
      },
      {
        param_key: 'enable_sms_notifications',
        param_value: 'false',
        param_type: 'boolean',
        description: 'SMS bildirimlerini etkinleştir',
        category: 'notification',
        is_editable: true,
        is_sensitive: false,
        is_required: false
      },
      {
        param_key: 'enable_auto_backup',
        param_value: 'false',
        param_type: 'boolean',
        description: 'Otomatik yedeklemeyi etkinleştir',
        category: 'backup',
        is_editable: true,
        is_sensitive: false,
        is_required: false
      },
      {
        param_key: 'backup_frequency',
        param_value: 'daily',
        param_type: 'string',
        description: 'Yedekleme sıklığı',
        category: 'backup',
        is_editable: true,
        is_sensitive: false,
        is_required: false
      },
      {
        param_key: 'enable_monitoring',
        param_value: 'true',
        param_type: 'boolean',
        description: 'Sistem izlemeyi etkinleştir',
        category: 'monitoring',
        is_editable: true,
        is_sensitive: false,
        is_required: false
      },
      {
        param_key: 'monitoring_interval',
        param_value: '60',
        param_type: 'number',
        description: 'İzleme aralığı (saniye)',
        category: 'monitoring',
        is_editable: true,
        is_sensitive: false,
        is_required: false
      },
      {
        param_key: 'ui_theme',
        param_value: 'light',
        param_type: 'string',
        description: 'Kullanıcı arayüzü teması',
        category: 'ui',
        is_editable: true,
        is_sensitive: false,
        is_required: false
      },
      {
        param_key: 'ui_language',
        param_value: 'tr',
        param_type: 'string',
        description: 'Kullanıcı arayüzü dili',
        category: 'ui',
        is_editable: true,
        is_sensitive: false,
        is_required: false
      },
      {
        param_key: 'timezone',
        param_value: 'Europe/Istanbul',
        param_type: 'string',
        description: 'Sistem zaman dilimi',
        category: 'datetime',
        is_editable: true,
        is_sensitive: false,
        is_required: false
      },
      {
        param_key: 'date_format',
        param_value: 'DD/MM/YYYY',
        param_type: 'string',
        description: 'Tarih formatı',
        category: 'datetime',
        is_editable: true,
        is_sensitive: false,
        is_required: false
      },
      {
        param_key: 'time_format',
        param_value: 'HH:mm:ss',
        param_type: 'string',
        description: 'Saat formatı',
        category: 'datetime',
        is_editable: true,
        is_sensitive: false,
        is_required: false
      }
    ];
    
    let addedCount = 0;
    let updatedCount = 0;
    const categories = new Map();
    
    for (const param of defaultParameters) {
      // Parametrenin var olup olmadığını kontrol et
      const checkResult = await sql.query('SELECT id FROM system_parameters WHERE param_key = $1', [param.param_key]);
      
      if (checkResult.length === 0) {
        // Yeni parametre ekle
        const insertQuery = `
          INSERT INTO system_parameters (param_key, param_value, param_type, description, category, is_editable, is_sensitive, is_required) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        await sql.query(insertQuery, [
          param.param_key,
          param.param_value,
          param.param_type,
          param.description,
          param.category,
          param.is_editable,
          param.is_sensitive,
          param.is_required
        ]);
        addedCount++;
        console.log(`   ✅ Yeni parametre eklendi: ${param.param_key}`);
      } else {
        // Mevcut parametreyi güncelle
        const updateQuery = `
          UPDATE system_parameters 
          SET param_value = $1, param_type = $2, description = $3, category = $4, is_editable = $5, is_sensitive = $6, is_required = $7, updated_at = CURRENT_TIMESTAMP 
          WHERE param_key = $8
        `;
        await sql.query(updateQuery, [
          param.param_value,
          param.param_type,
          param.description,
          param.category,
          param.is_editable,
          param.is_sensitive,
          param.is_required,
          param.param_key
        ]);
        updatedCount++;
        console.log(`   🔄 Parametre güncellendi: ${param.param_key}`);
      }
      
      // Kategori sayısını hesapla
      if (!categories.has(param.category)) {
        categories.set(param.category, 0);
      }
      categories.set(param.category, categories.get(param.category) + 1);
    }
    
    // Kategori istatistiklerini hazırla
    const categoryStats = Array.from(categories.entries()).map(([name, count]) => ({ name, count }));
    
    console.log('\n📊 Güncelleme Özeti:');
    console.log(`   ✅ Yeni eklenen: ${addedCount}`);
    console.log(`   🔄 Güncellenen: ${updatedCount}`);
    console.log(`   📋 Toplam: ${addedCount + updatedCount}`);
    console.log(`   📂 Kategoriler: ${categoryStats.map(c => `${c.name}(${c.count})`).join(', ')}`);
    
    // Son durum kontrolü
    console.log('\n📋 Son Durum Kontrolü:');
    const finalParams = await sql.query('SELECT COUNT(*) as count FROM system_parameters');
    console.log(`   Toplam parametre sayısı: ${finalParams[0].count}`);
    
    const categoryBreakdown = await sql.query(`
      SELECT category, COUNT(*) as count 
      FROM system_parameters 
      GROUP BY category 
      ORDER BY count DESC
    `);
    
    console.log('\n📊 Kategori Dağılımı:');
    categoryBreakdown.forEach(stat => {
      console.log(`   - ${stat.category}: ${stat.count} parametre`);
    });
    
    console.log('\n✅ Uygulama parametreleri başarıyla güncellendi!');
    
  } catch (error) {
    console.error('❌ Parametre güncelleme hatası:', error);
    console.error('Hata detayları:', error.message);
  }
}

// Parametreleri güncelle
updateApplicationParameters();
