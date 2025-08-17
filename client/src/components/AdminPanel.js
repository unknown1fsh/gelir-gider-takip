import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Form, 
  Alert, Table, Badge, Modal, ProgressBar,
  Nav, Navbar, NavDropdown, Spinner
} from 'react-bootstrap';
import { 
  FaUsers, FaChartBar, FaDatabase, FaCog, 
  FaTrash, FaPlus, FaEye, FaEdit, FaBan,
  FaCheck, FaExclamationTriangle, FaServer,
  FaHdd, FaNetworkWired, FaMemory, FaClock
} from 'react-icons/fa';

const AdminPanel = () => {
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Dashboard verileri
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [systemParams, setSystemParams] = useState(null);
  
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
      const response = await fetch('/api/admin/dashboard', {
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
      } else {
        setMessage({ type: 'danger', text: 'Geçersiz admin şifresi' });
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
      }
    } catch (error) {
      console.error('Sistem parametreleri hatası:', error);
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
    <div className="admin-panel">
      {/* Admin Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand className="fw-bold">
            🛡️ Admin Panel
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="admin-nav" />
          <Navbar.Collapse id="admin-nav">
            <Nav className="me-auto">
              <Nav.Link href="#dashboard">Dashboard</Nav.Link>
              <Nav.Link href="#users">Kullanıcılar</Nav.Link>
              <Nav.Link href="#system">Sistem</Nav.Link>
            </Nav>
            <Nav>
              <Button variant="outline-light" onClick={handleLogout}>
                🚪 Çıkış
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid>
        {message.text && (
          <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
            {message.text}
          </Alert>
        )}

        {/* Dashboard İstatistikleri */}
        <Row className="mb-4" id="dashboard">
          <Col>
            <h2 className="mb-3">📊 Dashboard İstatistikleri</h2>
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

        {/* Sistem Parametreleri */}
        <Row className="mb-4" id="system">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light">
                <h5 className="mb-0">⚙️ Sistem Parametreleri</h5>
              </Card.Header>
              <Card.Body>
                {systemParams ? (
                  <Row>
                    <Col md={6}>
                      <h6>🖥️ Sunucu Bilgileri</h6>
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
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Veritabanı İşlemleri */}
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light">
                <h5 className="mb-0">🗄️ Veritabanı İşlemleri</h5>
              </Card.Header>
              <Card.Body>
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
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

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
    </div>
  );
};

export default AdminPanel;
