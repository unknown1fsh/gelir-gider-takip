import React, { useState } from 'react';
import { Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BackButton from './BackButton';

const IncomeForm = () => {
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
    const [message, setMessage] = useState({ type: '', text: '' });

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
            const response = await axios.post('/api/incomes', formData);
            
            if (response.data.success) {
                setMessage({ type: 'success', text: response.data.message });
                setFormData({
                    title: '',
                    amount: '',
                    income_type: 'salary',
                    source: '',
                    description: '',
                    income_date: new Date().toISOString().split('T')[0]
                });
            }
        } catch (error) {
            setMessage({ 
                type: 'danger', 
                text: error.response?.data?.message || 'Gelir eklenirken hata oluştu' 
            });
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

    return (
        <div className="container mt-4">
            <BackButton fallbackPath="/gelirler" />
            <Card className="shadow">
                <Card.Header className="bg-primary text-white">
                    <h4 className="mb-0">💰 Yeni Gelir Ekle</h4>
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
                                    {formData.income_type === 'food_card' && (
                                        <Form.Text className="text-warning">
                                            ⚠️ Yemek kartı geliri sadece yemek giderlerinde kullanılır ve genel gelir hesaplamalarına dahil edilmez.
                                        </Form.Text>
                                    )}
                                </Form.Group>
                            </Col>
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
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Gelir Kaynağı</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="source"
                                        value={formData.source}
                                        onChange={handleChange}
                                        placeholder="Örn: ABC Şirketi"
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
                                        placeholder="Gelir hakkında ek bilgiler..."
                                        rows="3"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                            <Button
                                variant="secondary"
                                onClick={() => navigate('/gelirler')}
                                className="me-md-2"
                                disabled={loading}
                            >
                                ❌ İptal
                            </Button>
                            <Button
                                type="submit"
                                variant="success"
                                size="lg"
                                disabled={loading}
                                className="px-4"
                            >
                                {loading ? 'Ekleniyor...' : '💰 Gelir Ekle'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default IncomeForm;
