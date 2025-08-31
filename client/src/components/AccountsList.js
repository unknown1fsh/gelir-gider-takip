import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, Table, Button, Badge, Modal, Form, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BackButton from './BackButton';

const AccountsList = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editFormData, setEditFormData] = useState({
    current_balance: '',
    account_limit: '',
    credit_limit: ''
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get('/api/accounts');
      setAccounts(response.data);
    } catch (error) {
      console.error('Hesaplar yüklenemedi:', error);
      setMessage({ type: 'danger', text: 'Hesaplar yüklenirken hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (account) => {
    setEditingAccount(account);
    setEditFormData({
      current_balance: account.current_balance,
      account_limit: account.account_limit || '',
      credit_limit: account.credit_limit || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`/api/accounts/${editingAccount.id}`, editFormData);
      setMessage({ type: 'success', text: 'Hesap başarıyla güncellendi!' });
      
      // Hesapları yeniden yükle
      await fetchAccounts();
      
      // Modal'ı kapat
      setShowEditModal(false);
      setEditingAccount(null);
      
      // 2 saniye sonra mesajı temizle
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 2000);

    } catch (error) {
      console.error('Hesap güncellenirken hata:', error);
      setMessage({ type: 'danger', text: 'Hesap güncellenirken hata oluştu' });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount || 0);
  };

  const getAccountTypeBadge = (accountType) => {
    if (accountType === 'vadeli') {
      return <Badge bg="warning">Vadeli</Badge>;
    }
    return <Badge bg="info">Vadesiz</Badge>;
  };

  const getBalanceColor = (balance) => {
    if (balance >= 0) return 'success';
    return 'danger';
  };

  const getCreditAccountBadge = (isCreditAccount) => {
    if (isCreditAccount) {
      return <Badge bg="danger">Kredili Mevduat</Badge>;
    }
    return <Badge bg="success">Normal Hesap</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
        <p className="mt-2">Hesaplar yükleniyor...</p>
      </div>
    );
  }

  return (
    <div>
      <BackButton />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🏦 Banka Hesapları</h2>
        <Button variant="primary" onClick={() => navigate('/hesap-ekle')}>
          ➕ Yeni Hesap Ekle
        </Button>
      </div>

      {message.text && (
        <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      {accounts.length === 0 ? (
        <Card>
          <CardBody className="text-center">
            <h5>📭 Henüz hesap eklenmemiş</h5>
            <p>İlk hesabınızı eklemek için aşağıdaki butona tıklayın.</p>
            <Button variant="primary" onClick={() => navigate('/hesap-ekle')}>
              🏦 İlk Hesabı Ekle
            </Button>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h5 className="mb-0">
              📊 Toplam {accounts.length} Hesap
            </h5>
          </CardHeader>
          <CardBody>
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>🏦 Banka</th>
                    <th>📝 Hesap Adı</th>
                    <th>🔢 Hesap No</th>
                    <th>🌍 IBAN</th>
                    <th>📅 Tür</th>
                    <th>💰 Limit</th>
                    <th>💵 Bakiye</th>
                    <th>💳 Kredi</th>
                    <th>⚙️ İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(account => (
                    <tr key={account.id}>
                      <td>
                        <strong>{account.bank_name}</strong>
                      </td>
                      <td>{account.account_name}</td>
                      <td>
                        {account.account_number ? (
                          <code>{account.account_number}</code>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <code className="small">{account.iban}</code>
                      </td>
                      <td>
                        {getAccountTypeBadge(account.account_type)}
                        <br />
                        {getCreditAccountBadge(account.is_credit_account)}
                      </td>
                      <td>
                        {account.account_limit > 0 ? (
                          <span className="text-info">
                            {formatCurrency(account.account_limit)}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <span className={`text-${getBalanceColor(account.current_balance)}`}>
                          <strong>{formatCurrency(account.current_balance)}</strong>
                        </span>
                      </td>
                      <td>
                        {account.is_credit_account && account.credit_limit > 0 ? (
                          <div>
                            <div className="text-danger">
                              {formatCurrency(account.credit_limit)}
                            </div>
                            <small className="text-muted">Kredi Limiti</small>
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleEditClick(account)}
                        >
                          ✏️ Düzenle
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* Özet Bilgiler */}
            <Row className="mt-4">
              <Col md={3}>
                <div className="text-center p-3 border rounded">
                  <h6>💰 Toplam Bakiye</h6>
                  <h4 className={`text-${getBalanceColor(accounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance), 0))}`}>
                    {formatCurrency(accounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance), 0))}
                  </h4>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 border rounded">
                  <h6>🏦 Toplam Hesap</h6>
                  <h4 className="text-primary">{accounts.length}</h4>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 border rounded">
                  <h6>💳 Kredili Hesaplar</h6>
                  <h4 className="text-danger">
                    {accounts.filter(acc => acc.is_credit_account).length}
                  </h4>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 border rounded">
                  <h6>⏰ Vadeli Hesaplar</h6>
                  <h4 className="text-warning">
                    {accounts.filter(acc => acc.account_type === 'vadeli').length}
                  </h4>
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>✏️ Hesap Düzenle</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            <p><strong>Hesap:</strong> {editingAccount?.account_name}</p>
            <p><strong>Banka:</strong> {editingAccount?.bank_name}</p>
            
            <Form.Group className="mb-3">
              <Form.Label>💵 Mevcut Bakiye *</Form.Label>
              <Form.Control
                type="number"
                name="current_balance"
                value={editFormData.current_balance}
                onChange={(e) => setEditFormData(prev => ({
                  ...prev,
                  current_balance: e.target.value
                }))}
                step="0.01"
                required
              />
            </Form.Group>

            {editingAccount?.account_type === 'vadeli' && (
              <Form.Group className="mb-3">
                <Form.Label>💰 Hesap Limiti</Form.Label>
                <Form.Control
                  type="number"
                  name="account_limit"
                  value={editFormData.account_limit}
                  onChange={(e) => setEditFormData(prev => ({
                    ...prev,
                    account_limit: e.target.value
                  }))}
                  step="0.01"
                  min="0"
                />
              </Form.Group>
            )}

            {editingAccount?.is_credit_account && (
              <Form.Group className="mb-3">
                <Form.Label>🎯 Kredi Limiti</Form.Label>
                <Form.Control
                  type="number"
                  name="credit_limit"
                  value={editFormData.credit_limit}
                  onChange={(e) => setEditFormData(prev => ({
                    ...prev,
                    credit_limit: e.target.value
                  }))}
                  step="0.01"
                  min="0"
                />
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              ❌ İptal
            </Button>
            <Button variant="primary" type="submit">
              ✅ Güncelle
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AccountsList;
