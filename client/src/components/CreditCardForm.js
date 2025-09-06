import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BackButton from './BackButton';

const CreditCardForm = () => {
  const navigate = useNavigate();
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    bank_id: '',
    card_name: '',
    card_number: '',
    total_limit: '',
    remaining_limit: '',
    statement_date: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const response = await axios.get('/api/banks');
      setBanks(response.data);
    } catch (error) {
      console.error('Bankalar yüklenemedi:', error);
      setMessage({ type: 'danger', text: 'Bankalar yüklenirken hata oluştu' });
    }
  };

  const handleInputChange = (e) => {
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

  const validateForm = () => {
    const newErrors = {};

    // Zorunlu alanlar
    if (!formData.bank_id) newErrors.bank_id = 'Banka seçimi zorunludur';
    if (!formData.card_name.trim()) newErrors.card_name = 'Kart adı zorunludur';
    if (!formData.total_limit || parseFloat(formData.total_limit) <= 0) {
      newErrors.total_limit = 'Toplam limit 0\'dan büyük olmalıdır';
    }
    if (!formData.remaining_limit || parseFloat(formData.remaining_limit) < 0) {
      newErrors.remaining_limit = 'Kalan limit 0\'dan küçük olamaz';
    }
    if (!formData.statement_date || parseInt(formData.statement_date) < 1 || parseInt(formData.statement_date) > 31) {
      newErrors.statement_date = 'Hesap kesim tarihi 1-31 arasında olmalıdır';
    }

    // Kalan limit, toplam limitten büyük olamaz
    if (formData.total_limit && formData.remaining_limit) {
      if (parseFloat(formData.remaining_limit) > parseFloat(formData.total_limit)) {
        newErrors.remaining_limit = 'Kalan limit, toplam limitten büyük olamaz';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage({ type: 'danger', text: 'Lütfen form hatalarını düzeltin' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.post('/api/credit-cards', formData);
      setMessage({ 
        type: 'success', 
        text: '✅ Kredi kartı başarıyla eklendi! Yeni kart eklemek için formu tekrar doldurabilir veya kredi kartları listesine gidebilirsiniz.' 
      });
      
      // Formu temizle
      setFormData({
        bank_id: '',
        card_name: '',
        card_number: '',
        total_limit: '',
        remaining_limit: '',
        statement_date: ''
      });

      // Formu temizledikten sonra kullanıcıya seçenek sun
      // Otomatik yönlendirme kaldırıldı - kullanıcı isterse tekrar ekleyebilir

    } catch (error) {
      console.error('Kredi kartı eklenirken hata:', error);
      setMessage({ type: 'danger', text: 'Kredi kartı eklenirken hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value) => {
    // Sadece rakamları al ve 4'lü gruplar halinde ayır
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const calculateUsagePercentage = () => {
    if (formData.total_limit && formData.remaining_limit) {
      const total = parseFloat(formData.total_limit);
      const remaining = parseFloat(formData.remaining_limit);
      const used = total - remaining;
      return ((used / total) * 100).toFixed(1);
    }
    return 0;
  };

  const getUsageColor = () => {
    const percentage = parseFloat(calculateUsagePercentage());
    if (percentage >= 80) return 'danger';
    if (percentage >= 60) return 'warning';
    return 'success';
  };

  return (
    <div>
      <BackButton fallbackPath="/kredi-kartlari" />
      <h2 className="mb-4 text-center">💳 Yeni Kredi Kartı Ekle</h2>
      
      <Row className="justify-content-center">
        <Col md={10}>
          <Card>
            <CardHeader>
              <h5 className="mb-0">Kredi Kartı Bilgileri</h5>
            </CardHeader>
            <CardBody>
              {message.text && (
                <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>{message.text}</span>
                    {message.type === 'success' && (
                      <div className="ms-3">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => navigate('/kredi-kartlari')}
                          className="me-2"
                        >
                          📋 Kredi Kartları Listesi
                        </Button>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => setMessage({ type: '', text: '' })}
                        >
                          ➕ Yeni Kart Ekle
                        </Button>
                      </div>
                    )}
                  </div>
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* Banka ve Kart Adı */}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>🏦 Banka Seçin *</Form.Label>
                      <Form.Select
                        name="bank_id"
                        value={formData.bank_id}
                        onChange={handleInputChange}
                        isInvalid={!!errors.bank_id}
                      >
                        <option value="">Banka seçin...</option>
                        {banks.map(bank => (
                          <option key={bank.id} value={bank.id}>
                            {bank.bank_name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.bank_id}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>📝 Kart Adı *</Form.Label>
                      <Form.Control
                        type="text"
                        name="card_name"
                        value={formData.card_name}
                        onChange={handleInputChange}
                        placeholder="Örn: Ana Kart, İş Kartı"
                        isInvalid={!!errors.card_name}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.card_name}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Kart Numarası */}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>🔢 Kart Numarası</Form.Label>
                      <Form.Control
                        type="text"
                        name="card_number"
                        value={formData.card_number}
                        onChange={(e) => {
                          const formatted = formatCardNumber(e.target.value);
                          setFormData(prev => ({ ...prev, card_number: formatted }));
                        }}
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                      />
                      <Form.Text className="text-muted">
                        Kart numarası otomatik olarak formatlanacaktır
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>📅 Hesap Kesim Tarihi *</Form.Label>
                      <Form.Control
                        type="number"
                        name="statement_date"
                        value={formData.statement_date}
                        onChange={handleInputChange}
                        placeholder="1-31 arası"
                        min="1"
                        max="31"
                        isInvalid={!!errors.statement_date}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.statement_date}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Ayın hangi günü hesap kesimi yapılıyor?
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Limit Bilgileri */}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>🎯 Toplam Limit *</Form.Label>
                      <Form.Control
                        type="number"
                        name="total_limit"
                        value={formData.total_limit}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        isInvalid={!!errors.total_limit}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.total_limit}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>💳 Kalan Limit *</Form.Label>
                      <Form.Control
                        type="number"
                        name="remaining_limit"
                        value={formData.remaining_limit}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        isInvalid={!!errors.remaining_limit}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.remaining_limit}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Kullanım Oranı Göstergesi */}
                {formData.total_limit && formData.remaining_limit && (
                  <Row className="mb-4">
                    <Col>
                      <div className={`alert alert-${getUsageColor()}`}>
                        <h6>📊 Kredi Kartı Kullanım Oranı:</h6>
                        <div className="d-flex justify-content-between align-items-center">
                          <span>
                            <strong>Toplam Limit:</strong> {parseFloat(formData.total_limit).toLocaleString('tr-TR')} ₺
                          </span>
                          <span>
                            <strong>Kullanılan:</strong> {(parseFloat(formData.total_limit) - parseFloat(formData.remaining_limit)).toLocaleString('tr-TR')} ₺
                          </span>
                          <span>
                            <strong>Kalan:</strong> {parseFloat(formData.remaining_limit).toLocaleString('tr-TR')} ₺
                          </span>
                          <span>
                            <strong>Kullanım:</strong> {calculateUsagePercentage()}%
                          </span>
                        </div>
                        <div className="progress mt-2">
                          <div 
                            className={`progress-bar bg-${getUsageColor()}`}
                            style={{ width: `${calculateUsagePercentage()}%` }}
                          ></div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                )}

                {/* Bilgi Kartı */}
                <Row className="mb-4">
                  <Col>
                    <div className="alert alert-info">
                      <h6>💡 Kredi Kartı Bilgileri:</h6>
                      <ul className="mb-0 small">
                        <li><strong>Hesap Kesim Tarihi:</strong> Ayın belirtilen gününde hesap kesimi yapılır</li>
                        <li><strong>Kullanım Oranı:</strong> %80 üzeri riskli, %60-80 uyarı, %60 altı güvenli</li>
                        <li><strong>Limit Kontrolü:</strong> Kalan limit asla toplam limitten büyük olamaz</li>
                      </ul>
                    </div>
                  </Col>
                </Row>

                {/* Butonlar */}
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/kredi-kartlari')}
                    className="me-md-2"
                    disabled={loading}
                  >
                    ❌ İptal
                  </Button>
                  <Button
                    type="submit"
                    variant="success"
                    disabled={loading}
                  >
                    {loading ? '⏳ Ekleniyor...' : '✅ Kredi Kartını Kaydet'}
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CreditCardForm;
