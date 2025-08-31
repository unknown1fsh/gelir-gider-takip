import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Modal, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BackButton from './BackButton';

const IncomesList = () => {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchIncomes = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Token kontrolü
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
          return;
        }

        const response = await axios.get('/api/incomes');
        if (response.data.success) {
          setIncomes(response.data.incomes);
        } else {
          setError('Gelirler yüklenirken hata oluştu');
        }
      } catch (error) {
        console.error('Gelir listesi hatası:', error);
        
        if (error.response?.status === 403) {
          setError('Yetki hatası. Lütfen tekrar giriş yapın.');
          // Token'ı temizle ve login sayfasına yönlendir
          localStorage.removeItem('token');
          navigate('/login');
        } else if (error.response?.status === 401) {
          setError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setError('Gelirler yüklenirken hata oluştu: ' + (error.response?.data?.message || error.message));
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchIncomes();
  }, [navigate]);



  const handleDelete = async () => {
    if (!selectedIncome) return;

    try {
      // Token kontrolü
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
        navigate('/login');
        return;
      }

      await axios.delete(`/api/incomes/${selectedIncome.id}`);
      
      // State'den kaldır
      setIncomes(incomes.filter(income => income.id !== selectedIncome.id));
      setShowDeleteModal(false);
      setSelectedIncome(null);
    } catch (error) {
      console.error('Gelir silme hatası:', error);
      
      if (error.response?.status === 403) {
        setError('Yetki hatası. Lütfen tekrar giriş yapın.');
        localStorage.removeItem('token');
        navigate('/login');
      } else if (error.response?.status === 401) {
        setError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
        localStorage.removeItem('token');
        navigate('/login');
      } else if (error.response?.status === 404) {
        setError('Gelir bulunamadı');
      } else {
        setError('Gelir silinirken hata oluştu: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const getIncomeTypeLabel = (type) => {
    const types = {
      'salary': 'Maaş',
      'part_time': 'Ek İş',
      'rental': 'Kira Geliri',
      'investment': 'Yatırım',
      'food_card': 'Yemek Kartı',
      'other': 'Diğer'
    };
    return types[type] || type;
  };

  const getIncomeTypeBadge = (type) => {
    const badgeColors = {
      'salary': 'success',
      'part_time': 'info',
      'rental': 'warning',
      'investment': 'primary',
      'food_card': 'secondary',
      'other': 'dark'
    };
    return badgeColors[type] || 'secondary';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (dateString) => {
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
      <BackButton />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gelirler</h2>
        <Button 
          variant="primary" 
          onClick={() => navigate('/incomes/new')}
          className="d-flex align-items-center gap-2"
        >
          <FaPlus /> Yeni Gelir Ekle
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {incomes.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <h5 className="text-muted">Henüz gelir eklenmemiş</h5>
            <p className="text-muted">İlk gelirinizi eklemek için "Yeni Gelir Ekle" butonuna tıklayın.</p>
            <Button 
              variant="primary" 
              onClick={() => navigate('/incomes/new')}
              className="d-flex align-items-center gap-2 mx-auto"
            >
              <FaPlus /> Yeni Gelir Ekle
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
                  <th>Kaynak</th>
                  <th>Tür</th>
                  <th>Tarih</th>
                  <th>Açıklama</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((income) => (
                  <tr key={income.id}>
                    <td>
                      <strong>{income.title}</strong>
                    </td>
                    <td>
                      <span className="text-success fw-bold">
                        {formatCurrency(income.amount)}
                      </span>
                    </td>
                    <td>{income.source}</td>
                    <td>
                      <Badge bg={getIncomeTypeBadge(income.income_type)}>
                        {getIncomeTypeLabel(income.income_type)}
                      </Badge>
                    </td>
                    <td>{formatDate(income.income_date)}</td>
                    <td>
                      {income.description ? (
                        <span className="text-muted">
                          {income.description.length > 50 
                            ? `${income.description.substring(0, 50)}...` 
                            : income.description
                          }
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="outline-info" 
                          size="sm"
                          title="Görüntüle"
                          onClick={() => navigate(`/incomes/${income.id}`)}
                        >
                          <FaEye />
                        </Button>
                        <Button 
                          variant="outline-warning" 
                          size="sm"
                          title="Düzenle"
                          onClick={() => navigate(`/incomes/${income.id}/edit`)}
                        >
                          <FaEdit />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          title="Sil"
                          onClick={() => {
                            setSelectedIncome(income);
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

      {/* Toplam Gelir Özeti */}
      {incomes.length > 0 && (
        <Card className="mt-4">
          <Card.Body>
            <div className="row text-center">
              <div className="col-md-4">
                <h6 className="text-muted">Toplam Gelir</h6>
                <h4 className="text-success">
                  {formatCurrency(incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0))}
                </h4>
              </div>
              <div className="col-md-4">
                <h6 className="text-muted">Gelir Sayısı</h6>
                <h4 className="text-primary">{incomes.length}</h4>
              </div>
              <div className="col-md-4">
                <h6 className="text-muted">Bu Ay</h6>
                <h4 className="text-info">
                  {formatCurrency(
                    incomes
                      .filter(income => {
                        const incomeDate = new Date(income.income_date);
                        const now = new Date();
                        return incomeDate.getMonth() === now.getMonth() && 
                               incomeDate.getFullYear() === now.getFullYear();
                      })
                      .reduce((sum, income) => sum + parseFloat(income.amount), 0)
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
          <Modal.Title>Gelir Sil</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <strong>"{selectedIncome?.title}"</strong> gelirini silmek istediğinizden emin misiniz?
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

export default IncomesList;
