import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Form, 
  Alert, Table, Badge, Modal, ProgressBar,
  Spinner, Accordion, Nav, Navbar, Dropdown,
  Tabs, Tab, InputGroup, FormControl, ButtonGroup,
  ListGroup, ListGroupItem, OverlayTrigger, Tooltip,
  Popover, Overlay, Modal as BootstrapModal
} from 'react-bootstrap';
import './AdminPanel.css';
import { 
  FaUsers, FaChartBar, FaDatabase, FaCog, 
  FaTrash, FaPlus, FaEye, FaEdit, FaBan,
  FaCheck, FaExclamationTriangle, FaServer,
  FaHdd, FaBars, FaTimes, FaCode, FaDownload,
  FaSearch, FaClock, FaUpload, FaCrown, FaShieldAlt,
  FaKey, FaLock, FaUnlock, FaSave, FaUndo,
  FaCopy, FaPaste, FaFileExport, FaFileImport,
  FaHistory, FaBackup, FaRestore, FaSync,
  FaBell, FaEnvelope, FaPhone, FaMapMarker,
  FaGlobe, FaLanguage, FaPalette, FaFont,
  FaCalendar, FaThermometerHalf, FaNetworkWired, 
  FaWifi, FaMemory, FaMicrochip, FaDesktop, 
  FaMobile, FaTablet, FaLaptop, FaCloud, 
  FaCloudRain, FaSun, FaMoon, FaStar, FaHeart, 
  FaThumbsUp, FaThumbsDown, FaQuestionCircle, 
  FaInfoCircle, FaExclamationCircle, FaCheckCircle, 
  FaTimesCircle, FaArrowUp, FaArrowDown, 
  FaArrowLeft, FaArrowRight, FaExpand, FaCompress, 
  FaFilter, FaSort, FaSortUp, FaSortDown, 
  FaColumns, FaList, FaTh, FaThLarge, FaThList, FaTable,
  FaCalendarAlt, FaCalendarDay, FaCalendarWeek, 
  FaCalendarMonth, FaCalendarCheck, FaCalendarTimes, 
  FaCalendarMinus, FaCalendarPlus, FaUserCog, 
  FaUserShield, FaUserTie, FaUserGraduate, 
  FaUserNinja, FaUserSecret, FaUserAstronaut, 
  FaUserInjured, FaUserCheck, FaUserTimes, 
  FaUserPlus, FaUserMinus, FaUserEdit, FaUserLock,
  FaUserUnlock, FaUserClock, FaUserTag, 
  FaUserFriends, FaSignInAlt, FaSignOutAlt,
  FaBuilding, FaCreditCard
} from 'react-icons/fa';

