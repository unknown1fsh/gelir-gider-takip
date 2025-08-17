import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Modal, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ExpensesList = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/expenses');
      if (response.data.success) {
        setExpenses(response.data.expenses);
      } else {
        setError('Giderler yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Gider listesi hatası:', error);
      setError('Giderler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;

    try {
      // Burada silme API'si olacak
      // await axios.delete(`/api/expenses/${selectedExpense.id}`);
      
      // Şimdilik sadece state'den kaldır
      setExpenses(expenses.filter(expense => expense.id !== selectedExpense.id));
      setShowDeleteModal(false);
      setSelectedExpense(null);
    } catch (error) {
      console.error('Gider silme hatası:', error);
      setError('Gider silinirken hata oluştu');
    }
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      'cash': 'Nakit',
      'credit_card': 'Kredi Kartı',
      'bank_transfer': 'Banka Transferi',
      'credit_account': 'Kredili Hesap'
    };
    return methods[method] || method;
  };

  const getPaymentMethodBadge = (method) => {
    const badgeColors = {
      'cash': 'success',
      'credit_card': 'warning',
      'bank_transfer': 'info',
      'credit_account': 'danger'
    };
    return badgeColors[method] || 'secondary';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Giderler</h2>
        <Button 
          variant="primary" 
          onClick={() => navigate('/expenses/new')}
          className="d-flex align-items-center gap-2"
        >
          <FaPlus /> Yeni Gider Ekle
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {expenses.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <h5 className="text-muted">Henüz gider eklenmemiş</h5>
            <p className="text-muted">İlk giderinizi eklemek için "Yeni Gider Ekle" butonuna tıklayın.</p>
            <Button 
              variant="primary" 
              onClick={() => navigate('/expenses/new')}
              className="d-flex align-items-center gap-2 mx-auto"
            >
              <FaPlus /> Yeni Gider Ekle
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body>
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Başlık</th>
                  <th>Tutar</th>
                  <th>Kategori</th>
                  <th>Ödeme Yöntemi</th>
                  <th>Vade Tarihi</th>
                  <th>Ödeme Tarihi</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>
                      <strong>{expense.title}</strong>
                    </td>
                    <td>
                      <span className="text-danger fw-bold">
                        {formatCurrency(expense.amount)}
                      </span>
                    </td>
                    <td>
                      {expense.category_name && (
                        <Badge 
                          bg="secondary" 
                          style={{ backgroundColor: expense.category_color || '#6c757d' }}
                        >
                          {expense.category_name}
                        </Badge>
                      )}
                    </td>
                    <td>
                      <Badge bg={getPaymentMethodBadge(expense.payment_method)}>
                        {getPaymentMethodLabel(expense.payment_method)}
                      </Badge>
                    </td>
                    <td>{formatDate(expense.due_date)}</td>
                    <td>{formatDate(expense.payment_date)}</td>
                    <td>
                      <Badge bg={expense.is_paid ? 'success' : 'warning'}>
                        {expense.is_paid ? 'Ödendi' : 'Bekliyor'}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="outline-info" 
                          size="sm"
                          title="Görüntüle"
                        >
                          <FaEye />
                        </Button>
                        <Button 
                          variant="outline-warning" 
                          size="sm"
                          title="Düzenle"
                        >
                          <FaEdit />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          title="Sil"
                          onClick={() => {
                            setSelectedExpense(expense);
                            setShowDeleteModal(true);
                          }}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Toplam Gider Özeti */}
      {expenses.length > 0 && (
        <Card className="mt-4">
          <Card.Body>
            <div className="row text-center">
              <div className="col-md-4">
                <h6 className="text-muted">Toplam Gider</h6>
                <h4 className="text-danger">
                  {formatCurrency(expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0))}
                </h4>
              </div>
              <div className="col-md-4">
                <h6 className="text-muted">Gider Sayısı</h6>
                <h4 className="text-primary">{expenses.length}</h4>
              </div>
              <div className="col-md-4">
                <h6 className="text-muted">Bu Ay</h6>
                <h4 className="text-info">
                  {formatCurrency(
                    expenses
                      .filter(expense => {
                        const expenseDate = new Date(expense.created_at);
                        const now = new Date();
                        return expenseDate.getMonth() === now.getMonth() && 
                               expenseDate.getFullYear() === now.getFullYear();
                      })
                      .reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
                  )}
                </h4>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Silme Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Gider Sil</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <strong>"{selectedExpense?.title}"</strong> giderini silmek istediğinizden emin misiniz?
          </p>
          <p className="text-danger">
            Bu işlem geri alınamaz!
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            İptal
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Sil
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ExpensesList;
