import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Form, 
  Alert, Table, Badge, Modal, ProgressBar,
  Spinner, Accordion, Nav
} from 'react-bootstrap';
import './AdminPanel.css';
import { 
  FaUsers, FaChartBar, FaDatabase, FaCog, 
  FaTrash, FaPlus, FaEye, FaEdit, FaBan,
  FaCheck, FaExclamationTriangle, FaServer,
  FaHdd, FaBars, FaTimes,
  FaCode, FaDownload,
  FaSearch, FaClock, FaUpload
} from 'react-icons/fa';

const AdminPanel = () => {
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Dashboard verileri
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [systemParams, setSystemParams] = useState(null);
  const [newBankName, setNewBankName] = useState('');
  
  // Sistem parametreleri düzenleme state'leri
  const [editingSystemParams, setEditingSystemParams] = useState(false);
  const [systemConfigForm, setSystemConfigForm] = useState({
    database: {},
    application: {},
    security: {}
  });
  
  // Sistem parametreleri yönetimi state'leri
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
    is_editable: true
  });
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkEditParameters, setBulkEditParameters] = useState([]);
  const [importData, setImportData] = useState('');
  const [importOverwrite, setImportOverwrite] = useState(false);
  const [parametersLoading, setParametersLoading] = useState(false);
  
  // Modal durumları
  const [showResetModal, setShowResetModal] = useState(false);
  const [showMockDataModal, setShowMockDataModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Admin girişi
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminPassword) {
      setMessage({ type: 'danger', text: 'Admin şifresi gerekli' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword })
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setMessage({ type: 'success', text: 'Admin girişi başarılı!' });
        fetchDashboardData();
        fetchUsers();
        fetchSystemParams();
        fetchBanks();
        fetchSystemParameters();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'danger', text: errorData.message || 'Geçersiz admin şifresi' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Bağlantı hatası' });
    }
    setLoading(false);
  };

  // Dashboard verilerini getir
  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword })
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Dashboard veri hatası:', error);
    }
  };

  // Kullanıcıları getir
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Kullanıcı listesi hatası:', error);
    }
  };

  // Bankaları getir
  const fetchBanks = async () => {
    try {
      const response = await fetch('/api/banks', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'admin-password': adminPassword
        }
      });
      
      if (response.ok) {
        // const data = await response.json();
        // setBanks(data || []);
      }
    } catch (error) {
      console.error('Bankalar getirme hatası:', error);
    }
  };

  // Yeni banka ekle
  const addBank = async () => {
    if (!newBankName.trim()) {
      setMessage({ type: 'danger', text: 'Banka adı boş olamaz' });
      return;
    }

    try {
      const response = await fetch('/api/banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bank_name: newBankName.trim(),
          adminPassword 
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Banka başarıyla eklendi!' });
        setNewBankName('');
        fetchBanks();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'danger', text: errorData.error || 'Banka eklenirken hata oluştu' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Bağlantı hatası' });
    }
  };

  // Duplicate bankaları temizle
  const cleanDuplicateBanks = async () => {
    if (!window.confirm('⚠️ Duplicate bankaları temizlemek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch('/api/banks/clean-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message });
        fetchBanks();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'danger', text: errorData.error || 'Duplicate temizleme hatası' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Bağlantı hatası' });
    }
  };

  // Tüm bankaları reset et
  const resetAllBanks = async () => {
    if (!window.confirm('⚠️ DİKKAT: Tüm banka listesi temizlenecek ve yeniden oluşturulacak. Bu işlem geri alınamaz! Devam etmek istiyor musunuz?')) {
      return;
    }

    try {
      const response = await fetch('/api/banks/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message });
        fetchBanks();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'danger', text: errorData.error || 'Banka reset hatası' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Bağlantı hatası' });
    }
  };

  // Tek banka sil
  // const deleteBank = async (bankId, bankName) => {
  //   if (!window.confirm(`⚠️ "${bankName}" bankasını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
  //     return;
  //   }

  //   try {
  //     const response = await fetch(`/api/banks/${bankId}`, {
  //       method: 'DELETE',
  //       headers: { 
  //         'Content-Type': 'application/json',
  //         'admin-password': adminPassword
  //       }
  //     });

  //     if (response.ok) {
  //       const data = await response.json();
  //       setMessage({ type: 'success', text: data.message });
  //       fetchBanks();
  //     } else {
  //       const errorData = await response.json();
  //       setMessage({ type: 'danger', text: errorData.error || 'Banka silme hatası' });
  //     }
  //   } catch (error) {
  //     setMessage({ type: 'danger', text: 'Bağlantı hatası' });
  //   }
  // };

  // Sistem parametrelerini getir
  const fetchSystemParams = async () => {
    try {
      const response = await fetch('/api/admin/system-params', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemParams(data.systemParams);
        
        // Form state'ini güncelle
        if (data.systemParams.systemConfig) {
          setSystemConfigForm(data.systemParams.systemConfig);
        }
      }
    } catch (error) {
      console.error('Sistem parametreleri hatası:', error);
    }
  };

  // Sistem parametrelerini getir
  const fetchSystemParameters = async () => {
    try {
      setParametersLoading(true);
      console.log('Sistem parametreleri yükleniyor...');
      const response = await fetch('/api/admin/system-parameters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Sistem parametreleri yüklendi:', data);
        if (data.success && data.parameters) {
          setSystemParameters(data.parameters);
          setFilteredParameters(data.parameters);
        } else {
          console.error('Sistem parametreleri verisi bulunamadı:', data);
          setMessage({ type: 'warning', text: 'Sistem parametreleri yüklenemedi' });
        }
      } else {
        const errorData = await response.json();
        console.error('Sistem parametreleri API hatası:', errorData);
        setMessage({ type: 'danger', text: errorData.message || 'Sistem parametreleri alınamadı' });
      }
    } catch (error) {
      console.error('Sistem parametreleri listesi hatası:', error);
      setMessage({ type: 'danger', text: 'Sistem parametreleri yüklenirken bağlantı hatası oluştu' });
    } finally {
      setParametersLoading(false);
    }
  };

  // Sistem parametrelerini güncelle
  const updateSystemParams = async () => {
    try {
      const response = await fetch('/api/admin/update-system-params', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adminPassword,
          ...systemConfigForm
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message });
        setEditingSystemParams(false);
        fetchSystemParams(); // Güncel verileri yeniden getir
        
        if (data.requiresRestart) {
          setMessage({ 
            type: 'warning', 
            text: 'Port değişikliği için sunucu yeniden başlatılmalı!' 
          });
        }
      } else {
        const errorData = await response.json();
        setMessage({ type: 'danger', text: errorData.message || 'Güncelleme hatası' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Bağlantı hatası' });
    }
  };

  // Sistem parametrelerini sıfırla
  const resetSystemParams = async () => {
    if (!window.confirm('⚠️ Tüm sistem parametreleri varsayılan değerlere sıfırlanacak. Bu işlem geri alınamaz! Devam etmek istiyor musunuz?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/reset-system-params', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword })
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message });
        fetchSystemParams(); // Güncel verileri yeniden getir
      } else {
        const errorData = await response.json();
        setMessage({ type: 'danger', text: errorData.message || 'Sıfırlama hatası' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Bağlantı hatası' });
    }
  };

  // Kullanıcı durumunu değiştir
  const toggleUserStatus = async (userId) => {
    try {
      const response = await fetch('/api/admin/users/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword, userId })
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Kullanıcı durumu güncellendi' });
        fetchUsers();
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Güncelleme hatası' });
    }
  };

  // Veritabanını sıfırla
  const resetDatabase = async () => {
    try {
      const response = await fetch('/api/admin/reset-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword })
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Veritabanı başarıyla sıfırlandı!' });
        setShowResetModal(false);
        fetchDashboardData();
        fetchUsers();
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Sıfırlama hatası' });
    }
  };

  // Mock veri ekle
  const insertMockData = async () => {
    try {
      const response = await fetch('/api/admin/insert-mock-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword })
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message });
        setShowMockDataModal(false);
        fetchDashboardData();
        fetchUsers();
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Mock veri ekleme hatası' });
    }
  };

  // Admin çıkışı
  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminPassword('');
    setDashboardData(null);
    setUsers([]);
    setSystemParams(null);
    setMessage({ type: '', text: '' });
  };

  // Sistem parametreleri yönetimi fonksiyonları
  const updateBulkParameter = (paramId, value) => {
    setBulkEditParameters(prev => {
      const existing = prev.find(p => p.id === paramId);
      if (existing) {
        return prev.map(p => p.id === paramId ? { ...p, param_value: value } : p);
      } else {
        return [...prev, { id: paramId, param_value: value }];
      }
    });
  };

  const openEditModal = (param) => {
    setEditingParameter(param);
    setShowParameterModal(true);
  };

  const handleDeleteParameter = async (paramId) => {
    if (!window.confirm('Bu parametreyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/system-parameters/${paramId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'admin-password': adminPassword
        }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Parametre başarıyla silindi!' });
        fetchSystemParameters();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'danger', text: errorData.message || 'Silme hatası' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Bağlantı hatası' });
    }
  };

  const openAddModal = () => {
    setParameterForm({
      param_key: '',
      param_value: '',
      param_type: 'string',
      description: '',
      category: 'general',
      is_editable: true
    });
    setShowAddParameterModal(true);
  };

  const handleBulkUpdate = async () => {
    if (bulkEditParameters.length === 0) {
      setMessage({ type: 'warning', text: 'Güncellenecek parametre bulunamadı' });
      return;
    }

    try {
      const response = await fetch('/api/admin/system-parameters/bulk-update', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'admin-password': adminPassword
        },
        body: JSON.stringify({ parameters: bulkEditParameters })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Tüm parametreler başarıyla güncellendi!' });
        setBulkEditMode(false);
        setBulkEditParameters([]);
        fetchSystemParameters();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'danger', text: errorData.message || 'Toplu güncelleme hatası' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Bağlantı hatası' });
    }
  };

  const closeBulkEditMode = () => {
    setBulkEditMode(false);
    setBulkEditParameters([]);
  };

  const handleExportParameters = () => {
    const dataStr = JSON.stringify({ parameters: systemParameters }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `system-parameters-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportParameters = async () => {
    if (!importData.trim()) {
      setMessage({ type: 'warning', text: 'Lütfen JSON verisi girin' });
      return;
    }

    try {
      const parsedData = JSON.parse(importData);
      if (!parsedData.parameters || !Array.isArray(parsedData.parameters)) {
        setMessage({ type: 'danger', text: 'Geçersiz JSON formatı' });
        return;
      }

      const response = await fetch('/api/admin/system-parameters/import', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'admin-password': adminPassword
        },
        body: JSON.stringify({ 
          parameters: parsedData.parameters,
          overwrite: importOverwrite
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message || 'Parametreler başarıyla içe aktarıldı!' });
        setImportData('');
        setImportOverwrite(false);
        fetchSystemParameters();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'danger', text: errorData.message || 'İçe aktarma hatası' });
      }
    } catch (error) {
      if (error.name === 'SyntaxError') {
        setMessage({ type: 'danger', text: 'Geçersiz JSON formatı' });
      } else {
        setMessage({ type: 'danger', text: 'Bağlantı hatası' });
      }
    }
  };

  const handleUpdateParameter = async (e) => {
    e.preventDefault();
    if (!editingParameter) return;

    try {
      // Dinamik parametreler için özel güncelleme
      if (editingParameter.param_key === 'expense_categories_list' || editingParameter.param_key === 'banks_list') {
        await handleUpdateDynamicParameter(editingParameter);
        setShowParameterModal(false);
        setEditingParameter(null);
        return;
      }

      // Normal parametre güncelleme
      const response = await fetch(`/api/admin/system-parameters/${editingParameter.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'admin-password': adminPassword
        },
        body: JSON.stringify(editingParameter)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Parametre başarıyla güncellendi!' });
        setShowParameterModal(false);
        setEditingParameter(null);
        fetchSystemParameters();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'danger', text: errorData.message || 'Güncelleme hatası' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Bağlantı hatası' });
    }
  };

  const handleAddParameter = async (e) => {
    e.preventDefault();
    if (!parameterForm.param_key || !parameterForm.param_value) {
      setMessage({ type: 'warning', text: 'Parametre adı ve değeri zorunludur' });
      return;
    }

    try {
      const response = await fetch('/api/admin/system-parameters/add', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'admin-password': adminPassword
        },
        body: JSON.stringify(parameterForm)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Yeni parametre başarıyla eklendi!' });
        setShowAddParameterModal(false);
        setParameterForm({
          param_key: '',
          param_value: '',
          param_type: 'string',
          description: '',
          category: 'general',
          is_editable: true
        });
        fetchSystemParameters();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'danger', text: errorData.message || 'Ekleme hatası' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Bağlantı hatası' });
    }
  };

  // Dinamik parametreleri düzenle
  const handleEditDynamicParameter = (param) => {
    if (param.param_key === 'expense_categories_list') {
      // Gider kategorilerini düzenle
      try {
        const categories = JSON.parse(param.param_value);
        setEditingParameter({
          ...param,
          categories: categories
        });
        setShowParameterModal(true);
      } catch (error) {
        setMessage({ type: 'danger', text: 'Gider kategorileri verisi bozuk' });
      }
    } else if (param.param_key === 'banks_list') {
      // Banka listesini düzenle
      try {
        const banks = JSON.parse(param.param_value);
        setEditingParameter({
          ...param,
          banks: banks
        });
        setShowParameterModal(true);
      } catch (error) {
        setMessage({ type: 'danger', text: 'Banka listesi verisi bozuk' });
      }
    } else {
      // Normal parametre düzenleme
      openEditModal(param);
    }
  };

  // Dinamik parametre güncelleme
  const handleUpdateDynamicParameter = async (param) => {
    try {
      if (param.param_key === 'expense_categories_list') {
        const response = await fetch('/api/admin/expense-categories/update', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'admin-password': adminPassword
          },
          body: JSON.stringify({ categories: param.categories })
        });

        if (response.ok) {
          setMessage({ type: 'success', text: 'Gider kategorileri başarıyla güncellendi!' });
          fetchSystemParameters();
        } else {
          const errorData = await response.json();
          setMessage({ type: 'danger', text: errorData.message || 'Güncelleme hatası' });
        }
      } else if (param.param_key === 'banks_list') {
        const response = await fetch('/api/admin/banks/update', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'admin-password': adminPassword
          },
          body: JSON.stringify({ banks: param.banks })
        });

        if (response.ok) {
          setMessage({ type: 'success', text: 'Banka listesi başarıyla güncellendi!' });
          fetchSystemParameters();
        } else {
          const errorData = await response.json();
          setMessage({ type: 'danger', text: errorData.message || 'Güncelleme hatası' });
        }
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Bağlantı hatası' });
    }
  };

  // Smooth scroll to section
  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Scroll event listener for active section detection
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['dashboard', 'users', 'system'];
      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Parametreleri kategorilere göre grupla
  const groupParameters = (params) => {
    return params.reduce((groups, param) => {
      let category = param.category || 'Genel';
      
      // Özel kategoriler oluştur
      if (param.param_key.includes('currency') || param.param_key.includes('money') || param.param_key.includes('default_currency')) {
        category = 'Para Birimi';
      } else if (param.param_key.includes('security') || param.param_key.includes('auth') || param.param_key.includes('password')) {
        category = 'Güvenlik';
      } else if (param.param_key.includes('income') || param.param_key.includes('expense') || param.param_key.includes('categories')) {
        category = 'Gelir/Gider';
      } else if (param.param_key.includes('bank') || param.param_key.includes('card') || param.param_key.includes('credit')) {
        category = 'Banka/Kredi Kartı';
      } else if (param.param_key.includes('notification') || param.param_key.includes('email') || param.param_key.includes('sms')) {
        category = 'Bildirimler';
      } else if (param.param_key.includes('app') || param.param_key.includes('system') || param.param_key.includes('name')) {
        category = 'Uygulama';
      } else if (param.param_key.includes('loan') || param.param_key.includes('debt')) {
        category = 'Kredi/Borç';
      } else if (param.param_key.includes('payment') || param.param_key.includes('auto')) {
        category = 'Ödeme';
      }
      
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(param);
      return groups;
    }, {});
  };

  // Parametre filtreleme effect'i
  useEffect(() => {
    let filtered = systemParameters;
    
    // Kategori filtreleme
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(param => param.category === selectedCategory);
    }
    
    // Tip filtreleme
    // if (selectedType !== 'all') {
    //   filtered = filtered.filter(param => param.param_type === selectedType);
    // }
    
    // Düzenlenebilir filtreleme
    // if (selectedEditable !== 'all') {
    //   filtered = filtered.filter(param => param.is_editable === (selectedEditable === 'true'));
    // }
    
    // Arama terimi filtreleme
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(param => 
        param.param_key.toLowerCase().includes(term) ||
        param.description.toLowerCase().includes(term) ||
        param.category.toLowerCase().includes(term) ||
        param.param_type.toLowerCase().includes(term)
      );
    }
    
    setFilteredParameters(filtered);
  }, [systemParameters, selectedCategory, searchTerm]);

  // Click outside handler for mobile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('.sidebar') && !event.target.closest('.mobile-menu-toggle')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  // Parametre değerini render et
  const renderParameterValue = (param) => {
    if (param.param_type === 'boolean') {
      return (
        <Badge bg={param.param_value === 'true' ? 'success' : 'danger'}>
          {param.param_value === 'true' ? 'Evet' : 'Hayır'}
        </Badge>
      );
    } else if (param.param_type === 'number') {
      return (
        <Badge bg="info">
          {Number(param.param_value).toLocaleString('tr-TR')}
        </Badge>
      );
    } else if (param.param_type === 'json') {
      try {
        const parsed = JSON.parse(param.param_value);
        if (Array.isArray(parsed)) {
          return (
            <div>
              {parsed.map((item, index) => (
                <Badge key={index} bg="secondary" className="me-1 mb-1">
                  {typeof item === 'object' ? (item.name || item.bank_name || JSON.stringify(item)) : String(item)}
                </Badge>
              ))}
            </div>
          );
        } else {
          return (
            <Badge bg="secondary">
              {JSON.stringify(parsed)}
            </Badge>
          );
        }
      } catch {
        return (
          <Badge bg="warning">
            {param.param_value}
          </Badge>
        );
      }
    } else {
      return (
        <Badge bg="secondary">
          {String(param.param_value)}
        </Badge>
      );
    }
  };

  // Parametre tipini render et
  const renderParameterType = (type) => {
    const typeColors = {
      'string': 'primary',
      'number': 'info',
      'boolean': 'success',
      'json': 'warning',
      'date': 'danger'
    };
    
    return (
      <Badge bg={typeColors[type] || 'secondary'}>
        {type}
      </Badge>
    );
  };



  // Parametre değer input'unu render et
  const renderParameterValueInput = (param, value, onChange, size = "lg") => {
    if (param.param_type === 'boolean') {
      return (
        <Form.Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          size={size}
        >
          <option value="true">Evet</option>
          <option value="false">Hayır</option>
        </Form.Select>
      );
    } else if (param.param_type === 'number') {
      return (
        <Form.Control
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          size={size}
          step="any"
        />
      );
    } else if (param.param_type === 'json') {
      return (
        <Form.Control
          as="textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          size={size}
          rows={3}
          placeholder='["değer1", "değer2"]'
        />
      );
    } else {
      return (
        <Form.Control
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          size={size}
        />
      );
    }
  };

  // Admin giriş formu
  if (!isAuthenticated) {
    return (
      <Container className="mt-5">
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card className="shadow-lg border-0">
              <Card.Header className="bg-danger text-white text-center py-3">
                <h3 className="mb-0">🔐 Admin Girişi</h3>
              </Card.Header>
              <Card.Body className="p-4">
                {message.text && (
                  <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
                    {message.text}
                  </Alert>
                )}

                <Form onSubmit={handleAdminLogin}>
                  <Form.Group className="mb-3">
                    <Form.Label>Admin Şifresi</Form.Label>
                    <Form.Control
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Admin şifresini giriniz"
                      required
                      size="lg"
                    />
                  </Form.Group>

                  <div className="d-grid gap-2">
                    <Button
                      type="submit"
                      variant="danger"
                      size="lg"
                      disabled={loading}
                      className="py-2"
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Giriş yapılıyor...
                        </>
                      ) : (
                        '🚀 Admin Girişi'
                      )}
                    </Button>
                  </div>
                </Form>

                <div className="text-center mt-3">
                  <p className="text-muted mb-0">
                    <small>
                      ⚠️ <strong>Uyarı:</strong> Bu panel sadece sistem yöneticileri içindir.
                    </small>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  // Admin panel ana içeriği
  return (
    <div className="admin-panel d-flex">
      {/* Sol Sidebar - Dikey Navbar */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'show' : ''}`}>
        <div className="sidebar-header">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="mb-0 text-white">
              {!sidebarCollapsed && '🛡️ Admin Panel'}
            </h5>
            <Button
              variant="link"
              className="text-white p-0"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <FaBars /> : <FaTimes />}
            </Button>
          </div>
        </div>
        
        <Nav className="flex-column sidebar-nav">
          <Nav.Link 
            onClick={() => scrollToSection('dashboard')}
            className={`sidebar-link ${activeSection === 'dashboard' ? 'active' : ''}`}
          >
            <FaChartBar className="me-2" />
            {!sidebarCollapsed && 'Dashboard'}
          </Nav.Link>
          <Nav.Link 
            onClick={() => scrollToSection('users')}
            className={`sidebar-link ${activeSection === 'users' ? 'active' : ''}`}
          >
            <FaUsers className="me-2" />
            {!sidebarCollapsed && 'Kullanıcılar'}
          </Nav.Link>
          <Nav.Link 
            onClick={() => scrollToSection('system')}
            className={`sidebar-link ${activeSection === 'system' ? 'active' : ''}`}
          >
            <FaCog className="me-2" />
            {!sidebarCollapsed && 'Sistem Parametreleri'}
          </Nav.Link>
        </Nav>
        
        <div className="sidebar-footer">
          <Button 
            variant="outline-light" 
            size="sm" 
            className="w-100"
            onClick={handleLogout}
          >
            🚪 Çıkış
          </Button>
        </div>
      </div>

      {/* Ana İçerik Alanı */}
      <div className="main-content">
        {/* Mobile Menu Toggle */}
        <div className="d-md-none position-fixed top-0 start-0 p-3 mobile-menu-toggle" style={{ zIndex: 1001 }}>
          <Button
            variant="dark"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-circle"
            style={{ width: '45px', height: '45px' }}
          >
            <FaBars />
          </Button>
        </div>
        
        <Container fluid>
          {message.text && (
            <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
              {message.text}
            </Alert>
          )}

          {loading && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" size="lg" />
              <p className="mt-3 text-muted">Yükleniyor...</p>
            </div>
          )}

          {/* Breadcrumb Navigation */}
          <nav aria-label="breadcrumb" className="mb-4">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <button 
                  type="button"
                  onClick={() => scrollToSection('dashboard')} 
                  className="btn btn-link text-decoration-none p-0 border-0"
                  style={{ color: 'inherit' }}
                >
                  🏠 Ana Sayfa
                </button>
              </li>
              {activeSection !== 'dashboard' && (
                <li className="breadcrumb-item active" aria-current="page">
                  {activeSection === 'users' && '👥 Kullanıcı Yönetimi'}
                  {activeSection === 'system' && '⚙️ Sistem Parametreleri'}
                </li>
              )}
            </ol>
          </nav>

          {/* Dashboard İstatistikleri */}
          <Row className="mb-4" id="dashboard">
            <Col>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h2 className="mb-1">📊 Dashboard İstatistikleri</h2>
                  <p className="text-muted mb-0">Hoş geldiniz! Sistem genel durumu aşağıda görüntülenmektedir.</p>
                </div>
                <div className="text-end">
                  <small className="text-muted d-block">Son Güncelleme</small>
                  <span className="badge bg-info">
                    {new Date().toLocaleString('tr-TR')}
                  </span>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="ms-2"
                    onClick={() => {
                      fetchDashboardData();
                      fetchUsers();
                      fetchSystemParams();
                      fetchBanks();
                    }}
                    title="Tüm verileri yenile"
                  >
                    🔄 Yenile
                  </Button>
                </div>
              </div>
            </Col>
          </Row>

          {dashboardData && (
            <Row className="g-3 mb-4">
              <Col md={3}>
                <Card className="text-center border-0 shadow-sm h-100">
                  <Card.Body className="p-3">
                    <div className="text-primary mb-2">
                      <FaUsers size={24} />
                    </div>
                    <h4 className="mb-1">{dashboardData.stats.totalUsers}</h4>
                    <small className="text-muted">Toplam Kullanıcı</small>
                    <div className="mt-2">
                      <Badge bg="success">{dashboardData.stats.activeUsers} Aktif</Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3}>
                <Card className="text-center border-0 shadow-sm h-100">
                  <Card.Body className="p-3">
                    <div className="text-success mb-2">
                      <FaChartBar size={24} />
                    </div>
                    <h4 className="mb-1">{dashboardData.stats.totalAccounts}</h4>
                    <small className="text-muted">Toplam Hesap</small>
                    <div className="mt-2">
                      <Badge bg="info">{dashboardData.stats.totalCreditCards} Kredi Kartı</Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3}>
                <Card className="text-center border-0 shadow-sm h-100">
                  <Card.Body className="p-3">
                    <div className="text-warning mb-2">
                      <FaPlus size={24} />
                    </div>
                    <h4 className="mb-1">{dashboardData.stats.totalIncomes}</h4>
                    <small className="text-muted">Toplam Gelir</small>
                    <div className="mt-2">
                      <Badge bg="success">{dashboardData.stats.recentUsers} Yeni (7 gün)</Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3}>
                <Card className="text-center border-0 shadow-sm h-100">
                  <Card.Body className="p-3">
                    <div className="text-danger mb-2">
                      <FaTrash size={24} />
                    </div>
                    <h4 className="mb-1">{dashboardData.stats.totalExpenses}</h4>
                    <small className="text-muted">Toplam Gider</small>
                    <div className="mt-2">
                      <Badge bg="warning">{dashboardData.stats.totalRentExpenses} Kira</Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Son Giriş Yapan Kullanıcılar */}
          {dashboardData?.lastLoginUsers && (
            <Row className="mb-4">
              <Col>
                <Card className="border-0 shadow-sm">
                  <Card.Header className="bg-light">
                    <h5 className="mb-0">🕐 Son Giriş Yapan Kullanıcılar</h5>
                  </Card.Header>
                  <Card.Body>
                    <Table responsive>
                      <thead>
                        <tr>
                          <th>Kullanıcı Adı</th>
                          <th>Ad Soyad</th>
                          <th>Son Giriş</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.lastLoginUsers.map((user, index) => (
                          <tr key={index}>
                            <td>
                              <Badge bg="primary">{user.username}</Badge>
                            </td>
                            <td>{user.full_name}</td>
                            <td>
                              <small className="text-muted">
                                {new Date(user.last_login).toLocaleString('tr-TR')}
                              </small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Kullanıcı Yönetimi */}
          <Row className="mb-4" id="users">
            <Col>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">👥 Kullanıcı Yönetimi</h5>
                  <Button variant="outline-primary" size="sm" onClick={() => fetchUsers()}>
                    🔄 Yenile
                  </Button>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover>
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
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>
                            <Badge bg="secondary">{user.username}</Badge>
                          </td>
                          <td>{user.email}</td>
                          <td>{user.full_name}</td>
                          <td>
                            {user.is_active ? (
                              <Badge bg="success">Aktif</Badge>
                            ) : (
                              <Badge bg="danger">Pasif</Badge>
                            )}
                          </td>
                          <td>
                            {user.last_login ? (
                              <small className="text-muted">
                                {new Date(user.last_login).toLocaleString('tr-TR')}
                              </small>
                            ) : (
                              <span className="text-muted">Hiç giriş yapmamış</span>
                            )}
                          </td>
                          <td>
                            <small className="text-muted">
                              {new Date(user.created_at).toLocaleDateString('tr-TR')}
                            </small>
                          </td>
                          <td>
                            <Button
                              variant={user.is_active ? "warning" : "success"}
                              size="sm"
                              onClick={() => toggleUserStatus(user.id)}
                              className="me-1"
                            >
                              {user.is_active ? <FaBan /> : <FaCheck />}
                            </Button>
                            <Button
                              variant="info"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserModal(true);
                              }}
                            >
                              <FaEye />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Sistem Parametreleri - Akordiyon Yapısı */}
          <Row className="mb-4" id="system">
            <Col>
              <h2 className="mb-3">⚙️ Sistem Parametreleri</h2>
              
              <Accordion className="shadow-sm">
                {/* Sunucu Bilgileri */}
                <Accordion.Item eventKey="0">
                  <Accordion.Header>
                    <FaServer className="me-2 text-primary" />
                    <strong>🖥️ Sunucu Bilgileri</strong>
                  </Accordion.Header>
                  <Accordion.Body>
                    {systemParams ? (
                      <Row>
                        <Col md={6}>
                          <Table size="sm">
                            <tbody>
                              <tr>
                                <td><strong>Node.js Versiyonu:</strong></td>
                                <td>{systemParams.serverInfo.version}</td>
                              </tr>
                              <tr>
                                <td><strong>Platform:</strong></td>
                                <td>{systemParams.serverInfo.platform}</td>
                              </tr>
                              <tr>
                                <td><strong>Çalışma Süresi:</strong></td>
                                <td>{Math.floor(systemParams.serverInfo.uptime / 3600)} saat</td>
                              </tr>
                              <tr>
                                <td><strong>Aktif Bağlantılar:</strong></td>
                                <td>{systemParams.activeConnections}</td>
                              </tr>
                            </tbody>
                          </Table>
                        </Col>
                        <Col md={6}>
                          <h6>💾 Bellek Kullanımı</h6>
                          <div className="mb-2">
                            <small>RSS: {(systemParams.serverInfo.memoryUsage.rss / 1024 / 1024).toFixed(2)} MB</small>
                            <ProgressBar 
                              now={(systemParams.serverInfo.memoryUsage.rss / 1024 / 1024 / 100) * 100} 
                              className="mt-1"
                            />
                          </div>
                          <div className="mb-2">
                            <small>Heap Used: {(systemParams.serverInfo.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB</small>
                            <ProgressBar 
                              now={(systemParams.serverInfo.memoryUsage.heapUsed / 1024 / 1024 / 100) * 100} 
                              className="mt-1"
                              variant="warning"
                            />
                          </div>
                        </Col>
                      </Row>
                    ) : (
                      <div className="text-center">
                        <Spinner animation="border" />
                        <p className="mt-2">Sistem parametreleri yükleniyor...</p>
                      </div>
                    )}
                  </Accordion.Body>
                </Accordion.Item>



                {/* Sistem Konfigürasyonu */}
                <Accordion.Item eventKey="2">
                  <Accordion.Header>
                    <FaCog className="me-2 text-warning" />
                    <strong>⚙️ Sistem Konfigürasyonu</strong>
                  </Accordion.Header>
                  <Accordion.Body>
                    {systemParams?.systemConfig ? (
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6>🔧 Düzenlenebilir Sistem Parametreleri</h6>
                          <div>
                            {!editingSystemParams ? (
                              <Button 
                                variant="primary" 
                                size="sm"
                                onClick={() => setEditingSystemParams(true)}
                              >
                                ✏️ Düzenle
                              </Button>
                            ) : (
                              <div>
                                <Button 
                                  variant="success" 
                                  size="sm" 
                                  className="me-2"
                                  onClick={updateSystemParams}
                                >
                                  💾 Kaydet
                                </Button>
                                <Button 
                                  variant="secondary" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingSystemParams(false);
                                    fetchSystemParams(); // Orijinal değerleri geri yükle
                                  }}
                                >
                                  ❌ İptal
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Veritabanı Konfigürasyonu */}
                        <Card className="mb-3">
                          <Card.Header className="bg-info text-white">
                            <h6 className="mb-0">🗄️ Veritabanı Ayarları</h6>
                          </Card.Header>
                          <Card.Body>
                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-2">
                                  <Form.Label>Host</Form.Label>
                                  <Form.Control
                                    type="text"
                                    value={systemConfigForm.database?.host || ''}
                                    onChange={(e) => setSystemConfigForm({
                                      ...systemConfigForm,
                                      database: { ...systemConfigForm.database, host: e.target.value }
                                    })}
                                    disabled={!editingSystemParams}
                                    size="sm"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-2">
                                  <Form.Label>Port</Form.Label>
                                  <Form.Control
                                    type="number"
                                    value={systemConfigForm.database?.port || ''}
                                    onChange={(e) => setSystemConfigForm({
                                      ...systemConfigForm,
                                      database: { ...systemConfigForm.database, port: parseInt(e.target.value) }
                                    })}
                                    disabled={!editingSystemParams}
                                    size="sm"
                                  />
                                </Form.Group>
                              </Col>
                            </Row>
                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-2">
                                  <Form.Label>Kullanıcı Adı</Form.Label>
                                  <Form.Control
                                    type="text"
                                    value={systemConfigForm.database?.user || ''}
                                    onChange={(e) => setSystemConfigForm({
                                      ...systemConfigForm,
                                      database: { ...systemConfigForm.database, user: e.target.value }
                                    })}
                                    disabled={!editingSystemParams}
                                    size="sm"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-2">
                                  <Form.Label>Şifre</Form.Label>
                                  <Form.Control
                                    type="password"
                                    value={systemConfigForm.database?.password || ''}
                                    onChange={(e) => setSystemConfigForm({
                                      ...systemConfigForm,
                                      database: { ...systemConfigForm.database, password: e.target.value }
                                    })}
                                    disabled={!editingSystemParams}
                                    size="sm"
                                  />
                                </Form.Group>
                              </Col>
                            </Row>
                            <Row>
                              <Col md={12}>
                                <Form.Group className="mb-2">
                                  <Form.Label>Veritabanı Adı</Form.Label>
                                  <Form.Control
                                    type="text"
                                    value={systemConfigForm.database?.database || ''}
                                    onChange={(e) => setSystemConfigForm({
                                      ...systemConfigForm,
                                      database: { ...systemConfigForm.database, database: e.target.value }
                                    })}
                                    disabled={!editingSystemParams}
                                    size="sm"
                                  />
                                </Form.Group>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>

                        {/* Uygulama Konfigürasyonu */}
                        <Card className="mb-3">
                          <Card.Header className="bg-success text-white">
                            <h6 className="mb-0">🚀 Uygulama Ayarları</h6>
                          </Card.Header>
                          <Card.Body>
                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-2">
                                  <Form.Label>Port</Form.Label>
                                  <Form.Control
                                    type="number"
                                    value={systemConfigForm.application?.port || ''}
                                    onChange={(e) => setSystemConfigForm({
                                      ...systemConfigForm,
                                      application: { ...systemConfigForm.application, port: parseInt(e.target.value) }
                                    })}
                                    disabled={!editingSystemParams}
                                    size="sm"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-2">
                                  <Form.Label>Admin Şifresi</Form.Label>
                                  <Form.Control
                                    type="password"
                                    value={systemConfigForm.application?.adminPassword || ''}
                                    onChange={(e) => setSystemConfigForm({
                                      ...systemConfigForm,
                                      application: { ...systemConfigForm.application, adminPassword: e.target.value }
                                    })}
                                    disabled={!editingSystemParams}
                                    size="sm"
                                  />
                                </Form.Group>
                              </Col>
                            </Row>
                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-2">
                                  <Form.Label>Oturum Süresi (saniye)</Form.Label>
                                  <Form.Control
                                    type="number"
                                    value={systemConfigForm.application?.sessionTimeout || ''}
                                    onChange={(e) => setSystemConfigForm({
                                      ...systemConfigForm,
                                      application: { ...systemConfigForm.application, sessionTimeout: parseInt(e.target.value) }
                                    })}
                                    disabled={!editingSystemParams}
                                    size="sm"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-2">
                                  <Form.Label>Maksimum Giriş Denemesi</Form.Label>
                                  <Form.Control
                                    type="number"
                                    value={systemConfigForm.application?.maxLoginAttempts || ''}
                                    onChange={(e) => setSystemConfigForm({
                                      ...systemConfigForm,
                                      application: { ...systemConfigForm.application, maxLoginAttempts: parseInt(e.target.value) }
                                    })}
                                    disabled={!editingSystemParams}
                                    size="sm"
                                  />
                                </Form.Group>
                              </Col>
                            </Row>
                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-2">
                                  <Form.Label>Minimum Şifre Uzunluğu</Form.Label>
                                  <Form.Control
                                    type="number"
                                    value={systemConfigForm.application?.passwordMinLength || ''}
                                    onChange={(e) => setSystemConfigForm({
                                      ...systemConfigForm,
                                      application: { ...systemConfigForm.application, passwordMinLength: parseInt(e.target.value) }
                                    })}
                                    disabled={!editingSystemParams}
                                    size="sm"
                                  />
                                </Form.Group>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>

                        {/* Güvenlik Konfigürasyonu */}
                        <Card className="mb-3">
                          <Card.Header className="bg-warning text-dark">
                            <h6 className="mb-0">🔒 Güvenlik Ayarları</h6>
                          </Card.Header>
                          <Card.Body>
                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-2">
                                  <Form.Label>BCrypt Rounds</Form.Label>
                                  <Form.Control
                                    type="number"
                                    value={systemConfigForm.security?.bcryptRounds || ''}
                                    onChange={(e) => setSystemConfigForm({
                                      ...systemConfigForm,
                                      security: { ...systemConfigForm.security, bcryptRounds: parseInt(e.target.value) }
                                    })}
                                    disabled={!editingSystemParams}
                                    size="sm"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-2">
                                  <Form.Label>JWT Geçerlilik Süresi</Form.Label>
                                  <Form.Control
                                    type="text"
                                    value={systemConfigForm.security?.jwtExpiresIn || ''}
                                    onChange={(e) => setSystemConfigForm({
                                      ...systemConfigForm,
                                      security: { ...systemConfigForm.security, jwtExpiresIn: e.target.value }
                                    })}
                                    disabled={!editingSystemParams}
                                    size="sm"
                                    placeholder="24h, 7d, 30d"
                                  />
                                </Form.Group>
                              </Col>
                            </Row>
                            <Row>
                              <Col md={12}>
                                <Form.Group className="mb-2">
                                  <Form.Label>CORS Origin</Form.Label>
                                  <Form.Control
                                    type="text"
                                    value={systemConfigForm.security?.corsOrigin || ''}
                                    onChange={(e) => setSystemConfigForm({
                                      ...systemConfigForm,
                                      security: { ...systemConfigForm.security, corsOrigin: e.target.value }
                                    })}
                                    disabled={!editingSystemParams}
                                    size="sm"
                                    placeholder="* veya http://localhost:3000"
                                  />
                                </Form.Group>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>

                        {/* Sıfırlama Butonu */}
                        <div className="text-center">
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={resetSystemParams}
                            disabled={editingSystemParams}
                          >
                            🔄 Varsayılan Değerlere Sıfırla
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Spinner animation="border" />
                        <p className="mt-2">Sistem konfigürasyonu yükleniyor...</p>
                      </div>
                    )}
                  </Accordion.Body>
                </Accordion.Item>

                {/* Veritabanı İşlemleri */}
                <Accordion.Item eventKey="3">
                  <Accordion.Header>
                    <FaHdd className="me-2 text-info" />
                    <strong>🗄️ Veritabanı İşlemleri</strong>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      <Col md={6}>
                        <Card className="border-warning">
                          <Card.Body className="text-center">
                            <FaExclamationTriangle className="text-warning mb-2" size={32} />
                            <h6>Veritabanını Sıfırla</h6>
                            <p className="text-muted small">
                              Tüm verileri kalıcı olarak siler. Bu işlem geri alınamaz!
                            </p>
                            <Button 
                              variant="warning" 
                              onClick={() => setShowResetModal(true)}
                            >
                              🗑️ Veritabanını Sıfırla
                            </Button>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6}>
                        <Card className="border-success">
                          <Card.Body className="text-center">
                            <FaPlus className="text-success mb-2" size={32} />
                            <h6>Test Verileri Ekle</h6>
                            <p className="text-muted small">
                              3 test kullanıcısı ve örnek veriler ekler
                            </p>
                            <Button 
                              variant="success" 
                              onClick={() => setShowMockDataModal(true)}
                            >
                              📊 Test Verileri Ekle
                            </Button>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>

                {/* Sistem Parametreleri - Yönetim */}
                <Accordion.Item eventKey="4">
                  <Accordion.Header>
                    <FaDatabase className="me-2 text-info" />
                    <strong>⚙️ Sistem Parametreleri Yönetimi</strong>
                  </Accordion.Header>
                  <Accordion.Body>
                    {/* Hızlı İstatistikler */}
                    <Accordion.Item eventKey="4-1">
                      <Accordion.Header>
                        <FaDatabase className="me-2 text-primary" />
                        <strong>📊 Hızlı İstatistikler</strong>
                      </Accordion.Header>
                      <Accordion.Body>
                        <Row className="g-3">
                          <Col md={3}>
                            <Card className="text-center border-0 shadow-sm h-100">
                              <Card.Body className="p-3">
                                <div className="text-primary mb-2">
                                  <FaDatabase size={24} />
                                </div>
                                <h4 className="mb-1">{systemParameters.length}</h4>
                                <small className="text-muted">Toplam Parametre</small>
                              </Card.Body>
                            </Card>
                          </Col>
                          <Col md={3}>
                            <Card className="text-center border-0 shadow-sm h-100">
                              <Card.Body className="p-3">
                                <div className="text-success mb-2">
                                  <FaEdit size={24} />
                                </div>
                                <h4 className="mb-1">{systemParameters.filter(p => p.is_editable).length}</h4>
                                <small className="text-muted">Düzenlenebilir</small>
                              </Card.Body>
                            </Card>
                          </Col>
                          <Col md={3}>
                            <Card className="text-center border-0 shadow-sm h-100">
                              <Card.Body className="p-3">
                                <div className="text-info mb-2">
                                  <FaCog size={24} />
                                </div>
                                <h4 className="mb-1">{systemParameters.filter(p => p.param_type === 'json').length}</h4>
                                <small className="text-muted">JSON Parametre</small>
                              </Card.Body>
                            </Card>
                          </Col>
                          <Col md={3}>
                            <Card className="text-center border-0 shadow-sm h-100">
                              <Card.Body className="p-3">
                                <div className="text-warning mb-2">
                                  <FaExclamationTriangle size={24} />
                                </div>
                                <h4 className="mb-1">{systemParameters.filter(p => p.param_type === 'boolean' && p.param_value === 'false').length}</h4>
                                <small className="text-muted">Pasif Özellik</small>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                      </Accordion.Body>
                    </Accordion.Item>

                    

                                        {/* Basit Filtreleme */}
                    <Accordion.Item eventKey="4-2">
                      <Accordion.Header>
                        <FaSearch className="me-2 text-info" />
                        <strong>🔍 Parametre Filtreleme</strong>
                      </Accordion.Header>
                      <Accordion.Body>
                        <Row className="g-3">
                          <Col md={6}>
                            <Form.Control
                              type="text"
                              placeholder="Parametre adı veya açıklama ile arama..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </Col>
                          <Col md={3}>
                            <Form.Select
                              value={selectedCategory}
                              onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                              <option value="all">Tüm Kategoriler</option>
                              <option value="Para Birimi">💰 Para Birimi</option>
                              <option value="Güvenlik">🔒 Güvenlik</option>
                              <option value="Gelir/Gider">📊 Gelir/Gider</option>
                              <option value="Banka/Kredi Kartı">🏦 Banka/Kredi Kartı</option>
                              <option value="Bildirimler">🔔 Bildirimler</option>
                              <option value="Uygulama">🚀 Uygulama</option>
                            </Form.Select>
                          </Col>
                          <Col md={3}>
                            <Button 
                              variant="outline-primary" 
                              onClick={fetchSystemParameters}
                              disabled={parametersLoading}
                              className="w-100"
                            >
                              {parametersLoading ? (
                                <>
                                  <Spinner animation="border" size="sm" className="me-2" />
                                  Yükleniyor...
                                </>
                              ) : (
                                '🔄 Yenile'
                              )}
                            </Button>
                          </Col>
                        </Row>
                        <div className="mt-3">
                          <Badge bg="info" className="me-2">
                            Toplam: {systemParameters.length}
                          </Badge>
                          <Badge bg="success" className="me-2">
                            Düzenlenebilir: {systemParameters.filter(p => p.is_editable).length}
                          </Badge>
                          <Badge bg="warning">
                            Filtrelenen: {filteredParameters.length}
                          </Badge>
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>



                    {/* Son Güncellemeler */}
                    <Accordion.Item eventKey="4-3">
                      <Accordion.Header>
                        <FaClock className="me-2 text-secondary" />
                        <strong>🕒 Son Güncellemeler</strong>
                      </Accordion.Header>
                      <Accordion.Body>
                        <Row className="g-3">
                          {systemParameters
                            .filter(param => param.updated_at)
                            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                            .slice(0, 4)
                            .map((param) => (
                              <Col xs={6} md={3} key={param.id}>
                                <Card className="text-center border-secondary h-100">
                                  <Card.Body className="p-3">
                                    <div className="text-secondary mb-2">
                                      <FaEdit size={20} />
                                    </div>
                                    <h6 className="mb-1 text-truncate" title={param.param_key}>
                                      {param.param_key}
                                    </h6>
                                    <small className="text-muted d-block">
                                      {new Date(param.updated_at).toLocaleDateString('tr-TR')}
                                    </small>
                                    <small className="text-muted d-block">
                                      {new Date(param.updated_at).toLocaleTimeString('tr-TR')}
                                    </small>
                                  </Card.Body>
                                </Card>
                              </Col>
                            ))}
                        </Row>
                      </Accordion.Body>
                    </Accordion.Item>

                    {/* İstatistikler */}
                    <Accordion.Item eventKey="4-4">
                      <Accordion.Header>
                        <FaChartBar className="me-2 text-info" />
                        <strong>📈 Detaylı İstatistikler</strong>
                      </Accordion.Header>
                      <Accordion.Body>
                        <Row className="g-3">
                          <Col xs={6} md={3}>
                            <Card className="text-center border-info">
                              <Card.Body className="p-3">
                                <div className="text-info mb-2">
                                  <FaDatabase size={24} />
                                </div>
                                <h5 className="mb-1">{systemParameters.length}</h5>
                                <small className="text-muted">Toplam Parametre</small>
                              </Card.Body>
                            </Card>
                          </Col>
                          <Col xs={6} md={3}>
                            <Card className="text-center border-success">
                              <Card.Body className="p-3">
                                <div className="text-success mb-2">
                                  <FaEdit size={24} />
                                </div>
                                <h5 className="mb-1">{systemParameters.filter(p => p.is_editable).length}</h5>
                                <small className="text-muted">Düzenlenebilir</small>
                              </Card.Body>
                            </Card>
                          </Col>
                          <Col xs={6} md={3}>
                            <Card className="text-center border-warning">
                              <Card.Body className="p-3">
                                <div className="text-warning mb-2">
                                  <FaEye size={24} />
                                </div>
                                <h5 className="mb-1">{systemParameters.filter(p => !p.is_editable).length}</h5>
                                <small className="text-muted">Salt Okunur</small>
                              </Card.Body>
                            </Card>
                          </Col>
                          <Col xs={6} md={3}>
                            <Card className="text-center border-primary">
                              <Card.Body className="p-3">
                                <div className="text-primary mb-2">
                                  <FaCode size={24} />
                                </div>
                                <h5 className="mb-1">{systemParameters.filter(p => p.param_type === 'json').length}</h5>
                                <small className="text-muted">JSON Tipi</small>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                      </Accordion.Body>
                    </Accordion.Item>

                    {/* Banka Yönetimi Araçları */}
                    <div className="bank-tools mb-4">
                      <Card className="border-primary">
                        <Card.Header className="bg-primary text-white">
                          <h6 className="mb-0">🏦 Banka Yönetimi Araçları</h6>
                        </Card.Header>
                        <Card.Body>
                          <div className="mb-3">
                            <Row>
                              <Col md={8}>
                                <Form.Control
                                  type="text"
                                  placeholder="Yeni banka adı girin..."
                                  value={newBankName}
                                  onChange={(e) => setNewBankName(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && addBank()}
                                />
                              </Col>
                              <Col md={4}>
                                <Button variant="success" onClick={addBank} className="w-100">
                                  ➕ Banka Ekle
                                </Button>
                              </Col>
                            </Row>
                          </div>

                          <Row>
                            <Col md={6}>
                              <Card className="border-warning">
                                <Card.Body className="text-center">
                                  <FaExclamationTriangle className="text-warning mb-2" size={24} />
                                  <h6>Duplicate Bankaları Temizle</h6>
                                  <p className="text-muted small">
                                    Tekrarlanan banka kayıtlarını temizler
                                  </p>
                                  <Button 
                                    variant="warning" 
                                    onClick={cleanDuplicateBanks}
                                    size="sm"
                                  >
                                    🧹 Duplicate Temizle
                                  </Button>
                                </Card.Body>
                              </Card>
                            </Col>
                            <Col md={6}>
                              <Card className="border-danger">
                                <Card.Body className="text-center">
                                  <FaTrash className="text-danger mb-2" size={24} />
                                  <h6>Banka Listesini Reset Et</h6>
                                  <p className="text-muted small">
                                    Tüm bankaları siler ve standart listeyi yeniden oluşturur
                                  </p>
                                  <Button 
                                    variant="danger" 
                                    onClick={resetAllBanks}
                                    size="sm"
                                  >
                                    🗑️ Reset Et
                                  </Button>
                                </Card.Body>
                              </Card>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </div>

                    <div className="parameter-table">
                      {parametersLoading ? (
                        <div className="text-center py-5">
                          <Spinner animation="border" variant="primary" size="lg" />
                          <p className="mt-3 text-muted">Sistem parametreleri yükleniyor...</p>
                        </div>
                      ) : (
                        <div>
                          {/* Gruplandırılmış Parametreler */}
                          {Object.entries(groupParameters(filteredParameters)).map(([category, params]) => (
                            <div key={category} className="parameter-category mb-4">
                              <Card className="border-primary">
                                <Card.Header className="bg-primary text-white">
                                  <h6 className="mb-0">
                                    {category === 'Para Birimi' && '💰 Para Birimi'}
                                    {category === 'Güvenlik' && '🔒 Güvenlik'}
                                    {category === 'Gelir/Gider' && '📊 Gelir/Gider'}
                                    {category === 'Banka/Kredi Kartı' && '🏦 Banka/Kredi Kartı'}
                                    {category === 'Bildirimler' && '🔔 Bildirimler'}
                                    {category === 'Uygulama' && '🚀 Uygulama'}
                                    {category === 'Kredi/Borç' && '💳 Kredi/Borç'}
                                    {category === 'Ödeme' && '💸 Ödeme'}
                                    {category === 'Genel' && '⚙️ Genel'}
                                    {!['Para Birimi', 'Güvenlik', 'Gelir/Gider', 'Banka/Kredi Kartı', 'Bildirimler', 'Uygulama', 'Kredi/Borç', 'Ödeme', 'Genel'].includes(category) && `📁 ${category}`}
                                  </h6>
                                  <small className="text-white-50">
                                    {params.length} parametre • {params.filter(p => p.is_editable).length} düzenlenebilir
                                  </small>
                                </Card.Header>
                                <Card.Body className="p-0">
                                  <Table responsive hover className="mb-0">
                                    <thead className="table-light">
                                      <tr>
                                        <th>ID</th>
                                        <th>Parametre Adı</th>
                                        <th>Değer</th>
                                        <th>Tip</th>
                                        <th>Açıklama</th>
                                        <th>Düzenlenebilir</th>
                                        <th>Son Güncelleme</th>
                                        <th>İşlemler</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {params.map((param) => (
                                        <tr key={param.id} className="parameter-row">
                                          <td>
                                            <Badge bg="secondary">{param.id}</Badge>
                                          </td>
                                          <td>
                                            <strong className="text-primary">{param.param_key}</strong>
                                          </td>
                                          <td className="parameter-value-cell">
                                            {bulkEditMode ? (
                                              renderParameterValueInput(param, bulkEditParameters.find(bp => bp.id === param.id)?.param_value || param.param_value, (value) => updateBulkParameter(param.id, value), "sm")
                                            ) : (
                                              <div className="parameter-value-display">
                                                {renderParameterValue(param)}
                                              </div>
                                            )}
                                          </td>
                                          <td>{renderParameterType(param.param_type)}</td>
                                          <td>
                                            <small className="text-muted">
                                              {param.description || 'Açıklama yok'}
                                            </small>
                                          </td>
                                          <td>
                                            {param.is_editable ? (
                                              <Badge bg="success">Evet</Badge>
                                            ) : (
                                              <Badge bg="danger">Hayır</Badge>
                                            )}
                                          </td>
                                          <td>
                                            <small className="text-muted">
                                              {param.updated_at ? 
                                                new Date(param.updated_at).toLocaleDateString('tr-TR') : 
                                                'Bilinmiyor'
                                              }
                                            </small>
                                          </td>
                                          <td>
                                            <div className="btn-group" role="group">
                                              <Button
                                                variant="info"
                                                size="sm"
                                                onClick={() => {
                                                  if (param.param_key === 'expense_categories_list' || param.param_key === 'banks_list') {
                                                    handleEditDynamicParameter(param);
                                                  } else {
                                                    openEditModal(param);
                                                  }
                                                }}
                                                disabled={!param.is_editable}
                                                title="Düzenle"
                                              >
                                                <FaEdit />
                                              </Button>
                                              {param.param_key !== 'expense_categories_list' && param.param_key !== 'banks_list' && (
                                                <Button
                                                  variant="danger"
                                                  size="sm"
                                                  onClick={() => handleDeleteParameter(param.id)}
                                                  disabled={!param.is_editable}
                                                  title="Sil"
                                                  className="ms-1"
                                                >
                                                  <FaTrash />
                                                </Button>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                </Card.Body>
                              </Card>
                            </div>
                          ))}
                          
                          {/* Parametre bulunamadı mesajı */}
                          {Object.keys(groupParameters(filteredParameters)).length === 0 && (
                            <div className="text-center py-5">
                              <div className="text-muted">
                                <FaExclamationTriangle className="mb-2" size={24} />
                                <p className="mb-0">Filtrelere uygun parametre bulunamadı</p>
                                <small>Filtreleri temizleyip tekrar deneyin</small>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="d-flex justify-content-end">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={openAddModal}
                      >
                        ➕ Yeni Parametre Ekle
                      </Button>
                    </div>

                                        {/* Toplu Düzenleme */}
                    <Accordion.Item eventKey="4-5">
                      <Accordion.Header>
                        <FaEdit className="me-2 text-warning" />
                        <strong>🔄 Toplu Düzenleme</strong>
                      </Accordion.Header>
                      <Accordion.Body>
                        <div className="d-flex align-items-center mb-3">
                          <Form.Check
                            type="switch"
                            id="bulkEditSwitch"
                            checked={bulkEditMode}
                            onChange={(e) => setBulkEditMode(e.target.checked)}
                            className="me-3"
                          />
                          <span className="text-muted">
                            Toplu düzenleme modunu açarak birden fazla parametreyi aynı anda düzenleyebilirsiniz
                          </span>
                        </div>
                        {bulkEditMode && (
                          <div className="alert alert-info">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>Toplu Düzenleme Modu Aktif</strong>
                                <br />
                                <small className="text-muted">
                                  Parametre değerlerini doğrudan tabloda düzenleyebilirsiniz
                                </small>
                              </div>
                              <div>
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={handleBulkUpdate}
                                  disabled={bulkEditParameters.length === 0}
                                  className="me-2"
                                >
                                  💾 Tüm Değişiklikleri Kaydet
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={closeBulkEditMode}
                                >
                                  ❌ Modu Kapat
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Accordion.Body>
                    </Accordion.Item>

                    {/* Dışa Aktar */}
                    <Accordion.Item eventKey="4-6">
                      <Accordion.Header>
                        <FaDownload className="me-2 text-info" />
                        <strong>📤 Parametreleri Dışa Aktar</strong>
                      </Accordion.Header>
                      <Accordion.Body>
                        <div className="alert alert-light">
                          <p className="mb-2">
                            <strong>JSON Formatında Dışa Aktar:</strong> Tüm sistem parametrelerini JSON dosyası olarak indirin.
                          </p>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={handleExportParameters}
                          >
                            📄 JSON Olarak Dışa Aktar
                          </Button>
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>

                    {/* İçe Aktar */}
                    <Accordion.Item eventKey="4-7">
                      <Accordion.Header>
                        <FaUpload className="me-2 text-success" />
                        <strong>📥 Parametreleri İçe Aktar</strong>
                      </Accordion.Header>
                      <Accordion.Body>
                        <div className="alert alert-light">
                          <p className="mb-2">
                            <strong>JSON Formatında İçe Aktar:</strong> Daha önce dışa aktarılan parametreleri geri yükleyin.
                          </p>
                          <Form.Group className="mb-3">
                            <Form.Label>JSON Verisi:</Form.Label>
                            <Form.Control
                              as="textarea"
                              value={importData}
                              onChange={(e) => setImportData(e.target.value)}
                              placeholder='{"parameters": [{"param_key": "example", "param_value": "value", "param_type": "string", "description": "Açıklama", "category": "general", "is_editable": true}]}'
                              rows={6}
                              className="font-monospace"
                            />
                          </Form.Group>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <Form.Check
                              type="checkbox"
                              id="overwriteSwitch"
                              label="Var olan parametreleri üzerine yaz"
                              checked={importOverwrite}
                              onChange={(e) => setImportOverwrite(e.target.checked)}
                            />
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={handleImportParameters}
                              disabled={!importData}
                            >
                              📥 Parametreleri İçe Aktar
                            </Button>
                          </div>
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Veritabanı Sıfırlama Modal */}
      <Modal show={showResetModal} onHide={() => setShowResetModal(false)}>
        <Modal.Header closeButton className="bg-warning text-white">
          <Modal.Title>⚠️ Dikkat!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>Bu işlem geri alınamaz!</strong></p>
          <p>Tüm kullanıcı verileri, hesaplar, kredi kartları, gelirler ve giderler kalıcı olarak silinecektir.</p>
          <p>Devam etmek istediğinizden emin misiniz?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResetModal(false)}>
            İptal
          </Button>
          <Button variant="danger" onClick={resetDatabase}>
            🗑️ Evet, Sıfırla
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Mock Veri Ekleme Modal */}
      <Modal show={showMockDataModal} onHide={() => setShowMockDataModal(false)}>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>📊 Test Verileri Ekle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Aşağıdaki test verileri eklenecektir:</p>
          <ul>
            <li><strong>3 Test Kullanıcısı:</strong> test1, test2, test3 (şifre: 12345)</li>
            <li><strong>3 Test Bankası</strong></li>
            <li><strong>3 Test Hesabı</strong></li>
            <li><strong>3 Test Kredi Kartı</strong></li>
            <li><strong>3 Test Geliri</strong></li>
            <li><strong>3 Test Gideri</strong></li>
            <li><strong>2 Test Kira Gideri</strong></li>
          </ul>
          <p>Devam etmek istiyor musunuz?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMockDataModal(false)}>
            İptal
          </Button>
          <Button variant="success" onClick={insertMockData}>
            📊 Evet, Ekle
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Kullanıcı Detay Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>👤 Kullanıcı Detayları</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <Row>
              <Col md={6}>
                <h6>Kişisel Bilgiler</h6>
                <Table size="sm">
                  <tbody>
                    <tr>
                      <td><strong>ID:</strong></td>
                      <td>{selectedUser.id}</td>
                    </tr>
                    <tr>
                      <td><strong>Kullanıcı Adı:</strong></td>
                      <td>{selectedUser.username}</td>
                    </tr>
                    <tr>
                      <td><strong>E-posta:</strong></td>
                      <td>{selectedUser.email}</td>
                    </tr>
                    <tr>
                      <td><strong>Ad Soyad:</strong></td>
                      <td>{selectedUser.full_name}</td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              <Col md={6}>
                <h6>Hesap Bilgileri</h6>
                <Table size="sm">
                  <tbody>
                    <tr>
                      <td><strong>Durum:</strong></td>
                      <td>
                        {selectedUser.is_active ? (
                          <Badge bg="success">Aktif</Badge>
                        ) : (
                          <Badge bg="danger">Pasif</Badge>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Son Giriş:</strong></td>
                      <td>
                        {selectedUser.last_login ? (
                          <small>{new Date(selectedUser.last_login).toLocaleString('tr-TR')}</small>
                        ) : (
                          <span className="text-muted">Hiç giriş yapmamış</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Kayıt Tarihi:</strong></td>
                      <td>
                        <small>{new Date(selectedUser.created_at).toLocaleString('tr-TR')}</small>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Güncelleme:</strong></td>
                      <td>
                        <small>{new Date(selectedUser.updated_at).toLocaleString('tr-TR')}</small>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>
            Kapat
          </Button>
        </Modal.Footer>
      </Modal>

             {/* Parametre Düzenleme Modal */}
       <Modal show={showParameterModal} onHide={() => setShowParameterModal(false)} size="lg" className="parameter-modal">
        <Modal.Header closeButton>
          <Modal.Title>✏️ Parametre Düzenle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdateParameter}>
            <Form.Group className="mb-3">
              <Form.Label>Parametre Adı</Form.Label>
              <Form.Control
                type="text"
                value={editingParameter?.param_key || ''}
                onChange={(e) => setEditingParameter({ ...editingParameter, param_key: e.target.value })}
                size="lg"
                disabled={editingParameter?.param_key === 'expense_categories_list' || editingParameter?.param_key === 'banks_list'}
              />
            </Form.Group>
            
            {/* Gider kategorileri için özel düzenleme */}
            {editingParameter?.param_key === 'expense_categories_list' && editingParameter?.categories ? (
              <div>
                <Form.Label>Gider Kategorileri</Form.Label>
                {editingParameter.categories.map((category, index) => (
                  <Row key={index} className="mb-2">
                    <Col md={6}>
                      <Form.Control
                        type="text"
                        placeholder="Kategori adı"
                        value={category.name || ''}
                        onChange={(e) => {
                          const newCategories = [...editingParameter.categories];
                          newCategories[index] = { ...newCategories[index], name: e.target.value };
                          setEditingParameter({ ...editingParameter, categories: newCategories });
                        }}
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Control
                        type="color"
                        value={category.color || '#007bff'}
                        onChange={(e) => {
                          const newCategories = [...editingParameter.categories];
                          newCategories[index] = { ...newCategories[index], color: e.target.value };
                          setEditingParameter({ ...editingParameter, categories: newCategories });
                        }}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Control
                        type="text"
                        placeholder="🏠"
                        value={category.icon || ''}
                        onChange={(e) => {
                          const newCategories = [...editingParameter.categories];
                          newCategories[index] = { ...newCategories[index], icon: e.target.value };
                          setEditingParameter({ ...editingParameter, categories: newCategories });
                        }}
                      />
                    </Col>
                    <Col md={1}>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          const newCategories = editingParameter.categories.filter((_, i) => i !== index);
                          setEditingParameter({ ...editingParameter, categories: newCategories });
                        }}
                      >
                        ✕
                      </Button>
                    </Col>
                  </Row>
                ))}
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => {
                    const newCategories = [...(editingParameter.categories || []), { name: '', color: '#007bff', icon: '📌' }];
                    setEditingParameter({ ...editingParameter, categories: newCategories });
                  }}
                >
                  ➕ Kategori Ekle
                </Button>
              </div>
            ) : editingParameter?.param_key === 'banks_list' && editingParameter?.banks ? (
              /* Banka listesi için özel düzenleme */
              <div>
                <Form.Label>Banka Listesi</Form.Label>
                {editingParameter.banks.map((bank, index) => (
                  <Row key={index} className="mb-2">
                    <Col md={10}>
                      <Form.Control
                        type="text"
                        placeholder="Banka adı"
                        value={bank.bank_name || ''}
                        onChange={(e) => {
                          const newBanks = [...editingParameter.banks];
                          newBanks[index] = { ...newBanks[index], bank_name: e.target.value };
                          setEditingParameter({ ...editingParameter, banks: newBanks });
                        }}
                      />
                    </Col>
                    <Col md={2}>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          const newBanks = editingParameter.banks.filter((_, i) => i !== index);
                          setEditingParameter({ ...editingParameter, banks: newBanks });
                        }}
                      >
                        ✕
                      </Button>
                    </Col>
                  </Row>
                ))}
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => {
                    const newBanks = [...(editingParameter.banks || []), { bank_name: '', id: `new_${Date.now()}` }];
                    setEditingParameter({ ...editingParameter, banks: newBanks });
                  }}
                >
                  ➕ Banka Ekle
                </Button>
              </div>
            ) : (
              /* Normal parametre düzenleme */
              <Form.Group className="mb-3">
                <Form.Label>Değer</Form.Label>
                {renderParameterValueInput(
                  { param_type: editingParameter?.param_type || 'string' },
                  editingParameter?.param_value || '',
                  (value) => setEditingParameter({ ...editingParameter, param_value: value })
                )}
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Tip</Form.Label>
              <Form.Select
                value={editingParameter?.param_type || ''}
                onChange={(e) => setEditingParameter({ ...editingParameter, param_type: e.target.value })}
                size="lg"
              >
                <option value="string">String (Metin)</option>
                <option value="number">Number (Sayı)</option>
                <option value="boolean">Boolean (Evet/Hayır)</option>
                <option value="json">JSON (Dizi/Obje)</option>
                <option value="date">Date (Tarih)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                type="text"
                value={editingParameter?.description || ''}
                onChange={(e) => setEditingParameter({ ...editingParameter, description: e.target.value })}
                size="lg"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Kategori</Form.Label>
              <Form.Select
                value={editingParameter?.category || ''}
                onChange={(e) => setEditingParameter({ ...editingParameter, category: e.target.value })}
                size="lg"
              >
                <option value="general">Genel</option>
                <option value="financial">Finansal</option>
                <option value="income">Gelir</option>
                <option value="expense">Gider</option>
                <option value="account">Hesap</option>
                <option value="credit_card">Kredi Kartı</option>
                <option value="loan">Kredi</option>
                <option value="notifications">Bildirimler</option>
                <option value="security">Güvenlik</option>
                <option value="system">Sistem</option>
                <option value="localization">Lokalizasyon</option>
                <option value="reporting">Raporlama</option>
                <option value="api">API</option>
                <option value="ai">AI & Otomasyon</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Düzenlenebilir</Form.Label>
              <Form.Check
                type="checkbox"
                checked={editingParameter?.is_editable || false}
                onChange={(e) => setEditingParameter({ ...editingParameter, is_editable: e.target.checked })}
              />
            </Form.Group>
            <div className="d-grid gap-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Kaydediliyor...
                  </>
                ) : (
                  '💾 Kaydet'
                )}
              </Button>
              <Button variant="secondary" size="lg" onClick={() => setShowParameterModal(false)}>
                ❌ İptal
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

             {/* Yeni Parametre Ekleme Modal */}
       <Modal show={showAddParameterModal} onHide={() => setShowAddParameterModal(false)} size="lg" className="parameter-modal">
        <Modal.Header closeButton>
          <Modal.Title>➕ Yeni Parametre Ekle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddParameter}>
            <Form.Group className="mb-3">
              <Form.Label>Parametre Adı</Form.Label>
              <Form.Control
                type="text"
                value={parameterForm.param_key}
                onChange={(e) => setParameterForm({ ...parameterForm, param_key: e.target.value })}
                placeholder="Örn: max_login_attempts"
                required
                size="lg"
              />
            </Form.Group>
                         <Form.Group className="mb-3">
               <Form.Label>Değer</Form.Label>
               {renderParameterValueInput(
                 { param_type: parameterForm.param_type },
                 parameterForm.param_value,
                 (value) => setParameterForm({ ...parameterForm, param_value: value })
               )}
             </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tip</Form.Label>
              <Form.Select
                value={parameterForm.param_type}
                onChange={(e) => setParameterForm({ ...parameterForm, param_type: e.target.value })}
                placeholder="Örn: number"
                required
                size="lg"
              >
                <option value="string">String (Metin)</option>
                <option value="number">Number (Sayı)</option>
                <option value="boolean">Boolean (Evet/Hayır)</option>
                <option value="json">JSON (Dizi/Obje)</option>
                <option value="date">Date (Tarih)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                type="text"
                value={parameterForm.description}
                onChange={(e) => setParameterForm({ ...parameterForm, description: e.target.value })}
                placeholder="Parametrenin amacını açıklayın"
                size="lg"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Kategori</Form.Label>
              <Form.Select
                value={parameterForm.category}
                onChange={(e) => setParameterForm({ ...parameterForm, category: e.target.value })}
                required
                size="lg"
              >
                <option value="general">Genel</option>
                <option value="financial">Finansal</option>
                <option value="income">Gelir</option>
                <option value="expense">Gider</option>
                <option value="account">Hesap</option>
                <option value="credit_card">Kredi Kartı</option>
                <option value="loan">Kredi</option>
                <option value="notifications">Bildirimler</option>
                <option value="security">Güvenlik</option>
                <option value="system">Sistem</option>
                <option value="localization">Lokalizasyon</option>
                <option value="reporting">Raporlama</option>
                <option value="api">API</option>
                <option value="ai">AI & Otomasyon</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Düzenlenebilir</Form.Label>
              <Form.Check
                type="checkbox"
                checked={parameterForm.is_editable}
                onChange={(e) => setParameterForm({ ...parameterForm, is_editable: e.target.checked })}
              />
            </Form.Group>
            <div className="d-grid gap-2">
              <Button
                type="submit"
                variant="success"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Eklendi...
                  </>
                ) : (
                  '➕ Ekle'
                )}
              </Button>
              <Button variant="secondary" size="lg" onClick={() => setShowAddParameterModal(false)}>
                ❌ İptal
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AdminPanel;
