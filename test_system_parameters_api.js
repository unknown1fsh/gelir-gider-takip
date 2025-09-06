// Node.js 18+ için fetch global olarak mevcut
// const fetch = require('node-fetch'); // Eski Node.js versiyonları için

async function testSystemParametersAPI() {
  console.log('🔍 Sistem Parametreleri API Testi Başlıyor...\n');

  try {
    // 1. Sistem parametrelerini getir
    console.log('📋 1. Sistem Parametreleri Getirme Testi:');
    const response = await fetch('http://localhost:5000/api/admin/system-parameters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        adminPassword: '12345'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Başarılı!');
      console.log('📊 Toplam parametre sayısı:', data.parameters ? data.parameters.length : 0);
      
      if (data.parameters && data.parameters.length > 0) {
        console.log('📝 İlk 5 parametre:');
        data.parameters.slice(0, 5).forEach((param, index) => {
          console.log(`   ${index + 1}. ${param.param_key} (${param.category}) = ${param.param_value}`);
        });
      } else {
        console.log('⚠️  Hiç parametre bulunamadı!');
      }
    } else {
      const error = await response.json();
      console.log('❌ Hata:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. Sistem konfigürasyonu getir
    console.log('📋 2. Sistem Konfigürasyonu Getirme Testi:');
    const configResponse = await fetch('http://localhost:5000/api/admin/system-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        adminPassword: '12345'
      })
    });

    if (configResponse.ok) {
      const configData = await configResponse.json();
      console.log('✅ Başarılı!');
      console.log('📊 Konfigürasyon kategorileri:', Object.keys(configData.config || {}));
    } else {
      const error = await configResponse.json();
      console.log('❌ Hata:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 3. Uygulama parametrelerini güncelle
    console.log('📋 3. Uygulama Parametrelerini Güncelleme Testi:');
    const updateResponse = await fetch('http://localhost:5000/api/admin/update-application-parameters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        adminPassword: '12345'
      })
    });

    if (updateResponse.ok) {
      const updateData = await updateResponse.json();
      console.log('✅ Başarılı!');
      console.log('📊 Özet:', updateData.summary);
    } else {
      const error = await updateResponse.json();
      console.log('❌ Hata:', error.message);
    }

  } catch (error) {
    console.error('❌ Test sırasında hata oluştu:', error.message);
  }
}

testSystemParametersAPI();
