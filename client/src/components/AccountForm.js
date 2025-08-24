import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Form, Button, Row, Col, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BackButton from './BackButton';

const AccountForm = () => {
  const navigate = useNavigate();
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    bank_id: '',
    account_name: '',
    account_number: '',
    iban: '',
    account_type: 'vadesiz',
    account_limit: '',
    current_balance: '',
    is_credit_account: false,
    credit_limit: ''
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
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Kredili mevduat hesabı seçimi değiştiğinde ilgili alanları sıfırla
    if (name === 'is_credit_account') {
      if (!checked) {
        setFormData(prev => ({
          ...prev,
          credit_limit: '',
          account_limit: ''
        }));
      }
    }

    // Hesap türü değiştiğinde ilgili alanları sıfırla
    if (name === 'account_type') {
      if (value === 'vadesiz') {
        setFormData(prev => ({
          ...prev,
          account_limit: ''
        }));
      }
    }

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
    if (!formData.account_name.trim()) newErrors.account_name = 'Hesap adı zorunludur';
    if (!formData.iban.trim()) newErrors.iban = 'IBAN zorunludur';
    if (!formData.current_balance) newErrors.current_balance = 'Mevcut bakiye zorunludur';

    // IBAN formatı kontrolü
    if (formData.iban && !formData.iban.startsWith('TR')) {
      newErrors.iban = 'IBAN TR ile başlamalıdır';
    }

    // Kredili mevduat hesabı validasyonları
    if (formData.is_credit_account) {
      if (!formData.credit_limit || parseFloat(formData.credit_limit) <= 0) {
        newErrors.credit_limit = 'Kredi limiti 0\'dan büyük olmalıdır';
      }
    }

    // Vadeli hesap limiti kontrolü
    if (formData.account_type === 'vadeli' && formData.account_limit) {
      if (parseFloat(formData.account_limit) <= 0) {
        newErrors.account_limit = 'Hesap limiti 0\'dan büyük olmalıdır';
      }
    }

    // Bakiye kontrolü
    if (formData.current_balance && parseFloat(formData.current_balance) < 0) {
      if (!formData.is_credit_account) {
        newErrors.current_balance = 'Normal hesaplarda bakiye negatif olamaz';
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
      const response = await axios.post('/api/accounts', formData);
      setMessage({ type: 'success', text: 'Hesap başarıyla eklendi!' });
      
      // Formu temizle
      setFormData({
        bank_id: '',
        account_name: '',
        account_number: '',
        iban: '',
        account_type: 'vadesiz',
        account_limit: '',
        current_balance: '',
        is_credit_account: false,
        credit_limit: ''
      });

      // 2 saniye sonra hesaplar sayfasına yönlendir
      setTimeout(() => {
        navigate('/hesaplar');
      }, 2000);

    } catch (error) {
      console.error('Hesap eklenirken hata:', error);
      setMessage({ type: 'danger', text: 'Hesap eklenirken hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  const formatIBAN = (value) => {
    if (value && !value.startsWith('TR')) {
      return 'TR' + value.replace(/\s/g, '').toUpperCase();
    }
    return value.replace(/\s/g, '').toUpperCase();
  };

  const getAccountTypeInfo = () => {
    if (formData.account_type === 'vadeli') {
      return {
        color: 'warning',
        text: 'Vadeli hesap limiti belirlenebilir',
        icon: '⏰'
      };
    }
    return {
      color: 'info',
      text: 'Vadesiz hesap limiti belirlenemez',
      icon: '💳'
    };
  };

  const getCreditAccountInfo = () => {
    if (formData.is_credit_account) {
      return {
        color: 'danger',
        text: 'Kredili mevduat hesabı - negatif bakiye mümkün',
        icon: '💰'
      };
    }
    return {
      color: 'success',
      text: 'Normal hesap - sadece pozitif bakiye',
      icon: '✅'
    };
  };

  const accountTypeInfo = getAccountTypeInfo();
  const creditAccountInfo = getCreditAccountInfo();

  return (
    <div>
      <BackButton />
      <h2 className="mb-4 text-center">🏦 Yeni Hesap Ekle</h2>
      
      <Row className="justify-content-center">
        <Col md={10}>
          <Card>
            <CardHeader>
              <h5 className="mb-0">Banka Hesap Bilgileri</h5>
            </CardHeader>
            <CardBody>
              {message.text && (
                <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
                  {message.text}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* Banka ve Hesap Adı */}
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
                      {banks.length > 0 && (
                        <Form.Text className="text-muted">
                          {banks.length} adet banka bulundu
                        </Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>📝 Hesap Adı *</Form.Label>
                      <Form.Control
                        type="text"
                        name="account_name"
                        value={formData.account_name}
                        onChange={handleInputChange}
                        placeholder="Örn: Ana Hesap, Tasarruf Hesabı"
                        isInvalid={!!errors.account_name}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.account_name}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Hesap Numarası ve IBAN */}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>🔢 Hesap Numarası</Form.Label>
                      <Form.Control
                        type="text"
                        name="account_number"
                        value={formData.account_number}
                        onChange={handleInputChange}
                        placeholder="Hesap numarası (opsiyonel)"
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>🌍 IBAN *</Form.Label>
                      <Form.Control
                        type="text"
                        name="iban"
                        value={formData.iban}
                        onChange={(e) => {
                          const formatted = formatIBAN(e.target.value);
                          setFormData(prev => ({ ...prev, iban: formatted }));
                        }}
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                        maxLength={32}
                        isInvalid={!!errors.iban}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.iban}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        IBAN otomatik olarak TR ile başlayacak şekilde formatlanacaktır
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Hesap Türü ve Hesap Limiti */}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>📅 Hesap Türü</Form.Label>
                      <Form.Select
                        name="account_type"
                        value={formData.account_type}
                        onChange={handleInputChange}
                      >
                        <option value="vadesiz">Vadesiz Hesap</option>
                        <option value="vadeli">Vadeli Hesap</option>
                      </Form.Select>
                      <Form.Text className={`text-${accountTypeInfo.color}`}>
                        {accountTypeInfo.icon} {accountTypeInfo.text}
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>💰 Hesap Limiti</Form.Label>
                      <Form.Control
                        type="number"
                        name="account_limit"
                        value={formData.account_limit}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        disabled={formData.account_type === 'vadesiz'}
                        isInvalid={!!errors.account_limit}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.account_limit}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        {formData.account_type === 'vadeli' 
                          ? 'Vadeli hesap için işlem limiti' 
                          : 'Vadesiz hesaplarda limit belirlenemez'
                        }
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Mevcut Bakiye ve Kredili Mevduat */}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>💵 Mevcut Bakiye *</Form.Label>
                      <Form.Control
                        type="number"
                        name="current_balance"
                        value={formData.current_balance}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        isInvalid={!!errors.current_balance}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.current_balance}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>💳 Kredili Mevduat Hesabı</Form.Label>
                      <Form.Check
                        type="checkbox"
                        name="is_credit_account"
                        checked={formData.is_credit_account}
                        onChange={handleInputChange}
                        label="Bu hesap kredili mevduat hesabıdır"
                      />
                      <Form.Text className={`text-${creditAccountInfo.color}`}>
                        {creditAccountInfo.icon} {creditAccountInfo.text}
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Kredi Limiti - Sadece kredili mevduat seçildiğinde */}
                {formData.is_credit_account && (
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>🎯 Kredi Limiti *</Form.Label>
                        <Form.Control
                          type="number"
                          name="credit_limit"
                          value={formData.credit_limit}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          isInvalid={!!errors.credit_limit}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.credit_limit}
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted">
                          Kredili mevduat hesabı için maksimum kredi limiti
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                )}

                {/* Bilgi Kartları */}
                <Row className="mb-4">
                  <Col md={6}>
                    <div className={`alert alert-${accountTypeInfo.color} mb-0`}>
                      <h6>📋 Hesap Türü Bilgisi:</h6>
                      <ul className="mb-0 small">
                        <li><strong>Vadesiz:</strong> Günlük işlemler, limit yok</li>
                        <li><strong>Vadeli:</strong> Belirli süre için, limit belirlenebilir</li>
                      </ul>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className={`alert alert-${creditAccountInfo.color} mb-0`}>
                      <h6>💳 Kredili Mevduat:</h6>
                      <ul className="mb-0 small">
                        <li><strong>Normal:</strong> Sadece pozitif bakiye</li>
                        <li><strong>Kredili:</strong> Negatif bakiye mümkün</li>
                      </ul>
                    </div>
                  </Col>
                </Row>

                {/* Butonlar */}
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/')}
                    className="me-md-2"
                    disabled={loading}
                  >
                    ❌ İptal
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                  >
                    {loading ? '⏳ Ekleniyor...' : '✅ Hesabı Kaydet'}
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

export default AccountForm;
