import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Form, 
  Alert, Table, Badge, Modal,
  Spinner
} from 'react-bootstrap';
import { 
  FaPlus, FaEdit, FaTrash, FaCalendarAlt,
  FaCreditCard, FaClock, FaCheck,
  FaExclamationTriangle, FaHistory
} from 'react-icons/fa';
import './AutomaticPayments.css';

const AutomaticPayments = () => {
  const [payments, setPayments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Hesaplar ve kredi kartları için state'ler
  const [userAccounts, setUserAccounts] = useState([]);
  const [userCreditCards, setUserCreditCards] = useState([]);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  
  // Form states
  const [paymentForm, setPaymentForm] = useState({
    category_id: '',
    title: '',
    description: '',
    amount: '',
    currency: 'TRY',
    frequency_type: 'monthly',
    frequency_value: 1,
    start_date: '',
    end_date: '',
    account_type: 'bank_account',
    account_id: '',
    auto_execute: false,
    reminder_days: 3
  });
  
  const [manualPaymentForm, setManualPaymentForm] = useState({
    payment_date: '',
    amount: '',
    description: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, categoriesRes, summaryRes, accountsRes, creditCardsRes] = await Promise.all([
        fetch('/api/automatic-payments'),
        fetch('/api/automatic-payment-categories'),
        // fetch('/api/automatic-payment-templates'),
        fetch('/api/automatic-payments/summary'),
        fetch('/api/user-accounts'),
        fetch('/api/user-credit-cards')
      ]);

      if (paymentsRes.ok) setPayments(await paymentsRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      // if (templatesRes.ok) setTemplates(await templatesRes.json());
      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (accountsRes.ok) setUserAccounts(await accountsRes.json());
      if (creditCardsRes.ok) setUserCreditCards(await creditCardsRes.json());
    } catch (error) {
      setMessage({ type: 'danger', text: 'Veriler yüklenirken hata oluştu' });
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/automatic-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Otomatik ödeme başarıyla oluşturuldu' });
        setShowAddModal(false);
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        setMessage({ type: 'danger', text: error.error || 'Ödeme oluşturulamadı' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Bağlantı hatası' });
    }
    setLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/automatic-payments/${selectedPayment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Ödeme başarıyla güncellendi' });
        setShowEditModal(false);
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        setMessage({ type: 'danger', text: error.error || 'Güncelleme başarısız' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Bağlantı hatası' });
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu ödeme talimatını silmek istediğinizden emin misiniz?')) return;
    
    try {
      const response = await fetch(`/api/automatic-payments/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Ödeme başarıyla silindi' });
        fetchData();
      } else {
        const error = await response.json();
        setMessage({ type: 'danger', text: error.error || 'Silme başarısız' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Bağlantı hatası' });
    }
  };

  const handleManualPayment = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/automatic-payments/${selectedPayment.id}/manual-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualPaymentForm)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Manuel ödeme başarıyla kaydedildi' });
        setShowManualPaymentModal(false);
        setManualPaymentForm({ payment_date: '', amount: '', description: '' });
        fetchData();
      } else {
        const error = await response.json();
        setMessage({ type: 'danger', text: error.error || 'Ödeme kaydedilemedi' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Bağlantı hatası' });
    }
    setLoading(false);
  };

  const fetchHistory = async (paymentId) => {
    try {
      const response = await fetch(`/api/automatic-payments/${paymentId}/history`);
      if (response.ok) {
        setPaymentHistory(await response.json());
        setShowHistoryModal(true);
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Geçmiş yüklenemedi' });
    }
  };

  const resetForm = () => {
    setPaymentForm({
      category_id: '',
      title: '',
      description: '',
      amount: '',
      currency: 'TRY',
      frequency_type: 'monthly',
      frequency_value: 1,
      start_date: '',
      end_date: '',
      account_type: '', // Boş string olarak başlat
      account_id: '',
      auto_execute: false,
      reminder_days: 3
    });
  };

  const openEditModal = (payment) => {
    setSelectedPayment(payment);
    setPaymentForm({
      category_id: payment.category_id,
      title: payment.title,
      description: payment.description || '',
      amount: payment.amount,
      currency: payment.currency,
      frequency_type: payment.frequency_type,
      frequency_value: payment.frequency_value,
      start_date: payment.start_date,
      end_date: payment.end_date || '',
      account_type: payment.account_type,
      account_id: payment.account_id,
      auto_execute: payment.auto_execute,
      reminder_days: payment.reminder_days,
      is_active: payment.is_active
    });
    setShowEditModal(true);
  };

  const openManualPaymentModal = (payment) => {
    setSelectedPayment(payment);
    setManualPaymentForm({
      payment_date: new Date().toISOString().split('T')[0],
      amount: payment.amount,
      description: payment.title
    });
    setShowManualPaymentModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'overdue':
        return <Badge bg="danger">Gecikmiş</Badge>;
      case 'due_soon':
        return <Badge bg="warning">Yakında</Badge>;
      case 'upcoming':
        return <Badge bg="info">Yaklaşıyor</Badge>;
      default:
        return <Badge bg="secondary">Bilinmiyor</Badge>;
    }
  };

  const getFrequencyText = (type, value) => {
    switch (type) {
      case 'daily':
        return `Her ${value} gün`;
      case 'weekly':
        return `Her ${value} hafta`;
      case 'monthly':
        return `Her ${value} ay`;
      case 'quarterly':
        return `Her ${value} çeyrek`;
      case 'yearly':
        return `Her ${value} yıl`;
      default:
        return `Her ${value} gün`;
    }
  };

  if (loading && payments.length === 0) {
    return (
      <Container className="mt-4">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3">Yükleniyor...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      {message.text && (
        <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">💳 Otomatik Ödeme Talimatları</h2>
              <p className="text-muted mb-0">Düzenli ödemelerinizi otomatik olarak takip edin</p>
            </div>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <FaPlus className="me-2" />
              Yeni Ödeme Talimatı
            </Button>
          </div>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="text-center border-primary">
            <Card.Body>
              <div className="text-primary mb-2">
                <FaCreditCard size={24} />
              </div>
              <h4>{summary.total_payments || 0}</h4>
              <small className="text-muted">Toplam Talimat</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-success">
            <Card.Body>
              <div className="text-success mb-2">
                <FaCheck size={24} />
              </div>
              <h4>{summary.active_payments || 0}</h4>
              <small className="text-muted">Aktif Talimat</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-warning">
            <Card.Body>
              <div className="text-warning mb-2">
                <FaExclamationTriangle size={24} />
              </div>
              <h4>{summary.due_soon_payments || 0}</h4>
              <small className="text-muted">Yakında Ödenecek</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-danger">
            <Card.Body>
              <div className="text-danger mb-2">
                <FaClock size={24} />
              </div>
              <h4>{summary.overdue_payments || 0}</h4>
              <small className="text-muted">Gecikmiş</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Payments Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">📋 Ödeme Talimatları</h5>
        </Card.Header>
        <Card.Body>
          {payments.length === 0 ? (
            <div className="text-center py-5">
              <FaCreditCard size={48} className="text-muted mb-3" />
              <h5 className="text-muted">Henüz ödeme talimatı oluşturmadınız</h5>
              <p className="text-muted">İlk ödeme talimatınızı oluşturmak için yukarıdaki butona tıklayın</p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Kategori</th>
                  <th>Başlık</th>
                  <th>Tutar</th>
                  <th>Sıklık</th>
                  <th>Sonraki Ödeme</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="me-2" style={{ fontSize: '1.2em' }}>
                          {payment.category_icon}
                        </span>
                        <span className="text-muted">{payment.category_name}</span>
                      </div>
                    </td>
                    <td>
                      <strong>{payment.title}</strong>
                      {payment.description && (
                        <div className="text-muted small">{payment.description}</div>
                      )}
                    </td>
                    <td>
                      <strong className="text-primary">
                        {payment.amount.toLocaleString('tr-TR')} {payment.currency}
                      </strong>
                    </td>
                    <td>
                      <small>{getFrequencyText(payment.frequency_type, payment.frequency_value)}</small>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <FaCalendarAlt className="me-2 text-muted" />
                        <span className={payment.days_until_payment <= 0 ? 'text-danger' : ''}>
                          {new Date(payment.next_payment_date).toLocaleDateString('tr-TR')}
                        </span>
                        {payment.days_until_payment > 0 && (
                          <Badge bg="info" className="ms-2">
                            {payment.days_until_payment} gün
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td>{getStatusBadge(payment.payment_status)}</td>
                    <td>
                      <div className="btn-group" role="group">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => openEditModal(payment)}
                          title="Düzenle"
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => openManualPaymentModal(payment)}
                          title="Manuel Ödeme"
                        >
                          <FaCheck />
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => fetchHistory(payment.id)}
                          title="Geçmiş"
                        >
                          <FaHistory />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(payment.id)}
                          title="Sil"
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add Payment Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>➕ Yeni Ödeme Talimatı</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kategori</Form.Label>
                  <Form.Select
                    value={paymentForm.category_id}
                    onChange={(e) => setPaymentForm({...paymentForm, category_id: e.target.value})}
                    required
                  >
                    <option value="">Kategori seçin</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Başlık</Form.Label>
                  <Form.Control
                    type="text"
                    value={paymentForm.title}
                    onChange={(e) => setPaymentForm({...paymentForm, title: e.target.value})}
                    placeholder="Örn: Ev Kirası"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                value={paymentForm.description}
                onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                placeholder="Ödeme hakkında açıklama (opsiyonel)"
                rows={2}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tutar</Form.Label>
                  <Form.Control
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Para Birimi</Form.Label>
                  <Form.Select
                    value={paymentForm.currency}
                    onChange={(e) => setPaymentForm({...paymentForm, currency: e.target.value})}
                  >
                    <option value="TRY">TRY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ödeme Sıklığı</Form.Label>
                  <Form.Select
                    value={paymentForm.frequency_type}
                    onChange={(e) => setPaymentForm({...paymentForm, frequency_type: e.target.value})}
                    required
                  >
                    <option value="daily">Günlük</option>
                    <option value="weekly">Haftalık</option>
                    <option value="monthly">Aylık</option>
                    <option value="quarterly">Çeyreklik</option>
                    <option value="yearly">Yıllık</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Değer</Form.Label>
                  <Form.Control
                    type="number"
                    value={paymentForm.frequency_value}
                    onChange={(e) => setPaymentForm({...paymentForm, frequency_value: parseInt(e.target.value)})}
                    placeholder="1"
                    min="1"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Başlangıç Tarihi</Form.Label>
                  <Form.Control
                    type="date"
                    value={paymentForm.start_date}
                    onChange={(e) => setPaymentForm({...paymentForm, start_date: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bitiş Tarihi (Opsiyonel)</Form.Label>
                  <Form.Control
                    type="date"
                    value={paymentForm.end_date}
                    onChange={(e) => setPaymentForm({...paymentForm, end_date: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hesap Türü</Form.Label>
                  <Form.Select
                    value={paymentForm.account_type}
                    onChange={(e) => {
                      setPaymentForm({
                        ...paymentForm, 
                        account_type: e.target.value,
                        account_id: '' // Hesap türü değiştiğinde hesap seçimini sıfırla
                      });
                    }}
                    required
                  >
                    <option value="">Hesap türü seçin</option>
                    <option value="bank_account">Banka Hesabı</option>
                    <option value="credit_card">Kredi Kartı</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {paymentForm.account_type === 'bank_account' ? 'Banka Hesabı' : 
                     paymentForm.account_type === 'credit_card' ? 'Kredi Kartı' : 'Hesap'}
                  </Form.Label>
                  <Form.Select
                    value={paymentForm.account_id}
                    onChange={(e) => setPaymentForm({...paymentForm, account_id: e.target.value})}
                    required
                    disabled={!paymentForm.account_type}
                  >
                    <option value="">
                      {paymentForm.account_type === 'bank_account' ? 'Hesap seçin' : 
                       paymentForm.account_type === 'credit_card' ? 'Kart seçin' : 'Önce hesap türü seçin'}
                    </option>
                    {paymentForm.account_type === 'bank_account' && userAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.bank_name} - {account.account_name} ({account.account_number})
                      </option>
                    ))}
                    {paymentForm.account_type === 'credit_card' && userCreditCards.map(card => (
                      <option key={card.id} value={card.id}>
                        {card.bank_name} - {card.card_name} (****{card.card_number?.slice(-4) || '****'})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hatırlatma (Gün)</Form.Label>
                  <Form.Control
                    type="number"
                    value={paymentForm.reminder_days}
                    onChange={(e) => setPaymentForm({...paymentForm, reminder_days: parseInt(e.target.value)})}
                    placeholder="3"
                    min="0"
                    max="30"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Otomatik Yürüt"
                    checked={paymentForm.auto_execute}
                    onChange={(e) => setPaymentForm({...paymentForm, auto_execute: e.target.checked})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-grid gap-2">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : 'Oluştur'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit Payment Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>✏️ Ödeme Düzenle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdate}>
            {/* Same form fields as Add Modal */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kategori</Form.Label>
                  <Form.Select
                    value={paymentForm.category_id}
                    onChange={(e) => setPaymentForm({...paymentForm, category_id: e.target.value})}
                    required
                  >
                    <option value="">Kategori seçin</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Başlık</Form.Label>
                  <Form.Control
                    type="text"
                    value={paymentForm.title}
                    onChange={(e) => setPaymentForm({...paymentForm, title: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                value={paymentForm.description}
                onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                rows={2}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tutar</Form.Label>
                  <Form.Control
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    step="0.01"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Para Birimi</Form.Label>
                  <Form.Select
                    value={paymentForm.currency}
                    onChange={(e) => setPaymentForm({...paymentForm, currency: e.target.value})}
                  >
                    <option value="TRY">TRY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ödeme Sıklığı</Form.Label>
                  <Form.Select
                    value={paymentForm.frequency_type}
                    onChange={(e) => setPaymentForm({...paymentForm, frequency_type: e.target.value})}
                    required
                  >
                    <option value="daily">Günlük</option>
                    <option value="weekly">Haftalık</option>
                    <option value="monthly">Aylık</option>
                    <option value="quarterly">Çeyreklik</option>
                    <option value="yearly">Yıllık</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Değer</Form.Label>
                  <Form.Control
                    type="number"
                    value={paymentForm.frequency_value}
                    onChange={(e) => setPaymentForm({...paymentForm, frequency_value: parseInt(e.target.value)})}
                    min="1"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Başlangıç Tarihi</Form.Label>
                  <Form.Control
                    type="date"
                    value={paymentForm.start_date}
                    onChange={(e) => setPaymentForm({...paymentForm, start_date: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bitiş Tarihi (Opsiyonel)</Form.Label>
                  <Form.Control
                    type="date"
                    value={paymentForm.end_date}
                    onChange={(e) => setPaymentForm({...paymentForm, end_date: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hesap Türü</Form.Label>
                  <Form.Select
                    value={paymentForm.account_type}
                    onChange={(e) => {
                      setPaymentForm({
                        ...paymentForm, 
                        account_type: e.target.value,
                        account_id: '' // Hesap türü değiştiğinde hesap seçimini sıfırla
                      });
                    }}
                    required
                  >
                    <option value="">Hesap türü seçin</option>
                    <option value="bank_account">Banka Hesabı</option>
                    <option value="credit_card">Kredi Kartı</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {paymentForm.account_type === 'bank_account' ? 'Banka Hesabı' : 
                     paymentForm.account_type === 'credit_card' ? 'Kredi Kartı' : 'Hesap'}
                  </Form.Label>
                  <Form.Select
                    value={paymentForm.account_id}
                    onChange={(e) => setPaymentForm({...paymentForm, account_id: e.target.value})}
                    required
                    disabled={!paymentForm.account_type}
                  >
                    <option value="">
                      {paymentForm.account_type === 'bank_account' ? 'Hesap seçin' : 
                       paymentForm.account_type === 'Kredi Kartı' ? 'Kart seçin' : 'Önce hesap türü seçin'}
                    </option>
                    {paymentForm.account_type === 'bank_account' && userAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.bank_name} - {account.account_name} ({account.account_number})
                      </option>
                    ))}
                    {paymentForm.account_type === 'credit_card' && userCreditCards.map(card => (
                      <option key={card.id} value={card.id}>
                        {card.bank_name} - {card.card_name} (****{card.card_number?.slice(-4) || '****'})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hatırlatma (Gün)</Form.Label>
                  <Form.Control
                    type="number"
                    value={paymentForm.reminder_days}
                    onChange={(e) => setPaymentForm({...paymentForm, reminder_days: parseInt(e.target.value)})}
                    min="0"
                    max="30"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Otomatik Yürüt"
                    checked={paymentForm.auto_execute}
                    onChange={(e) => setPaymentForm({...paymentForm, auto_execute: e.target.checked})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-grid gap-2">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : 'Güncelle'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Manual Payment Modal */}
      <Modal show={showManualPaymentModal} onHide={() => setShowManualPaymentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>💳 Manuel Ödeme Kaydet</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleManualPayment}>
            <Form.Group className="mb-3">
              <Form.Label>Ödeme Tarihi</Form.Label>
              <Form.Control
                type="date"
                value={manualPaymentForm.payment_date}
                onChange={(e) => setManualPaymentForm({...manualPaymentForm, payment_date: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Tutar</Form.Label>
              <Form.Control
                type="number"
                value={manualPaymentForm.amount}
                onChange={(e) => setManualPaymentForm({...manualPaymentForm, amount: e.target.value})}
                step="0.01"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                type="text"
                value={manualPaymentForm.description}
                onChange={(e) => setManualPaymentForm({...manualPaymentForm, description: e.target.value})}
                placeholder="Ödeme açıklaması"
              />
            </Form.Group>

            <div className="d-grid gap-2">
              <Button type="submit" variant="success" disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : 'Kaydet'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* History Modal */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📋 Ödeme Geçmişi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {paymentHistory.length === 0 ? (
            <div className="text-center py-3">
              <p className="text-muted">Henüz ödeme geçmişi bulunmuyor</p>
            </div>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Tutar</th>
                  <th>Durum</th>
                  <th>Yöntem</th>
                  <th>Açıklama</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.payment_date).toLocaleDateString('tr-TR')}</td>
                    <td>
                      <strong>{item.amount} {item.currency}</strong>
                    </td>
                    <td>
                      <Badge bg={item.status === 'completed' ? 'success' : 'warning'}>
                        {item.status === 'completed' ? 'Tamamlandı' : 'Bekliyor'}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={item.execution_method === 'automatic' ? 'info' : 'secondary'}>
                        {item.execution_method === 'automatic' ? 'Otomatik' : 'Manuel'}
                      </Badge>
                    </td>
                    <td>
                      {item.expense_description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AutomaticPayments;
