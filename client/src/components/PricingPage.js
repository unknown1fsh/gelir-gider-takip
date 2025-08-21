import React from 'react';
import { 
  Container, Row, Col, Card, Button, Badge,
  Nav, Navbar, NavbarBrand
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaRocket, FaCheck, FaTimes, FaStar, FaCrown,
  FaUsers, FaShieldAlt, FaHeadset, FaDownload
} from 'react-icons/fa';
import './PricingPage.css';

const PricingPage = () => {
  const plans = [
    {
      name: 'Ücretsiz',
      price: '0₺',
      period: '/ay',
      description: 'Bireysel kullanıcılar için temel özellikler',
      features: [
        '1 hesap',
        'Temel gelir-gider takibi',
        '5 kategori',
        'Aylık raporlar',
        'Mobil uygulama',
        'E-posta desteği'
      ],
      limitations: [
        'Reklam gösterimi',
        'Sınırlı geçmiş veri',
        'Temel analizler'
      ],
      buttonText: 'Ücretsiz Başla',
      buttonVariant: 'outline-primary',
      popular: false,
      icon: FaRocket
    },
    {
      name: 'Premium',
      price: '29₺',
      period: '/ay',
      description: 'Gelişmiş özellikler ile profesyonel kullanım',
      features: [
        '5 hesap',
        'Sınırsız gelir-gider takibi',
        'Sınırsız kategori',
        'Detaylı raporlar ve analizler',
        'Gelişmiş grafikler',
        'Bütçe planlama',
        'Otomatik ödemeler',
        'Öncelikli destek',
        'Reklamsız deneyim',
        'Veri yedekleme'
      ],
      limitations: [],
      buttonText: 'Premium Başla',
      buttonVariant: 'primary',
      popular: true,
      icon: FaStar
    },
    {
      name: 'Enterprise',
      price: '99₺',
      period: '/ay',
      description: 'Büyük ekipler ve şirketler için',
      features: [
        'Sınırsız hesap',
        'Tüm Premium özellikleri',
        'Takım yönetimi',
        'Gelişmiş güvenlik',
        'API erişimi',
        'Özel entegrasyonlar',
        '7/24 telefon desteği',
        'Özel eğitim',
        'SLA garantisi',
        'Özel raporlar'
      ],
      limitations: [],
      buttonText: 'İletişime Geç',
      buttonVariant: 'success',
      popular: false,
      icon: FaCrown
    }
  ];

  return (
    <div className="pricing-page">
      {/* Navigation */}
      <Navbar bg="transparent" variant="light" expand="lg" className="pricing-navbar">
        <Container>
          <NavbarBrand className="fw-bold text-white">
            <FaRocket className="me-2" />
            Gelir Gider Takip
          </NavbarBrand>
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/" className="text-white me-3">
              Ana Sayfa
            </Nav.Link>
            <Nav.Link as={Link} to="/login" className="text-white me-3">
              Giriş Yap
            </Nav.Link>
            <Button as={Link} to="/register" variant="outline-light" className="rounded-pill px-4">
              Ücretsiz Başla
            </Button>
          </Nav>
        </Container>
      </Navbar>

      {/* Hero Section */}
      <section className="pricing-hero">
        <Container>
          <Row className="text-center">
            <Col>
              <Badge bg="warning" className="mb-3 px-3 py-2 text-dark fw-semibold">
                💰 Şeffaf Fiyatlandırma
              </Badge>
              <h1 className="display-4 fw-bold text-white mb-4">
                Size En Uygun Planı Seçin
              </h1>
              <p className="lead text-white-50 mb-5">
                İhtiyaçlarınıza göre özelleştirilmiş planlar. Ücretsiz başlayın, 
                ihtiyaç duydukça geliştirin.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Pricing Cards */}
      <section className="pricing-cards">
        <Container>
          <Row className="justify-content-center g-4">
            {plans.map((plan, index) => (
              <Col key={index} lg={4} md={6} className="d-flex">
                <Card className={`pricing-card h-100 ${plan.popular ? 'popular' : ''}`}>
                  {plan.popular && (
                    <div className="popular-badge">
                      <FaStar className="me-2" />
                      En Popüler
                    </div>
                  )}
                  <Card.Body className="p-4">
                    <div className="text-center mb-4">
                      <div className="plan-icon mb-3">
                        <plan.icon />
                      </div>
                      <h3 className="fw-bold mb-2">{plan.name}</h3>
                      <div className="price-section mb-3">
                        <span className="price">{plan.price}</span>
                        <span className="period">{plan.period}</span>
                      </div>
                      <p className="text-muted mb-0">{plan.description}</p>
                    </div>

                    {/* Features */}
                    <div className="features-list mb-4">
                      <h6 className="fw-semibold mb-3 text-success">
                        <FaCheck className="me-2" />
                        Dahil Olan Özellikler
                      </h6>
                      <ul className="list-unstyled">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="mb-2">
                            <FaCheck className="text-success me-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Limitations */}
                    {plan.limitations.length > 0 && (
                      <div className="limitations-list mb-4">
                        <h6 className="fw-semibold mb-3 text-muted">
                          <FaTimes className="me-2" />
                          Sınırlamalar
                        </h6>
                        <ul className="list-unstyled">
                          {plan.limitations.map((limitation, idx) => (
                            <li key={idx} className="mb-2">
                              <FaTimes className="text-muted me-2" />
                              {limitation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CTA Button */}
                    <Button
                      as={Link}
                      to={plan.name === 'Enterprise' ? '/contact' : '/register'}
                      variant={plan.buttonVariant}
                      size="lg"
                      className="w-100 fw-semibold py-3"
                    >
                      {plan.buttonText}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Comparison Table */}
      <section className="comparison-section">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-5 fw-bold text-white mb-3">
                Detaylı Karşılaştırma
              </h2>
              <p className="lead text-white-50">
                Tüm planların özelliklerini yan yana karşılaştırın
              </p>
            </Col>
          </Row>
          
          <div className="comparison-table-container">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Özellik</th>
                  <th>Ücretsiz</th>
                  <th>Premium</th>
                  <th>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Hesap Sayısı</td>
                  <td>1</td>
                  <td>5</td>
                  <td>Sınırsız</td>
                </tr>
                <tr>
                  <td>Gelir-Gider Takibi</td>
                  <td>Temel</td>
                  <td>Gelişmiş</td>
                  <td>Tam</td>
                </tr>
                <tr>
                  <td>Kategori Sayısı</td>
                  <td>5</td>
                  <td>Sınırsız</td>
                  <td>Sınırsız</td>
                </tr>
                <tr>
                  <td>Raporlar</td>
                  <td>Aylık</td>
                  <td>Detaylı</td>
                  <td>Özel</td>
                </tr>
                <tr>
                  <td>Analizler</td>
                  <td>Temel</td>
                  <td>Gelişmiş</td>
                  <td>Tam</td>
                </tr>
                <tr>
                  <td>Otomatik Ödemeler</td>
                  <td><FaTimes className="text-danger" /></td>
                  <td><FaCheck className="text-success" /></td>
                  <td><FaCheck className="text-success" /></td>
                </tr>
                <tr>
                  <td>API Erişimi</td>
                  <td><FaTimes className="text-danger" /></td>
                  <td><FaTimes className="text-danger" /></td>
                  <td><FaCheck className="text-success" /></td>
                </tr>
                <tr>
                  <td>Destek</td>
                  <td>E-posta</td>
                  <td>Öncelikli</td>
                  <td>7/24 Telefon</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-5 fw-bold text-white mb-3">
                Sık Sorulan Sorular
              </h2>
              <p className="lead text-white-50">
                Fiyatlandırma hakkında merak edilenler
              </p>
            </Col>
          </Row>
          
          <Row className="g-4">
            <Col lg={6}>
              <div className="faq-item">
                <h5 className="fw-semibold mb-3">
                  <FaUsers className="me-2 text-primary" />
                  Plan değişikliği yapabilir miyim?
                </h5>
                <p className="text-white-50">
                  Evet, istediğiniz zaman planınızı değiştirebilirsiniz. Değişiklik bir sonraki fatura döneminde geçerli olur.
                </p>
              </div>
            </Col>
            <Col lg={6}>
              <div className="faq-item">
                <h5 className="fw-semibold mb-3">
                  <FaShieldAlt className="me-2 text-primary" />
                  Verilerim güvende mi?
                </h5>
                <p className="text-white-50">
                  Tüm verileriniz şifrelenmiş olarak saklanır ve güvenlik standartlarına uygun olarak korunur.
                </p>
              </div>
            </Col>
            <Col lg={6}>
              <div className="faq-item">
                <h5 className="fw-semibold mb-3">
                  <FaHeadset className="me-2 text-primary" />
                  Hangi destek seçenekleri mevcut?
                </h5>
                <p className="text-white-50">
                  Ücretsiz plan: E-posta, Premium: Öncelikli e-posta, Enterprise: 7/24 telefon ve özel destek.
                </p>
              </div>
            </Col>
            <Col lg={6}>
              <div className="faq-item">
                <h5 className="fw-semibold mb-3">
                  <FaDownload className="me-2 text-primary" />
                  Mobil uygulama ücretsiz mi?
                </h5>
                <p className="text-white-50">
                  Evet, tüm planlarda mobil uygulama ücretsiz olarak sunulur ve tüm özelliklere erişim sağlar.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="pricing-cta">
        <Container>
          <Row className="text-center">
            <Col>
              <h2 className="display-5 fw-bold text-white mb-4">
                Hemen Başlayın
              </h2>
              <p className="lead text-white-50 mb-5">
                Ücretsiz hesap oluşturun ve finansal yolculuğunuza başlayın
              </p>
              <div className="cta-buttons">
                <Button 
                  as={Link} 
                  to="/register" 
                  variant="warning" 
                  size="lg" 
                  className="me-3 px-5 py-3 fw-semibold rounded-pill"
                >
                  <FaRocket className="me-2" />
                  Ücretsiz Başla
                </Button>
                <Button 
                  variant="outline-light" 
                  size="lg" 
                  className="px-5 py-3 fw-semibold rounded-pill"
                >
                  <FaHeadset className="me-2" />
                  Demo İste
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer className="pricing-footer">
        <Container>
          <Row className="py-4">
            <Col className="text-center">
              <p className="text-white-50 mb-0">
                © 2024 Gelir Gider Takip. Tüm hakları saklıdır.
              </p>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default PricingPage;
