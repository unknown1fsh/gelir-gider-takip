import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Table, Button, Badge, Modal, Form, Alert, Row, Col, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BackButton from './BackButton';

const CreditCardsList = () => {
  const navigate = useNavigate();
  const [creditCards, setCreditCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [editFormData, setEditFormData] = useState({
    remaining_limit: ''
  });

  useEffect(() => {
    fetchCreditCards();
  }, []);

  const fetchCreditCards = async () => {
    try {
      const response = await axios.get('/api/credit-cards');
      setCreditCards(response.data);
    } catch (error) {
      console.error('Kredi kartları yüklenemedi:', error);
      setMessage({ type: 'danger', text: 'Kredi kartları yüklenirken hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (card) => {
    setEditingCard(card);
    setEditFormData({
      remaining_limit: card.remaining_limit
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`/api/credit-cards/${editingCard.id}`, editFormData);
      setMessage({ type: 'success', text: 'Kredi kartı başarıyla güncellendi!' });
      
      // Kredi kartlarını yeniden yükle
      await fetchCreditCards();
      
      // Modal'ı kapat
      setShowEditModal(false);
      setEditingCard(null);
      
      // 2 saniye sonra mesajı temizle
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 2000);

    } catch (error) {
      console.error('Kredi kartı güncellenirken hata:', error);
      setMessage({ type: 'danger', text: 'Kredi kartı güncellenirken hata oluştu' });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount || 0);
  };

  const calculateUsagePercentage = (totalLimit, remainingLimit) => {
    if (totalLimit && remainingLimit) {
      const used = totalLimit - remainingLimit;
      return ((used / totalLimit) * 100).toFixed(1);
    }
    return 0;
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 80) return 'danger';
    if (percentage >= 60) return 'warning';
    return 'success';
  };

  const calculateDaysUntilStatement = (statementDate) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let statementDay = new Date(currentYear, currentMonth, statementDate);
    
    // Eğer bu ayın kesim tarihi geçtiyse, gelecek ayın kesim tarihini hesapla
    if (today > statementDay) {
      statementDay = new Date(currentYear, currentMonth + 1, statementDate);
    }
    
    const diffTime = statementDay - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getDaysUntilStatementColor = (days) => {
    if (days <= 3) return 'danger';
    if (days <= 7) return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
        <p className="mt-2">Kredi kartları yükleniyor...</p>
      </div>
    );
  }

  return (
    <div>
      <BackButton fallbackPath="/dashboard" />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>💳 Kredi Kartları</h2>
        <Button variant="success" onClick={() => navigate('/kredi-karti-ekle')}>
          ➕ Yeni Kredi Kartı Ekle
        </Button>
      </div>

      {message.text && (
        <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      {creditCards.length === 0 ? (
        <Card>
          <CardBody className="text-center">
            <h5>📭 Henüz kredi kartı eklenmemiş</h5>
            <p>İlk kredi kartınızı eklemek için aşağıdaki butona tıklayın.</p>
            <Button variant="success" onClick={() => navigate('/kredi-karti-ekle')}>
              💳 İlk Kredi Kartını Ekle
            </Button>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h5 className="mb-0">
              📊 Toplam {creditCards.length} Kredi Kartı
            </h5>
          </CardHeader>
          <CardBody>
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>🏦 Banka</th>
                    <th>📝 Kart Adı</th>
                    <th>🔢 Kart No</th>
                    <th>🎯 Toplam Limit</th>
                    <th>💳 Kalan Limit</th>
                    <th>📊 Kullanım</th>
                    <th>📅 Kesim Tarihi</th>
                    <th>⏰ Kalan Gün</th>
                    <th>⚙️ İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {creditCards.map(card => {
                    const usagePercentage = calculateUsagePercentage(card.total_limit, card.remaining_limit);
                    const usageColor = getUsageColor(usagePercentage);
                    const daysUntilStatement = calculateDaysUntilStatement(card.statement_date);
                    const daysColor = getDaysUntilStatementColor(daysUntilStatement);
                    
                    return (
                      <tr key={card.id}>
                        <td>
                          <strong>{card.bank_name}</strong>
                        </td>
                        <td>{card.card_name}</td>
                        <td>
                          {card.card_number ? (
                            <code>{card.card_number}</code>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <span className="text-primary">
                            <strong>{formatCurrency(card.total_limit)}</strong>
                          </span>
                        </td>
                        <td>
                          <span className="text-success">
                            <strong>{formatCurrency(card.remaining_limit)}</strong>
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="me-2" style={{ width: '60px' }}>
                              <ProgressBar 
                                variant={usageColor} 
                                now={usagePercentage} 
                                className="mb-1"
                              />
                            </div>
                            <Badge bg={usageColor}>
                              {usagePercentage}%
                            </Badge>
                          </div>
                          <small className="text-muted d-block">
                            Kullanılan: {formatCurrency(card.total_limit - card.remaining_limit)}
                          </small>
                        </td>
                        <td>
                          <Badge bg="info">
                            {card.statement_date}. Gün
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={daysColor}>
                            {daysUntilStatement} gün
                          </Badge>
                          {daysUntilStatement <= 3 && (
                            <div className="text-danger small mt-1">
                              ⚠️ Yaklaşıyor!
                            </div>
                          )}
                        </td>
                        <td>
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleEditClick(card)}
                          >
                            ✏️ Düzenle
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>

            {/* Özet Bilgiler */}
            <Row className="mt-4">
              <Col md={3}>
                <div className="text-center p-3 border rounded">
                  <h6>💳 Toplam Kart</h6>
                  <h4 className="text-primary">{creditCards.length}</h4>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 border rounded">
                  <h6>🎯 Toplam Limit</h6>
                  <h4 className="text-info">
                    {formatCurrency(creditCards.reduce((sum, card) => sum + parseFloat(card.total_limit), 0))}
                  </h4>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 border rounded">
                  <h6>💰 Kalan Limit</h6>
                  <h4 className="text-success">
                    {formatCurrency(creditCards.reduce((sum, card) => sum + parseFloat(card.remaining_limit), 0))}
                  </h4>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 border rounded">
                  <h6>📊 Ortalama Kullanım</h6>
                  <h4 className="text-warning">
                    {creditCards.length > 0 
                      ? (creditCards.reduce((sum, card) => {
                          const usage = calculateUsagePercentage(card.total_limit, card.remaining_limit);
                          return sum + parseFloat(usage);
                        }, 0) / creditCards.length).toFixed(1)
                      : 0
                    }%
                  </h4>
                </div>
              </Col>
            </Row>

            {/* Risk Analizi */}
            <Row className="mt-4">
              <Col>
                <div className="alert alert-warning">
                  <h6>⚠️ Risk Analizi:</h6>
                  <Row>
                    <Col md={4}>
                      <strong>🔴 Yüksek Risk:</strong> 
                      {creditCards.filter(card => {
                        const usage = calculateUsagePercentage(card.total_limit, card.remaining_limit);
                        return usage >= 80;
                      }).length} kart
                    </Col>
                    <Col md={4}>
                      <strong>🟡 Orta Risk:</strong> 
                      {creditCards.filter(card => {
                        const usage = calculateUsagePercentage(card.total_limit, card.remaining_limit);
                        return usage >= 60 && usage < 80;
                      }).length} kart
                    </Col>
                    <Col md={4}>
                      <strong>🟢 Düşük Risk:</strong> 
                      {creditCards.filter(card => {
                        const usage = calculateUsagePercentage(card.total_limit, card.remaining_limit);
                        return usage < 60;
                      }).length} kart
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>✏️ Kredi Kartı Düzenle</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            <p><strong>Kart:</strong> {editingCard?.card_name}</p>
            <p><strong>Banka:</strong> {editingCard?.bank_name}</p>
            <p><strong>Toplam Limit:</strong> {formatCurrency(editingCard?.total_limit)}</p>
            
            <Form.Group className="mb-3">
              <Form.Label>💳 Kalan Limit *</Form.Label>
              <Form.Control
                type="number"
                name="remaining_limit"
                value={editFormData.remaining_limit}
                onChange={(e) => setEditFormData(prev => ({
                  ...prev,
                  remaining_limit: e.target.value
                }))}
                step="0.01"
                min="0"
                max={editingCard?.total_limit}
                required
              />
              <Form.Text className="text-muted">
                Maksimum: {formatCurrency(editingCard?.total_limit)}
              </Form.Text>
            </Form.Group>

            {editFormData.remaining_limit && (
              <div className="alert alert-info">
                <strong>Kullanım Oranı:</strong> {calculateUsagePercentage(editingCard?.total_limit, editFormData.remaining_limit)}%
                <br />
                <strong>Kullanılan:</strong> {formatCurrency(editingCard?.total_limit - editFormData.remaining_limit)}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              ❌ İptal
            </Button>
            <Button variant="success" type="submit">
              ✅ Güncelle
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default CreditCardsList;
