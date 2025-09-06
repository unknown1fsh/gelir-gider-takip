const { neon } = require('@neondatabase/serverless');

async function checkNeonDatabase() {
  try {
    console.log('🔍 Neon veritabanına bağlanılıyor...');
    
    // Neon veritabanı bağlantısı - doğrudan URL kullan
    const DATABASE_URL = 'postgresql://neondb_owner:npg_JptIgQh2fP5L@ep-winter-river-a2ecm56m-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require';
    const sql = neon(DATABASE_URL);
    
    console.log('✅ Veritabanına bağlantı başarılı!');
    
    // Tüm tabloları listele
    console.log('\n📋 Mevcut tablolar:');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    const tables = await sql.query(tablesQuery);
    
    if (tables.length === 0) {
      console.log('❌ Hiç tablo bulunamadı!');
      return;
    }
    
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });
    
    // Her tablo için veri sayısını ve örnek verileri göster
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`\n📊 Tablo: ${tableName}`);
      
      // Tablo yapısını göster
      const structureQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position;
      `;
      const structure = await sql.query(structureQuery, [tableName]);
      
      console.log('   Yapı:');
      structure.forEach(col => {
        console.log(`     - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
      });
      
      // Veri sayısını göster
      const countQuery = `SELECT COUNT(*) as count FROM "${tableName}";`;
      const countResult = await sql.query(countQuery);
      const rowCount = countResult[0].count;
      console.log(`   📈 Toplam kayıt sayısı: ${rowCount}`);
      
      // İlk 5 kaydı göster
      if (rowCount > 0) {
        const sampleQuery = `SELECT * FROM "${tableName}" LIMIT 5;`;
        const sampleData = await sql.query(sampleQuery);
        
        console.log('   📝 Örnek veriler:');
        sampleData.forEach((row, index) => {
          console.log(`     ${index + 1}. ${JSON.stringify(row, null, 2)}`);
        });
        
        if (rowCount > 5) {
          console.log(`     ... ve ${rowCount - 5} kayıt daha`);
        }
      }
    }
    
    // Özel tablolar için detaylı bilgi
    console.log('\n🔍 Özel tablo kontrolleri:');
    
    // Users tablosu kontrolü
    if (tables.some(t => t.table_name === 'users')) {
      console.log('\n👥 Users tablosu:');
      const users = await sql.query('SELECT id, username, email, created_at FROM users LIMIT 10;');
      users.forEach(user => {
        console.log(`   - ID: ${user.id}, Kullanıcı: ${user.username}, Email: ${user.email}, Oluşturulma: ${user.created_at}`);
      });
    }
    
         // Expenses tablosu kontrolü
     if (tables.some(t => t.table_name === 'expenses')) {
       console.log('\n💰 Expenses tablosu:');
       const expenses = await sql.query('SELECT id, user_id, title, amount, category_id, description, payment_date FROM expenses LIMIT 10;');
       expenses.forEach(expense => {
         console.log(`   - ID: ${expense.id}, Kullanıcı: ${expense.user_id}, Başlık: ${expense.title}, Tutar: ${expense.amount}, Kategori ID: ${expense.category_id}, Açıklama: ${expense.description}, Ödeme Tarihi: ${expense.payment_date}`);
       });
     }
     
     // Incomes tablosu kontrolü
     if (tables.some(t => t.table_name === 'incomes')) {
       console.log('\n💵 Incomes tablosu:');
       const incomes = await sql.query('SELECT id, user_id, title, amount, source, description, income_date FROM incomes LIMIT 10;');
       incomes.forEach(income => {
         console.log(`   - ID: ${income.id}, Kullanıcı: ${income.user_id}, Başlık: ${income.title}, Tutar: ${income.amount}, Kaynak: ${income.source}, Açıklama: ${income.description}, Gelir Tarihi: ${income.income_date}`);
       });
     }
    
    console.log('\n✅ Veritabanı kontrolü tamamlandı!');
    
  } catch (error) {
    console.error('❌ Veritabanı kontrolü sırasında hata:', error);
    console.error('Hata detayları:', error.message);
  }
}

// Scripti çalıştır
checkNeonDatabase();
