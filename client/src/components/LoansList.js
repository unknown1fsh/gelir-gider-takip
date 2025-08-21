import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Table, Modal, Form, Alert, Badge, Spinner } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaMoneyBillWave, FaCalendarAlt, FaPercentage } from 'react-icons/fa';
import axios from 'axios';

const LoansList = () => {
    const [loans, setLoans] = useState([]);
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingLoan, setEditingLoan] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);

    const [formData, setFormData] = useState({
        bank_id: '',
        loan_name: '',
        total_amount: '',
        interest_rate: '',
        term_months: '',
        monthly_payment: '',
        total_repayment: '',
        start_date: '',
        end_date: ''
    });

    const [paymentData, setPaymentData] = useState({
        payment_amount: ''
    });

    useEffect(() => {
        fetchLoans();
        fetchBanks();
    }, []);

    const fetchLoans = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/loans');
            if (response.data.success) {
                setLoans(response.data.loans);
            }
        } catch (error) {
            setError('Krediler yüklenirken hata oluştu');
            console.error('Krediler hatası:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBanks = async () => {
        try {
            const response = await axios.get('/api/banks');
            setBanks(response.data);
        } catch (error) {
            console.error('Bankalar hatası:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePaymentInputChange = (e) => {
        const { name, value } = e.target;
        setPaymentData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingLoan) {
                await axios.put(`/api/loans/${editingLoan.id}`, formData);
            } else {
                await axios.post('/api/loans', formData);
            }
            setShowModal(false);
            setEditingLoan(null);
            resetForm();
            fetchLoans();
        } catch (error) {
            setError('Kredi kaydedilirken hata oluştu');
            console.error('Kredi kaydetme hatası:', error);
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`/api/loans/${selectedLoan.id}/payment`, paymentData);
            setShowPaymentModal(false);
            setSelectedLoan(null);
            setPaymentData({ payment_amount: '' });
            fetchLoans();
        } catch (error) {
            setError('Kredi ödemesi yapılırken hata oluştu');
            console.error('Kredi ödeme hatası:', error);
        }
    };

    const handleEdit = (loan) => {
        setEditingLoan(loan);
        setFormData({
            bank_id: loan.bank_id,
            loan_name: loan.loan_name,
            total_amount: loan.total_amount,
            interest_rate: loan.interest_rate,
            term_months: loan.term_months,
            monthly_payment: loan.monthly_payment,
            total_repayment: loan.total_repayment,
            start_date: loan.start_date,
            end_date: loan.end_date
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu krediyi silmek istediğinizden emin misiniz?')) {
            try {
                await axios.delete(`/api/loans/${id}`);
                fetchLoans();
            } catch (error) {
                setError('Kredi silinirken hata oluştu');
                console.error('Kredi silme hatası:', error);
            }
        }
    };

    const handlePaymentClick = (loan) => {
        setSelectedLoan(loan);
        setShowPaymentModal(true);
    };

    const resetForm = () => {
        setFormData({
            bank_id: '',
            loan_name: '',
            total_amount: '',
            interest_rate: '',
            term_months: '',
            monthly_payment: '',
            total_repayment: '',
            start_date: '',
            end_date: ''
        });
    };

    const openNewLoanModal = () => {
        setEditingLoan(null);
        resetForm();
        setShowModal(true);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    const getRemainingBalancePercentage = (loan) => {
        if (loan.total_repayment === 0) return 0;
        return ((loan.remaining_balance / loan.total_repayment) * 100).toFixed(1);
    };

    const getRemainingBalanceColor = (percentage) => {
        if (percentage > 80) return 'danger';
        if (percentage > 50) return 'warning';
        return 'success';
    };

    if (loading) {
        return (
            <div className="container mt-4 text-center">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Yükleniyor...</span>
                </Spinner>
                <p className="mt-3">Krediler yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>🏦 Krediler</h2>
                <Button variant="success" onClick={openNewLoanModal}>
                    <FaPlus className="me-2" />
                    Yeni Kredi Ekle
                </Button>
            </div>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Özet Kartları */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="text-center border-primary">
                        <Card.Body>
                            <h5 className="text-primary">💰</h5>
                            <h6>Toplam Kredi</h6>
                            <h4 className="text-primary">
                                {formatCurrency(loans.reduce((sum, loan) => sum + parseFloat(loan.total_amount), 0))}
                            </h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center border-warning">
                        <Card.Body>
                            <h5 className="text-warning">💸</h5>
                            <h6>Kalan Bakiye</h6>
                            <h4 className="text-warning">
                                {formatCurrency(loans.reduce((sum, loan) => sum + parseFloat(loan.remaining_balance), 0))}
                            </h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center border-success">
                        <Card.Body>
                            <h5 className="text-success">📊</h5>
                            <h6>Ödenen Tutar</h6>
                            <h4 className="text-success">
                                {formatCurrency(loans.reduce((sum, loan) => sum + (parseFloat(loan.total_repayment) - parseFloat(loan.remaining_balance)), 0))}
                            </h4>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="text-center border-info">
                        <Card.Body>
                            <h5 className="text-info">📅</h5>
                            <h6>Aktif Kredi</h6>
                            <h4 className="text-info">{loans.length}</h4>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Krediler Tablosu */}
            <Card className="shadow">
                <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">📋 Kredi Listesi</h5>
                </Card.Header>
                <Card.Body>
                    {loans.length === 0 ? (
                        <div className="text-center py-4">
                            <h6 className="text-muted">Henüz kredi bulunmuyor</h6>
                            <p className="text-muted">İlk kredinizi ekleyerek başlayın</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover>
                                <thead className="table-light">
                                    <tr>
                                        <th>Kredi Adı</th>
                                        <th>Banka</th>
                                        <th>Toplam Tutar</th>
                                        <th>Faiz Oranı</th>
                                        <th>Vade</th>
                                        <th>Aylık Ödeme</th>
                                        <th>Kalan Bakiye</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loans.map((loan) => (
                                        <tr key={loan.id}>
                                            <td>
                                                <strong>{loan.loan_name}</strong>
                                                <br />
                                                <small className="text-muted">
                                                    {formatDate(loan.start_date)} - {formatDate(loan.end_date)}
                                                </small>
                                            </td>
                                            <td>{loan.bank_name}</td>
                                            <td className="text-primary fw-bold">
                                                {formatCurrency(loan.total_amount)}
                                            </td>
                                            <td>
                                                <Badge bg="info">
                                                    <FaPercentage className="me-1" />
                                                    {loan.interest_rate}%
                                                </Badge>
                                            </td>
                                            <td>
                                                <Badge bg="secondary">
                                                    <FaCalendarAlt className="me-1" />
                                                    {loan.term_months} ay
                                                </Badge>
                                            </td>
                                            <td className="text-success fw-bold">
                                                {formatCurrency(loan.monthly_payment)}
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <span className={`text-${getRemainingBalanceColor(getRemainingBalancePercentage(loan))} fw-bold me-2`}>
                                                        {formatCurrency(loan.remaining_balance)}
                                                    </span>
                                                    <Badge bg={getRemainingBalanceColor(getRemainingBalancePercentage(loan))}>
                                                        %{getRemainingBalancePercentage(loan)}
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="btn-group" role="group">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleEdit(loan)}
                                                        title="Düzenle"
                                                    >
                                                        <FaEdit />
                                                    </Button>
                                                    <Button
                                                        variant="outline-success"
                                                        size="sm"
                                                        onClick={() => handlePaymentClick(loan)}
                                                        title="Ödeme Yap"
                                                    >
                                                        <FaMoneyBillWave />
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(loan.id)}
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
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Kredi Ekleme/Düzenleme Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingLoan ? 'Kredi Düzenle' : 'Yeni Kredi Ekle'}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Banka *</Form.Label>
                                    <Form.Select
                                        name="bank_id"
                                        value={formData.bank_id}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Banka Seçin</option>
                                        {banks.map((bank) => (
                                            <option key={bank.id} value={bank.id}>
                                                {bank.bank_name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Kredi Adı *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="loan_name"
                                        value={formData.loan_name}
                                        onChange={handleInputChange}
                                        placeholder="Örn: Konut Kredisi"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Toplam Kredi Tutarı *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="total_amount"
                                        value={formData.total_amount}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Faiz Oranı (%) *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="interest_rate"
                                        value={formData.interest_rate}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Vade (Ay) *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="term_months"
                                        value={formData.term_months}
                                        onChange={handleInputChange}
                                        placeholder="12"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Aylık Ödeme Tutarı *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="monthly_payment"
                                        value={formData.monthly_payment}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Toplam Geri Ödeme *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="total_repayment"
                                        value={formData.total_repayment}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        step="0.01"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Başlangıç Tarihi *</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Bitiş Tarihi *</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            İptal
                        </Button>
                        <Button variant="primary" type="submit">
                            {editingLoan ? 'Güncelle' : 'Ekle'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Kredi Ödeme Modal */}
            <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Kredi Ödemesi Yap</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handlePayment}>
                    <Modal.Body>
                        {selectedLoan && (
                            <div className="mb-3">
                                <h6>Kredi: {selectedLoan.loan_name}</h6>
                                <p className="text-muted">
                                    Kalan Bakiye: <strong>{formatCurrency(selectedLoan.remaining_balance)}</strong>
                                </p>
                            </div>
                        )}
                        <Form.Group className="mb-3">
                            <Form.Label>Ödeme Tutarı *</Form.Label>
                            <Form.Control
                                type="number"
                                name="payment_amount"
                                value={paymentData.payment_amount}
                                onChange={handlePaymentInputChange}
                                placeholder="0.00"
                                step="0.01"
                                required
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
                            İptal
                        </Button>
                        <Button variant="success" type="submit">
                            Ödeme Yap
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default LoansList;
