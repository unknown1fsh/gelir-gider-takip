import React from 'react';
import { Navbar, Nav, Container, Button, Dropdown, Badge } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaSignOutAlt, FaCog, FaUserEdit, FaShieldAlt, FaHistory, FaBell, FaEnvelope, FaCalendarAlt, FaChartLine, FaWallet, FaCreditCard, FaMoneyBillWave, FaReceipt } from 'react-icons/fa';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          💰 Gelir-Gider Takip
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/dashboard" 
              className={isActive('/dashboard') ? 'active fw-bold' : ''}
              style={{ whiteSpace: 'nowrap' }}
            >
              📊 Dashboard
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/accounts/new" 
              className={isActive('/accounts/new') ? 'active fw-bold' : ''}
              style={{ whiteSpace: 'nowrap' }}
            >
              🏦 Hesap Ekle
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/credit-cards/new" 
              className={isActive('/credit-cards/new') ? 'active fw-bold' : ''}
              style={{ whiteSpace: 'nowrap' }}
            >
              💳 Kredi Kartı Ekle
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/incomes/new" 
              className={isActive('/incomes/new') ? 'active fw-bold' : ''}
              style={{ whiteSpace: 'nowrap' }}
            >
              💰 Gelir Ekle
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/expenses/new" 
              className={isActive('/expenses/new') ? 'active fw-bold' : ''}
              style={{ whiteSpace: 'nowrap' }}
            >
              💸 Gider Ekle
            </Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link 
              as={Link} 
              to="/incomes" 
              className={isActive('/incomes') ? 'active fw-bold' : ''}
              style={{ whiteSpace: 'nowrap' }}
            >
              💰 Gelirler
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/expenses" 
              className={isActive('/expenses') ? 'active fw-bold' : ''}
              style={{ whiteSpace: 'nowrap' }}
            >
              💸 Giderler
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/accounts" 
              className={isActive('/accounts') ? 'active fw-bold' : ''}
              style={{ whiteSpace: 'nowrap' }}
            >
              📋 Hesaplar
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/credit-cards" 
              className={isActive('/credit-cards') ? 'active fw-bold' : ''}
              style={{ whiteSpace: 'nowrap' }}
            >
              📋 Kredi Kartları
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/analytics" 
              className={isActive('/analytics') ? 'active fw-bold' : ''}
              style={{ whiteSpace: 'nowrap' }}
            >
              📈 Analiz
            </Nav.Link>
          </Nav>
          
          {/* Kullanıcı Menüsü */}
          <Nav>
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-light" id="user-dropdown" className="d-flex align-items-center gap-2">
                <div className="d-flex align-items-center">
                  <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px' }}>
                    <FaUser className="text-white" size={16} />
                  </div>
                  <span className="d-none d-md-inline">{user?.full_name || user?.username || 'Kullanıcı'}</span>
                </div>
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow-lg" style={{ minWidth: '280px' }}>
                {/* Kullanıcı Bilgileri */}
                <Dropdown.Header className="bg-light">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px' }}>
                      <FaUser className="text-white" size={20} />
                    </div>
                    <div>
                      <div className="fw-bold">{user?.full_name}</div>
                      <small className="text-muted">@{user?.username}</small>
                      <div className="text-muted small">{user?.email}</div>
                    </div>
                  </div>
                </Dropdown.Header>
                
                <Dropdown.Divider />
                
                {/* Hızlı Erişim */}
                <Dropdown.Header className="text-uppercase small fw-bold text-muted">
                  Hızlı Erişim
                </Dropdown.Header>
                
                <Dropdown.Item as={Link} to="/dashboard" className="d-flex align-items-center gap-2">
                  <FaChartLine className="text-primary" />
                  Dashboard
                </Dropdown.Item>
                
                <Dropdown.Item as={Link} to="/accounts" className="d-flex align-items-center gap-2">
                  <FaWallet className="text-success" />
                  Hesaplarım
                </Dropdown.Item>
                
                <Dropdown.Item as={Link} to="/credit-cards" className="d-flex align-items-center gap-2">
                  <FaCreditCard className="text-warning" />
                  Kredi Kartlarım
                </Dropdown.Item>
                
                <Dropdown.Item as={Link} to="/incomes" className="d-flex align-items-center gap-2">
                  <FaMoneyBillWave className="text-info" />
                  Gelirlerim
                </Dropdown.Item>
                
                <Dropdown.Item as={Link} to="/expenses" className="d-flex align-items-center gap-2">
                  <FaReceipt className="text-danger" />
                  Giderlerim
                </Dropdown.Item>
                
                <Dropdown.Divider />
                
                {/* Kullanıcı Ayarları */}
                <Dropdown.Header className="text-uppercase small fw-bold text-muted">
                  Hesap Ayarları
                </Dropdown.Header>
                
                <Dropdown.Item className="d-flex align-items-center gap-2">
                  <FaUserEdit className="text-primary" />
                  Profili Düzenle
                </Dropdown.Item>
                
                <Dropdown.Item className="d-flex align-items-center gap-2">
                  <FaCog className="text-secondary" />
                  Ayarlar
                </Dropdown.Item>
                
                <Dropdown.Item className="d-flex align-items-center gap-2">
                  <FaShieldAlt className="text-success" />
                  Güvenlik
                </Dropdown.Item>
                
                <Dropdown.Item className="d-flex align-items-center gap-2">
                  <FaHistory className="text-info" />
                  Giriş Geçmişi
                </Dropdown.Item>
                
                <Dropdown.Divider />
                
                {/* Bildirimler */}
                <Dropdown.Item className="d-flex align-items-center gap-2">
                  <FaBell className="text-warning" />
                  Bildirimler
                  <Badge bg="danger" className="ms-auto">3</Badge>
                </Dropdown.Item>
                
                <Dropdown.Item className="d-flex align-items-center gap-2">
                  <FaEnvelope className="text-info" />
                  Mesajlar
                  <Badge bg="primary" className="ms-auto">1</Badge>
                </Dropdown.Item>
                
                <Dropdown.Divider />
                
                {/* Çıkış */}
                <Dropdown.Item onClick={handleLogout} className="d-flex align-items-center gap-2 text-danger">
                  <FaSignOutAlt />
                  Çıkış Yap
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
