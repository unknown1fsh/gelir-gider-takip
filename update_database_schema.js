const { neon } = require('@neondatabase/serverless');

async function updateDatabaseSchema() {
  try {
    console.log('🔍 Veritabanı şeması güncelleniyor...');
    
    // Neon veritabanı bağlantısı
    const DATABASE_URL = 'postgresql://neondb_owner:npg_JptIgQh2fP5L@ep-winter-river-a2ecm56m-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require';
    const sql = neon(DATABASE_URL);
    
    console.log('✅ Veritabanına bağlantı başarılı!');
    
    // Sütunları ekle
    const alterQueries = [
      'ALTER TABLE system_parameters ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN DEFAULT FALSE',
      'ALTER TABLE system_parameters ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT FALSE',
      'ALTER TABLE system_parameters ADD COLUMN IF NOT EXISTS validation_rules TEXT',
      'ALTER TABLE system_parameters ADD COLUMN IF NOT EXISTS default_value TEXT',
      'ALTER TABLE system_parameters ADD COLUMN IF NOT EXISTS min_value TEXT',
      'ALTER TABLE system_parameters ADD COLUMN IF NOT EXISTS max_value TEXT',
      'ALTER TABLE system_parameters ADD COLUMN IF NOT EXISTS options TEXT'
    ];
    
    for (const query of alterQueries) {
      await sql.query(query);
      console.log(`   ✅ Sütun eklendi: ${query.split(' ')[5]}`);
    }
    
    // Mevcut parametreleri güncelle
    const updateQueries = [
      "UPDATE system_parameters SET is_sensitive = TRUE WHERE param_key IN ('jwt_secret', 'admin_password', 'database_password')",
      "UPDATE system_parameters SET is_required = TRUE WHERE param_key IN ('app_name', 'app_version', 'default_currency')"
    ];
    
    for (const query of updateQueries) {
      await sql.query(query);
      console.log(`   ✅ Güncelleme yapıldı: ${query.split(' ')[3]}`);
    }
    
    // Tablo yapısını kontrol et
    console.log('\n📋 Güncellenmiş tablo yapısı:');
    const columns = await sql.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'system_parameters' 
      ORDER BY ordinal_position
    `);
    
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
    });
    
    // Mevcut parametreleri listele
    console.log('\n📊 Mevcut parametreler:');
    const params = await sql.query('SELECT * FROM system_parameters ORDER BY category, param_key');
    params.forEach(param => {
      console.log(`   - ${param.param_key}: ${param.param_value} (${param.category}) - Zorunlu: ${param.is_required}, Hassas: ${param.is_sensitive}`);
    });
    
    console.log('\n✅ Veritabanı şeması başarıyla güncellendi!');
    
  } catch (error) {
    console.error('❌ Şema güncelleme hatası:', error);
    console.error('Hata detayları:', error.message);
  }
}

// Şemayı güncelle
updateDatabaseSchema();
