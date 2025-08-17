import React from 'react';
import { Card, Button, Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const WelcomePage = () => {
  const { isAuthenticated } = useAuth();
  
  // Eğer kullanıcı giriş yapmışsa Dashboard'a yönlendir
  if (isAuthenticated) {
    window.location.href = '/dashboard';
    return null;
  }

  return (
    <div className="welcome-page">
      {/* Hero Section */}
      <div className="hero-section text-center text-white py-5">
        <Container>
          <div className="hero-content">
            <h1 className="display-3 fw-bold mb-4">
              💰 Gelir-Gider Takip Uygulaması
            </h1>
            <p className="lead mb-4">
              Finansal hedeflerinize ulaşmanın en akıllı ve profesyonel yolu
            </p>
            <div className="hero-buttons">
              <Button 
                as={Link} 
                to="/register" 
                variant="success" 
                size="lg"
                className="me-3 px-4 py-2"
              >
                🚀 Ücretsiz Başla
              </Button>
              <Button 
                as={Link} 
                to="/login" 
                variant="outline-light" 
                size="lg"
                className="px-4 py-2"
              >
                🔐 Giriş Yap
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="py-5">
        <Row className="text-center mb-5">
          <Col>
            <h2 className="display-5 fw-bold text-primary mb-3">
              ✨ Neden Bu Uygulamayı Seçmelisiniz?
            </h2>
            <p className="lead text-muted">
              Profesyonel finansal yönetim için geliştirilmiş özellikler
            </p>
          </Col>
        </Row>

        <Row className="g-4 mb-5">
          <Col lg={4} md={6}>
            <Card className="h-100 border-0 shadow-sm feature-card">
              <Card.Body className="text-center p-4">
                <div className="feature-icon mb-3">
                  <span className="display-4">📊</span>
                </div>
                <h4 className="fw-bold mb-3">Detaylı Finansal Analiz</h4>
                <p className="text-muted">
                  Gelir-gider trendlerinizi görsel grafiklerle analiz edin. 
                  Aylık, yıllık karşılaştırmalar ve kategorik dağılımlar ile 
                  finansal durumunuzu net bir şekilde görün.
                </p>
                <ul className="text-start text-muted">
                  <li>📈 Trend analizi ve tahminler</li>
                  <li>🎯 Kategori bazında gider dağılımı</li>
                  <li>💰 Net gelir hesaplamaları</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6}>
            <Card className="h-100 border-0 shadow-sm feature-card">
              <Card.Body className="text-center p-4">
                <div className="feature-icon mb-3">
                  <span className="display-4">🏦</span>
                </div>
                <h4 className="fw-bold mb-3">Çoklu Hesap Yönetimi</h4>
                <p className="text-muted">
                  Tüm banka hesaplarınızı tek yerden takip edin. 
                  Mevduat, kredili hesaplar ve özel limitler ile 
                  tam kontrol sağlayın.
                </p>
                <ul className="text-start text-muted">
                  <li>💳 IBAN ve hesap bilgileri</li>
                  <li>📊 Vadeli/vadesiz hesap türleri</li>
                  <li>🔒 Kredi limiti takibi</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6}>
            <Card className="h-100 border-0 shadow-sm feature-card">
              <Card.Body className="text-center p-4">
                <div className="feature-icon mb-3">
                  <span className="display-4">💳</span>
                </div>
                <h4 className="fw-bold mb-3">Kredi Kartı Takibi</h4>
                <p className="text-muted">
                  Kredi kartı limitlerinizi ve ödeme tarihlerini kolayca yönetin. 
                  Harcama takibi ve ödeme planlaması ile borçlarınızı kontrol altında tutun.
                </p>
                <ul className="text-start text-muted">
                  <li>📅 Hesap kesim tarihi takibi</li>
                  <li>💸 Kalan limit hesaplaması</li>
                  <li>⚠️ Ödeme hatırlatıcıları</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6}>
            <Card className="h-100 border-0 shadow-sm feature-card">
              <Card.Body className="text-center p-4">
                <div className="feature-icon mb-3">
                  <span className="display-4">🏠</span>
                </div>
                <h4 className="fw-bold mb-3">Ev Giderleri Yönetimi</h4>
                <p className="text-muted">
                  Kira, aidat, vergi gibi ev giderlerini detaylı kaydedin. 
                  Sözleşme bilgileri ve ödeme takibi ile ev masraflarınızı organize edin.
                </p>
                <ul className="text-start text-muted">
                  <li>🏘️ Kira ve aidat takibi</li>
                  <li>📋 Sözleşme bilgileri</li>
                  <li>📊 Gider kategorileri</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6}>
            <Card className="h-100 border-0 shadow-sm feature-card">
              <Card.Body className="text-center p-4">
                <div className="feature-icon mb-3">
                  <span className="display-4">📱</span>
                </div>
                <h4 className="fw-bold mb-3">Mobil Uyumlu Tasarım</h4>
                <p className="text-muted">
                  Her cihazdan kolayca erişim sağlayın. Responsive tasarım ile 
                  telefon, tablet ve bilgisayarınızdan rahatça kullanın.
                </p>
                <ul className="text-start text-muted">
                  <li>📱 Mobil uyumlu arayüz</li>
                  <li>💻 Tüm tarayıcılarda çalışır</li>
                  <li>⚡ Hızlı ve güvenli</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6}>
            <Card className="h-100 border-0 shadow-sm feature-card">
              <Card.Body className="text-center p-4">
                <div className="feature-icon mb-3">
                  <span className="display-4">🔒</span>
                </div>
                <h4 className="fw-bold mb-3">Güvenli Veri Yönetimi</h4>
                <p className="text-muted">
                  Verileriniz güvenle saklanır. JWT token tabanlı authentication 
                  ve şifreli veri transferi ile bilgileriniz korunur.
                </p>
                <ul className="text-start text-muted">
                  <li>🔐 Güvenli giriş sistemi</li>
                  <li>🛡️ Veri şifreleme</li>
                  <li>📊 Yedekleme ve senkronizasyon</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Call to Action */}
        <Row className="text-center">
          <Col>
            <Card className="border-0 bg-gradient text-white">
              <Card.Body className="p-5">
                <h3 className="fw-bold mb-3">🚀 Hemen Başlayın!</h3>
                <p className="lead mb-4">
                  Finansal hedeflerinize ulaşmak için bugün ücretsiz hesap oluşturun
                </p>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <Button 
                    as={Link} 
                    to="/register" 
                    variant="light" 
                    size="lg"
                    className="px-4 py-2 fw-bold"
                  >
                    📝 Ücretsiz Kayıt Ol
                  </Button>
                  <Button 
                    as={Link} 
                    to="/login" 
                    variant="outline-light" 
                    size="lg"
                    className="px-4 py-2"
                  >
                    🔐 Zaten Hesabım Var
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default WelcomePage;
