import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
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
              to="/" 
              className={isActive('/') ? 'active fw-bold' : ''}
            >
              📊 Dashboard
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/accounts/new" 
              className={isActive('/accounts/new') ? 'active fw-bold' : ''}
            >
              🏦 Hesap Ekle
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/credit-cards/new" 
              className={isActive('/credit-cards/new') ? 'active fw-bold' : ''}
            >
              💳 Kredi Kartı Ekle
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/incomes/new" 
              className={isActive('/incomes/new') ? 'active fw-bold' : ''}
            >
              💰 Gelir Ekle
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/expenses/new" 
              className={isActive('/expenses/new') ? 'active fw-bold' : ''}
            >
              💸 Gider Ekle
            </Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link 
              as={Link} 
              to="/accounts" 
              className={isActive('/accounts') ? 'active fw-bold' : ''}
            >
              📋 Hesaplar
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/credit-cards" 
              className={isActive('/credit-cards') ? 'active fw-bold' : ''}
            >
              📋 Kredi Kartları
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/analytics" 
              className={isActive('/analytics') ? 'active fw-bold' : ''}
            >
              📈 Analiz
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
