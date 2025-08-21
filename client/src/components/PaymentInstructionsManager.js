import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Row, Col, Card, Button, Form, Alert, Badge, Modal,
  Spinner, Tabs, Tab, ButtonGroup
} from 'react-bootstrap';
import { 
  FaPlus, FaEdit, FaTrash, FaCalendar, FaCreditCard, FaUniversity, 
  FaClock, FaCheckCircle, FaTimesCircle, FaExclamationTriangle 
} from 'react-icons/fa';

const PaymentInstructionsManager = () => {
  const [instructions, setInstructions] = useState([]);
  const [cancelledInstructions, setCancelledInstructions] = useState([]);
  const [expiredInstructions, setExpiredInstructions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState(null);
  const [cancellingInstruction, setCancellingInstruction] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    instruction_type: 'fixed_term',
    expense_id: '',
    payment_method: 'account',
    payment_source_id: '',
    payment_source_type: 'account',
    frequency: 'monthly',
    amount: '',
    description: '',
    start_date: '',
    end_date: '',
    total_transfers: ''
  });

  // İptal etme form state
  const [cancelFormData, setCancelFormData] = useState({
    cancellation_reason: ''
  });

  useEffect(() => {
    fetchInstructions();
    fetchCancelledInstructions();
    fetchExpiredInstructions();
    fetchAccounts();
    fetchCreditCards();
  }, []);

  const fetchInstructions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/payment-instructions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // API response'ını güvenli şekilde kontrol et
      if (response.data && response.data.success && response.data.instructions) {
        setInstructions(response.data.instructions);
      } else {
        setInstructions([]);
        console.warn('API response format beklenenden farklı:', response.data);
      }
    } catch (error) {
      console.error('Ödeme talimatları yüklenirken hata:', error);
      setMessage({ type: 'danger', text: 'Ödeme talimatları yüklenirken hata oluştu' });
      setInstructions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCancelledInstructions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/payment-instructions/cancelled', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // API response'ını güvenli şekilde kontrol et
      if (response.data && response.data.success && response.data.instructions) {
        setCancelledInstructions(response.data.instructions);
      } else {
        setCancelledInstructions([]);
        console.warn('Cancelled instructions API response format beklenenden farklı:', response.data);
      }
    } catch (error) {
      console.error('İptal edilen talimatlar yüklenirken hata:', error);
      setCancelledInstructions([]);
    }
  };

  const fetchExpiredInstructions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/payment-instructions/expired', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // API response'ını güvenli şekilde kontrol et
      if (response.data && response.data.success && response.data.instructions) {
        setExpiredInstructions(response.data.instructions);
      } else {
        setExpiredInstructions([]);
        console.warn('Expired instructions API response format beklenenden farklı:', response.data);
      }
    } catch (error) {
      console.error('Süresi biten talimatlar yüklenirken hata:', error);
      setExpiredInstructions([]);
    }
  };

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/accounts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // API response'ını güvenli şekilde kontrol et
      if (response.data && Array.isArray(response.data)) {
        setAccounts(response.data);
      } else if (response.data && response.data.accounts && Array.isArray(response.data.accounts)) {
        setAccounts(response.data.accounts);
      } else {
        setAccounts([]);
        console.warn('Accounts API response format beklenenden farklı:', response.data);
      }
    } catch (error) {
      console.error('Hesaplar yüklenirken hata:', error);
      setAccounts([]);
    }
  };

  const fetchCreditCards = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/credit-cards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // API response'ını güvenli şekilde kontrol et
      if (response.data && Array.isArray(response.data)) {
        setCreditCards(response.data);
      } else if (response.data && response.data.creditCards && Array.isArray(response.data.creditCards)) {
        setCreditCards(response.data.creditCards);
      } else {
        setCreditCards([]);
        console.warn('Credit cards API response format beklenenden farklı:', response.data);
      }
    } catch (error) {
      console.error('Kredi kartları yüklenirken hata:', error);
      setCreditCards([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // payment_source_type'ı payment_method'a göre ayarla
      const submitData = {
        ...formData,
        payment_source_type: formData.payment_method
      };
      
      const response = await axios.post('/api/payment-instructions', submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({ type: 'success', text: response.data.message });
      setShowAddModal(false);
      fetchInstructions();
      resetForm();
    } catch (error) {
      setMessage({ type: 'danger', text: error.response?.data?.message || 'Ödeme talimatı eklenirken hata oluştu' });
    }
  };

  const handleCancelInstruction = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.patch(`/api/payment-instructions/${cancellingInstruction.id}/cancel`, 
        cancelFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({ type: 'success', text: response.data.message });
      setShowCancelModal(false);
      setCancellingInstruction(null);
      setCancelFormData({ cancellation_reason: '' });
      fetchInstructions();
      fetchCancelledInstructions();
    } catch (error) {
      setMessage({ type: 'danger', text: error.response?.data?.message || 'Talimat iptal edilirken hata oluştu' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      instruction_type: 'fixed_term',
      expense_id: '',
      payment_method: 'account',
      payment_source_id: '',
      payment_source_type: 'account',
      frequency: 'monthly',
      amount: '',
      description: '',
      start_date: '',
      end_date: '',
      total_transfers: ''
    });
  };

  const handleEdit = (instruction) => {
    setEditingInstruction(instruction);
    setFormData({
      title: instruction.title,
      instruction_type: instruction.instruction_type,
      expense_id: instruction.expense_id || '',
      payment_method: instruction.payment_method,
      payment_source_id: instruction.payment_source_id,
      payment_source_type: instruction.payment_source_type,
      frequency: instruction.frequency || 'monthly',
      amount: instruction.amount,
      description: instruction.description || '',
      start_date: instruction.start_date || '',
      end_date: instruction.end_date || '',
      total_transfers: instruction.total_transfers || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // payment_source_type'ı payment_method'a göre ayarla
      const submitData = {
        ...formData,
        payment_source_type: formData.payment_method
      };
      
      const response = await axios.put(`/api/payment-instructions/${editingInstruction.id}`, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({ type: 'success', text: response.data.message });
      setShowEditModal(false);
      setEditingInstruction(null);
      resetForm();
      fetchInstructions();
    } catch (error) {
      setMessage({ 
        type: 'danger', 
        text: error.response?.data?.message || 'Ödeme talimatı güncellenirken hata oluştu' 
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu ödeme talimatını silmek istediğinizden emin misiniz?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`/api/payment-instructions/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setMessage({ type: 'success', text: response.data.message });
        fetchInstructions();
      } catch (error) {
        setMessage({ 
          type: 'danger', 
          text: error.response?.data?.message || 'Ödeme talimatı silinirken hata oluştu' 
        });
      }
    }
  };

  const toggleStatus = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`/api/payment-instructions/${id}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({ type: 'success', text: response.data.message });
      fetchInstructions();
    } catch (error) {
      setMessage({ 
        type: 'danger', 
        text: error.response?.data?.message || 'Durum güncellenirken hata oluştu' 
      });
    }
  };

  const getStatusBadge = (instruction) => {
    if (!instruction.is_active) {
      return <Badge bg="secondary">Pasif</Badge>;
    }

    if (instruction.instruction_type === 'automatic') {
      const nextDate = new Date(instruction.next_payment_date);
      const today = new Date();
      const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return <Badge bg="danger">Gecikmiş</Badge>;
      } else if (diffDays <= 7) {
        return <Badge bg="warning">Yaklaşıyor</Badge>;
      } else {
        return <Badge bg="success">Planlanmış</Badge>;
      }
    } else {
      if (instruction.remaining_transfers <= 0) {
        return <Badge bg="secondary">Tamamlandı</Badge>;
      } else if (instruction.remaining_transfers <= 3) {
        return <Badge bg="warning">Az Kaldı</Badge>;
      } else {
        return <Badge bg="info">Devam Ediyor</Badge>;
      }
    }
  };

  const getMethodIcon = (method) => {
    return method === 'account' ? <FaUniversity className="me-2" /> : <FaCreditCard className="me-2" />;
  };

  const getInstructionTypeLabel = (type) => {
    return type === 'automatic' ? 'Otomatik' : 'Sabit Süreli';
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      monthly: 'Aylık',
      quarterly: '3 Aylık',
      yearly: 'Yıllık'
    };
    return labels[frequency] || frequency;
  };

  const getRemainingInfo = (instruction) => {
    if (instruction.instruction_type === 'automatic') {
      const nextDate = new Date(instruction.next_payment_date);
      const today = new Date();
      const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return `Gecikmiş: ${Math.abs(diffDays)} gün`;
      } else if (diffDays === 0) {
        return 'Bugün ödenecek';
      } else {
        return `${diffDays} gün sonra ödenecek`;
      }
    } else {
      if (instruction.remaining_transfers <= 0) {
        return 'Tüm ödemeler tamamlandı';
      } else {
        const estimatedEndDate = instruction.end_date ? 
          new Date(instruction.end_date).toLocaleDateString('tr-TR') : 
          'Belirsiz';
        return `${instruction.remaining_transfers} ödeme kaldı (Tahmini bitiş: ${estimatedEndDate})`;
      }
    }
  };

  const filteredInstructions = (instructions || []).filter(instruction => {
    if (activeTab === 'all') return true;
    if (activeTab === 'automatic') return instruction.instruction_type === 'automatic';
    if (activeTab === 'fixed_term') return instruction.instruction_type === 'fixed_term';
    return true;
  });

  const getInstructionsForTab = () => {
    switch (activeTab) {
      case 'cancelled':
        return cancelledInstructions || [];
      case 'expired':
        return expiredInstructions || [];
      default:
        return filteredInstructions || [];
    }
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>💳 Ödeme Talimatlarım</h2>
          <p className="text-muted">
            Otomatik ödeme talimatlarınızı ve sabit süreli ödeme planlarınızı yönetin
          </p>
        </Col>
        <Col xs="auto">
          <Button 
            variant="primary" 
            onClick={() => setShowAddModal(true)}
            className="d-flex align-items-center"
          >
            <FaPlus className="me-2" />
            Yeni Talimat Ekle
          </Button>
        </Col>
      </Row>

      {message.text && (
        <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        <Tab eventKey="all" title={`Tümü (${instructions?.length || 0})`} />
        <Tab eventKey="automatic" title={`Otomatik (${instructions?.filter(i => i.instruction_type === 'automatic')?.length || 0})`} />
        <Tab eventKey="fixed_term" title={`Sabit Süreli (${instructions?.filter(i => i.instruction_type === 'fixed_term')?.length || 0})`} />
        <Tab eventKey="cancelled" title={`İptal Edilen (${cancelledInstructions?.length || 0})`} />
        <Tab eventKey="expired" title={`Süresi Biten (${expiredInstructions?.length || 0})`} />
      </Tabs>

      {getInstructionsForTab()?.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <FaCalendar size={48} className="text-muted mb-3" />
            <h5>
              {activeTab === 'cancelled' && 'İptal Edilen Talimat Bulunamadı'}
              {activeTab === 'expired' && 'Süresi Biten Talimat Bulunamadı'}
              {(activeTab === 'all' || activeTab === 'automatic' || activeTab === 'fixed_term') && 'Henüz ödeme talimatı eklenmemiş'}
            </h5>
            <p className="text-muted">
              {activeTab === 'all' && 'Yeni ödeme talimatı ekleyerek başlayın'}
              {activeTab === 'automatic' && 'Otomatik ödeme talimatı ekleyerek başlayın'}
              {activeTab === 'fixed_term' && 'Sabit süreli ödeme planı ekleyerek başlayın'}
              {(activeTab === 'cancelled' || activeTab === 'expired') && 'Bu sekmelerde iptal edilen ve süresi biten talimatlarınız görüntülenecek'}
            </p>
            {(activeTab === 'all' || activeTab === 'automatic' || activeTab === 'fixed_term') && (
              <Button variant="primary" onClick={() => setShowAddModal(true)}>
                İlk Talimatı Ekle
              </Button>
            )}
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {(getInstructionsForTab() || []).map((instruction) => (
            <Col key={instruction.id} lg={6} xl={4} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <Badge bg={instruction.instruction_type === 'automatic' ? 'primary' : 'success'} className="me-2">
                      {getInstructionTypeLabel(instruction.instruction_type)}
                    </Badge>
                    {getStatusBadge(instruction)}
                  </div>
                  <ButtonGroup size="sm">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => handleEdit(instruction)}
                    >
                      <FaEdit />
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => handleDelete(instruction.id)}
                    >
                      <FaTrash />
                    </Button>
                  </ButtonGroup>
                </Card.Header>
                <Card.Body>
                  <h6 className="card-title">{instruction.title}</h6>
                  <p className="card-text text-muted small mb-2">
                    {instruction.description || 'Açıklama yok'}
                  </p>
                  
                  <div className="d-flex align-items-center mb-2">
                    {getMethodIcon(instruction.payment_method)}
                    <span className="small">
                      {instruction.source_name}
                    </span>
                  </div>

                  <div className="mb-2">
                    <strong className="text-primary">
                      {parseFloat(instruction.amount).toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY'
                      })}
                    </strong>
                  </div>

                  {instruction.instruction_type === 'automatic' && (
                    <div className="mb-2">
                      <small className="text-muted">
                                                 <FaClock className="me-1" />
                        {getFrequencyLabel(instruction.frequency)}
                      </small>
                    </div>
                  )}

                  {instruction.instruction_type === 'fixed_term' && (
                    <div className="mb-2">
                      <small className="text-muted">
                                                 <FaCalendar className="me-1" />
                        {instruction.start_date && instruction.end_date ? 
                          `${new Date(instruction.start_date).toLocaleDateString('tr-TR')} - ${new Date(instruction.end_date).toLocaleDateString('tr-TR')}` :
                          `${instruction.total_transfers} transfer`
                        }
                      </small>
                    </div>
                  )}

                  <div className="mt-3">
                    <small className="text-muted">
                      {getRemainingInfo(instruction)}
                    </small>
                  </div>
                </Card.Body>
                <Card.Footer className="text-center">
                  <div className="d-flex gap-2 justify-content-center">
                    {(activeTab === 'all' || activeTab === 'automatic' || activeTab === 'fixed_term') && (
                      <>
                        <Button
                          variant={instruction.is_active ? 'outline-warning' : 'outline-success'}
                          size="sm"
                          onClick={() => toggleStatus(instruction.id)}
                        >
                          {instruction.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            setCancellingInstruction(instruction);
                            setShowCancelModal(true);
                          }}
                        >
                          İptal Et
                        </Button>
                      </>
                    )}
                    {(activeTab === 'cancelled' || activeTab === 'expired') && (
                      <Badge bg={activeTab === 'cancelled' ? 'danger' : 'warning'}>
                        {activeTab === 'cancelled' ? 'İptal Edildi' : 'Süresi Doldu'}
                      </Badge>
                    )}
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Add Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Yeni Ödeme Talimatı Ekle</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Talimat Başlığı *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Örn: Kira, Elektrik Faturası"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Talimat Türü *</Form.Label>
                  <Form.Select
                    value={formData.instruction_type}
                    onChange={(e) => setFormData({...formData, instruction_type: e.target.value})}
                  >
                    <option value="fixed_term">Sabit Süreli (Kira, vb.)</option>
                    <option value="automatic">Otomatik (Fatura, Abonelik)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ödeme Yöntemi *</Form.Label>
                  <Form.Select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({
                      ...formData, 
                      payment_method: e.target.value,
                      payment_source_id: '' // Ödeme yöntemi değiştiğinde kaynağı sıfırla
                    })}
                  >
                    <option value="account">Hesaptan</option>
                    <option value="credit_card">Kredi Kartından</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ödeme Kaynağı *</Form.Label>
                  <Form.Select
                    value={formData.payment_source_id}
                    onChange={(e) => setFormData({...formData, payment_source_id: e.target.value})}
                    required
                  >
                    <option value="">Seçiniz</option>
                    {formData.payment_method === 'account' ? 
                      (accounts || []).map(account => (
                        <option key={account.id} value={account.id}>
                          {account.account_name} - {account.bank_name}
                        </option>
                      )) :
                      (creditCards || []).map(card => (
                        <option key={card.id} value={card.id}>
                          {card.card_name} - {card.card_number?.slice(-4) || '****'}
                        </option>
                      ))
                    }
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tutar (₺) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                {formData.instruction_type === 'automatic' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Ödeme Sıklığı</Form.Label>
                    <Form.Select
                      value={formData.frequency}
                      onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                    >
                      <option value="monthly">Aylık</option>
                      <option value="quarterly">3 Aylık</option>
                      <option value="yearly">Yıllık</option>
                    </Form.Select>
                  </Form.Group>
                )}
                {formData.instruction_type === 'fixed_term' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Toplam Transfer Adedi</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.total_transfers}
                      onChange={(e) => setFormData({...formData, total_transfers: e.target.value})}
                      placeholder="12"
                    />
                  </Form.Group>
                )}
              </Col>
            </Row>

            {formData.instruction_type === 'fixed_term' && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Başlangıç Tarihi</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Bitiş Tarihi</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Talimat hakkında ek bilgiler..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              İptal
            </Button>
            <Button variant="primary" type="submit">
              Talimat Ekle
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Ödeme Talimatını Düzenle</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdate}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Talimat Başlığı *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Örn: Kira, Elektrik Faturası"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ödeme Yöntemi *</Form.Label>
                  <Form.Select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({
                      ...formData, 
                      payment_method: e.target.value,
                      payment_source_id: '' // Ödeme yöntemi değiştiğinde kaynağı sıfırla
                    })}
                  >
                    <option value="account">Hesaptan</option>
                    <option value="credit_card">Kredi Kartından</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ödeme Kaynağı *</Form.Label>
                  <Form.Select
                    value={formData.payment_source_id}
                    onChange={(e) => setFormData({...formData, payment_source_id: e.target.value})}
                    required
                  >
                    <option value="">Seçiniz</option>
                    {formData.payment_method === 'account' ? 
                      (accounts || []).map(account => (
                        <option key={account.id} value={account.id}>
                          {account.account_name} - {account.bank_name}
                        </option>
                      )) :
                      (creditCards || []).map(card => (
                        <option key={card.id} value={card.id}>
                          {card.card_name} - {card.card_number?.slice(-4) || '****'}
                        </option>
                      ))
                    }
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tutar (₺) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                {formData.instruction_type === 'automatic' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Ödeme Sıklığı</Form.Label>
                    <Form.Select
                      value={formData.frequency}
                      onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                    >
                      <option value="monthly">Aylık</option>
                      <option value="quarterly">3 Aylık</option>
                      <option value="yearly">Yıllık</option>
                    </Form.Select>
                  </Form.Group>
                )}
                {formData.instruction_type === 'fixed_term' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Toplam Transfer Adedi</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.total_transfers}
                      onChange={(e) => setFormData({...formData, total_transfers: e.target.value})}
                      placeholder="12"
                    />
                  </Form.Group>
                )}
              </Col>
              <Col md={6}>
                {formData.instruction_type === 'fixed_term' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Başlangıç Tarihi</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    />
                  </Form.Group>
                )}
              </Col>
            </Row>

            {formData.instruction_type === 'fixed_term' && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Bitiş Tarihi</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Durum</Form.Label>
                    <Form.Select
                      value={editingInstruction?.is_active ? 'true' : 'false'}
                      onChange={(e) => setEditingInstruction({
                        ...editingInstruction,
                        is_active: e.target.value === 'true'
                      })}
                    >
                      <option value="true">Aktif</option>
                      <option value="false">Pasif</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Talimat hakkında ek bilgiler..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              İptal
            </Button>
            <Button variant="primary" type="submit">
              Güncelle
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Cancel Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ödeme Talimatını İptal Et</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCancelInstruction}>
          <Modal.Body>
            <Alert variant="warning">
              <strong>Dikkat!</strong> Bu işlem geri alınamaz. Talimat iptal edildikten sonra geçmiş tablosuna kaydedilecektir.
            </Alert>
            
            <div className="mb-3">
              <strong>Talimat:</strong> {cancellingInstruction?.title}
            </div>
            
            <div className="mb-3">
              <strong>Tutar:</strong> {cancellingInstruction?.amount} TL
            </div>
            
            <Form.Group className="mb-3">
              <Form.Label>İptal Nedeni</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={cancelFormData.cancellation_reason}
                onChange={(e) => setCancelFormData({...cancelFormData, cancellation_reason: e.target.value})}
                placeholder="İptal etme nedeninizi belirtin (opsiyonel)..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
              Vazgeç
            </Button>
            <Button variant="danger" type="submit">
              İptal Et
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default PaymentInstructionsManager;
