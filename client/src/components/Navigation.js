import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">
          💰 Gelir Gider Takip
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">🏠 Ana Sayfa</Nav.Link>
            <Nav.Link as={Link} to="/hesap-ekle">🏦 Hesap Ekle</Nav.Link>
            <Nav.Link as={Link} to="/kredi-karti-ekle">💳 Kredi Kartı Ekle</Nav.Link>
            <Nav.Link as={Link} to="/hesaplar">📊 Hesaplar</Nav.Link>
            <Nav.Link as={Link} to="/kredi-kartlari">🎴 Kredi Kartları</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
