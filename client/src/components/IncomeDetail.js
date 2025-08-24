import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Alert, Row, Col } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import BackButton from './BackButton';

const IncomeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [income, setIncome] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        fetchIncome();
    }, [id]);

    const fetchIncome = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Token kontrolü
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
                navigate('/login');
                return;
            }

            const response = await axios.get(`/api/incomes/${id}`);
            if (response.data.success) {
                setIncome(response.data.income);
            } else {
                setError('Gelir bulunamadı');
            }
        } catch (error) {
            console.error('Gelir getirme hatası:', error);
            
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
                setError('Gelir bilgileri yüklenirken hata oluştu: ' + (error.response?.data?.message || error.message));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            // Token kontrolü
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
                navigate('/login');
                return;
            }

            await axios.delete(`/api/incomes/${id}`);
            navigate('/incomes');
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
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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

    if (error || !income) {
        return (
            <div className="container mt-4">
                <BackButton />
                <Alert variant="danger">
                    {error || 'Gelir bulunamadı'}
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <BackButton />
            
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>💰 Gelir Detayı</h2>
                <div className="d-flex gap-2">
                    <Button 
                        variant="warning" 
                        onClick={() => navigate(`/incomes/${id}/edit`)}
                        className="d-flex align-items-center gap-2"
                    >
                        <FaEdit /> Düzenle
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={() => setShowDeleteModal(true)}
                        className="d-flex align-items-center gap-2"
                    >
                        <FaTrash /> Sil
                    </Button>
                </div>
            </div>

            <Row>
                <Col lg={8}>
                    <Card className="shadow">
                        <Card.Header className="bg-primary text-white">
                            <h5 className="mb-0">{income.title}</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={6}>
                                    <div className="mb-3">
                                        <strong className="text-muted">Tutar:</strong>
                                        <div className="h4 text-success mb-0">
                                            {formatCurrency(income.amount)}
                                        </div>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="mb-3">
                                        <strong className="text-muted">Gelir Türü:</strong>
                                        <div>
                                            <Badge bg={getIncomeTypeBadge(income.income_type)} className="fs-6">
                                                {getIncomeTypeLabel(income.income_type)}
                                            </Badge>
                                        </div>
                                    </div>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <div className="mb-3">
                                        <strong className="text-muted">Kaynak:</strong>
                                        <div className="fs-5">{income.source}</div>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="mb-3">
                                        <strong className="text-muted">Gelir Tarihi:</strong>
                                        <div className="fs-5">{formatDate(income.income_date)}</div>
                                    </div>
                                </Col>
                            </Row>

                            {income.description && (
                                <div className="mb-3">
                                    <strong className="text-muted">Açıklama:</strong>
                                    <div className="fs-5">{income.description}</div>
                                </div>
                            )}

                            <div className="mb-3">
                                <strong className="text-muted">Kayıt Tarihi:</strong>
                                <div className="fs-6 text-muted">
                                    {new Date(income.created_at).toLocaleDateString('tr-TR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    <Card className="shadow">
                        <Card.Header className="bg-info text-white">
                            <h6 className="mb-0">📊 Hızlı Bilgiler</h6>
                        </Card.Header>
                        <Card.Body>
                            <div className="text-center">
                                <div className="mb-3">
                                    <h6 className="text-muted">Gelir ID</h6>
                                    <h4 className="text-primary">#{income.id}</h4>
                                </div>
                                
                                <div className="mb-3">
                                    <h6 className="text-muted">Durum</h6>
                                    <Badge bg="success" className="fs-6">Aktif</Badge>
                                </div>

                                <Button 
                                    variant="outline-primary" 
                                    onClick={() => navigate('/incomes')}
                                    className="w-100 d-flex align-items-center justify-content-center gap-2"
                                >
                                    <FaArrowLeft /> Gelir Listesine Dön
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Silme Modal */}
            <div className={`modal fade ${showDeleteModal ? 'show' : ''}`} 
                 style={{ display: showDeleteModal ? 'block' : 'none' }}
                 tabIndex="-1">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Gelir Sil</h5>
                            <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
                        </div>
                        <div className="modal-body">
                            <p>
                                <strong>"{income.title}"</strong> gelirini silmek istediğinizden emin misiniz?
                            </p>
                            <p className="text-danger">
                                Bu işlem geri alınamaz!
                            </p>
                        </div>
                        <div className="modal-footer">
                            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                                İptal
                            </Button>
                            <Button variant="danger" onClick={handleDelete}>
                                Sil
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal backdrop */}
            {showDeleteModal && (
                <div className="modal-backdrop fade show" onClick={() => setShowDeleteModal(false)}></div>
            )}
        </div>
    );
};

export default IncomeDetail;
