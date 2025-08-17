import React, { useState } from 'react';
import { Card, Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [errors, setErrors] = useState({});
  
  // Mevcut ay ve yıl için varsayılan değerler
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Hata mesajını temizle
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
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

  // Yıl seçenekleri (son 5 yıl ve gelecek 2 yıl)
  const years = [];
  for (let year = currentYear - 5; year <= currentYear + 2; year++) {
    years.push(year);
  }

  const validateForm = () => {
    const newErrors = {};

    if (formData.username.length < 3) {
      newErrors.username = 'Kullanıcı adı en az 3 karakter olmalıdır';
    }

    if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    if (!formData.email.includes('@')) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    if (formData.full_name.length < 2) {
      newErrors.full_name = 'Ad soyad en az 2 karakter olmalıdır';
    }

    if (selectedMonth === null || selectedMonth === undefined) {
      newErrors.month = 'Lütfen bir ay seçiniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    const result = await register(
      formData.username,
      formData.email,
      formData.password,
      formData.full_name
    );
    
    if (result.success) {
      // Seçilen ay ve yılı localStorage'a kaydet
      localStorage.setItem('selectedMonth', selectedMonth);
      localStorage.setItem('selectedYear', selectedYear);
      
      setMessage({ type: 'success', text: result.message + ' Dashboard\'a yönlendiriliyorsunuz...' });
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } else {
      setMessage({ type: 'danger', text: result.message });
    }
    
    setLoading(false);
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-lg border-0">
            <Card.Header className="bg-success text-white text-center py-3">
              <h3 className="mb-0">📝 Yeni Hesap Oluştur</h3>
            </Card.Header>
            <Card.Body className="p-4">
              {message.text && (
                <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
                  {message.text}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Kullanıcı Adı *</Form.Label>
                      <Form.Control
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Kullanıcı adınız"
                        isInvalid={!!errors.username}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.username}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>E-posta *</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="ornek@email.com"
                        isInvalid={!!errors.email}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Ad Soyad *</Form.Label>
                  <Form.Control
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Adınız ve soyadınız"
                    isInvalid={!!errors.full_name}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.full_name}
                  </Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Şifre *</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Şifreniz"
                        isInvalid={!!errors.password}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.password}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Şifre Tekrar *</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Şifrenizi tekrar giriniz"
                        isInvalid={!!errors.confirmPassword}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.confirmPassword}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Ay ve Yıl Seçimi */}
                <Card className="border-success bg-light mb-3">
                  <Card.Header className="bg-success text-white">
                    <h6 className="mb-0">📅 Hangi Dönem İçin Takip Yapmak İstiyorsunuz?</h6>
                  </Card.Header>
                  <Card.Body className="p-3">
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-bold">Ay Seçiniz *</Form.Label>
                          <Form.Select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            isInvalid={!!errors.month}
                            size="lg"
                            className="border-success"
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
                          <Form.Control.Feedback type="invalid">
                            {errors.month}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-bold">Yıl Seçiniz</Form.Label>
                          <Form.Select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            size="lg"
                            className="border-success"
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
                  </Card.Body>
                </Card>

                <div className="d-grid gap-2 mb-3">
                  <Button
                    type="submit"
                    variant="success"
                    size="lg"
                    disabled={loading}
                    className="py-2"
                  >
                    {loading ? 'Hesap oluşturuluyor...' : '🚀 Hesap Oluştur ve Takibe Başla'}
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-muted mb-0">
                    Zaten hesabınız var mı?{' '}
                    <Link to="/login" className="text-success text-decoration-none">
                      Giriş yapın
                    </Link>
                  </p>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Alt bilgi kartı */}
          <Card className="text-center border-0 bg-light mt-3">
            <Card.Body className="p-3">
              <p className="text-muted mb-0">
                <small>
                  💡 <strong>Güvenlik:</strong> Güçlü bir şifre kullanın ve bilgilerinizi güvende tutun.
                </small>
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterPage;
