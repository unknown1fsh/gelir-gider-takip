import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Axios interceptor - her istekte token ekle ve hataları yakala
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }

    // Response interceptor - 401/403 hatalarında otomatik logout
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Authentication error detected, logging out...');
          setToken(null);
          setUser(null);
          localStorage.removeItem('token');
          
          // Eğer login sayfasında değilsek, login'e yönlendir
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );

    // Cleanup function
    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [token]);

  // Sayfa yüklendiğinde token kontrolü
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get('/api/auth/profile');
          if (response.data.success) {
            setUser(response.data.user);
          } else {
            // Token geçersiz, temizle
            setToken(null);
            setUser(null);
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Token kontrol hatası:', error);
          
          // 403 veya 401 hatası durumunda token'ı temizle
          if (error.response?.status === 403 || error.response?.status === 401) {
            setToken(null);
            setUser(null);
            localStorage.removeItem('token');
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', { username, password });
      if (response.data.success) {
        setToken(response.data.token);
        setUser(response.data.user);
        return { success: true };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Giriş yapılırken hata oluştu' 
      };
    }
  };

  const register = async (username, email, password, full_name) => {
    try {
      const response = await axios.post('/api/auth/register', { 
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
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
