// API Configuration
const config = {
  // Development ortamında localhost:5000, production'da relative path
  apiBaseUrl: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api',
  
  // App configuration
  appName: 'Gelir Gider Takip',
  version: '1.0.0',
  
  // Default settings
  defaultCurrency: 'TRY',
  defaultLanguage: 'tr',
  
  // Pagination
  defaultPageSize: 10,
  maxPageSize: 100
};

export default config;
