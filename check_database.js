const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function checkDatabase() {
  try {
    console.log('🔍 Veritabanı tabloları kontrol ediliyor...\n');

    // Tüm tabloları listele
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    const tables = await sql.query(tablesQuery);
    
    console.log('📋 Mevcut Tablolar:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    console.log('\n📊 Tablo Detayları:\n');

    // Her tablo için sütun bilgilerini al
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`🔸 ${tableName.toUpperCase()} TABLOSU:`);
      
      // Sütun bilgileri
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `;
      const columns = await sql.query(columnsQuery, [tableName]);
      
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''} ${col.column_default ? `DEFAULT: ${col.column_default}` : ''}`);
      });

      // Kayıt sayısı
      const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
      const countResult = await sql.query(countQuery);
      console.log(`  📈 Kayıt sayısı: ${countResult[0].count}`);
      
      // İlk birkaç kayıt
      if (countResult[0].count > 0) {
        const sampleQuery = `SELECT * FROM ${tableName} LIMIT 3`;
        const sampleData = await sql.query(sampleQuery);
        console.log(`  📝 Örnek veriler:`);
        sampleData.forEach((row, index) => {
          console.log(`    ${index + 1}. ${JSON.stringify(row)}`);
        });
      }
      
      console.log('');
    }

    // Sistem parametrelerini kontrol et
    console.log('⚙️ SİSTEM PARAMETRELERİ:');
    const systemParamsQuery = 'SELECT * FROM system_parameters ORDER BY category, param_key';
    const systemParams = await sql.query(systemParamsQuery);
    
    if (systemParams.length > 0) {
      const categories = [...new Set(systemParams.map(p => p.category))];
      categories.forEach(category => {
        console.log(`\n📂 ${category.toUpperCase()} Kategorisi:`);
        systemParams
          .filter(p => p.category === category)
          .forEach(param => {
            console.log(`  - ${param.param_key}: ${param.param_value} (${param.param_type})`);
          });
      });
    } else {
      console.log('  ❌ Sistem parametreleri bulunamadı');
    }

  } catch (error) {
    console.error('❌ Veritabanı kontrol hatası:', error);
  }
}

checkDatabase();
