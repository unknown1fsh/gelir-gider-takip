import React, { useState } from 'react';
import { 
  Container, Row, Col, Card, Form, Button, Alert, 
  InputGroup, FormControl, Spinner
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaRocket, FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock,
  FaPaperPlane, FaUser, FaComments, FaCheckCircle
} from 'react-icons/fa';
import './ContactPage.css';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Simüle edilmiş form gönderimi
    setTimeout(() => {
      setMessage({ type: 'success', text: 'Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.' });
      setFormData({ name: '', email: '', subject: '', message: '' });
      setLoading(false);
    }, 2000);
  };

  const contactInfo = [
    {
      icon: FaEnvelope,
      title: 'E-posta',
      content: 'info@gelirgidertakip.com',
      link: 'mailto:info@gelirgidertakip.com'
    },
    {
      icon: FaPhone,
      title: 'Telefon',
      content: '+90 (212) 555 0123',
      link: 'tel:+902125550123'
    },
    {
      icon: FaMapMarkerAlt,
      title: 'Adres',
      content: 'İstanbul, Türkiye',
      link: '#'
    },
    {
      icon: FaClock,
      title: 'Çalışma Saatleri',
      content: 'Pazartesi - Cuma: 09:00 - 18:00',
      link: '#'
    }
  ];

  const faqItems = [
    {
      question: 'Nasıl hesap oluşturabilirim?',
      answer: 'Ana sayfadaki "Ücretsiz Başla" butonuna tıklayarak veya kayıt sayfasından hesap oluşturabilirsiniz.'
    },
    {
      question: 'Hangi ödeme yöntemleri kabul ediliyor?',
      answer: 'Kredi kartı, banka kartı ve PayPal ile ödeme yapabilirsiniz. Tüm ödemeler güvenli şekilde işlenir.'
    },
    {
      question: 'Verilerim güvende mi?',
      answer: 'Evet, tüm verileriniz şifrelenmiş olarak saklanır ve güvenlik standartlarına uygun olarak korunur.'
    },
    {
      question: 'Mobil uygulama mevcut mu?',
      answer: 'Evet, iOS ve Android için mobil uygulamalarımız mevcuttur ve tüm özelliklere erişim sağlar.'
    }
  ];

  return (
    <div className="contact-page">
      {/* Navigation */}
      <nav className="contact-navbar">
        <Container>
          <div className="d-flex justify-content-between align-items-center py-3">
            <Link to="/" className="navbar-brand fw-bold text-white">
              <FaRocket className="me-2" />
              Gelir Gider Takip
            </Link>
            <div className="nav-links">
              <Link to="/" className="text-white me-3">Ana Sayfa</Link>
              <Link to="/pricing" className="text-white me-3">Fiyatlandırma</Link>
              <Link to="/about" className="text-white me-3">Hakkımızda</Link>
              <Link to="/login" className="text-white me-3">Giriş Yap</Link>
              <Button as={Link} to="/register" variant="outline-light" className="rounded-pill px-4">
                Ücretsiz Başla
              </Button>
            </div>
          </div>
        </Container>
      </nav>

      {/* Hero Section */}
      <section className="contact-hero">
        <Container>
          <Row className="text-center">
            <Col>
              <h1 className="display-4 fw-bold text-white mb-4">
                Bizimle İletişime Geçin
              </h1>
              <p className="lead text-white-50 mb-5">
                Sorularınız mı var? Yardıma mı ihtiyacınız var? 
                Size yardımcı olmaktan mutluluk duyarız.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Contact Form & Info Section */}
      <section className="contact-content">
        <Container>
          <Row className="g-5">
            {/* Contact Form */}
            <Col lg={8}>
              <Card className="contact-form-card">
                <Card.Body className="p-5">
                  <h2 className="fw-bold mb-4">Mesaj Gönderin</h2>
                  
                  {message && (
                    <Alert variant={message.type} className="mb-4" dismissible>
                      {message.text}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-semibold text-muted">
                            <FaUser className="me-2" />
                            Ad Soyad
                          </Form.Label>
                          <FormControl
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ad ve soyadınızı girin"
                            className="form-control-lg border-2"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-semibold text-muted">
                            <FaEnvelope className="me-2" />
                            E-posta
                          </Form.Label>
                          <FormControl
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="E-posta adresinizi girin"
                            className="form-control-lg border-2"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold text-muted">
                        <FaComments className="me-2" />
                        Konu
                      </Form.Label>
                      <FormControl
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Mesaj konusunu girin"
                        className="form-control-lg border-2"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold text-muted">
                        <FaPaperPlane className="me-2" />
                        Mesaj
                      </Form.Label>
                      <FormControl
                        as="textarea"
                        rows={5}
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Mesajınızı buraya yazın..."
                        className="form-control-lg border-2"
                        required
                      />
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-100 fw-semibold py-3"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Gönderiliyor...
                        </>
                      ) : (
                        <>
                          <FaPaperPlane className="me-2" />
                          Mesaj Gönder
                        </>
                      )}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {/* Contact Info */}
            <Col lg={4}>
              <div className="contact-info">
                <h3 className="fw-bold text-white mb-4">İletişim Bilgileri</h3>
                
                {contactInfo.map((info, index) => (
                  <div key={index} className="contact-info-item mb-4">
                    <div className="contact-info-icon">
                      <info.icon />
                    </div>
                    <div className="contact-info-content">
                      <h6 className="fw-semibold text-white mb-2">{info.title}</h6>
                      <a href={info.link} className="text-white-50 text-decoration-none">
                        {info.content}
                      </a>
                    </div>
                  </div>
                ))}

                <div className="contact-social mt-5">
                  <h6 className="fw-semibold text-white mb-3">Sosyal Medya</h6>
                  <div className="social-links">
                    <a href="#" className="social-link">
                      <FaEnvelope />
                    </a>
                    <a href="#" className="social-link">
                      <FaEnvelope />
                    </a>
                    <a href="#" className="social-link">
                      <FaEnvelope />
                    </a>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
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
                En çok merak edilen sorular ve cevapları
              </p>
            </Col>
          </Row>
          
          <Row className="g-4">
            {faqItems.map((item, index) => (
              <Col key={index} lg={6}>
                <Card className="faq-card h-100">
                  <Card.Body className="p-4">
                    <h5 className="fw-semibold mb-3">
                      <FaCheckCircle className="me-2 text-primary" />
                      {item.question}
                    </h5>
                    <p className="text-muted mb-0">
                      {item.answer}
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="contact-cta">
        <Container>
          <Row className="text-center">
            <Col>
              <h2 className="display-5 fw-bold text-white mb-4">
                Hemen Başlayın
              </h2>
              <p className="lead text-white-50 mb-5">
                Ücretsiz hesap oluşturun ve finansal yolculuğunuza başlayın
              </p>
              <Button 
                as={Link} 
                to="/register" 
                variant="warning" 
                size="lg" 
                className="px-5 py-3 fw-semibold rounded-pill"
              >
                <FaRocket className="me-2" />
                Ücretsiz Başla
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer className="contact-footer">
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

export default ContactPage;
