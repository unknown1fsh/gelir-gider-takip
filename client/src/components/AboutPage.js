import React from 'react';
import { 
  Container, Row, Col, Card, Button, Badge,
  Nav, Navbar, NavbarBrand, Image
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaRocket, FaUsers, FaBullseye, FaHeart, FaAward,
  FaLightbulb, FaHandshake, FaGlobe, FaChartLine,
  FaShieldAlt, FaHeadset, FaCode, FaMobile
} from 'react-icons/fa';
import './AboutPage.css';

const AboutPage = () => {
  const teamMembers = [
    {
      name: 'Ahmet Yılmaz',
      position: 'Kurucu & CEO',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      bio: '10+ yıl fintech deneyimi ile finansal teknoloji alanında uzman.',
      social: { linkedin: '#', twitter: '#', github: '#' }
    },
    {
      name: 'Zeynep Kaya',
      position: 'CTO',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face',
      bio: 'Yazılım geliştirme ve sistem mimarisi konularında uzman.',
      social: { linkedin: '#', twitter: '#', github: '#' }
    },
    {
      name: 'Mehmet Demir',
      position: 'Ürün Müdürü',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      bio: 'Kullanıcı deneyimi ve ürün stratejisi konularında uzman.',
      social: { linkedin: '#', twitter: '#', github: '#' }
    },
    {
      name: 'Elif Özkan',
      position: 'Tasarım Lideri',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
      bio: 'UI/UX tasarım ve kullanıcı araştırması konularında uzman.',
      social: { linkedin: '#', twitter: '#', github: '#' }
    }
  ];

  const milestones = [
    {
      year: '2020',
      title: 'Kuruluş',
      description: 'Gelir Gider Takip projesi başlatıldı',
      icon: FaRocket
    },
    {
      year: '2021',
      title: 'İlk Sürüm',
      description: 'Beta kullanıcıları ile ilk sürüm yayınlandı',
      icon: FaCode
    },
    {
      year: '2022',
      title: '10K Kullanıcı',
      description: '10,000 aktif kullanıcıya ulaşıldı',
      icon: FaUsers
    },
    {
      year: '2023',
      title: 'Mobil Uygulama',
      description: 'iOS ve Android uygulamaları yayınlandı',
      icon: FaMobile
    },
    {
      year: '2024',
      title: '2.0 Sürümü',
      description: 'Yeni özellikler ve gelişmiş arayüz',
      icon: FaAward
    }
  ];

  const values = [
    {
      icon: FaBullseye,
      title: 'Misyonumuz',
      description: 'Herkesin finansal hedeflerine ulaşmasını kolaylaştırmak ve finansal okuryazarlığı artırmak.'
    },
    {
      icon: FaHeart,
      title: 'Vizyonumuz',
      description: 'Finansal teknoloji alanında lider olmak ve kullanıcılarımızın güvenini kazanmak.'
    },
    {
      icon: FaHandshake,
      title: 'Değerlerimiz',
      description: 'Şeffaflık, güvenilirlik, yenilikçilik ve kullanıcı odaklılık temel değerlerimizdir.'
    }
  ];

  return (
    <div className="about-page">
      {/* Navigation */}
      <Navbar bg="transparent" variant="light" expand="lg" className="about-navbar">
        <Container>
          <NavbarBrand className="fw-bold text-white">
            <FaRocket className="me-2" />
            Gelir Gider Takip
          </NavbarBrand>
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/" className="text-white me-3">
              Ana Sayfa
            </Nav.Link>
            <Nav.Link as={Link} to="/pricing" className="text-white me-3">
              Fiyatlandırma
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
      <section className="about-hero">
        <Container>
          <Row className="text-center">
            <Col>
              <Badge bg="warning" className="mb-3 px-3 py-2 text-dark fw-semibold">
                🚀 Hakkımızda
              </Badge>
              <h1 className="display-4 fw-bold text-white mb-4">
                Finansal Geleceğinizi <br />
                <span className="text-warning">Birlikte İnşa Edelim</span>
              </h1>
              <p className="lead text-white-50 mb-5">
                2020 yılından bu yana, kullanıcılarımızın finansal hedeflerine ulaşmasına yardımcı oluyoruz. 
                Modern teknoloji ve kullanıcı dostu tasarım ile finansal yönetimi kolaylaştırıyoruz.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Story Section */}
      <section className="story-section">
        <Container>
          <Row className="align-items-center g-5">
            <Col lg={6}>
              <div className="story-content">
                <h2 className="display-5 fw-bold text-white mb-4">
                  Hikayemiz
                </h2>
                <p className="lead text-white-50 mb-4">
                  Gelir Gider Takip, kişisel finans yönetiminin karmaşık olması gerektiğine inanmayan bir grup 
                  teknoloji tutkunu tarafından kuruldu.
                </p>
                <p className="text-white-50 mb-4">
                  Amacımız, herkesin gelir ve giderlerini kolayca takip edebilmesi, bütçelerini planlayabilmesi 
                  ve finansal hedeflerine ulaşabilmesi için gerekli araçları sağlamaktı.
                </p>
                <p className="text-white-50 mb-4">
                  Bugün, 10,000'den fazla kullanıcımız ile bu hedefe ulaştığımızı düşünüyoruz. 
                  Ancak yolculuğumuz henüz başladı.
                </p>
                <Button 
                  variant="warning" 
                  size="lg" 
                  className="px-4 py-2 fw-semibold rounded-pill"
                >
                  <FaRocket className="me-2" />
                  Bizimle Çalışın
                </Button>
              </div>
            </Col>
            <Col lg={6}>
              <div className="story-image">
                <div className="image-container">
                  <Image 
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop" 
                    alt="Takım Çalışması"
                    fluid
                    className="rounded-3 shadow-lg"
                  />
                  <div className="image-overlay">
                    <div className="overlay-content">
                      <FaUsers className="mb-3" />
                      <h5>Takım Ruhu</h5>
                      <p>Birlikte daha güçlüyüz</p>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Values Section */}
      <section className="values-section">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-5 fw-bold text-white mb-3">
                Değerlerimiz
              </h2>
              <p className="lead text-white-50">
                Bizi biz yapan temel değerler
              </p>
            </Col>
          </Row>
          
          <Row className="g-4">
            {values.map((value, index) => (
              <Col key={index} lg={4} md={6}>
                <Card className="value-card h-100">
                  <Card.Body className="text-center p-4">
                    <div className="value-icon mb-3">
                      <value.icon />
                    </div>
                    <h4 className="fw-bold mb-3">{value.title}</h4>
                    <p className="text-muted mb-0">
                      {value.description}
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-5 fw-bold text-white mb-3">
                Ekibimiz
              </h2>
              <p className="lead text-white-50">
                Projeyi hayata geçiren tutkulu ekip
              </p>
            </Col>
          </Row>
          
          <Row className="g-4">
            {teamMembers.map((member, index) => (
              <Col key={index} lg={3} md={6}>
                <Card className="team-card h-100">
                  <Card.Body className="text-center p-4">
                    <div className="member-image mb-3">
                      <Image 
                        src={member.image} 
                        alt={member.name}
                        roundedCircle
                        width="120"
                        height="120"
                        className="border-3 border-primary"
                      />
                    </div>
                    <h5 className="fw-bold mb-2">{member.name}</h5>
                    <p className="text-primary fw-semibold mb-3">{member.position}</p>
                    <p className="text-muted mb-3">{member.bio}</p>
                    <div className="social-links">
                      <a href={member.social.linkedin} className="social-link">
                        <FaGlobe />
                      </a>
                      <a href={member.social.twitter} className="social-link">
                        <FaGlobe />
                      </a>
                      <a href={member.social.github} className="social-link">
                        <FaGlobe />
                      </a>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Milestones Section */}
      <section className="milestones-section">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-5 fw-bold text-white mb-3">
                Yolculuğumuz
              </h2>
              <p className="lead text-white-50">
                Başarılarımız ve kilometre taşlarımız
              </p>
            </Col>
          </Row>
          
          <div className="timeline">
            {milestones.map((milestone, index) => (
              <div key={index} className={`timeline-item ${index % 2 === 0 ? 'left' : 'right'}`}>
                <div className="timeline-content">
                  <div className="timeline-icon">
                    <milestone.icon />
                  </div>
                  <div className="timeline-year">{milestone.year}</div>
                  <h5 className="fw-bold mb-2">{milestone.title}</h5>
                  <p className="text-muted mb-0">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <Container>
          <Row className="text-center g-4">
            <Col md={3} sm={6}>
              <div className="stat-item">
                <div className="stat-icon mb-3">
                  <FaUsers />
                </div>
                <h2 className="text-warning fw-bold">10K+</h2>
                <p className="text-white-50 mb-0">Aktif Kullanıcı</p>
              </div>
            </Col>
            <Col md={3} sm={6}>
              <div className="stat-item">
                <div className="stat-icon mb-3">
                  <FaChartLine />
                </div>
                <h2 className="text-warning fw-bold">50M+</h2>
                <p className="text-white-50 mb-0">İşlem</p>
              </div>
            </Col>
            <Col md={3} sm={6}>
              <div className="stat-item">
                <div className="stat-icon mb-3">
                  <FaShieldAlt />
                </div>
                <h2 className="text-warning fw-bold">99.9%</h2>
                <p className="text-white-50 mb-0">Güvenilirlik</p>
              </div>
            </Col>
            <Col md={3} sm={6}>
              <div className="stat-item">
                <div className="stat-icon mb-3">
                  <FaHeadset />
                </div>
                <h2 className="text-warning fw-bold">24/7</h2>
                <p className="text-white-50 mb-0">Destek</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <Container>
          <Row className="text-center">
            <Col>
              <h2 className="display-5 fw-bold text-white mb-4">
                Bizimle Çalışmak İster misiniz?
              </h2>
              <p className="lead text-white-50 mb-5">
                Tutkulu ve yetenekli insanlar arıyoruz. Kariyer fırsatlarımızı keşfedin.
              </p>
              <div className="cta-buttons">
                <Button 
                  variant="warning" 
                  size="lg" 
                  className="me-3 px-5 py-3 fw-semibold rounded-pill"
                >
                  <FaUsers className="me-2" />
                  Kariyer Fırsatları
                </Button>
                <Button 
                  variant="outline-light" 
                  size="lg" 
                  className="px-5 py-3 fw-semibold rounded-pill"
                >
                  <FaHandshake className="me-2" />
                  İletişime Geç
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer className="about-footer">
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

export default AboutPage;
