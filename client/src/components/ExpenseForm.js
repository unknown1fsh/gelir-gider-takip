import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BackButton from './BackButton';

const ExpenseForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category_id: '',
        expense_type: 'other',
        payment_method: 'cash',
        related_account_id: '',
        related_credit_card_id: '',
        related_credit_account_id: '',
        due_date: '',
        payment_date: '',
        description: ''
    });

    const [rentData, setRentData] = useState({
        rent_amount: '',
        maintenance_fee: '',
        property_tax: '',
        insurance: '',
        other_fees: '',
        property_address: '',
        landlord_name: '',
        contract_start_date: '',
        contract_end_date: '',
        due_date: ''
    });

    const [creditData, setCreditData] = useState({
        payment_type: 'credit_card',
        principal_amount: '',
        interest_amount: '',
        late_fee: '',
        minimum_payment: '',
        statement_date: '',
        due_date: '',
        payment_date: '',
        is_minimum_payment: false
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [creditCards, setCreditCards] = useState([]);
    
    // API çağrı kontrolü için ref
    const categoriesLoaded = useRef(false);

    useEffect(() => {
        // Kategoriler daha önce yüklendiyse tekrar yükleme
        if (categoriesLoaded.current) {
            console.log('🔄 Kategoriler zaten yüklendi, tekrar yüklenmeyecek');
            return;
        }
        
        // Force cache temizleme
        setCategories([]);
        
        // Tüm localStorage cache'ini temizle
        Object.keys(localStorage).forEach(key => {
            if (key.includes('category') || key.includes('cache') || key.includes('expense') || key.includes('api')) {
                localStorage.removeItem(key);
            }
        });
        
        // SessionStorage'ı da temizle
        sessionStorage.clear();
        
        // IndexedDB'yi de temizle (varsa)
        if ('indexedDB' in window) {
            indexedDB.databases().then(databases => {
                databases.forEach(db => {
                    if (db.name.includes('category') || db.name.includes('cache')) {
                        indexedDB.deleteDatabase(db.name);
                    }
                });
            });
        }
        
        // Kategorileri yeniden yükle
        fetchCategories();
        fetchAccounts();
        fetchCreditCards();
        
        // Kategoriler yüklendi olarak işaretle
        categoriesLoaded.current = true;
    }, []);

    const fetchCategories = async () => {
        try {
            // Force cache bypass - her seferinde farklı parametreler
            const timestamp = new Date().getTime();
            const random = Math.random();
            const version = Math.floor(Math.random() * 10000);
            
            console.log('🔍 Kategoriler yükleniyor...', { timestamp, random, version });
            
            const response = await axios.get(`/api/expense-categories?t=${timestamp}&r=${random}&v=${version}&nocache=true`, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    'If-Modified-Since': '0',
                    'If-None-Match': '*'
                }
            });
            
            console.log('📡 API Response:', response.data);
            
            // Backend { success: true, categories: [...] } formatında döndürüyor
            if (response.data.success && response.data.categories) {
                // Kategorileri sadece unique olanları al ve sadece ilk 8'ini al
                const uniqueCategories = response.data.categories
                    .filter((category, index, self) => 
                        index === self.findIndex(c => c.id === category.id && c.name === category.name)
                    )
                    .slice(0, 8); // Sadece ilk 8 kategori
                
                console.log(`✅ Frontend'de yüklenen kategoriler: ${uniqueCategories.length} adet (sadece ilk 8)`);
                setCategories(uniqueCategories);
            } else {
                console.log('❌ Kategoriler bulunamadı');
                setCategories([]);
            }
        } catch (error) {
            console.error('❌ Kategoriler yüklenirken hata:', error);
            setCategories([]);
        }
    };

    const fetchAccounts = async () => {
        try {
            const response = await axios.get('/api/accounts');
            // Backend direkt array döndürüyor
            setAccounts(response.data || []);
        } catch (error) {
            console.error('Hesaplar yüklenirken hata:', error);
            setAccounts([]);
        }
    };

    const fetchCreditCards = async () => {
        try {
            const response = await axios.get('/api/credit-cards');
            // Backend direkt array döndürüyor
            setCreditCards(response.data || []);
        } catch (error) {
            console.error('Kredi kartları yüklenirken hata:', error);
            setCreditCards([]);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Gider türü değiştiğinde otomatik kategori seçimi
        if (name === 'expense_type') {
            const selectedExpenseType = expenseTypes.find(type => type.value === value);
            if (selectedExpenseType && selectedExpenseType.category) {
                const category = categories.find(cat => cat.name === selectedExpenseType.category);
                if (category) {
                    setFormData(prev => ({ ...prev, category_id: category.id }));
                }
            }
        }
    };

    const handleRentChange = (e) => {
        const { name, value } = e.target;
        setRentData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCreditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCreditData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const calculateTotalAmount = () => {
        // Daha güvenli sayı dönüşümü için parseFloat yerine Number kullan
        const rent = Number(rentData.rent_amount) || 0;
        const maintenance = Number(rentData.maintenance_fee) || 0;
        const tax = Number(rentData.property_tax) || 0;
        const insurance = Number(rentData.insurance) || 0;
        const other = Number(rentData.other_fees) || 0;
        
        // Toplamı hesapla ve precision hatasını düzelt
        const total = rent + maintenance + tax + insurance + other;
        
        // Floating point precision hatasını düzelt
        return Math.round(total * 100) / 100;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Ana gider kaydını oluştur
            const expenseResponse = await axios.post('/api/expenses', formData);
            
            if (expenseResponse.data.success) {
                const expenseId = expenseResponse.data.expense_id;
                
                // Ev kirası detayları ekleniyorsa
                if (formData.expense_type === 'rent' && rentData.rent_amount) {
                    // Sadece dolu olan alanları gönder
                    const rentDataToSend = {
                        expense_id: expenseId,
                        rent_amount: rentData.rent_amount || null,
                        maintenance_fee: rentData.maintenance_fee || null,
                        property_tax: rentData.property_tax || null,
                        insurance: rentData.insurance || null,
                        other_fees: rentData.other_fees || null,
                        property_address: rentData.property_address || null,
                        landlord_name: rentData.landlord_name || null,
                        contract_start_date: rentData.contract_start_date || null,
                        contract_end_date: rentData.contract_end_date || null,
                        due_date: rentData.due_date || null
                    };
                    
                    console.log('🏠 Rent data gönderiliyor:', rentDataToSend);
                    
                    await axios.post('/api/rent-expenses', rentDataToSend);
                }
                
                // Kredi ödemesi detayları ekleniyorsa
                if (['credit_card', 'credit_loan', 'credit_account'].includes(formData.expense_type) && creditData.principal_amount) {
                    await axios.post('/api/credit-payments', {
                        ...creditData,
                        expense_id: expenseId
                    });
                }

                setMessage({ type: 'success', text: 'Gider başarıyla eklendi' });
                resetForm();
            }
        } catch (error) {
            setMessage({ 
                type: 'danger', 
                text: error.response?.data?.message || 'Gider eklenirken hata oluştu' 
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            amount: '',
            category_id: '',
            expense_type: 'other',
            payment_method: 'cash',
            related_account_id: '',
            related_credit_card_id: '',
            related_credit_account_id: '',
            due_date: '',
            payment_date: '',
            description: ''
        });
        setRentData({
            rent_amount: '',
            maintenance_fee: '',
            property_tax: '',
            insurance: '',
            other_fees: '',
            property_address: '',
            landlord_name: '',
            contract_start_date: '',
            contract_end_date: '',
            due_date: ''
        });
        setCreditData({
            payment_type: 'credit_card',
            principal_amount: '',
            interest_amount: '',
            late_fee: '',
            minimum_payment: '',
            statement_date: '',
            due_date: '',
            payment_date: '',
            is_minimum_payment: false
        });
    };

    const expenseTypes = [
        { value: 'rent', label: '🏠 Ev Kirası', category: 'Ev Giderleri' },
        { value: 'utilities', label: '💡 Faturalar (Elektrik, Su, Doğalgaz)', category: 'Ev Giderleri' },
        { value: 'maintenance', label: '🔧 Ev Bakım/Onarım', category: 'Ev Giderleri' },
        { value: 'credit_card', label: '💳 Kredi Kartı Ödemesi', category: 'Kredi Ödemeleri' },
        { value: 'credit_loan', label: '🏦 Kredi Ödemesi', category: 'Kredi Ödemeleri' },
        { value: 'credit_account', label: '📊 Kredili Hesap', category: 'Kredi Ödemeleri' },
        { value: 'food', label: '🛒 Market/Alışveriş', category: 'Gıda' },
        { value: 'transport', label: '🚗 Ulaşım', category: 'Ulaşım' },
        { value: 'health', label: '🏥 Sağlık', category: 'Sağlık' },
        { value: 'entertainment', label: '🎬 Eğlence', category: 'Eğlence' },
        { value: 'other', label: '📝 Diğer', category: 'Diğer' }
    ];

    const paymentMethods = [
        { value: 'cash', label: 'Nakit' },
        { value: 'credit_card', label: 'Kredi Kartı' },
        { value: 'bank_transfer', label: 'Banka Transferi' },
        { value: 'credit_account', label: 'Kredili Hesap' }
    ];

    return (
        <div className="container mt-4">
            <BackButton fallbackPath="/giderler" />
            <Card className="shadow">
                <Card.Header className="bg-danger text-white">
                    <h4 className="mb-0">💸 Yeni Gider Ekle</h4>
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
                                    <Form.Label>Gider Başlığı *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Örn: Ocak Kira Ödemesi"
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
                                    <Form.Label>Kategori *</Form.Label>
                                    <Form.Select
                                        name="category_id"
                                        value={formData.category_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Kategori Seçin</option>
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Gider Türü *</Form.Label>
                                    <Form.Select
                                        name="expense_type"
                                        value={formData.expense_type}
                                        onChange={handleChange}
                                        required
                                    >
                                        {expenseTypes.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Ödeme Yöntemi *</Form.Label>
                                    <Form.Select
                                        name="payment_method"
                                        value={formData.payment_method}
                                        onChange={handleChange}
                                        required
                                    >
                                        {paymentMethods.map(method => (
                                            <option key={method.value} value={method.value}>
                                                {method.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Son Ödeme Tarihi</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="due_date"
                                        value={formData.due_date}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Banka Transferi Seçildiğinde Hesap Seçimi */}
                        {formData.payment_method === 'bank_transfer' && (
                            <Row>
                                <Col md={12}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Ödeme Yapılacak Hesap *</Form.Label>
                                        <Form.Select
                                            name="related_account_id"
                                            value={formData.related_account_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Hesap Seçin</option>
                                            {accounts
                                                .map(account => (
                                                    <option key={account.id} value={account.id}>
                                                        {account.bank_name} - {account.account_name} 
                                                        {account.is_credit_account ? 
                                                            `(Kalan Limit: ₺${parseFloat(account.credit_limit || 0).toLocaleString('tr-TR', {minimumFractionDigits: 2})})` :
                                                            `(Bakiye: ₺${parseFloat(account.current_balance).toLocaleString('tr-TR', {minimumFractionDigits: 2})})`
                                                        }
                                                    </option>
                                                ))
                                            }
                                        </Form.Select>

                                    </Form.Group>
                                </Col>
                            </Row>
                        )}

                        {/* Kredi Kartı Seçildiğinde Kart Seçimi */}
                        {formData.payment_method === 'credit_card' && (
                            <Row>
                                <Col md={12}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Ödeme Yapılacak Kredi Kartı *</Form.Label>
                                        <Form.Select
                                            name="related_credit_card_id"
                                            value={formData.related_credit_card_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Kredi Kartı Seçin</option>
                                            {creditCards.map(card => (
                                                <option key={card.id} value={card.id}>
                                                    {card.bank_name} - {card.card_name} 
                                                    (Kalan Limit: ₺{parseFloat(card.remaining_limit).toLocaleString('tr-TR', {minimumFractionDigits: 2})})
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                        )}

                        {/* Kredili Hesap Seçildiğinde Hesap Seçimi */}
                        {formData.payment_method === 'credit_account' && (
                            <Row>
                                <Col md={12}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Ödeme Yapılacak Kredili Hesap *</Form.Label>
                                        <Form.Select
                                            name="related_credit_account_id"
                                            value={formData.related_credit_account_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Kredili Hesap Seçin</option>
                                            {accounts
                                                .filter(account => account.is_credit_account) // Sadece kredili hesaplar
                                                .map(account => (
                                                    <option key={account.id} value={account.id}>
                                                        {account.bank_name} - {account.account_name} 
                                                        (Kalan Limit: ₺{parseFloat(account.credit_limit).toLocaleString('tr-TR', {minimumFractionDigits: 2})})
                                                    </option>
                                                ))
                                            }
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                        )}

                        {/* Ev Kirası Detayları */}
                        {formData.expense_type === 'rent' && (
                            <Card className="mb-3 border-warning">
                                <Card.Header className="bg-warning text-dark">
                                    <h6 className="mb-0">🏠 Ev Kirası Detayları</h6>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Kira Tutarı (₺)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="rent_amount"
                                                    value={rentData.rent_amount}
                                                    onChange={handleRentChange}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Aidat (₺) - Opsiyonel</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="maintenance_fee"
                                                    value={rentData.maintenance_fee}
                                                    onChange={handleRentChange}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Emlak Vergisi (₺) - Opsiyonel</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="property_tax"
                                                    value={rentData.property_tax}
                                                    onChange={handleRentChange}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Sigorta (₺) - Opsiyonel</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="insurance"
                                                    value={rentData.insurance}
                                                    onChange={handleRentChange}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Diğer Masraflar (₺) - Opsiyonel</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="other_fees"
                                                    value={rentData.other_fees}
                                                    onChange={handleRentChange}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <div className="mt-4 pt-2">
                                                <strong>Toplam: ₺{calculateTotalAmount().toFixed(2)}</strong>
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Son Ödeme Tarihi - Opsiyonel</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    name="due_date"
                                                    value={rentData.due_date}
                                                    onChange={handleRentChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Mülk Adresi - Opsiyonel</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="property_address"
                                                    value={rentData.property_address}
                                                    onChange={handleRentChange}
                                                    placeholder="Mülk adresi..."
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Ev Sahibi - Opsiyonel</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="landlord_name"
                                                    value={rentData.landlord_name}
                                                    onChange={handleRentChange}
                                                    placeholder="Ev sahibi adı..."
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Kontrat Başlangıç - Opsiyonel</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    name="contract_start_date"
                                                    value={rentData.contract_start_date}
                                                    onChange={handleRentChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Kontrat Bitiş - Opsiyonel</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    name="contract_end_date"
                                                    value={rentData.contract_end_date}
                                                    onChange={handleRentChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Kredi Ödemesi Detayları */}
                        {['credit_card', 'credit_loan', 'credit_account'].includes(formData.expense_type) && (
                            <Card className="mb-3 border-info">
                                <Card.Header className="bg-info text-white">
                                    <h6 className="mb-0">💳 Kredi Ödemesi Detayları</h6>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Ana Para (₺)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="principal_amount"
                                                    value={creditData.principal_amount}
                                                    onChange={handleCreditChange}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Faiz (₺)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="interest_amount"
                                                    value={creditData.interest_amount}
                                                    onChange={handleCreditChange}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Gecikme Cezası (₺)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="late_fee"
                                                    value={creditData.late_fee}
                                                    onChange={handleCreditChange}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Minimum Ödeme (₺)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="minimum_payment"
                                                    value={creditData.minimum_payment}
                                                    onChange={handleCreditChange}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Hesap Kesim Tarihi</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    name="statement_date"
                                                    value={creditData.statement_date}
                                                    onChange={handleCreditChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Son Ödeme Tarihi</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    name="due_date"
                                                    value={creditData.due_date}
                                                    onChange={handleCreditChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={12}>
                                            <Form.Group className="mb-3">
                                                <Form.Check
                                                    type="checkbox"
                                                    name="is_minimum_payment"
                                                    label="Minimum ödeme yapıldı"
                                                    checked={creditData.is_minimum_payment}
                                                    onChange={handleCreditChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        )}

                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Açıklama</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Gider hakkında ek bilgiler..."
                                        rows="3"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                            <Button
                                variant="secondary"
                                onClick={() => navigate('/giderler')}
                                className="me-md-2"
                                disabled={loading}
                            >
                                ❌ İptal
                            </Button>
                            <Button
                                type="submit"
                                variant="danger"
                                size="lg"
                                disabled={loading}
                                className="px-4"
                            >
                                {loading ? 'Ekleniyor...' : '💸 Gider Ekle'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default ExpenseForm;
