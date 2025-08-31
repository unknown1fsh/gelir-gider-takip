import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Form, Button, 
  Alert, Image, Tabs, Tab,
  Modal, Spinner
} from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import BackButton from './BackButton';
import { 
  FaUser, FaShieldAlt, FaKey, FaEdit,
  FaSave, FaTimes, FaTrash,
  FaDownload, FaCog, FaPalette
} from 'react-icons/fa';
import './UserProfile.css';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profil bilgileri
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    birth_date: '',
    bio: '',
    avatar: null
  });
  
  // Güvenlik ayarları
  const [securityData, setSecurityData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
    two_factor_enabled: false,
    login_notifications: true,
    session_timeout: 30
  });
  
  // Görünüm ayarları
  const [appearanceData, setAppearanceData] = useState({
    theme: 'light',
    language: 'tr',
    currency: 'TRY',
    date_format: 'DD/MM/YYYY',
    time_format: '24h',
    notifications_enabled: true,
    email_notifications: true,
    push_notifications: false
  });
  
  // Modal durumları
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Avatar yükleme
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        birth_date: user.birth_date || '',
        bio: user.bio || '',
        avatar: user.avatar || null
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecurityData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAppearanceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAppearanceData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(profileData).forEach(key => {
        if (profileData[key] !== null && profileData[key] !== '') {
          formData.append(key, profileData[key]);
        }
      });
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await axios.put('/api/user/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Profil başarıyla güncellendi!' });
        setShowAvatarModal(false);
      }
    } catch (error) {
      setMessage({ 
        type: 'danger', 
        text: error.response?.data?.message || 'Profil güncellenirken hata oluştu' 
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (securityData.new_password !== securityData.confirm_password) {
      setMessage({ type: 'danger', text: 'Yeni şifreler eşleşmiyor!' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put('/api/user/password', {
        current_password: securityData.current_password,
        new_password: securityData.new_password
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Şifre başarıyla güncellendi!' });
        // setShowPasswordModal(false);
        setSecurityData(prev => ({
          ...prev,
          current_password: '',
          new_password: '',
          confirm_password: ''
        }));
      }
    } catch (error) {
      setMessage({ 
        type: 'danger', 
        text: error.response?.data?.message || 'Şifre güncellenirken hata oluştu' 
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAppearance = async () => {
    setLoading(true);
    try {
      const response = await axios.put('/api/user/appearance', appearanceData);

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Görünüm ayarları güncellendi!' });
      }
    } catch (error) {
      setMessage({ 
        type: 'danger', 
        text: error.response?.data?.message || 'Ayarlar güncellenirken hata oluştu' 
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm('Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete('/api/user/account');
      if (response.data.success) {
        logout();
      }
    } catch (error) {
      setMessage({ 
        type: 'danger', 
        text: error.response?.data?.message || 'Hesap silinirken hata oluştu' 
      });
    } finally {
      setLoading(false);
    }
  };

  const exportUserData = async () => {
    try {
      const response = await axios.get('/api/user/export-data', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `user-data-${user.username}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setMessage({ 
        type: 'danger', 
        text: 'Veri dışa aktarılırken hata oluştu' 
      });
    }
  };

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Container fluid className="user-profile-container">
      <BackButton />
      
      {message.text && (
        <Alert 
          variant={message.type} 
          dismissible 
          onClose={() => setMessage({ type: '', text: '' })}
          className="mb-4"
        >
          {message.text}
        </Alert>
      )}

      <Row className="mb-4">
        <Col>
          <h1 className="profile-title">
            <FaUser className="me-3" />
            Kullanıcı Profili
          </h1>
          <p className="text-muted">Profil bilgilerinizi yönetin ve hesap ayarlarınızı özelleştirin</p>
        </Col>
      </Row>

      <Row>
        <Col lg={4} className="mb-4">
          {/* Profil Kartı */}
          <Card className="profile-card h-100">
            <Card.Body className="text-center">
              <div className="avatar-container mb-4">
                <div className="profile-avatar-container">
                  {user.avatar || avatarPreview ? (
                    <Image 
                      src={user.avatar || avatarPreview} 
                      alt={user.full_name}
                      className="profile-avatar"
                      roundedCircle
                    />
                  ) : (
                    <div className="profile-avatar-placeholder">
                      {user.full_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="avatar-edit-btn"
                  onClick={() => setShowAvatarModal(true)}
                >
                  <FaEdit />
                </Button>
              </div>
              
              <h4 className="mb-2">{user.full_name || user.username}</h4>
              <p className="text-muted mb-3">@{user.username}</p>
              
              <div className="profile-stats">
                <Row>
                  <Col>
                    <div className="stat-item">
                      <h5>0</h5>
                      <small>Hesap</small>
                    </div>
                  </Col>
                  <Col>
                    <div className="stat-item">
                      <h5>0</h5>
                      <small>Gelir</small>
                    </div>
                  </Col>
                  <Col>
                    <div className="stat-item">
                      <h5>0</h5>
                      <small>Gider</small>
                    </div>
                  </Col>
                </Row>
              </div>
              
              <div className="profile-actions mt-4">
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="w-100 mb-2"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <FaTrash className="me-2" />
                  Hesabı Sil
                </Button>
                
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="w-100"
                  onClick={exportUserData}
                >
                  <FaDownload className="me-2" />
                  Verileri Dışa Aktar
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          {/* Ana İçerik */}
          <Card>
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="profile-tabs"
              >
                {/* Profil Sekmesi */}
                <Tab eventKey="profile" title={
                  <span><FaUser className="me-2" />Profil</span>
                }>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Ad Soyad</Form.Label>
                        <Form.Control
                          type="text"
                          name="full_name"
                          value={profileData.full_name}
                          onChange={handleProfileChange}
                          placeholder="Ad soyadınızı girin"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>E-posta</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={profileData.email}
                          onChange={handleProfileChange}
                          placeholder="E-posta adresinizi girin"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Telefon</Form.Label>
                        <Form.Control
                          type="tel"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleProfileChange}
                          placeholder="Telefon numaranızı girin"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Doğum Tarihi</Form.Label>
                        <Form.Control
                          type="date"
                          name="birth_date"
                          value={profileData.birth_date}
                          onChange={handleProfileChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Adres</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="address"
                      value={profileData.address}
                      onChange={handleProfileChange}
                      placeholder="Adresinizi girin"
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Label>Hakkımda</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="bio"
                      value={profileData.bio}
                      onChange={handleProfileChange}
                      placeholder="Kendiniz hakkında kısa bir açıklama yazın"
                    />
                  </Form.Group>
                  
                  <div className="d-flex justify-content-end">
                    <Button
                      variant="primary"
                      onClick={updateProfile}
                      disabled={loading}
                    >
                      {loading ? (
                        <Spinner animation="border" size="sm" className="me-2" />
                      ) : (
                        <FaSave className="me-2" />
                      )}
                      Profili Güncelle
                    </Button>
                  </div>
                </Tab>

                {/* Güvenlik Sekmesi */}
                <Tab eventKey="security" title={
                  <span><FaShieldAlt className="me-2" />Güvenlik</span>
                }>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Mevcut Şifre</Form.Label>
                        <Form.Control
                          type="password"
                          name="current_password"
                          value={securityData.current_password}
                          onChange={handleSecurityChange}
                          placeholder="Mevcut şifrenizi girin"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Yeni Şifre</Form.Label>
                        <Form.Control
                          type="password"
                          name="new_password"
                          value={securityData.new_password}
                          onChange={handleSecurityChange}
                          placeholder="Yeni şifrenizi girin"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Yeni Şifre (Tekrar)</Form.Label>
                        <Form.Control
                          type="password"
                          name="confirm_password"
                          value={securityData.confirm_password}
                          onChange={handleSecurityChange}
                          placeholder="Yeni şifrenizi tekrar girin"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Oturum Zaman Aşımı</Form.Label>
                        <Form.Select
                          name="session_timeout"
                          value={securityData.session_timeout}
                          onChange={handleSecurityChange}
                        >
                          <option value={15}>15 dakika</option>
                          <option value={30}>30 dakika</option>
                          <option value={60}>1 saat</option>
                          <option value={120}>2 saat</option>
                          <option value={0}>Sınırsız</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-4">
                    <Form.Check
                      type="checkbox"
                      name="login_notifications"
                      checked={securityData.login_notifications}
                      onChange={handleSecurityChange}
                      label="Yeni giriş yapıldığında e-posta bildirimi gönder"
                    />
                  </Form.Group>
                  
                  <div className="d-flex justify-content-end">
                    <Button
                      variant="primary"
                      onClick={updatePassword}
                      disabled={loading}
                    >
                      {loading ? (
                        <Spinner animation="border" size="sm" className="me-2" />
                      ) : (
                        <FaKey className="me-2" />
                      )}
                      Şifreyi Güncelle
                    </Button>
                  </div>
                </Tab>

                {/* Görünüm Sekmesi */}
                <Tab eventKey="appearance" title={
                  <span><FaPalette className="me-2" />Görünüm</span>
                }>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Tema</Form.Label>
                        <Form.Select
                          name="theme"
                          value={appearanceData.theme}
                          onChange={handleAppearanceChange}
                        >
                          <option value="light">Açık Tema</option>
                          <option value="dark">Koyu Tema</option>
                          <option value="auto">Otomatik</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Dil</Form.Label>
                        <Form.Select
                          name="language"
                          value={appearanceData.language}
                          onChange={handleAppearanceChange}
                        >
                          <option value="tr">Türkçe</option>
                          <option value="en">English</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Para Birimi</Form.Label>
                        <Form.Select
                          name="currency"
                          value={appearanceData.currency}
                          onChange={handleAppearanceChange}
                        >
                          <option value="TRY">Türk Lirası (₺)</option>
                          <option value="USD">Amerikan Doları ($)</option>
                          <option value="EUR">Euro (€)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Tarih Formatı</Form.Label>
                        <Form.Select
                          name="date_format"
                          value={appearanceData.date_format}
                          onChange={handleAppearanceChange}
                        >
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-4">
                    <Form.Check
                      type="checkbox"
                      name="notifications_enabled"
                      checked={appearanceData.notifications_enabled}
                      onChange={handleAppearanceChange}
                      label="Bildirimleri etkinleştir"
                    />
                  </Form.Group>
                  
                  <div className="d-flex justify-content-end">
                    <Button
                      variant="primary"
                      onClick={updateAppearance}
                      disabled={loading}
                    >
                      {loading ? (
                        <Spinner animation="border" size="sm" className="me-2" />
                      ) : (
                        <FaCog className="me-2" />
                      )}
                      Ayarları Kaydet
                    </Button>
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Avatar Düzenleme Modal */}
      <Modal show={showAvatarModal} onHide={() => setShowAvatarModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Profil Fotoğrafı Düzenle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Fotoğraf Seç</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </Form.Group>
          
          {avatarPreview && (
            <div className="text-center mb-3">
              <img 
                src={avatarPreview} 
                alt="Önizleme" 
                className="img-thumbnail"
                style={{ maxWidth: '200px' }}
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAvatarModal(false)}>
            <FaTimes className="me-2" />
            İptal
          </Button>
          <Button variant="primary" onClick={updateProfile} disabled={loading}>
            {loading ? (
              <Spinner animation="border" size="sm" className="me-2" />
            ) : (
              <FaSave className="me-2" />
            )}
            Kaydet
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Hesap Silme Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">
            <FaTrash className="me-2" />
            Hesabı Sil
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <strong>Dikkat!</strong> Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.
          </Alert>
          <p>Hesabınızı silmek istediğinizden emin misiniz?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            <FaTimes className="me-2" />
            İptal
          </Button>
          <Button variant="danger" onClick={deleteAccount} disabled={loading}>
            {loading ? (
              <Spinner animation="border" size="sm" className="me-2" />
            ) : (
              <FaTrash className="me-2" />
            )}
            Hesabı Sil
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserProfile;
