import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Console'da logları daha görünür hale getir
  const logAuth = (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `🔐 [${timestamp}] ${message}`;
    
    // Console'a yazdır
    console.log(logMessage);
    if (data) {
      console.log(`🔐 [${timestamp}] Data:`, data);
    }
    
    // localStorage'a da kaydet (debug için)
    try {
      const existingLogs = localStorage.getItem('auth_logs') || '[]';
      const logs = JSON.parse(existingLogs);
      logs.push({ timestamp, message, data });
      
      // Son 50 logu tut
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      
      localStorage.setItem('auth_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Log kaydetme hatası:', error);
    }
  };

  // Token'ı localStorage'dan yükle
  const loadTokenFromStorage = () => {
    try {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        console.log('🔍 localStorage\'dan token yüklendi:', storedToken.substring(0, 20) + '...');
        console.log('🔍 Token tam değeri:', storedToken);
        return storedToken;
      }
    } catch (error) {
      console.error('❌ localStorage token yükleme hatası:', error);
    }
    return null;
  };

  // Token'ı localStorage'a kaydet
  const saveTokenToStorage = (newToken) => {
    try {
      if (newToken) {
        localStorage.setItem('token', newToken);
        console.log('✅ Token localStorage\'a kaydedildi:', newToken.substring(0, 20) + '...');
        console.log('✅ Token tam değeri:', newToken);
        console.log('✅ localStorage kontrol:', localStorage.getItem('token') ? 'VAR' : 'YOK');
      } else {
        localStorage.removeItem('token');
        console.log('🗑️ Token localStorage\'dan silindi');
      }
    } catch (error) {
      console.error('❌ localStorage token kaydetme hatası:', error);
    }
  };

  // Token'ı temizle
  const clearToken = () => {
    setToken(null);
    setUser(null);
    saveTokenToStorage(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // Token geçerliliğini kontrol et
  const validateToken = async (tokenToValidate) => {
    try {
      console.log('🔍 Token geçerliliği kontrol ediliyor:', tokenToValidate.substring(0, 20) + '...');
      const response = await axios.get(`${config.apiBaseUrl}/auth/profile`, {
        headers: { Authorization: `Bearer ${tokenToValidate}` }
      });
      
      if (response.data.success) {
        console.log('✅ Token geçerli, kullanıcı bilgileri alındı');
        return { valid: true, user: response.data.user };
      } else {
        console.log('❌ Token geçersiz');
        return { valid: false };
      }
    } catch (error) {
      console.error('❌ Token doğrulama hatası:', error);
      return { valid: false };
    }
  };

  // İlk yükleme - localStorage'dan token'ı al ve doğrula
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🚀 Auth başlatılıyor...');
      console.log('🚀 ==========================================');
      
      const storedToken = loadTokenFromStorage();
      
      if (storedToken) {
        console.log('🔄 Stored token bulundu, doğrulanıyor...');
        const validation = await validateToken(storedToken);
        
        if (validation.valid) {
          console.log('✅ Token geçerli, kullanıcı oturumu açılıyor');
          setToken(storedToken);
          setUser(validation.user);
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } else {
          console.log('❌ Token geçersiz, temizleniyor');
          clearToken();
        }
      } else {
        console.log('❌ Stored token bulunamadı');
      }
      
      console.log('🚀 ==========================================');
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Token değiştiğinde axios header'ını güncelle
  useEffect(() => {
    if (token) {
      console.log('🔧 Axios header güncelleniyor:', token.substring(0, 20) + '...');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      saveTokenToStorage(token);
    } else {
      console.log('🔧 Axios header temizleniyor');
      delete axios.defaults.headers.common['Authorization'];
      saveTokenToStorage(null);
    }
  }, [token]);

  // Axios interceptor - 401/403 hatalarında otomatik logout
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        logAuth('❌ API Hatası yakalandı', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });

        if (error.response?.status === 401 || error.response?.status === 403) {
          logAuth('❌ Authentication error detected, logging out...');
          clearToken();
          
          // Eğer login sayfasında değilsek, login'e yönlendir
          if (window.location.pathname !== '/login') {
            logAuth('🔄 Login sayfasına yönlendiriliyor');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const login = async (username, password) => {
    try {
      logAuth('🔐 Login denemesi başlatılıyor', { username });
      logAuth('🔗 API URL', `${config.apiBaseUrl}/auth/login`);
      
      const response = await axios.post(`${config.apiBaseUrl}/auth/login`, { username, password });
      logAuth('✅ Login response alındı', response.data);
      
      if (response.data.success) {
        logAuth('✅ Login başarılı, token işleniyor');
        const newToken = response.data.token;
        
        // Önce localStorage'a kaydet
        saveTokenToStorage(newToken);
        logAuth('✅ Token localStorage\'a kaydedildi');
        
        // Axios header'ını hemen güncelle
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        logAuth('✅ Axios header güncellendi', { token: newToken.substring(0, 20) + '...' });
        
        // Sonra state'i güncelle
        setToken(newToken);
        setUser(response.data.user);
        
        logAuth('✅ Login tamamlandı');
        return { success: true };
      } else {
        logAuth('❌ Login başarısız', response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      logAuth('❌ Login hatası', { 
        error: error.message, 
        status: error.response?.status,
        data: error.response?.data 
      });
      return { 
        success: false, 
        message: error.response?.data?.message || 'Giriş yapılırken hata oluştu' 
      };
    }
  };

  const register = async (username, email, password, full_name) => {
    try {
      const response = await axios.post(`${config.apiBaseUrl}/auth/register`, { 
        username, 
        email, 
        password, 
        full_name 
      });
      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Kayıt olurken hata oluştu' 
      };
    }
  };

  const logout = () => {
    logAuth('🚪 Logout işlemi başlatılıyor');
    clearToken();
  };

  // Debug için logları görüntüle
  const showAuthLogs = () => {
    try {
      const logs = JSON.parse(localStorage.getItem('auth_logs') || '[]');
      console.log('🔍 Auth Logları:', logs);
      return logs;
    } catch (error) {
      console.error('Log görüntüleme hatası:', error);
      return [];
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    showAuthLogs,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
