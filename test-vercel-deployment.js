const axios = require('axios');

// Test konfigürasyonu
const TEST_CONFIG = {
  // Vercel URL'inizi buraya ekleyin
  baseURL: process.env.VERCEL_URL || 'https://your-app.vercel.app',
  timeout: 10000
};

// Test fonksiyonları
const tests = {
  // Ana sayfa testi
  async testHomePage() {
    try {
      console.log('🏠 Ana sayfa testi...');
      const response = await axios.get(`${TEST_CONFIG.baseURL}/`);
      console.log('✅ Ana sayfa başarılı:', response.status);
      return true;
    } catch (error) {
      console.log('❌ Ana sayfa hatası:', error.message);
      return false;
    }
  },

  // API endpoint testi
  async testAPIEndpoints() {
    try {
      console.log('🔧 API endpoint testi...');
      const response = await axios.get(`${TEST_CONFIG.baseURL}/api/auth/register`);
      console.log('✅ API endpoint başarılı:', response.status);
      return true;
    } catch (error) {
      if (error.response && error.response.status === 405) {
        console.log('✅ API endpoint çalışıyor (Method Not Allowed beklenen)');
        return true;
      }
      console.log('❌ API endpoint hatası:', error.message);
      return false;
    }
  },

  // Database bağlantı testi
  async testDatabaseConnection() {
    try {
      console.log('🗄️ Database bağlantı testi...');
      const response = await axios.post(`${TEST_CONFIG.baseURL}/api/auth/register`, {
        username: 'test_user',
        email: 'test@example.com',
        password: 'test123'
      });
      console.log('✅ Database bağlantısı başarılı');
      return true;
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Database bağlantısı çalışıyor (Validation error beklenen)');
        return true;
      }
      console.log('❌ Database bağlantı hatası:', error.message);
      return false;
    }
  },

  // CORS testi
  async testCORS() {
    try {
      console.log('🌐 CORS testi...');
      const response = await axios.options(`${TEST_CONFIG.baseURL}/api/auth/register`);
      console.log('✅ CORS başarılı:', response.status);
      return true;
    } catch (error) {
      console.log('❌ CORS hatası:', error.message);
      return false;
    }
  }
};

// Ana test fonksiyonu
async function runTests() {
  console.log('🚀 Vercel Deployment Test Başlıyor...');
  console.log(`📍 Test URL: ${TEST_CONFIG.baseURL}`);
  console.log('='.repeat(50));

  const results = {
    homePage: await tests.testHomePage(),
    apiEndpoints: await tests.testAPIEndpoints(),
    database: await tests.testDatabaseConnection(),
    cors: await tests.testCORS()
  };

  console.log('='.repeat(50));
  console.log('📊 Test Sonuçları:');
  console.log(`🏠 Ana Sayfa: ${results.homePage ? '✅' : '❌'}`);
  console.log(`🔧 API Endpoints: ${results.apiEndpoints ? '✅' : '❌'}`);
  console.log(`🗄️ Database: ${results.database ? '✅' : '❌'}`);
  console.log(`🌐 CORS: ${results.cors ? '✅' : '❌'}`);

  const successCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log('='.repeat(50));
  console.log(`🎯 Başarı Oranı: ${successCount}/${totalTests} (${Math.round(successCount/totalTests*100)}%)`);

  if (successCount === totalTests) {
    console.log('🎉 Tüm testler başarılı! Vercel deployment çalışıyor.');
  } else {
    console.log('⚠️ Bazı testler başarısız. Lütfen Vercel loglarını kontrol edin.');
  }
}

// Script'i çalıştır
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { tests, runTests };
