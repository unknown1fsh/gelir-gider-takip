import React, { useState } from 'react';
import { Card, Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPeriodSelection, setShowPeriodSelection] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Ay seçenekleri
  const months = [
    { value: 0, label: 'Ocak' },
    { value: 1, label: 'Şubat' },
    { value: 2, label: 'Mart' },
    { value: 3, label: 'Nisan' },
    { value: 4, label: 'Mayıs' },
    { value: 5, label: 'Haziran' },
    { value: 6, label: 'Temmuz' },
    { value: 7, label: 'Ağustos' },
    { value: 8, label: 'Eylül' },
    { value: 9, label: 'Ekim' },
    { value: 10, label: 'Kasım' },
    { value: 11, label: 'Aralık' }
  ];

  // Yıl seçenekleri
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear - 5; year <= currentYear + 2; year++) {
    years.push(year);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      // Önceki seçim kontrolü
      const previousMonth = localStorage.getItem('selectedMonth');
      const previousYear = localStorage.getItem('selectedYear');
      
      if (previousMonth !== null && previousYear !== null) {
        setShowPeriodSelection(true);
        setSelectedMonth(parseInt(previousMonth));
        setSelectedYear(parseInt(previousYear));
        setMessage({ type: 'info', text: 'Önceki seçiminizi kontrol edin' });
      } else {
        setMessage({ type: 'success', text: 'Giriş başarılı! Dashboard\'a yönlendiriliyorsunuz...' });
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } else {
      setMessage({ type: 'danger', text: result.message });
    }
    
    setLoading(false);
  };

  const handleContinueWithPrevious = () => {
    localStorage.setItem('selectedMonth', selectedMonth);
    localStorage.setItem('selectedYear', selectedYear);
    setMessage({ type: 'success', text: 'Önceki seçiminizle devam ediliyor...' });
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  const [showNewPeriodForm, setShowNewPeriodForm] = useState(false);

  const handleNewPeriod = () => {
    setShowNewPeriodForm(true);
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());
  };

  const handleSubmitNewPeriod = () => {
    localStorage.setItem('selectedMonth', selectedMonth);
    localStorage.setItem('selectedYear', selectedYear);
    setMessage({ type: 'success', text: 'Yeni dönem seçildi! Dashboard\'a yönlendiriliyorsunuz...' });
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-lg border-0">
            <Card.Header className="bg-primary text-white text-center py-3">
              <h3 className="mb-0">🔐 Giriş Yap</h3>
            </Card.Header>
            <Card.Body className="p-4">
              {message.text && (
                <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
                  {message.text}
                </Alert>
              )}

              {!showPeriodSelection ? (
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Kullanıcı Adı</Form.Label>
                    <Form.Control
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Kullanıcı adınızı giriniz"
                      required
                      size="lg"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Şifre</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Şifrenizi giriniz"
                      required
                      size="lg"
                    />
                  </Form.Group>

                  <div className="d-grid gap-2 mb-3">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={loading}
                      className="py-2"
                    >
                      {loading ? 'Giriş yapılıyor...' : '🚀 Giriş Yap'}
                    </Button>
                  </div>

                  <div className="text-center">
                    <p className="text-muted mb-0">
                      Hesabınız yok mu?{' '}
                      <Link to="/register" className="text-primary text-decoration-none">
                        Kayıt olun
                      </Link>
                    </p>
                  </div>
                </Form>
              ) : showNewPeriodForm ? (
                <div>
                  <div className="text-center mb-4">
                    <h5 className="text-primary">📅 Yeni Dönem Seçimi</h5>
                    <p className="text-muted">
                      Hangi dönem için takip yapmak istiyorsunuz?
                    </p>
                  </div>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Ay Seçiniz *</Form.Label>
                        <Form.Select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                          size="lg"
                          className="border-primary"
                        >
                          <option value="">Ay seçiniz...</option>
                          {months.map((month) => (
                            <option 
                              key={month.value} 
                              value={month.value}
                            >
                              {month.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Yıl Seçiniz</Form.Label>
                        <Form.Select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          size="lg"
                          className="border-primary"
                        >
                          {years.map((year) => (
                            <option 
                              key={year} 
                              value={year}
                            >
                              {year}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-grid gap-2 mb-3">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleSubmitNewPeriod}
                      disabled={selectedMonth === null || selectedMonth === undefined}
                      className="py-2"
                    >
                      🚀 Bu Dönemle Başla
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="lg"
                      onClick={() => setShowNewPeriodForm(false)}
                      className="py-2"
                    >
                      ⬅️ Geri Dön
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-center mb-4">
                    <h5 className="text-primary">📅 Önceki Seçiminiz</h5>
                    <p className="text-muted">
                      <strong>{months[selectedMonth]?.label} {selectedYear}</strong> dönemi için takip yapıyordunuz.
                    </p>
                  </div>

                  <div className="d-grid gap-2 mb-3">
                    <Button
                      variant="success"
                      size="lg"
                      onClick={handleContinueWithPrevious}
                      className="py-2"
                    >
                      ✅ Bu Dönemle Devam Et
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="lg"
                      onClick={handleNewPeriod}
                      className="py-2"
                    >
                      🔄 Yeni Dönem Seç
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Alt bilgi kartı */}
          <Card className="text-center border-0 bg-light mt-3">
            <Card.Body className="p-3">
              <p className="text-muted mb-0">
                <small>
                  💡 <strong>Güvenlik:</strong> Şifrenizi kimseyle paylaşmayın ve güçlü bir şifre kullanın.
                </small>
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
