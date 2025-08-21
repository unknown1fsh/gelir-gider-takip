import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Form, 
  Alert, Table, Badge, Modal, Spinner, Tabs, Tab
} from 'react-bootstrap';
import { 
  FaSync, FaPlus, FaEdit, FaTrash, FaEye,
  FaCalendarAlt, FaCreditCard, FaUniversity,
  FaCheckCircle, FaTimesCircle, FaExclamationTriangle
} from 'react-icons/fa';
import axios from 'axios';

const AutoPaymentsManager = () => {
  const [instructions, setInstructions] = useState([]);
  const [cancelledInstructions, setCancelledInstructions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState(null);
  const [cancellingInstruction, setCancellingInstruction] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [activeTab, setActiveTab] = useState('active');

  // İptal etme form state
  const [cancelFormData, setCancelFormData] = useState({
    cancellation_reason: ''
  });

  // Yeni otomatik ödeme form state
  const [newInstructionForm, setNewInstructionForm] = useState({
    title: '',
    amount: '',
    frequency: 'monthly',
    payment_method: 'account',
    payment_source_id: '',
    description: '',
    next_payment_date: ''
  });

  useEffect(() => {
    fetchInstructions();
    fetchCancelledInstructions();
    fetchAccounts();
    fetchCreditCards();
  }, []);

  const fetchInstructions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/auto-payments');
      if (response.data.success) {
        setInstructions(response.data.instructions);
      }
    } catch (error) {
      setMessage({ 
        type: 'danger', 
        text: 'Otomatik ödeme talimatları yüklenirken hata oluştu' 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCancelledInstructions = async () => {
    try {
      const response = await axios.get('/api/auto-payments/cancelled');
      if (response.data.success) {
        setCancelledInstructions(response.data.instructions);
      }
    } catch (error) {
      console.error('İptal edilen otomatik ödeme talimatları yüklenirken hata:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await axios.get('/api/accounts');
      setAccounts(response.data || []);
    } catch (error) {
      console.error('Hesaplar yüklenirken hata:', error);
    }
  };

  const fetchCreditCards = async () => {
    try {
      const response = await axios.get('/api/credit-cards');
      setCreditCards(response.data || []);
    } catch (error) {
      console.error('Kredi kartları yüklenirken hata:', error);
    }
  };

  const handleEdit = (instruction) => {
    setEditingInstruction(instruction);
    setShowEditModal(true);
  };

  const handleCancelInstruction = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.patch(`/api/auto-payments/${cancellingInstruction.id}/cancel`, 
        cancelFormData);

      if (response.data.success) {
        setMessage({ type: 'success', text: response.data.message });
        setShowCancelModal(false);
        setCancellingInstruction(null);
        setCancelFormData({ cancellation_reason: '' });
        fetchInstructions();
        fetchCancelledInstructions();
      }
    } catch (error) {
      setMessage({ 
        type: 'danger', 
        text: error.response?.data?.message || 'Talimat iptal edilirken hata oluştu' 
      });
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await axios.put(`/api/auto-payments/${editingInstruction.id}`, editingInstruction);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Otomatik ödeme talimatı güncellendi' });
        setShowEditModal(false);
        setEditingInstruction(null);
        fetchInstructions();
      }
    } catch (error) {
      setMessage({ 
        type: 'danger', 
        text: error.response?.data?.message || 'Güncelleme hatası' 
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu otomatik ödeme talimatını silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/auto-payments/${id}`);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Otomatik ödeme talimatı silindi' });
        fetchInstructions();
      }
    } catch (error) {
      setMessage({ 
        type: 'danger', 
        text: error.response?.data?.message || 'Silme hatası' 
      });
    }
  };

  const handleAddNewInstruction = async (e) => {
    e.preventDefault();
    try {
      // Önce gider olarak ekle
      const expenseData = {
        title: newInstructionForm.title,
        amount: newInstructionForm.amount,
        category_id: 1, // Varsayılan kategori
        expense_type: 'other',
        payment_method: newInstructionForm.payment_method === 'account' ? 'bank_transfer' : 'credit_card',
        description: newInstructionForm.description,
        payment_date: newInstructionForm.next_payment_date,
        is_paid: false
      };

      const expenseResponse = await axios.post('/api/expenses', expenseData);
      if (!expenseResponse.data.success) {
        throw new Error('Gider eklenirken hata oluştu');
      }

      const expenseId = expenseResponse.data.expense_id;

      // Sonra otomatik ödeme talimatı ekle
      const instructionData = {
        expense_id: expenseId,
        payment_method: newInstructionForm.payment_method,
        payment_source_id: newInstructionForm.payment_source_id,
        payment_source_type: newInstructionForm.payment_method,
        frequency: newInstructionForm.frequency,
        amount: newInstructionForm.amount,
        description: newInstructionForm.description
      };

      const instructionResponse = await axios.post('/api/auto-payments', instructionData);
      if (instructionResponse.data.success) {
        setMessage({ type: 'success', text: 'Yeni otomatik ödeme talimatı başarıyla eklendi' });
        setShowAddModal(false);
        resetNewInstructionForm();
        fetchInstructions();
      }
    } catch (error) {
      setMessage({ 
        type: 'danger', 
        text: error.response?.data?.message || 'Otomatik ödeme talimatı eklenirken hata oluştu' 
      });
    }
  };

  const resetNewInstructionForm = () => {
    setNewInstructionForm({
      title: '',
      amount: '',
      frequency: 'monthly',
      payment_method: 'account',
      payment_source_id: '',
      description: '',
      next_payment_date: ''
    });
  };

  const toggleStatus = async (instruction) => {
    try {
      const updatedInstruction = {
        ...instruction,
        is_active: !instruction.is_active
      };
      
      const response = await axios.put(`/api/auto-payments/${instruction.id}`, updatedInstruction);
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Durum güncellendi' });
        fetchInstructions();
      }
    } catch (error) {
      setMessage({ 
        type: 'danger', 
        text: 'Durum güncellenirken hata oluştu' 
      });
    }
  };

  const getStatusBadge = (instruction) => {
    if (instruction.is_active) {
      return <Badge bg="success">✅ Aktif</Badge>;
    } else {
      return <Badge bg="secondary">⏸️ Pasif</Badge>;
    }
  };

  const getMethodIcon = (method) => {
    return method === 'account' ? <FaUniversity className="text-success" /> : <FaCreditCard className="text-warning" />;
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      monthly: '📅 Aylık',
      quarterly: '📅 3 Aylık',
      yearly: '📅 Yıllık'
    };
    return labels[frequency] || frequency;
  };

  const getNextPaymentStatus = (nextPaymentDate) => {
    const today = new Date();
    const nextDate = new Date(nextPaymentDate);
    const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <Badge bg="danger">⚠️ Gecikmiş</Badge>;
    } else if (diffDays <= 7) {
      return <Badge bg="warning">⏰ Yaklaşıyor</Badge>;
    } else {
      return <Badge bg="info">📅 Planlı</Badge>;
    }
  };

  const getInstructionsForTab = () => {
    switch (activeTab) {
      case 'cancelled':
        return cancelledInstructions;
      default:
        return instructions;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" />
        <p className="mt-2">Otomatik ödeme talimatları yükleniyor...</p>
      </div>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="text-primary">🔄 Otomatik Ödeme Talimatları</h2>
            <div className="d-flex gap-2">
              <Button 
                variant="success" 
                onClick={() => setShowAddModal(true)}
                className="d-flex align-items-center gap-2"
              >
                <FaPlus /> Yeni Otomatik Ödeme Ekle
              </Button>
              <Button 
                variant="outline-primary" 
                onClick={fetchInstructions}
                className="d-flex align-items-center gap-2"
              >
                <FaSync /> Yenile
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        <Tab eventKey="active" title={`Aktif (${instructions.length})`} />
        <Tab eventKey="cancelled" title={`İptal Edilen (${cancelledInstructions.length})`} />
      </Tabs>

      {message.text && (
        <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      {getInstructionsForTab().length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <div className="text-muted">
              <h5>
                {activeTab === 'cancelled' ? 'İptal Edilen Talimat Bulunamadı' : 'Otomatik Ödeme Talimatı Bulunamadı'}
              </h5>
              <p className="mb-0">
                {activeTab === 'cancelled' ? 
                  'Bu sekmede iptal edilen otomatik ödeme talimatlarınız görüntülenecek' :
                  'Henüz hiç otomatik ödeme talimatı eklenmemiş. Gider eklerken otomatik ödeme seçeneğini işaretleyerek talimat oluşturabilirsiniz.'
                }
              </p>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          {getInstructionsForTab().map(instruction => (
            <Col key={instruction.id} md={6} lg={4} className="mb-4">
              <Card className={`h-100 border-0 shadow-sm ${
                instruction.is_active ? 'border-success' : 'border-secondary'
              }`}>
                <Card.Header className={`${
                  instruction.is_active ? 'bg-success' : 'bg-secondary'
                } text-white`}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 d-flex align-items-center gap-2">
                      {getMethodIcon(instruction.payment_source_type)}
                      <span>{instruction.expense_title}</span>
                    </h6>
                    {getStatusBadge(instruction)}
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <strong className="text-primary">{instruction.source_name}</strong>
                      <Badge bg="info">{getFrequencyLabel(instruction.frequency)}</Badge>
                    </div>
                    <div className="text-muted mb-2">
                      {instruction.description || 'Açıklama yok'}
                    </div>
                    <div className="mb-2">
                      <strong className="text-secondary">Tutar:</strong> 
                      <span className="ms-2 fw-bold text-danger">
                        ₺{parseFloat(instruction.amount).toLocaleString('tr-TR', {minimumFractionDigits: 2})}
                      </span>
                    </div>
                    <div className="mb-3">
                      <strong className="text-secondary">Sonraki Ödeme:</strong>
                      <div className="mt-1 d-flex align-items-center gap-2">
                        <span className="text-primary">
                          {new Date(instruction.next_payment_date).toLocaleDateString('tr-TR')}
                        </span>
                        {getNextPaymentStatus(instruction.next_payment_date)}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    {activeTab === 'active' && (
                      <>
                        <Button 
                          size="sm" 
                          variant={instruction.is_active ? "warning" : "success"}
                          onClick={() => toggleStatus(instruction)}
                          className="flex-fill"
                          title={instruction.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                        >
                          {instruction.is_active ? <FaTimesCircle /> : <FaCheckCircle />}
                          {instruction.is_active ? ' Pasif Yap' : ' Aktif Yap'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline-primary"
                          onClick={() => handleEdit(instruction)}
                          title="Düzenle"
                        >
                          <FaEdit />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline-danger"
                          onClick={() => {
                            setCancellingInstruction(instruction);
                            setShowCancelModal(true);
                          }}
                          title="İptal Et"
                        >
                          <FaTimesCircle />
                        </Button>
                      </>
                    )}
                    {activeTab === 'cancelled' && (
                      <Badge bg="danger" className="w-100 text-center py-2">
                        İptal Edildi
                      </Badge>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Düzenleme Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>✏️ Otomatik Ödeme Talimatını Düzenle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingInstruction && (
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ödeme Yöntemi</Form.Label>
                    <Form.Select
                      value={editingInstruction.payment_method}
                      onChange={(e) => setEditingInstruction({
                        ...editingInstruction,
                        payment_method: e.target.value
                      })}
                    >
                      <option value="account">🏦 Hesaptan</option>
                      <option value="credit_card">💳 Kredi Kartından</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ödeme Sıklığı</Form.Label>
                    <Form.Select
                      value={editingInstruction.frequency}
                      onChange={(e) => setEditingInstruction({
                        ...editingInstruction,
                        frequency: e.target.value
                      })}
                    >
                      <option value="monthly">📅 Aylık</option>
                      <option value="quarterly">📅 3 Aylık</option>
                      <option value="yearly">📅 Yıllık</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tutar (₺)</Form.Label>
                    <Form.Control
                      type="number"
                      value={editingInstruction.amount}
                      onChange={(e) => setEditingInstruction({
                        ...editingInstruction,
                        amount: e.target.value
                      })}
                      step="0.01"
                      min="0"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Açıklama</Form.Label>
                <Form.Control
                  as="textarea"
                  rows="3"
                  value={editingInstruction.description || ''}
                  onChange={(e) => setEditingInstruction({
                    ...editingInstruction,
                    description: e.target.value
                  })}
                  placeholder="Otomatik ödeme hakkında açıklama..."
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="is_active"
                  checked={editingInstruction.is_active}
                  onChange={(e) => setEditingInstruction({
                    ...editingInstruction,
                    is_active: e.target.checked
                  })}
                  label="Aktif"
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            İptal
          </Button>
          <Button variant="primary" onClick={handleUpdate}>
            💾 Güncelle
          </Button>
        </Modal.Footer>
      </Modal>

      {/* İptal Etme Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Otomatik Ödeme Talimatını İptal Et</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCancelInstruction}>
          <Modal.Body>
            <Alert variant="warning">
              <strong>Dikkat!</strong> Bu işlem geri alınamaz. Talimat iptal edildikten sonra geçmiş tablosuna kaydedilecektir.
            </Alert>
            
            <div className="mb-3">
              <strong>Talimat:</strong> {cancellingInstruction?.description || 'Otomatik Ödeme Talimatı'}
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

      {/* Yeni Otomatik Ödeme Ekleme Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>➕ Yeni Otomatik Ödeme Talimatı Ekle</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddNewInstruction}>
          <Modal.Body>
            <Alert variant="info">
              <strong>Bilgi:</strong> Yeni otomatik ödeme talimatı eklendiğinde, otomatik olarak gider olarak da kaydedilecektir.
            </Alert>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Talimat Başlığı *</Form.Label>
                  <Form.Control
                    type="text"
                    value={newInstructionForm.title}
                    onChange={(e) => setNewInstructionForm({...newInstructionForm, title: e.target.value})}
                    placeholder="Örn: Kira, Elektrik Faturası, Netflix Aboneliği"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tutar (₺) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={newInstructionForm.amount}
                    onChange={(e) => setNewInstructionForm({...newInstructionForm, amount: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ödeme Sıklığı *</Form.Label>
                  <Form.Select
                    value={newInstructionForm.frequency}
                    onChange={(e) => setNewInstructionForm({...newInstructionForm, frequency: e.target.value})}
                    required
                  >
                    <option value="monthly">📅 Aylık</option>
                    <option value="quarterly">📅 3 Aylık</option>
                    <option value="yearly">📅 Yıllık</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>İlk Ödeme Tarihi *</Form.Label>
                  <Form.Control
                    type="date"
                    value={newInstructionForm.next_payment_date}
                    onChange={(e) => setNewInstructionForm({...newInstructionForm, next_payment_date: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ödeme Yöntemi *</Form.Label>
                  <Form.Select
                    value={newInstructionForm.payment_method}
                    onChange={(e) => {
                      setNewInstructionForm({
                        ...newInstructionForm, 
                        payment_method: e.target.value,
                        payment_source_id: '' // Ödeme yöntemi değiştiğinde kaynağı sıfırla
                      });
                    }}
                    required
                  >
                    <option value="account">🏦 Hesaptan</option>
                    <option value="credit_card">💳 Kredi Kartından</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ödeme Kaynağı *</Form.Label>
                  <Form.Select
                    value={newInstructionForm.payment_source_id}
                    onChange={(e) => setNewInstructionForm({...newInstructionForm, payment_source_id: e.target.value})}
                    required
                  >
                    <option value="">Seçiniz</option>
                    {newInstructionForm.payment_method === 'account' ? 
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

            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newInstructionForm.description}
                onChange={(e) => setNewInstructionForm({...newInstructionForm, description: e.target.value})}
                placeholder="Otomatik ödeme hakkında açıklama..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              İptal
            </Button>
            <Button variant="success" type="submit">
              💾 Otomatik Ödeme Ekle
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AutoPaymentsManager;