const AdminPanel = () => {
  // ==================== AUTHENTICATION STATE ====================
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // ==================== LAYOUT STATE ====================
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  
  // ==================== DASHBOARD STATE ====================
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      totalAccounts: 0,
      totalCreditCards: 0,
      totalIncomes: 0,
      totalExpenses: 0,
      recentUsers: 0,
      totalRentExpenses: 0,
      systemUptime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      diskUsage: 0,
      networkTraffic: 0,
      activeSessions: 0,
      errorRate: 0,
      responseTime: 0
    },
    lastLoginUsers: [],
    recentActivities: [],
    systemAlerts: [],
    performanceMetrics: {}
  });
  
  // ==================== USERS MANAGEMENT STATE ====================
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userFilterStatus, setUserFilterStatus] = useState('all');
  const [userSortBy, setUserSortBy] = useState('created_at');
  const [userSortOrder, setUserSortOrder] = useState('desc');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    full_name: '',
    is_active: true,
    role: 'user'
  });
  
  // ==================== BANKS MANAGEMENT STATE ====================
  const [banks, setBanks] = useState([]);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [bankSearchTerm, setBankSearchTerm] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    bank_code: '',
    country: 'TR',
    is_active: true
  });
  
  // ==================== SYSTEM PARAMETERS STATE ====================
  const [systemParams, setSystemParams] = useState(null);
  const [systemParameters, setSystemParameters] = useState([]);
  const [filteredParameters, setFilteredParameters] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingParameter, setEditingParameter] = useState(null);
  const [showParameterModal, setShowParameterModal] = useState(false);
  const [showAddParameterModal, setShowAddParameterModal] = useState(false);
  const [parameterForm, setParameterForm] = useState({
    param_key: '',
    param_value: '',
    param_type: 'string',
    description: '',
    category: 'general',
    is_editable: true,
    validation_rules: '',
    default_value: '',
    min_value: '',
    max_value: '',
    options: '',
    is_required: false,
    is_sensitive: false
  });

  // Parametre arama ve filtreleme state'leri
  const [parameterSearchTerm, setParameterSearchTerm] = useState('');
  const [parameterFilterCategory, setParameterFilterCategory] = useState('');
  const [parameterFilterType, setParameterFilterType] = useState('');
  const [selectedParameter, setSelectedParameter] = useState(null);
  const [showSensitiveValue, setShowSensitiveValue] = useState(null);
  
  // ==================== ADVANCED SYSTEM PARAMETERS STATE ====================
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkEditParameters, setBulkEditParameters] = useState([]);
  const [importData, setImportData] = useState('');
  const [importOverwrite, setImportOverwrite] = useState(false);
  const [parametersLoading, setParametersLoading] = useState(false);
  const [parameterHistory, setParameterHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [parameterBackups, setParameterBackups] = useState([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  
  // ==================== SYSTEM CONFIGURATION STATE ====================
  const [systemConfig, setSystemConfig] = useState({
    database: {
      host: '',
      port: '',
      name: '',
      user: '',
      ssl_mode: 'require',
      connection_pool_size: 10,
      max_connections: 100,
      timeout: 30000
    },
    application: {
      name: 'Gelir Gider Takip',
      version: '1.0.0',
      environment: 'development',
      debug: false,
      log_level: 'info',
      timezone: 'Europe/Istanbul',
      locale: 'tr-TR',
      currency: 'TRY',
      date_format: 'DD/MM/YYYY',
      time_format: 'HH:mm:ss'
    },
    security: {
      jwt_secret: '',
      jwt_expires_in: '7d',
      bcrypt_rounds: 12,
      password_min_length: 8,
      password_require_uppercase: true,
      password_require_lowercase: true,
      password_require_numbers: true,
      password_require_symbols: false,
      max_login_attempts: 5,
      lockout_duration: 15,
      session_timeout: 3600,
      enable_2fa: false,
      enable_captcha: false,
      enable_rate_limiting: true,
      rate_limit_window: 900,
      rate_limit_max_requests: 100
    },
    email: {
      provider: 'smtp',
      host: '',
      port: 587,
      secure: true,
      user: '',
      password: '',
      from_address: '',
      from_name: '',
      enable_notifications: false
    },
    notification: {
      enable_email: false,
      enable_sms: false,
      enable_push: false,
      enable_webhook: false,
      webhook_url: '',
      notification_types: {
        user_registration: true,
        password_reset: true,
        account_locked: true,
        unusual_activity: true,
        system_alerts: true
      }
    },
    backup: {
      enable_auto_backup: false,
      backup_frequency: 'daily',
      backup_retention: 30,
      backup_location: 'local',
      backup_encryption: false,
      backup_compression: true
    },
    monitoring: {
      enable_monitoring: true,
      monitoring_interval: 60,
      alert_thresholds: {
        cpu_usage: 80,
        memory_usage: 85,
        disk_usage: 90,
        response_time: 5000,
        error_rate: 5
      },
      enable_logging: true,
      log_retention: 90,
      enable_analytics: true
    },
    ui: {
      theme: 'light',
      primary_color: '#007bff',
      secondary_color: '#6c757d',
      accent_color: '#28a745',
      font_family: 'Inter',
      font_size: '14px',
      enable_animations: true,
      enable_tooltips: true,
      enable_shortcuts: true,
      sidebar_position: 'left',
      sidebar_width: 250,
      enable_breadcrumbs: true,
      enable_search: true
    }
  });
  
  // ==================== MODAL STATES ====================
  const [showResetModal, setShowResetModal] = useState(false);
  const [showMockDataModal, setShowMockDataModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  
  // ==================== UTILITY FUNCTIONS ====================
  const showMessage = (type, text, duration = 5000) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), duration);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('tr-TR');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}g ${hours}s ${minutes}d`;
  };

  // ==================== API FUNCTIONS ====================
  
  // Admin Authentication
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminPassword) {
      showMessage('danger', 'Admin şifresi gerekli');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword })
      });

      if (response.ok) {
        setIsAuthenticated(true);
        showMessage('success', 'Admin girişi başarılı!');
        fetchDashboardData();
        fetchUsers();
        fetchBanks();
        fetchSystemParameters();
        fetchSystemConfig();
      } else {
        const error = await response.json();
        showMessage('danger', error.message || 'Admin girişi başarısız');
      }
    } catch (error) {
      console.error('Admin login hatası:', error);
      showMessage('danger', 'Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  // Dashboard Data
  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/dashboard', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminPassword: adminPassword
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(prev => ({
          ...prev,
          stats: { 
            ...prev.stats, 
            ...data.dashboard,
            // Sistem performansı verilerini de ekle
            systemUptime: data.dashboard.systemUptime || 0,
            memoryUsage: data.dashboard.memoryUsage || 0,
            cpuUsage: data.dashboard.cpuUsage || 0,
            diskUsage: data.dashboard.diskUsage || 0,
            activeSessions: data.dashboard.activeSessions || 0,
            errorRate: data.dashboard.errorRate || 0,
            responseTime: data.dashboard.responseTime || 0
          },
          recentActivities: data.dashboard.recentActivities || []
        }));
      }
    } catch (error) {
      console.error('Dashboard veri getirme hatası:', error);
    }
  };

  // Users Management
  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminPassword: adminPassword
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setFilteredUsers(data.users);
      }
    } catch (error) {
      console.error('Kullanıcılar getirme hatası:', error);
    }
  };

  // Banks Management
  const addBank = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/banks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          bank_name: newBankName.trim(),
          adminPassword: adminPassword
        })
      });
      
      if (response.ok) {
        showMessage('success', 'Banka başarıyla eklendi!');
        setNewBankName('');
        fetchBanks(); // Listeyi yenile
      } else {
        const error = await response.json();
        showMessage('danger', error.error || 'Banka eklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Banka ekleme hatası:', error);
      showMessage('danger', 'Banka eklenirken bağlantı hatası oluştu');
    }
  };

  const fetchBanks = async () => {
    try {
      console.log('🔍 Bankalar yükleniyor...');
      const response = await fetch('http://localhost:5000/api/banks', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Bankalar yüklendi:', data.length, 'adet');
        setBanks(data);
        setFilteredBanks(data);
      } else {
        console.error('❌ Bankalar yüklenemedi:', response.status);
        showMessage('danger', 'Bankalar yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('❌ Bankalar getirme hatası:', error);
      showMessage('danger', 'Bankalar yüklenirken bağlantı hatası oluştu');
    }
  };

  // System Parameters
  const fetchSystemParameters = async () => {
    setParametersLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/system-parameters', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminPassword: adminPassword
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemParameters(data.parameters);
        applyParameterFilters(data.parameters);
      } else {
        const error = await response.json();
        console.error('Sistem parametreleri API hatası:', error);
        showMessage('danger', error.message || 'Sistem parametreleri alınamadı');
      }
    } catch (error) {
      console.error('Sistem parametreleri getirme hatası:', error);
      showMessage('danger', 'Sistem parametreleri yüklenirken bağlantı hatası oluştu');
    } finally {
      setParametersLoading(false);
    }
  };

  // Parametre filtrelerini uygula
  const applyParameterFilters = (parameters) => {
    const filtered = parameters.filter(param => {
      const matchesSearch = !parameterSearchTerm || 
        param.param_key.toLowerCase().includes(parameterSearchTerm.toLowerCase()) ||
        (param.description && param.description.toLowerCase().includes(parameterSearchTerm.toLowerCase())) ||
        param.param_value.toLowerCase().includes(parameterSearchTerm.toLowerCase());
      const matchesCategory = !parameterFilterCategory || param.category === parameterFilterCategory;
      const matchesType = !parameterFilterType || param.param_type === parameterFilterType;
      return matchesSearch && matchesCategory && matchesType;
    });
    setFilteredParameters(filtered);
  };

  // Arama ve filtreleme değişikliklerini dinle
  useEffect(() => {
    if (systemParameters.length > 0) {
      applyParameterFilters(systemParameters);
    }
  }, [parameterSearchTerm, parameterFilterCategory, parameterFilterType, systemParameters]);

  // Yeni parametre ekle
  const addSystemParameter = async (parameterData) => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/add-system-parameter', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...parameterData,
          adminPassword: adminPassword
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        showMessage('success', data.message);
        fetchSystemParameters(); // Listeyi yenile
        return true;
      } else {
        const error = await response.json();
        showMessage('danger', error.message);
        return false;
      }
    } catch (error) {
      console.error('Parametre ekleme hatası:', error);
      showMessage('danger', 'Parametre eklenirken hata oluştu');
      return false;
    }
  };

  // Parametre güncelle
  const updateSystemParameter = async (paramId, paramValue) => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/update-system-parameters', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          paramId, 
          paramValue,
          adminPassword: adminPassword
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        showMessage('success', data.message);
        fetchSystemParameters(); // Listeyi yenile
        return true;
      } else {
        const error = await response.json();
        showMessage('danger', error.message);
        return false;
      }
    } catch (error) {
      console.error('Parametre güncelleme hatası:', error);
      showMessage('danger', 'Parametre güncellenirken hata oluştu');
      return false;
    }
  };

  // Parametre sil
  const deleteSystemParameter = async (paramId) => {
    if (!window.confirm('Bu parametreyi silmek istediğinizden emin misiniz?')) {
      return false;
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/delete-system-parameter', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'admin-password': adminPassword
        },
        body: JSON.stringify({ paramId })
      });
      
      if (response.ok) {
        const data = await response.json();
        showMessage('success', data.message);
        fetchSystemParameters(); // Listeyi yenile
        return true;
      } else {
        const error = await response.json();
        showMessage('danger', error.message);
        return false;
      }
    } catch (error) {
      console.error('Parametre silme hatası:', error);
      showMessage('danger', 'Parametre silinirken hata oluştu');
      return false;
    }
  };

  // Parametreleri dışa aktar
  const exportSystemParameters = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/export-system-parameters', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminPassword: adminPassword
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system_parameters_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showMessage('success', 'Parametreler başarıyla dışa aktarıldı');
      } else {
        const error = await response.json();
        showMessage('danger', error.message);
      }
    } catch (error) {
      console.error('Dışa aktarma hatası:', error);
      showMessage('danger', 'Dışa aktarma sırasında hata oluştu');
    }
  };

  // Parametreleri içe aktar
  const importSystemParameters = async (file, overwrite = false) => {
    try {
      const text = await file.text();
      const parameters = JSON.parse(text);
      
      if (!parameters.parameters || !Array.isArray(parameters.parameters)) {
        showMessage('danger', 'Geçersiz dosya formatı');
        return false;
      }

      const response = await fetch('http://localhost:5000/api/admin/import-system-parameters', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          parameters: parameters.parameters, 
          overwrite,
          adminPassword: adminPassword
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        showMessage('success', data.message);
        fetchSystemParameters(); // Listeyi yenile
        return true;
      } else {
        const error = await response.json();
        showMessage('danger', error.message);
        return false;
      }
    } catch (error) {
      console.error('İçe aktarma hatası:', error);
      showMessage('danger', 'İçe aktarma sırasında hata oluştu');
      return false;
    }
  };

  // Uygulama parametrelerini güncelle
  const updateApplicationParameters = async () => {
    try {
      showMessage('info', 'Uygulama parametreleri güncelleniyor...');
      
      const response = await fetch('http://localhost:5000/api/admin/update-application-parameters', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminPassword: adminPassword
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        showMessage('success', data.message);
        
        // Özet bilgilerini göster
        if (data.summary) {
          console.log('📊 Güncelleme Özeti:', data.summary);
          const summaryText = `
            ✅ Yeni eklenen: ${data.summary.added}
            🔄 Güncellenen: ${data.summary.updated}
            📋 Toplam: ${data.summary.total}
            📂 Kategoriler: ${data.summary.categories.map(c => `${c.name}(${c.count})`).join(', ')}
          `;
          showMessage('success', summaryText);
        }
        
        fetchSystemParameters(); // Listeyi yenile
        return true;
      } else {
        const error = await response.json();
        showMessage('danger', error.message);
        return false;
      }
    } catch (error) {
      console.error('Uygulama parametreleri güncelleme hatası:', error);
      showMessage('danger', 'Uygulama parametreleri güncellenirken hata oluştu');
      return false;
    }
  };

  // System Configuration
  const fetchSystemConfig = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/system-config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminPassword: adminPassword
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemConfig(data.config);
      }
    } catch (error) {
      console.error('Sistem konfigürasyonu getirme hatası:', error);
    }
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
      fetchUsers();
      fetchBanks();
      fetchSystemParameters();
      fetchSystemConfig();
    }
  }, [isAuthenticated]);

  // ==================== RENDER FUNCTIONS ====================
  
  // Login Form
  const renderLoginForm = () => (
    <div className="admin-login-container">
      <Card className="admin-login-card">
        <Card.Header className="text-center">
          <FaCrown className="admin-icon" />
          <h3>🔐 Admin Paneli</h3>
          <p className="text-muted">Sistem yönetimi için giriş yapın</p>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleAdminLogin}>
            <Form.Group className="mb-3">
              <Form.Label>
                <FaKey className="me-2" />
                Admin Şifresi
              </Form.Label>
              <Form.Control
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Admin şifresini girin"
                required
              />
            </Form.Group>
            <Button 
              type="submit" 
              variant="primary" 
              className="w-100"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Giriş yapılıyor...
                </>
              ) : (
                <>
                  <FaSignInAlt className="me-2" />
                  Giriş Yap
                </>
              )}
            </Button>
          </Form>
        </Card.Body>
        <Card.Footer className="text-center text-muted">
          <small>
            <FaShieldAlt className="me-1" />
            Güvenli admin erişimi
          </small>
        </Card.Footer>
      </Card>
    </div>
  );

  // Main Admin Panel
  const renderAdminPanel = () => (
    <div className={`admin-panel ${darkMode ? 'dark-mode' : ''} ${fullscreen ? 'fullscreen' : ''}`}>
      {/* Left Sidebar Navigation */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <FaCrown className="me-2" />
            Admin Panel
          </div>
          <Button 
            variant="link" 
            className="sidebar-toggle d-lg-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <FaBars />
          </Button>
        </div>
        
        <div className={`sidebar-content ${mobileMenuOpen ? 'show' : ''}`}>
          <Nav className="flex-column">
            <Nav.Link 
              className={`sidebar-nav-link ${activeSection === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveSection('dashboard')}
            >
              <FaChartBar className="me-2" />
              Dashboard
            </Nav.Link>
            <Nav.Link 
              className={`sidebar-nav-link ${activeSection === 'users' ? 'active' : ''}`}
              onClick={() => setActiveSection('users')}
            >
              <FaUsers className="me-2" />
              Kullanıcılar
            </Nav.Link>
            <Nav.Link 
              className={`sidebar-nav-link ${activeSection === 'system' ? 'active' : ''}`}
              onClick={() => setActiveSection('system')}
            >
              <FaCog className="me-2" />
              Sistem
            </Nav.Link>
          </Nav>
          
          <div className="sidebar-footer">
            <div className="sidebar-controls">
              <Button 
                variant="link" 
                className="sidebar-control-btn"
                onClick={() => setDarkMode(!darkMode)}
                title={darkMode ? 'Açık Tema' : 'Koyu Tema'}
              >
                {darkMode ? <FaSun /> : <FaMoon />}
              </Button>
              <Button 
                variant="link" 
                className="sidebar-control-btn"
                onClick={() => setFullscreen(!fullscreen)}
                title={fullscreen ? 'Tam Ekranı Kapat' : 'Tam Ekran'}
              >
                {fullscreen ? <FaCompress /> : <FaExpand />}
              </Button>
            </div>
            
            <Dropdown>
              <Dropdown.Toggle variant="outline-light" id="admin-dropdown" className="sidebar-dropdown">
                <FaUserCog className="me-2" />
                Admin
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setShowSettingsModal(true)}>
                  <FaCog className="me-2" />
                  Ayarlar
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setIsAuthenticated(false)}>
                  <FaSignOutAlt className="me-2" />
                  Çıkış
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main-content">
        {message.text && (
          <Alert 
            variant={message.type} 
            dismissible 
            onClose={() => setMessage({ type: '', text: '' })}
            className="admin-alert"
          >
            {message.text}
          </Alert>
        )}

        {/* Dashboard Section */}
        {activeSection === 'dashboard' && renderDashboard()}
        
        {/* Users Section */}
        {activeSection === 'users' && renderUsersManagement()}
        
        {/* System Section */}
        {activeSection === 'system' && renderSystemManagement()}
      </div>
    </div>
  );

  // ==================== RENDER FUNCTIONS ====================
  
  // Dashboard Section
  const renderDashboard = () => (
    <div className="dashboard-section">
      <Row className="mb-4">
        <Col>
          <h2><FaChartBar className="me-2" />Dashboard</h2>
          <p className="text-muted">Sistem genel durumu ve istatistikler</p>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="stat-card">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted">Toplam Kullanıcı</h6>
                  <h3>{dashboardData.stats.totalUsers}</h3>
                </div>
                <div className="stat-icon">
                  <FaUsers className="text-primary" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="stat-card">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted">Toplam Hesap</h6>
                  <h3>{dashboardData.stats.totalAccounts}</h3>
                </div>
                <div className="stat-icon">
                  <FaDatabase className="text-success" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="stat-card">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted">Toplam Gelir</h6>
                  <h3>{formatCurrency(dashboardData.stats.totalIncomes)}</h3>
                </div>
                <div className="stat-icon">
                  <FaArrowUp className="text-success" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="stat-card">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted">Toplam Gider</h6>
                  <h3>{formatCurrency(dashboardData.stats.totalExpenses)}</h3>
                </div>
                <div className="stat-icon">
                  <FaArrowDown className="text-danger" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* System Performance */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h6><FaServer className="me-2" />Sistem Performansı</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>CPU Kullanımı</small>
                  <small>{dashboardData.stats.cpuUsage}%</small>
                </div>
                <ProgressBar 
                  now={dashboardData.stats.cpuUsage} 
                  variant={dashboardData.stats.cpuUsage > 80 ? 'danger' : 'info'}
                />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Bellek Kullanımı</small>
                  <small>{dashboardData.stats.memoryUsage}%</small>
                </div>
                <ProgressBar 
                  now={dashboardData.stats.memoryUsage} 
                  variant={dashboardData.stats.memoryUsage > 85 ? 'danger' : 'warning'}
                />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Disk Kullanımı</small>
                  <small>{dashboardData.stats.diskUsage}%</small>
                </div>
                <ProgressBar 
                  now={dashboardData.stats.diskUsage} 
                  variant={dashboardData.stats.diskUsage > 90 ? 'danger' : 'success'}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h6><FaClock className="me-2" />Sistem Durumu</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <strong>Çalışma Süresi:</strong> {formatUptime(dashboardData.stats.systemUptime)}
              </div>
              <div className="mb-3">
                <strong>Aktif Oturumlar:</strong> {dashboardData.stats.activeSessions}
              </div>
              <div className="mb-3">
                <strong>Hata Oranı:</strong> {dashboardData.stats.errorRate}%
              </div>
              <div className="mb-3">
                <strong>Yanıt Süresi:</strong> {dashboardData.stats.responseTime}ms
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activities */}
      <Row>
        <Col md={8}>
          <Card>
            <Card.Header>
              <h6><FaHistory className="me-2" />Son Aktiviteler</h6>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                {dashboardData.recentActivities.length > 0 ? (
                  dashboardData.recentActivities.map((activity, index) => {
                    // Aktivite tipine göre ikon belirle
                    let activityIcon;
                    let activityColor = 'text-muted';
                    
                    switch (activity.type) {
                      case 'income':
                        activityIcon = <FaArrowUp className="text-success" />;
                        activityColor = 'text-success';
                        break;
                      case 'expense':
                        activityIcon = <FaArrowDown className="text-danger" />;
                        activityColor = 'text-danger';
                        break;
                      case 'account':
                        activityIcon = <FaDatabase className="text-primary" />;
                        activityColor = 'text-primary';
                        break;
                      case 'credit_card':
                        activityIcon = <FaCreditCard className="text-info" />;
                        activityColor = 'text-info';
                        break;
                      case 'bank':
                        activityIcon = <FaBuilding className="text-warning" />;
                        activityColor = 'text-warning';
                        break;
                      default:
                        activityIcon = <FaUserClock className="text-muted" />;
                    }
                    
                    return (
                      <ListGroupItem key={index} className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <span className="me-2">{activityIcon}</span>
                          <span className={activityColor}>{activity.description}</span>
                        </div>
                        <small className="text-muted">{formatDate(activity.timestamp)}</small>
                      </ListGroupItem>
                    );
                  })
                ) : (
                  <ListGroupItem className="text-center text-muted">
                    <FaInfoCircle className="me-2" />
                    Henüz aktivite bulunmuyor
                  </ListGroupItem>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header>
              <h6><FaBell className="me-2" />Sistem Uyarıları</h6>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                {dashboardData.systemAlerts.length > 0 ? (
                  dashboardData.systemAlerts.map((alert, index) => (
                    <ListGroupItem key={index} className={`d-flex justify-content-between align-items-center ${alert.level === 'error' ? 'text-danger' : alert.level === 'warning' ? 'text-warning' : 'text-info'}`}>
                      <div>
                        <FaExclamationTriangle className="me-2" />
                        {alert.message}
                      </div>
                      <small>{formatDate(alert.timestamp)}</small>
                    </ListGroupItem>
                  ))
                ) : (
                  <ListGroupItem className="text-center text-success">
                    <FaCheckCircle className="me-2" />
                    Sistem normal çalışıyor
                  </ListGroupItem>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );

  // Users Management Section
  const renderUsersManagement = () => (
    <div className="users-section">
      <Row className="mb-4">
        <Col>
          <h2><FaUsers className="me-2" />Kullanıcı Yönetimi</h2>
          <p className="text-muted">Sistem kullanıcılarını yönetin</p>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <FormControl
              placeholder="Kullanıcı ara..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <Form.Select
            value={userFilterStatus}
            onChange={(e) => setUserFilterStatus(e.target.value)}
          >
            <option value="all">Tüm Kullanıcılar</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <Button variant="primary" onClick={() => setShowUserModal(true)}>
            <FaPlus className="me-2" />
            Yeni Kullanıcı
          </Button>
        </Col>
      </Row>

      {/* Users Table */}
      <Card>
        <Card.Body>
          <Table responsive striped hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Kullanıcı Adı</th>
                <th>E-posta</th>
                <th>Ad Soyad</th>
                <th>Durum</th>
                <th>Son Giriş</th>
                <th>Kayıt Tarihi</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.full_name}</td>
                  <td>
                    <Badge bg={user.is_active ? 'success' : 'danger'}>
                      {user.is_active ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </td>
                  <td>{user.last_login ? formatDate(user.last_login) : 'Hiç giriş yapmamış'}</td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>
                    <ButtonGroup size="sm">
                      <Button variant="outline-primary" size="sm">
                        <FaEye />
                      </Button>
                      <Button variant="outline-warning" size="sm">
                        <FaEdit />
                      </Button>
                      <Button variant="outline-danger" size="sm">
                        <FaBan />
                      </Button>
                    </ButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );

  // System Management Section
  const renderSystemManagement = () => (
    <div className="system-section">
      <Row className="mb-4">
        <Col>
          <h2><FaCog className="me-2" />Sistem Yönetimi</h2>
          <p className="text-muted">Sistem parametrelerini ve konfigürasyonu yönetin</p>
        </Col>
      </Row>

      <Tabs defaultActiveKey="parameters" className="mb-4">
        <Tab eventKey="parameters" title="Sistem Parametreleri">
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h6><FaCog className="me-2" />Sistem Parametreleri</h6>
                <div>
                  <Button variant="outline-primary" size="sm" className="me-2" onClick={exportSystemParameters}>
                    <FaDownload className="me-2" />
                    Dışa Aktar
                  </Button>
                  <Button variant="outline-success" size="sm" className="me-2" onClick={() => document.getElementById('importFile').click()}>
                    <FaUpload className="me-2" />
                    İçe Aktar
                  </Button>
                  <Button variant="outline-warning" size="sm" className="me-2" onClick={updateApplicationParameters}>
                    <FaSync className="me-2" />
                    Uygulama Parametrelerini Güncelle
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setShowAddParameterModal(true)}>
                    <FaPlus className="me-2" />
                    Yeni Parametre
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {/* Arama ve Filtreleme */}
              <div className="row mb-3">
                <div className="col-md-4">
                  <InputGroup size="sm">
                    <InputGroup.Text><FaSearch /></InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Parametre ara..."
                      value={parameterSearchTerm}
                      onChange={(e) => setParameterSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                </div>
                <div className="col-md-3">
                  <Form.Select size="sm" value={parameterFilterCategory} onChange={(e) => setParameterFilterCategory(e.target.value)}>
                    <option value="">Tüm Kategoriler</option>
                    <option value="general">Genel</option>
                    <option value="financial">Finansal</option>
                    <option value="security">Güvenlik</option>
                    <option value="email">E-posta</option>
                    <option value="ui">Kullanıcı Arayüzü</option>
                    <option value="database">Veritabanı</option>
                    <option value="monitoring">İzleme</option>
                    <option value="backup">Yedekleme</option>
                    <option value="notification">Bildirim</option>
                    <option value="datetime">Tarih/Zaman</option>
                  </Form.Select>
                </div>
                <div className="col-md-3">
                  <Form.Select size="sm" value={parameterFilterType} onChange={(e) => setParameterFilterType(e.target.value)}>
                    <option value="">Tüm Tipler</option>
                    <option value="string">Metin</option>
                    <option value="number">Sayı</option>
                    <option value="boolean">Mantıksal</option>
                    <option value="json">JSON</option>
                    <option value="date">Tarih</option>
                  </Form.Select>
                </div>
                <div className="col-md-2">
                  <Button variant="outline-secondary" size="sm" onClick={() => {
                    setParameterSearchTerm('');
                    setParameterFilterCategory('');
                    setParameterFilterType('');
                  }}>
                    <FaTimes className="me-1" />
                    Temizle
                  </Button>
                </div>
              </div>

              {parametersLoading ? (
                <div className="text-center">
                  <Spinner animation="border" />
                  <p className="mt-2">Parametreler yükleniyor...</p>
                </div>
              ) : (
                <>
                  {/* Kategorilere Göre Gruplandırılmış Görünüm */}
                  <div className="mb-4">
                    <h6 className="mb-3">
                      <FaThList className="me-2" />
                      Kategorilere Göre Gruplandırılmış Parametreler
                    </h6>
                    <Accordion>
                      {(() => {
                        const categories = {};
                        
                        // Parametreleri kategorilere ekle
                        filteredParameters.forEach(param => {
                          if (!categories[param.category]) {
                            categories[param.category] = { parameters: [], banks: [] };
                          }
                          categories[param.category].parameters.push(param);
                        });
                        
                        // Bankaları 'financial' kategorisine ekle
                        if (banks.length > 0) {
                          if (!categories['financial']) {
                            categories['financial'] = { parameters: [], banks: [] };
                          }
                          categories['financial'].banks = banks;
                        }
                        
                        return Object.entries(categories).map(([category, data], index) => (
                          <Accordion.Item key={category} eventKey={index.toString()}>
                            <Accordion.Header>
                              <Badge bg="info" className="me-2">{category}</Badge>
                              <span className="fw-bold">{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                              <Badge bg="secondary" className="ms-2">
                                {data.parameters.length} parametre
                                {data.banks.length > 0 && `, ${data.banks.length} banka`}
                              </Badge>
                            </Accordion.Header>
                            <Accordion.Body>
                              {/* Parametreler */}
                              {data.parameters.length > 0 && (
                                <div className="mb-4">
                                  <h6 className="mb-3">
                                    <FaCog className="me-2" />
                                    Sistem Parametreleri
                                  </h6>
                                  <div className="table-responsive">
                                    <Table size="sm" striped>
                                      <thead>
                                        <tr>
                                          <th>Anahtar</th>
                                          <th>Değer</th>
                                          <th>Tip</th>
                                          <th>Açıklama</th>
                                          <th>İşlemler</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {data.parameters.map(param => (
                                      <tr key={param.id}>
                                        <td>
                                          <div>
                                            <code className="text-primary">{param.param_key}</code>
                                            <div className="mt-1">
                                              {param.is_required && <Badge bg="danger" size="sm" className="me-1">Zorunlu</Badge>}
                                              {param.is_sensitive && <Badge bg="warning" size="sm" className="me-1">Hassas</Badge>}
                                              {!param.is_editable && <Badge bg="secondary" size="sm" className="me-1">Salt Okunur</Badge>}
                                            </div>
                                          </div>
                                        </td>
                                        <td>
                                          {param.is_sensitive ? (
                                            <div>
                                              <span className="text-muted">••••••••</span>
                                              <Button variant="link" size="sm" className="p-0 ms-2" onClick={() => setShowSensitiveValue(param.id)}>
                                                <FaEye />
                                              </Button>
                                            </div>
                                          ) : (
                                            <div>
                                              <span className="text-break">{param.param_value}</span>
                                              {param.param_type === 'boolean' && (
                                                <Badge bg={param.param_value === 'true' ? 'success' : 'secondary'} size="sm" className="ms-1">
                                                  {param.param_value === 'true' ? 'Açık' : 'Kapalı'}
                                                </Badge>
                                              )}
                                            </div>
                                          )}
                                        </td>
                                        <td>
                                          <Badge bg="secondary">{param.param_type}</Badge>
                                        </td>
                                        <td>
                                          <div className="text-break small">
                                            {param.description}
                                          </div>
                                        </td>
                                        <td>
                                          <ButtonGroup size="sm" vertical>
                                            <Button 
                                              variant="outline-primary" 
                                              size="sm"
                                              onClick={() => {
                                                setParameterForm({
                                                  id: param.id,
                                                  param_key: param.param_key,
                                                  param_value: param.param_value,
                                                  param_type: param.param_type,
                                                  description: param.description || '',
                                                  category: param.category,
                                                  is_editable: param.is_editable,
                                                  is_sensitive: param.is_sensitive
                                                });
                                                setShowParameterModal(true);
                                              }}
                                              disabled={!param.is_editable}
                                            >
                                              <FaEdit />
                                            </Button>
                                            <Button 
                                              variant="outline-danger" 
                                              size="sm"
                                              onClick={() => deleteSystemParameter(param.id)}
                                              disabled={param.is_required}
                                            >
                                              <FaTrash />
                                            </Button>
                                          </ButtonGroup>
                                        </td>
                                      </tr>
                                        ))}
                                      </tbody>
                                    </Table>
                                  </div>
                                </div>
                              )}
                              
                              {/* Bankalar */}
                              {data.banks.length > 0 && (
                                <div className="mb-4">
                                  <h6 className="mb-3">
                                    <FaDatabase className="me-2" />
                                    Banka Yönetimi
                                  </h6>
                                  
                                  {/* Banka Ekleme */}
                                  <Row className="mb-3">
                                    <Col md={8}>
                                      <InputGroup>
                                        <FormControl
                                          placeholder="Yeni banka adı..."
                                          value={newBankName}
                                          onChange={(e) => {
                                            setNewBankName(e.target.value);
                                            // Gerçek zamanlı aynı isim kontrolü
                                            if (e.target.value.trim()) {
                                              const existingBank = banks.find(bank => 
                                                bank.bank_name.toLowerCase() === e.target.value.trim().toLowerCase()
                                              );
                                              if (existingBank) {
                                                // Input'a kırmızı border ekle
                                                e.target.style.borderColor = '#dc3545';
                                                e.target.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
                                              } else {
                                                // Normal border
                                                e.target.style.borderColor = '';
                                                e.target.style.boxShadow = '';
                                              }
                                            } else {
                                              e.target.style.borderColor = '';
                                              e.target.style.boxShadow = '';
                                            }
                                          }}
                                          onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              // Enter tuşu ile banka ekleme
                                              if (!newBankName.trim()) {
                                                showMessage('danger', 'Banka adı boş olamaz');
                                                return;
                                              }
                                              
                                              // Frontend'de aynı isim kontrolü
                                              const existingBank = banks.find(bank => 
                                                bank.bank_name.toLowerCase() === newBankName.trim().toLowerCase()
                                              );
                                              
                                              if (existingBank) {
                                                showMessage('warning', `"${newBankName.trim()}" bankası zaten mevcut!`);
                                                return;
                                              }
                                              
                                              // Banka ekleme işlemi
                                              addBank();
                                            }
                                          }}
                                        />
                                        <Button 
                                          variant="success" 
                                          disabled={!newBankName.trim() || banks.some(bank => 
                                            bank.bank_name.toLowerCase() === newBankName.trim().toLowerCase()
                                          )}
                                          onClick={async () => {
                                            if (!newBankName.trim()) {
                                              showMessage('danger', 'Banka adı boş olamaz');
                                              return;
                                            }
                                            
                                            // Frontend'de aynı isim kontrolü
                                            const existingBank = banks.find(bank => 
                                              bank.bank_name.toLowerCase() === newBankName.trim().toLowerCase()
                                            );
                                            
                                            if (existingBank) {
                                              showMessage('warning', `"${newBankName.trim()}" bankası zaten mevcut!`);
                                              return;
                                            }
                                            
                                            await addBank();
                                          }}
                                        >
                                          <FaPlus className="me-2" />
                                          Ekle
                                        </Button>
                                      </InputGroup>
                                    </Col>
                                    <Col md={4}>
                                      <Button 
                                        variant="outline-primary" 
                                        size="sm" 
                                        onClick={fetchBanks}
                                        className="w-100"
                                      >
                                        <FaSync className="me-2" />
                                        Yenile
                                      </Button>
                                    </Col>
                                  </Row>
                                  
                                  {/* Bankalar Tablosu */}
                                  <div className="table-responsive">
                                    <Table size="sm" striped hover>
                                      <thead>
                                        <tr>
                                          <th>ID</th>
                                          <th>Banka Adı</th>
                                          <th>Oluşturulma Tarihi</th>
                                          <th>İşlemler</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {data.banks.map(bank => (
                                          <tr key={bank.id}>
                                            <td>{bank.id}</td>
                                            <td>
                                              <div className="d-flex align-items-center">
                                                <FaBuilding className="me-2 text-primary" />
                                                <span className="fw-medium">{bank.bank_name}</span>
                                              </div>
                                            </td>
                                            <td>{formatDate(bank.created_at)}</td>
                                            <td>
                                              <ButtonGroup size="sm">
                                                <Button variant="outline-warning" size="sm">
                                                  <FaEdit />
                                                </Button>
                                                <Button 
                                                  variant="outline-danger" 
                                                  size="sm"
                                                  onClick={async () => {
                                                    if (!window.confirm(`${bank.bank_name} bankasını silmek istediğinizden emin misiniz?`)) {
                                                      return;
                                                    }
                                                    
                                                    try {
                                                      const response = await fetch(`http://localhost:5000/api/banks/${bank.id}`, {
                                                        method: 'DELETE',
                                                        headers: { 
                                                          'Content-Type': 'application/json',
                                                          'admin-password': adminPassword
                                                        }
                                                      });
                                                      
                                                      if (response.ok) {
                                                        showMessage('success', 'Banka başarıyla silindi!');
                                                        fetchBanks(); // Listeyi yenile
                                                      } else {
                                                        const error = await response.json();
                                                        showMessage('danger', error.error || 'Banka silinirken hata oluştu');
                                                      }
                                                    } catch (error) {
                                                      console.error('Banka silme hatası:', error);
                                                      showMessage('danger', 'Banka silinirken bağlantı hatası oluştu');
                                                    }
                                                  }}
                                                >
                                                  <FaTrash />
                                                </Button>
                                              </ButtonGroup>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </Table>
                                  </div>
                                </div>
                              )}
                            </Accordion.Body>
                          </Accordion.Item>
                        ));
                      })()}
                    </Accordion>
                  </div>

                  {/* Detaylı Tablo Görünümü */}
                  <div>
                    <h6 className="mb-3">
                      <FaTable className="me-2" />
                      Detaylı Tablo Görünümü
                    </h6>
                    <div className="table-responsive">
                      <Table responsive striped hover>
                        <thead className="table-dark">
                          <tr>
                            <th style={{width: '15%'}}>Anahtar</th>
                            <th style={{width: '20%'}}>Değer</th>
                            <th style={{width: '8%'}}>Tip</th>
                            <th style={{width: '10%'}}>Kategori</th>
                            <th style={{width: '25%'}}>Açıklama</th>
                            <th style={{width: '12%'}}>Özellikler</th>
                            <th style={{width: '10%'}}>İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredParameters.map(param => (
                            <tr key={param.id}>
                              <td>
                                <div>
                                  <code className="text-primary">{param.param_key}</code>
                                  <div className="mt-1">
                                    {param.is_required && <Badge bg="danger" size="sm" className="me-1">Zorunlu</Badge>}
                                    {param.is_sensitive && <Badge bg="warning" size="sm" className="me-1">Hassas</Badge>}
                                    {!param.is_editable && <Badge bg="secondary" size="sm" className="me-1">Salt Okunur</Badge>}
                                  </div>
                                </div>
                              </td>
                              <td>
                                {param.is_sensitive ? (
                                  <div>
                                    <span className="text-muted">••••••••</span>
                                    <Button variant="link" size="sm" className="p-0 ms-2" onClick={() => setShowSensitiveValue(param.id)}>
                                      <FaEye />
                                    </Button>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="text-break">{param.param_value}</span>
                                    {param.param_type === 'boolean' && (
                                      <Badge bg={param.param_value === 'true' ? 'success' : 'secondary'} size="sm" className="ms-1">
                                        {param.param_value === 'true' ? 'Açık' : 'Kapalı'}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td>
                                <Badge bg="secondary">{param.param_type}</Badge>
                              </td>
                              <td>
                                <Badge bg="info">{param.category}</Badge>
                              </td>
                              <td>
                                <div className="text-break">
                                  {param.description}
                                  {param.validation_rules && (
                                    <div className="mt-1">
                                      <small className="text-muted">
                                        <FaCode className="me-1" />
                                        {param.validation_rules}
                                      </small>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="small">
                                  {param.min_value && param.max_value && (
                                    <div>Min: {param.min_value}, Max: {param.max_value}</div>
                                  )}
                                  {param.options && (
                                    <div>Seçenekler: {param.options}</div>
                                  )}
                                  {param.default_value && (
                                    <div>Varsayılan: {param.default_value}</div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <ButtonGroup size="sm" vertical>
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm"
                                    onClick={() => {
                                      setParameterForm({
                                        id: param.id,
                                        param_key: param.param_key,
                                        param_value: param.param_value,
                                        param_type: param.param_type,
                                        description: param.description || '',
                                        category: param.category,
                                        is_editable: param.is_editable,
                                        is_sensitive: param.is_sensitive
                                      });
                                      setShowParameterModal(true);
                                    }}
                                    disabled={!param.is_editable}
                                  >
                                    <FaEdit />
                                  </Button>
                                  <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    onClick={() => deleteSystemParameter(param.id)}
                                    disabled={param.is_required}
                                  >
                                    <FaTrash />
                                  </Button>
                                </ButtonGroup>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                </>
              )}

              {/* İstatistikler */}
              <div className="row mt-3">
                <div className="col-md-3">
                  <Card className="text-center">
                    <Card.Body className="py-2">
                      <small className="text-muted">Toplam Parametre</small>
                      <div className="h5 mb-0">{systemParameters.length}</div>
                    </Card.Body>
                  </Card>
                </div>
                <div className="col-md-3">
                  <Card className="text-center">
                    <Card.Body className="py-2">
                      <small className="text-muted">Zorunlu</small>
                      <div className="h5 mb-0">{systemParameters.filter(p => p.is_required).length}</div>
                    </Card.Body>
                  </Card>
                </div>
                <div className="col-md-3">
                  <Card className="text-center">
                    <Card.Body className="py-2">
                      <small className="text-muted">Hassas</small>
                      <div className="h5 mb-0">{systemParameters.filter(p => p.is_sensitive).length}</div>
                    </Card.Body>
                  </Card>
                </div>
                <div className="col-md-3">
                  <Card className="text-center">
                    <Card.Body className="py-2">
                      <small className="text-muted">Kategoriler</small>
                      <div className="h5 mb-0">{new Set(systemParameters.map(p => p.category)).size}</div>
                    </Card.Body>
                  </Card>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="configuration" title="Sistem Konfigürasyonu">
          <Card>
            <Card.Header>
              <h6><FaServer className="me-2" />Sistem Konfigürasyonu</h6>
            </Card.Header>
            <Card.Body>
              <Tabs defaultActiveKey="application" className="mb-3">
                <Tab eventKey="application" title="Uygulama">
                  <Form>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Uygulama Adı</Form.Label>
                          <Form.Control
                            type="text"
                            value={systemConfig.application.name}
                            onChange={(e) => setSystemConfig(prev => ({
                              ...prev,
                              application: { ...prev.application, name: e.target.value }
                            }))}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Versiyon</Form.Label>
                          <Form.Control
                            type="text"
                            value={systemConfig.application.version}
                            onChange={(e) => setSystemConfig(prev => ({
                              ...prev,
                              application: { ...prev.application, version: e.target.value }
                            }))}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Zaman Dilimi</Form.Label>
                          <Form.Select
                            value={systemConfig.application.timezone}
                            onChange={(e) => setSystemConfig(prev => ({
                              ...prev,
                              application: { ...prev.application, timezone: e.target.value }
                            }))}
                          >
                            <option value="Europe/Istanbul">Europe/Istanbul</option>
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">America/New_York</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Para Birimi</Form.Label>
                          <Form.Select
                            value={systemConfig.application.currency}
                            onChange={(e) => setSystemConfig(prev => ({
                              ...prev,
                              application: { ...prev.application, currency: e.target.value }
                            }))}
                          >
                            <option value="TRY">TRY - Türk Lirası</option>
                            <option value="USD">USD - Amerikan Doları</option>
                            <option value="EUR">EUR - Euro</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Form>
                </Tab>
                
                <Tab eventKey="security" title="Güvenlik">
                  <Form>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>JWT Geçerlilik Süresi</Form.Label>
                          <Form.Control
                            type="text"
                            value={systemConfig.security.jwt_expires_in}
                            onChange={(e) => setSystemConfig(prev => ({
                              ...prev,
                              security: { ...prev.security, jwt_expires_in: e.target.value }
                            }))}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Minimum Şifre Uzunluğu</Form.Label>
                          <Form.Control
                            type="number"
                            value={systemConfig.security.password_min_length}
                            onChange={(e) => setSystemConfig(prev => ({
                              ...prev,
                              security: { ...prev.security, password_min_length: parseInt(e.target.value) }
                            }))}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Maksimum Giriş Denemesi</Form.Label>
                          <Form.Control
                            type="number"
                            value={systemConfig.security.max_login_attempts}
                            onChange={(e) => setSystemConfig(prev => ({
                              ...prev,
                              security: { ...prev.security, max_login_attempts: parseInt(e.target.value) }
                            }))}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Oturum Zaman Aşımı (saniye)</Form.Label>
                          <Form.Control
                            type="number"
                            value={systemConfig.security.session_timeout}
                            onChange={(e) => setSystemConfig(prev => ({
                              ...prev,
                              security: { ...prev.security, session_timeout: parseInt(e.target.value) }
                            }))}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Form>
                </Tab>
                
                <Tab eventKey="monitoring" title="İzleme">
                  <Form>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>CPU Kullanım Uyarı Eşiği (%)</Form.Label>
                          <Form.Control
                            type="number"
                            value={systemConfig.monitoring.alert_thresholds.cpu_usage}
                            onChange={(e) => setSystemConfig(prev => ({
                              ...prev,
                              monitoring: {
                                ...prev.monitoring,
                                alert_thresholds: {
                                  ...prev.monitoring.alert_thresholds,
                                  cpu_usage: parseInt(e.target.value)
                                }
                              }
                            }))}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Bellek Kullanım Uyarı Eşiği (%)</Form.Label>
                          <Form.Control
                            type="number"
                            value={systemConfig.monitoring.alert_thresholds.memory_usage}
                            onChange={(e) => setSystemConfig(prev => ({
                              ...prev,
                              monitoring: {
                                ...prev.monitoring,
                                alert_thresholds: {
                                  ...prev.monitoring.alert_thresholds,
                                  memory_usage: parseInt(e.target.value)
                                }
                              }
                            }))}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Form>
                </Tab>
              </Tabs>
              
              <div className="text-end">
                <Button variant="success" className="me-2">
                  <FaSave className="me-2" />
                  Kaydet
                </Button>
                <Button variant="secondary">
                  <FaUndo className="me-2" />
                  Sıfırla
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );

  // Modals
  const renderModals = () => (
    <>
      {/* User Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaUserPlus className="me-2" />
            Yeni Kullanıcı Ekle
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kullanıcı Adı</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>E-posta</Form.Label>
                  <Form.Control
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ad Soyad</Form.Label>
                  <Form.Control
                    type="text"
                    value={userForm.full_name}
                    onChange={(e) => setUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rol</Form.Label>
                  <Form.Select
                    value={userForm.role}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="user">Kullanıcı</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderatör</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>
            İptal
          </Button>
          <Button variant="primary">
            <FaSave className="me-2" />
            Kaydet
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Gizli dosya input'u */}
      <input
        type="file"
        id="importFile"
        accept=".json"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files[0]) {
            importSystemParameters(e.target.files[0], false);
            e.target.value = ''; // Input'u temizle
          }
        }}
      />

      {/* Parameter Modal */}
      <Modal show={showParameterModal} onHide={() => setShowParameterModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaEdit className="me-2" />
            Parametre Düzenle
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Parametre Adı</Form.Label>
                  <Form.Control
                    type="text"
                    value={parameterForm.param_key}
                    onChange={(e) => setParameterForm(prev => ({ ...prev, param_key: e.target.value }))}
                    readOnly
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Değer</Form.Label>
                  <Form.Control
                    type={parameterForm.param_type === 'boolean' ? 'select' : 'text'}
                    value={parameterForm.param_value}
                    onChange={(e) => setParameterForm(prev => ({ ...prev, param_value: e.target.value }))}
                  />
                  {parameterForm.param_type === 'boolean' && (
                    <Form.Select
                      value={parameterForm.param_value}
                      onChange={(e) => setParameterForm(prev => ({ ...prev, param_value: e.target.value }))}
                    >
                      <option value="true">Açık</option>
                      <option value="false">Kapalı</option>
                    </Form.Select>
                  )}
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tip</Form.Label>
                  <Form.Control
                    type="text"
                    value={parameterForm.param_type}
                    readOnly
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kategori</Form.Label>
                  <Form.Control
                    type="text"
                    value={parameterForm.category}
                    readOnly
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={parameterForm.description}
                readOnly
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowParameterModal(false)}>
            İptal
          </Button>
          <Button 
            variant="primary"
            onClick={async () => {
              const success = await updateSystemParameter(parameterForm.id, parameterForm.param_value);
              if (success) {
                setShowParameterModal(false);
                setParameterForm({
                  param_key: '',
                  param_value: '',
                  param_type: 'string',
                  description: '',
                  category: 'general',
                  is_editable: true,
                  is_sensitive: false
                });
              }
            }}
          >
            <FaSave className="me-2" />
            Kaydet
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Parameter Modal */}
      <Modal show={showAddParameterModal} onHide={() => setShowAddParameterModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaPlus className="me-2" />
            Yeni Parametre Ekle
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Parametre Adı *</Form.Label>
                  <Form.Control
                    type="text"
                    value={parameterForm.param_key}
                    onChange={(e) => setParameterForm(prev => ({ ...prev, param_key: e.target.value }))}
                    placeholder="parametre_adi"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Değer *</Form.Label>
                  <Form.Control
                    type="text"
                    value={parameterForm.param_value}
                    onChange={(e) => setParameterForm(prev => ({ ...prev, param_value: e.target.value }))}
                    placeholder="Parametre değeri"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tip</Form.Label>
                  <Form.Select
                    value={parameterForm.param_type}
                    onChange={(e) => setParameterForm(prev => ({ ...prev, param_type: e.target.value }))}
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="json">JSON</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kategori</Form.Label>
                  <Form.Select
                    value={parameterForm.category}
                    onChange={(e) => setParameterForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="general">Genel</option>
                    <option value="financial">Finansal</option>
                    <option value="security">Güvenlik</option>
                    <option value="database">Veritabanı</option>
                    <option value="email">E-posta</option>
                    <option value="ui">Kullanıcı Arayüzü</option>
                    <option value="notification">Bildirim</option>
                    <option value="backup">Yedekleme</option>
                    <option value="monitoring">İzleme</option>
                    <option value="datetime">Tarih/Zaman</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Düzenlenebilir</Form.Label>
                  <Form.Check
                    type="checkbox"
                    checked={parameterForm.is_editable}
                    onChange={(e) => setParameterForm(prev => ({ ...prev, is_editable: e.target.checked }))}
                    label="Parametre düzenlenebilir"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hassas Veri</Form.Label>
                  <Form.Check
                    type="checkbox"
                    checked={parameterForm.is_sensitive}
                    onChange={(e) => setParameterForm(prev => ({ ...prev, is_sensitive: e.target.checked }))}
                    label="Hassas veri (şifre, anahtar vb.)"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={parameterForm.description}
                onChange={(e) => setParameterForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Parametrenin ne işe yaradığını açıklayın"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddParameterModal(false)}>
            İptal
          </Button>
          <Button 
            variant="primary"
            onClick={async () => {
              if (!parameterForm.param_key || parameterForm.param_value === undefined) {
                showMessage('danger', 'Parametre adı ve değeri zorunludur');
                return;
              }
              
              const success = await addSystemParameter(parameterForm);
              if (success) {
                setShowAddParameterModal(false);
                setParameterForm({
                  param_key: '',
                  param_value: '',
                  param_type: 'string',
                  description: '',
                  category: 'general',
                  is_editable: true,
                  is_sensitive: false
                });
              }
            }}
          >
            <FaSave className="me-2" />
            Kaydet
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Admin Settings Modal */}
      <Modal show={showSettingsModal} onHide={() => setShowSettingsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaCog className="me-2" />
            Admin Ayarları
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs defaultActiveKey="general" className="mb-3">
            <Tab eventKey="general" title="Genel Ayarlar">
              <Card>
                <Card.Header>
                  <h6><FaCog className="me-2" />Sistem Ayarları</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Admin Panel Başlığı</Form.Label>
                        <Form.Control
                          type="text"
                          defaultValue="Admin Panel"
                          placeholder="Panel başlığını girin"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Tema</Form.Label>
                        <Form.Select defaultValue="light">
                          <option value="light">Açık Tema</option>
                          <option value="dark">Koyu Tema</option>
                          <option value="auto">Otomatik</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Dil</Form.Label>
                        <Form.Select defaultValue="tr">
                          <option value="tr">Türkçe</option>
                          <option value="en">English</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Zaman Dilimi</Form.Label>
                        <Form.Select defaultValue="Europe/Istanbul">
                          <option value="Europe/Istanbul">Türkiye (UTC+3)</option>
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">New York (UTC-5)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Tab>
            
            <Tab eventKey="security" title="Güvenlik">
              <Card>
                <Card.Header>
                  <h6><FaShieldAlt className="me-2" />Güvenlik Ayarları</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Admin Şifresi</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type="password"
                            placeholder="Yeni admin şifresi"
                          />
                          <Button variant="outline-secondary">
                            <FaEye />
                          </Button>
                        </InputGroup>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Şifre Onayı</Form.Label>
                        <Form.Control
                          type="password"
                          placeholder="Şifreyi tekrar girin"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Oturum Süresi (dakika)</Form.Label>
                        <Form.Control
                          type="number"
                          defaultValue="30"
                          min="5"
                          max="1440"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Maksimum Deneme</Form.Label>
                        <Form.Control
                          type="number"
                          defaultValue="5"
                          min="3"
                          max="10"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="form-check">
                    <Form.Check
                      type="checkbox"
                      id="twoFactorAuth"
                      label="İki Faktörlü Kimlik Doğrulama"
                      defaultChecked={false}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Tab>
            
            <Tab eventKey="notifications" title="Bildirimler">
              <Card>
                <Card.Header>
                  <h6><FaBell className="me-2" />Bildirim Ayarları</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>E-posta Bildirimleri</Form.Label>
                        <Form.Select defaultValue="enabled">
                          <option value="enabled">Aktif</option>
                          <option value="disabled">Pasif</option>
                          <option value="critical">Sadece Kritik</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>E-posta Adresi</Form.Label>
                        <Form.Control
                          type="email"
                          placeholder="admin@example.com"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="form-check mb-3">
                    <Form.Check
                      type="checkbox"
                      id="emailNewUser"
                      label="Yeni kullanıcı kaydı bildirimi"
                      defaultChecked={true}
                    />
                  </div>
                  <div className="form-check mb-3">
                    <Form.Check
                      type="checkbox"
                      id="emailSystemError"
                      label="Sistem hatası bildirimi"
                      defaultChecked={true}
                    />
                  </div>
                  <div className="form-check mb-3">
                    <Form.Check
                      type="checkbox"
                      id="emailBackup"
                      label="Yedekleme bildirimi"
                      defaultChecked={false}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Tab>
            
            <Tab eventKey="danger" title="Tehlikeli İşlemler">
              <Card>
                <Card.Header className="bg-danger text-white">
                  <h6><FaExclamationTriangle className="me-2" />Tehlikeli İşlemler</h6>
                </Card.Header>
                <Card.Body>
                  <Alert variant="danger" className="mb-4">
                    <Alert.Heading>
                      <FaExclamationTriangle className="me-2" />
                      Uyarı!
                    </Alert.Heading>
                    <p>
                      Aşağıdaki işlemler geri alınamaz ve tüm sistem verilerini kalıcı olarak silecektir. 
                      Bu işlemleri yapmadan önce mutlaka yedek alın.
                    </p>
                  </Alert>
                  
                  <Row>
                    <Col md={6}>
                      <Card className="border-danger">
                        <Card.Header className="bg-danger text-white">
                          <h6><FaUsers className="me-2" />Kullanıcı Yönetimi</h6>
                        </Card.Header>
                        <Card.Body>
                          <p className="text-muted">
                            Tüm kullanıcı hesaplarını ve kullanıcı verilerini siler.
                          </p>
                          <Button 
                            variant="outline-danger" 
                            className="w-100"
                            onClick={async () => {
                              if (window.confirm('TÜM KULLANICILARI SİLMEK İSTEDİĞİNİZDEN EMİN MİSİNİZ?\n\nBu işlem geri alınamaz!')) {
                                if (window.confirm('Son uyarı: Bu işlem tüm kullanıcı verilerini kalıcı olarak silecektir. Devam etmek istediğinizden emin misiniz?')) {
                                  try {
                                    const response = await fetch('http://localhost:5000/api/admin/users/all', {
                                      method: 'DELETE',
                                      headers: { 
                                        'Content-Type': 'application/json',
                                        'admin-password': adminPassword
                                      }
                                    });
                                    
                                    if (response.ok) {
                                      showMessage('success', 'Tüm kullanıcılar başarıyla silindi!');
                                      // Dashboard verilerini yenile
                                      fetchDashboardData();
                                    } else {
                                      const error = await response.json();
                                      showMessage('danger', error.error || 'Kullanıcılar silinirken hata oluştu');
                                    }
                                  } catch (error) {
                                    console.error('Kullanıcı silme hatası:', error);
                                    showMessage('danger', 'Kullanıcılar silinirken bağlantı hatası oluştu');
                                  }
                                }
                              }
                            }}
                          >
                            <FaTrash className="me-2" />
                            Tüm Kullanıcıları Sil
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                    
                    <Col md={6}>
                      <Card className="border-danger">
                        <Card.Header className="bg-danger text-white">
                          <h6><FaDatabase className="me-2" />Veri Yönetimi</h6>
                        </Card.Header>
                        <Card.Body>
                          <p className="text-muted">
                            Tüm kullanıcı verilerini siler (gelir, gider, hesaplar, kartlar). 
                            <br />
                            <strong>Sistem verileri korunur:</strong> Bankalar, kategoriler, sistem parametreleri
                          </p>
                          <Button 
                            variant="outline-danger" 
                            className="w-100"
                            onClick={async () => {
                              if (window.confirm('TÜM VERİLERİ SİLMEK İSTEDİĞİNİZDEN EMİN MİSİNİZ?\n\nBu işlem geri alınamaz!')) {
                                if (window.confirm('Son uyarı: Bu işlem tüm finansal verileri kalıcı olarak silecektir. Devam etmek istediğinizden emin misiniz?')) {
                                  try {
                                    const response = await fetch('http://localhost:5000/api/admin/data/all', {
                                      method: 'DELETE',
                                      headers: { 
                                        'Content-Type': 'application/json',
                                        'admin-password': adminPassword
                                      }
                                    });
                                    
                                    if (response.ok) {
                                      showMessage('success', 'Tüm veriler başarıyla silindi! (Sistem verileri korundu)');
                                      // Dashboard verilerini yenile
                                      fetchDashboardData();
                                    } else {
                                      const error = await response.json();
                                      showMessage('danger', error.error || 'Veriler silinirken hata oluştu');
                                    }
                                  } catch (error) {
                                    console.error('Veri silme hatası:', error);
                                    showMessage('danger', 'Veriler silinirken bağlantı hatası oluştu');
                                  }
                                }
                              }
                            }}
                          >
                            <FaTrash className="me-2" />
                            Tüm Verileri Sil
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  
                  <Row className="mt-3">
                    <Col md={12}>
                      <Card className="border-warning">
                        <Card.Header className="bg-warning text-dark">
                          <h6><FaExclamationTriangle className="me-2" />Sistem Sıfırlama</h6>
                        </Card.Header>
                        <Card.Body>
                          <p className="text-muted">
                            Tüm sistemi sıfırlar. Kullanıcılar ve tüm kullanıcı verileri silinir.
                            <br />
                            <strong>Sistem verileri korunur:</strong> Bankalar, kategoriler, sistem parametreleri
                          </p>
                          <Button 
                            variant="outline-warning" 
                            className="w-100"
                            onClick={async () => {
                              if (window.confirm('SİSTEMİ TAMAMEN SIFIRLAMAK İSTEDİĞİNİZDEN EMİN MİSİNİZ?\n\nBu işlem geri alınamaz!')) {
                                if (window.confirm('Son uyarı: Bu işlem tüm sistemi sıfırlayacaktır. Devam etmek istediğinizden emin misiniz?')) {
                                  if (window.confirm('FİNAL UYARI: Bu işlem geri alınamaz! Tüm sistem verileri kalıcı olarak silinecektir. Devam etmek istediğinizden emin misiniz?')) {
                                    try {
                                      const response = await fetch('http://localhost:5000/api/admin/system/reset', {
                                        method: 'DELETE',
                                        headers: { 
                                          'Content-Type': 'application/json',
                                          'admin-password': adminPassword
                                        }
                                      });
                                      
                                      if (response.ok) {
                                        showMessage('success', 'Sistem başarıyla sıfırlandı! (Sistem verileri korundu)');
                                        // Dashboard verilerini yenile
                                        fetchDashboardData();
                                      } else {
                                        const error = await response.json();
                                        showMessage('danger', error.error || 'Sistem sıfırlanırken hata oluştu');
                                      }
                                    } catch (error) {
                                      console.error('Sistem sıfırlama hatası:', error);
                                      showMessage('danger', 'Sistem sıfırlanırken bağlantı hatası oluştu');
                                    }
                                  }
                                }
                              }
                            }}
                          >
                            <FaExclamationTriangle className="me-2" />
                            Sistemi Tamamen Sıfırla
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Tab>
            
            <Tab eventKey="backup" title="Yedekleme">
              <Card>
                <Card.Header>
                  <h6><FaCloud className="me-2" />Yedekleme Ayarları</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Otomatik Yedekleme</Form.Label>
                        <Form.Select defaultValue="daily">
                          <option value="disabled">Pasif</option>
                          <option value="hourly">Saatlik</option>
                          <option value="daily">Günlük</option>
                          <option value="weekly">Haftalık</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Yedek Saklama Süresi</Form.Label>
                        <Form.Select defaultValue="30">
                          <option value="7">7 Gün</option>
                          <option value="30">30 Gün</option>
                          <option value="90">90 Gün</option>
                          <option value="365">1 Yıl</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Button variant="outline-primary" className="w-100">
                        <FaDownload className="me-2" />
                        Manuel Yedek Al
                      </Button>
                    </Col>
                    <Col md={6}>
                      <Button variant="outline-success" className="w-100">
                        <FaUpload className="me-2" />
                        Yedek Yükle
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSettingsModal(false)}>
            <FaTimes className="me-2" />
            İptal
          </Button>
          <Button variant="primary">
            <FaSave className="me-2" />
            Ayarları Kaydet
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );

  // ==================== MAIN RENDER ====================
  return (
    <div className="admin-panel-wrapper">
      {!isAuthenticated ? renderLoginForm() : renderAdminPanel()}
      
      {/* Modals */}
      {renderModals()}
    </div>
  );
};

export default AdminPanel;
