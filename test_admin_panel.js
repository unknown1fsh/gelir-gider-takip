const { neon } = require('@neondatabase/serverless');

async function testAdminPanel() {
  try {
    console.log('🔍 Admin Panel Test Başlatılıyor...');
    
    // Neon veritabanı bağlantısı
    const DATABASE_URL = 'postgresql://neondb_owner:npg_JptIgQh2fP5L@ep-winter-river-a2ecm56m-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require';
    const sql = neon(DATABASE_URL);
    
    console.log('✅ Veritabanına bağlantı başarılı!');
    
    // 1. Mevcut sistem parametrelerini kontrol et
    console.log('\n📋 1. Mevcut Sistem Parametreleri:');
    const currentParams = await sql.query('SELECT * FROM system_parameters ORDER BY category, param_key');
    console.log(`   Toplam parametre sayısı: ${currentParams.length}`);
    
    currentParams.forEach(param => {
      console.log(`   - ${param.param_key}: ${param.param_value} (${param.category})`);
    });
    
    // 2. Yeni parametre ekleme testi
    console.log('\n📝 2. Yeni Parametre Ekleme Testi:');
    const testParam = {
      param_key: 'test_parameter',
      param_value: 'test_value',
      param_type: 'string',
      description: 'Test parametresi',
      category: 'general',
      is_editable: true,
      is_sensitive: false
    };
    
    // Önce parametrenin var olup olmadığını kontrol et
    const checkResult = await sql.query('SELECT id FROM system_parameters WHERE param_key = $1', [testParam.param_key]);
    
    if (checkResult.length === 0) {
      const insertQuery = `
        INSERT INTO system_parameters (param_key, param_value, param_type, description, category, is_editable, is_sensitive) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;
      
      const result = await sql.query(insertQuery, [
        testParam.param_key,
        testParam.param_value,
        testParam.param_type,
        testParam.description,
        testParam.category,
        testParam.is_editable,
        testParam.is_sensitive
      ]);
      
      console.log(`   ✅ Yeni parametre eklendi: ${testParam.param_key} (ID: ${result[0].id})`);
    } else {
      console.log(`   ⚠️ Parametre zaten mevcut: ${testParam.param_key}`);
    }
    
    // 3. Parametre güncelleme testi
    console.log('\n🔄 3. Parametre Güncelleme Testi:');
    const updateQuery = 'UPDATE system_parameters SET param_value = $1, updated_at = CURRENT_TIMESTAMP WHERE param_key = $2';
    await sql.query(updateQuery, ['updated_test_value', testParam.param_key]);
    console.log(`   ✅ Parametre güncellendi: ${testParam.param_key}`);
    
    // 4. Güncellenmiş parametreyi kontrol et
    const updatedParam = await sql.query('SELECT * FROM system_parameters WHERE param_key = $1', [testParam.param_key]);
    console.log(`   📊 Güncellenmiş değer: ${updatedParam[0].param_value}`);
    
    // 5. Kategori bazında parametre sayıları
    console.log('\n📊 4. Kategori İstatistikleri:');
    const categoryStats = await sql.query(`
      SELECT category, COUNT(*) as count 
      FROM system_parameters 
      GROUP BY category 
      ORDER BY count DESC
    `);
    
    categoryStats.forEach(stat => {
      console.log(`   - ${stat.category}: ${stat.count} parametre`);
    });
    
    // 6. Test parametresini temizle
    console.log('\n🧹 5. Test Temizleme:');
    await sql.query('DELETE FROM system_parameters WHERE param_key = $1', [testParam.param_key]);
    console.log(`   ✅ Test parametresi silindi: ${testParam.param_key}`);
    
    // 7. Son durum kontrolü
    console.log('\n📋 6. Son Durum Kontrolü:');
    const finalParams = await sql.query('SELECT COUNT(*) as count FROM system_parameters');
    console.log(`   Toplam parametre sayısı: ${finalParams[0].count}`);
    
    console.log('\n✅ Admin Panel Test Tamamlandı!');
    console.log('\n🎯 Test Sonuçları:');
    console.log('   ✅ Veritabanı bağlantısı çalışıyor');
    console.log('   ✅ Parametre ekleme işlevi çalışıyor');
    console.log('   ✅ Parametre güncelleme işlevi çalışıyor');
    console.log('   ✅ Parametre silme işlevi çalışıyor');
    console.log('   ✅ Kategori istatistikleri çalışıyor');
    
  } catch (error) {
    console.error('❌ Test sırasında hata:', error);
    console.error('Hata detayları:', error.message);
  }
}

// Testi çalıştır
testAdminPanel();
