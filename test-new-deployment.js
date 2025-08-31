const axios = require('axios');

const VERCEL_URL = 'https://gelir-gider-takip-35w92zrdk-unknown1fshs-projects.vercel.app';

async function testNewDeployment() {
  try {
    console.log('🔍 Yeni deployment test başlıyor...');
    console.log('🌐 URL:', VERCEL_URL);
    
    // 1. Ana sayfa testi
    console.log('\n1️⃣ Ana sayfa testi...');
    try {
      const homeResponse = await axios.get(VERCEL_URL);
      console.log('✅ Ana sayfa yüklendi, Status:', homeResponse.status);
      console.log('📄 Content-Type:', homeResponse.headers['content-type']);
    } catch (error) {
      console.log('❌ Ana sayfa hatası:', error.response?.status, error.response?.statusText);
    }
    
    // 2. Login API testi
    console.log('\n2️⃣ Login API testi...');
    try {
      const loginResponse = await axios.post(`${VERCEL_URL}/api/auth/login`, {
        username: 'test142',
        password: '123456'
      });
      console.log('✅ Login başarılı!');
      console.log('🎫 Token:', loginResponse.data.token ? 'Mevcut' : 'Yok');
      console.log('👤 User:', loginResponse.data.user?.username);
    } catch (error) {
      console.log('❌ Login hatası:', error.response?.status, error.response?.statusText);
      if (error.response?.data) {
        console.log('📝 Hata detayı:', typeof error.response.data === 'string' ? error.response.data.substring(0, 200) + '...' : error.response.data);
      }
    }
    
    // 3. Manifest testi
    console.log('\n3️⃣ Manifest testi...');
    try {
      const manifestResponse = await axios.get(`${VERCEL_URL}/manifest.json`);
      console.log('✅ Manifest yüklendi, Status:', manifestResponse.status);
    } catch (error) {
      console.log('❌ Manifest hatası:', error.response?.status, error.response?.statusText);
    }
    
  } catch (error) {
    console.error('❌ Genel test hatası:', error.message);
  }
}

testNewDeployment();
