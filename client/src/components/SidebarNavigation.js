import React from 'react';
import { Nav, Dropdown } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaSignOutAlt, FaCog, FaUserEdit, FaChartLine, FaWallet, FaCreditCard, FaHome, FaPlus, FaList, FaChevronDown } from 'react-icons/fa';

const SidebarNavigation = () => {
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
    <div className="sidebar-navigation">
      {/* Logo ve Başlık */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <FaHome className="logo-icon" />
          <span className="logo-text">💰 Takip Asistanı</span>
        </div>
      </div>

      {/* Ana Navigasyon */}
      <Nav className="sidebar-nav flex-column">
        <div className="nav-section">
          <h6 className="nav-section-title">📊 Dashboard</h6>
          <Nav.Link 
            as={Link} 
            to="/dashboard" 
            className={`sidebar-nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            <FaChartLine className="nav-icon" />
            <span>Ana Sayfa</span>
          </Nav.Link>
        </div>

        <div className="nav-section">
          <h6 className="nav-section-title">➕ İşlemler</h6>
          <Nav.Link 
            as={Link} 
            to="/accounts/new" 
            className={`sidebar-nav-link ${isActive('/accounts/new') ? 'active' : ''}`}
          >
            <FaPlus className="nav-icon" />
            <span>Yeni Hesap</span>
          </Nav.Link>
          <Nav.Link 
            as={Link} 
            to="/credit-cards/new" 
            className={`sidebar-nav-link ${isActive('/credit-cards/new') ? 'active' : ''}`}
          >
            <FaPlus className="nav-icon" />
            <span>Yeni Kart</span>
          </Nav.Link>
          <Nav.Link 
            as={Link} 
            to="/incomes/new" 
            className={`sidebar-nav-link ${isActive('/incomes/new') ? 'active' : ''}`}
          >
            <FaPlus className="nav-icon" />
            <span>Gelir Kaydı</span>
          </Nav.Link>
          <Nav.Link 
            as={Link} 
            to="/expenses/new" 
            className={`sidebar-nav-link ${isActive('/expenses/new') ? 'active' : ''}`}
          >
            <FaPlus className="nav-icon" />
            <span>Gider Kaydı</span>
          </Nav.Link>
        </div>

        <div className="nav-section">
          <h6 className="nav-section-title">📋 Veriler</h6>
          <Nav.Link 
            as={Link} 
            to="/incomes" 
            className={`sidebar-nav-link ${isActive('/incomes') ? 'active' : ''}`}
          >
            <FaList className="nav-icon" />
            <span>Gelir Listesi</span>
          </Nav.Link>
          <Nav.Link 
            as={Link} 
            to="/expenses" 
            className={`sidebar-nav-link ${isActive('/expenses') ? 'active' : ''}`}
          >
            <FaList className="nav-icon" />
            <span>Gider Listesi</span>
          </Nav.Link>
          <Nav.Link 
            as={Link} 
            to="/accounts" 
            className={`sidebar-nav-link ${isActive('/accounts') ? 'active' : ''}`}
          >
            <FaList className="nav-icon" />
            <span>Hesap Listesi</span>
          </Nav.Link>
          <Nav.Link 
            as={Link} 
            to="/credit-cards" 
            className={`sidebar-nav-link ${isActive('/credit-cards') ? 'active' : ''}`}
          >
            <FaList className="nav-icon" />
            <span>Kart Listesi</span>
          </Nav.Link>
        </div>

        <div className="nav-section">
          <h6 className="nav-section-title">📈 Raporlar</h6>
          <Nav.Link 
            as={Link} 
            to="/analytics" 
            className={`sidebar-nav-link ${isActive('/analytics') ? 'active' : ''}`}
          >
            <FaChartLine className="nav-icon" />
            <span>Analiz & Raporlar</span>
          </Nav.Link>
        </div>
      </Nav>

      {/* Alt Kısım - Kullanıcı Menüsü */}
      <div className="sidebar-footer">
        <Dropdown className="user-dropdown">
          <Dropdown.Toggle variant="outline-light" id="user-dropdown" className="user-dropdown-toggle">
            <div className="user-info">
              <div className="user-avatar">
                <FaUser />
              </div>
              <div className="user-details">
                <div className="user-name">{user?.full_name || user?.username || 'Kullanıcı'}</div>
                <div className="user-role">Kullanıcı</div>
              </div>
            </div>
            <div className="dropdown-arrow">
              <FaChevronDown />
            </div>
          </Dropdown.Toggle>
          
          <Dropdown.Menu className="user-dropdown-menu">
            {/* Kullanıcı Bilgileri */}
            <Dropdown.Header className="user-header">
              <div className="d-flex align-items-center">
                <div className="user-avatar-large">
                  <FaUser />
                </div>
                <div className="ms-2">
                  <div className="user-name-large">{user?.full_name}</div>
                  <small className="text-muted">@{user?.username}</small>
                </div>
              </div>
            </Dropdown.Header>
            
            <Dropdown.Divider />
            
            {/* Profil ve Ayarlar */}
            <Dropdown.Item className="dropdown-item">
              <FaUserEdit className="dropdown-icon" />
              Profil
            </Dropdown.Item>
            
            <Dropdown.Item className="dropdown-item">
              <FaCog className="dropdown-icon" />
              Ayarlar
            </Dropdown.Item>
            
            <Dropdown.Divider />
            
            {/* Çıkış */}
            <Dropdown.Item onClick={handleLogout} className="dropdown-item text-danger">
              <FaSignOutAlt className="dropdown-icon" />
              Çıkış Yap
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </div>
  );
};

export default SidebarNavigation;
