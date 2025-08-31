import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BackButton from './BackButton';

const IncomeEditForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        income_type: 'salary',
        source: '',
        description: '',
        income_date: new Date().toISOString().split('T')[0]
    });
    
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchIncome = async () => {
            try {
                setFetching(true);
                setMessage({ type: '', text: '' });
                
                // Token kontrolü
                const token = localStorage.getItem('token');
                if (!token) {
                    setMessage({ 
                        type: 'danger', 
                        text: 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.' 
                    });
                    navigate('/login');
                    return;
                }

                const response = await axios.get(`/api/incomes/${id}`);
                if (response.data.success) {
                    const income = response.data.income;
                    setFormData({
                        title: income.title,
                        amount: income.amount,
                        income_type: income.income_type,
                        source: income.source,
                        description: income.description || '',
                        income_date: income.income_date
                    });
                }
            } catch (error) {
                console.error('Gelir getirme hatası:', error);
                
                if (error.response?.status === 403) {
                    setMessage({ 
                        type: 'danger', 
                        text: 'Yetki hatası. Lütfen tekrar giriş yapın.' 
                    });
                    localStorage.removeItem('token');
                    navigate('/login');
                } else if (error.response?.status === 401) {
                    setMessage({ 
                        type: 'danger', 
                        text: 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.' 
                    });
                    localStorage.removeItem('token');
                    navigate('/login');
                } else if (error.response?.status === 404) {
                    setMessage({ 
                        type: 'danger', 
                        text: 'Gelir bulunamadı' 
                    });
                } else {
                    setMessage({ 
                        type: 'danger', 
                        text: 'Gelir bilgileri yüklenirken hata oluştu: ' + (error.response?.data?.message || error.message)
                    });
                }
            } finally {
                setFetching(false);
            }
        };
        
        fetchIncome();
    }, [id, navigate]);



    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Token kontrolü
            const token = localStorage.getItem('token');
            if (!token) {
                setMessage({ 
                    type: 'danger', 
                    text: 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.' 
                });
                navigate('/login');
                return;
            }

            const response = await axios.put(`/api/incomes/${id}`, formData);
            
            if (response.data.success) {
                setMessage({ type: 'success', text: response.data.message });
                setTimeout(() => {
                    navigate('/incomes');
                }, 1500);
            }
        } catch (error) {
            console.error('Gelir güncelleme hatası:', error);
            
            if (error.response?.status === 403) {
                setMessage({ 
                    type: 'danger', 
                    text: 'Yetki hatası. Lütfen tekrar giriş yapın.' 
                });
                localStorage.removeItem('token');
                navigate('/login');
            } else if (error.response?.status === 401) {
                setMessage({ 
                    type: 'danger', 
                    text: 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.' 
                });
                localStorage.removeItem('token');
                navigate('/login');
            } else if (error.response?.status === 404) {
                setMessage({ 
                    type: 'danger', 
                    text: 'Gelir bulunamadı' 
                });
            } else {
                setMessage({ 
                    type: 'danger', 
                    text: 'Gelir güncellenirken hata oluştu: ' + (error.response?.data?.message || error.message)
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const incomeTypes = [
        { value: 'salary', label: 'Maaş' },
        { value: 'part_time', label: 'Ek İş' },
        { value: 'rental', label: 'Kira Geliri' },
        { value: 'investment', label: 'Yatırım Geliri' },
        { value: 'food_card', label: 'Yemek Kartı' },
        { value: 'other', label: 'Diğer' }
    ];

    if (fetching) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <BackButton />
            <Card className="shadow">
                <Card.Header className="bg-warning text-dark">
                    <h4 className="mb-0">✏️ Gelir Düzenle</h4>
                </Card.Header>
                <Card.Body>
                    {message.text && (
                        <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
                            {message.text}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Gelir Başlığı *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Örn: Ocak Maaşı"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Tutar (₺) *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Gelir Türü *</Form.Label>
                                    <Form.Select
                                        name="income_type"
                                        value={formData.income_type}
                                        onChange={handleChange}
                                        required
                                    >
                                        {incomeTypes.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Kaynak *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="source"
                                        value={formData.source}
                                        onChange={handleChange}
                                        placeholder="Örn: Şirket Adı"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Gelir Tarihi *</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="income_date"
                                        value={formData.income_date}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Açıklama</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Gelir hakkında ek bilgi..."
                                        rows="1"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="d-flex gap-2 justify-content-end">
                            <Button 
                                variant="secondary" 
                                onClick={() => navigate('/incomes')}
                                disabled={loading}
                            >
                                İptal
                            </Button>
                            <Button 
                                variant="warning" 
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? 'Güncelleniyor...' : 'Güncelle'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default IncomeEditForm;
