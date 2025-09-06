import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Badge, ProgressBar, Alert, Spinner, Button, 
  Table, Form, InputGroup, Tab, Tabs, Modal, ListGroup 
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaSearch, FaFilter, FaDownload, FaEye, FaEdit, FaTrash, 
  FaChartLine, FaChartPie, FaCalendarAlt, FaMoneyBillWave,
  FaCreditCard, FaUniversity, FaArrowUp, FaArrowDown
} from 'react-icons/fa';
import './Dashboard.css';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filtreleme ve arama
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Detaylı veriler
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  
  // Modal durumları
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Paralel olarak tüm verileri çek
      const [
        analyticsResponse,
        incomesResponse,
        expensesResponse,
        accountsResponse,
        creditCardsResponse
      ] = await Promise.all([
        axios.get('/api/analytics'),
        axios.get('/api/incomes'),
        axios.get('/api/expenses'),
        axios.get('/api/accounts'),
        axios.get('/api/credit-cards')
      ]);

      if (analyticsResponse.data.success) {
        setAnalytics(analyticsResponse.data.analytics);
      }
      
      if (incomesResponse.data.success) {
        setIncomes(incomesResponse.data.incomes || []);
      }
      
      if (expensesResponse.data.success) {
        setExpenses(expensesResponse.data.expenses || []);
      }
      
      setAccounts(accountsResponse.data || []);
      setCreditCards(creditCardsResponse.data || []);
      
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      // Sadece gerçek hata durumlarında mesaj göster
      if (error.response?.status !== 404) {
        setError('Veriler yüklenirken hata oluştu');
      }
      // Hata durumunda boş veriler ayarla
      setAnalytics({
        totalIncome: 0,
        totalExpense: 0,
        netIncome: 0,
        savingsRate: 0,
        incomeDistribution: {},
        expenseDistribution: {}
      });
      setIncomes([]);
      setExpenses([]);
      setAccounts([]);
      setCreditCards([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = Number(amount) || 0;
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(numAmount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const getPaymentMethodLabel = (method) => {
    const methods = {
      'cash': 'Nakit',
      'credit_card': 'Kredi Kartı',
      'bank_transfer': 'Banka Transferi',
      'credit_account': 'Kredili Hesap'
    };
    return methods[method] || method;
  };

  // Filtrelenmiş veriler
  const filteredIncomes = incomes.filter(income => {
    const matchesSearch = income.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         income.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = dateFilter === 'all' || 
                       (dateFilter === 'thisMonth' && new Date(income.income_date).getMonth() === new Date().getMonth()) ||
                       (dateFilter === 'lastMonth' && new Date(income.income_date).getMonth() === new Date().getMonth() - 1);
    return matchesSearch && matchesDate;
  });

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = dateFilter === 'all' || 
                       (dateFilter === 'thisMonth' && new Date(expense.created_at).getMonth() === new Date().getMonth()) ||
                       (dateFilter === 'lastMonth' && new Date(expense.created_at).getMonth() === new Date().getMonth() - 1);
    const matchesCategory = categoryFilter === 'all' || expense.category_name === categoryFilter;
    return matchesSearch && matchesDate && matchesCategory;
  });

  // Güvenli sayı dönüşümü ve hesaplama
  const totalIncome = filteredIncomes.reduce((sum, income) => {
    const amount = Number(income.amount) || 0;
    return sum + amount;
  }, 0);
  
  const totalExpense = filteredExpenses.reduce((sum, expense) => {
    const amount = Number(expense.amount) || 0;
    return sum + amount;
  }, 0);
  
  const netIncome = totalIncome - totalExpense;

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Spinner animation="border" role="status" variant="primary" size="lg">
          <span className="visually-hidden">Yükleniyor...</span>
        </Spinner>
        <p>Analiz verileri yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <Alert variant="danger" className="border-0 shadow">
          <Alert.Heading>Hata!</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchAllData}>
            🔄 Tekrar Dene
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container-fluid">
        {/* Header */}
        <div className="dashboard-header mb-4">
          <div>
            <h1 className="dashboard-title">📊 Finansal Analiz & Veri Takibi</h1>
            <p className="dashboard-subtitle">Tüm finansal verilerinizi detaylı olarak takip edin</p>
          </div>
          <div className="dashboard-actions">
            <Button 
              variant="outline-primary" 
              onClick={fetchAllData}
              disabled={loading}
              size="sm"
            >
              {loading ? 'Yenileniyor...' : '🔄 Yenile'}
            </Button>
          </div>
        </div>

        {/* Filtreleme ve Arama */}
        <Card className="dashboard-card mb-4">
          <Card.Header>
            <h5 className="mb-0">🔍 Filtreleme ve Arama</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={4}>
                <InputGroup className="mb-3">
                  <InputGroup.Text><FaSearch /></InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Başlık, kaynak veya kategori ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="mb-3"
                >
                  <option value="all">Tüm Zamanlar</option>
                  <option value="thisMonth">Bu Ay</option>
                  <option value="lastMonth">Geçen Ay</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="mb-3"
                >
                  <option value="all">Tüm Kategoriler</option>
                  {[...new Set(expenses.map(e => e.category_name))].map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => {
                    setSearchTerm('');
                    setDateFilter('all');
                    setCategoryFilter('all');
                  }}
                  className="w-100"
                >
                  <FaFilter /> Temizle
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Özet Kartları */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-4">
            <Card className="stat-card stat-card-income">
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon">
                  <FaArrowUp />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Toplam Gelir</div>
                  <div className="stat-value text-success">{formatCurrency(totalIncome)}</div>
                  <Badge bg="success" className="stat-badge">
                    {filteredIncomes.length} işlem
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <Card className="stat-card stat-card-expense">
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon">
                  <FaArrowDown />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Toplam Gider</div>
                  <div className="stat-value text-danger">{formatCurrency(totalExpense)}</div>
                  <Badge bg="danger" className="stat-badge">
                    {filteredExpenses.length} işlem
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <Card className={`stat-card ${netIncome >= 0 ? 'stat-card-net' : 'stat-card-expense'}`}>
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon">
                  <FaChartLine />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Net Gelir</div>
                  <div className={`stat-value ${netIncome >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatCurrency(netIncome)}
                  </div>
                  <Badge bg={netIncome >= 0 ? 'success' : 'danger'} className="stat-badge">
                    {netIncome >= 0 ? 'Pozitif' : 'Negatif'}
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <Card className="stat-card stat-card-savings">
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon">
                  <FaMoneyBillWave />
                </div>
                  <div className="stat-content">
                    <div className="stat-label">Tasarruf Oranı</div>
                    <div className="stat-value text-warning">
                      %{totalIncome > 0 ? Math.round((netIncome / totalIncome) * 100 * 10) / 10 : 0}
                    </div>
                    <Badge bg="warning" className="stat-badge">
                      Hedef: %20
                    </Badge>
                  </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Tab Navigation */}
        <Card className="dashboard-card mb-4">
          <Card.Body className="p-0">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="border-bottom"
            >
              <Tab eventKey="overview" title="📊 Genel Bakış">
                <div className="p-4">
                  <Row>
                    <Col md={6}>
                      <h5 className="mb-3">💰 Gelir Dağılımı</h5>
                      {incomes.length > 0 ? (
                        <div className="table-responsive">
                          <Table hover size="sm">
                            <thead>
                              <tr>
                                <th>Tür</th>
                                <th>Adet</th>
                                <th>Tutar</th>
                                <th>%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(
                                incomes.reduce((acc, income) => {
                                  const type = income.income_type || 'other';
                                  const amount = Number(income.amount) || 0;
                                  if (!acc[type]) acc[type] = { count: 0, total: 0 };
                                  acc[type].count++;
                                  acc[type].total += amount;
                                  return acc;
                                }, {})
                              ).map(([type, data]) => (
                                <tr key={type}>
                                  <td>{getIncomeTypeLabel(type)}</td>
                                  <td>{data.count}</td>
                                  <td>{formatCurrency(data.total)}</td>
                                  <td>{totalIncome > 0 ? Math.round((data.total / totalIncome) * 100 * 10) / 10 : 0}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      ) : (
                        <Alert variant="info">Henüz gelir kaydı bulunmuyor</Alert>
                      )}
                    </Col>
                    <Col md={6}>
                      <h5 className="mb-3">💸 Gider Dağılımı</h5>
                      {expenses.length > 0 ? (
                        <div className="table-responsive">
                          <Table hover size="sm">
                            <thead>
                              <tr>
                                <th>Kategori</th>
                                <th>Adet</th>
                                <th>Tutar</th>
                                <th>%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(
                                expenses.reduce((acc, expense) => {
                                  const category = expense.category_name || 'Diğer';
                                  const amount = Number(expense.amount) || 0;
                                  if (!acc[category]) acc[category] = { count: 0, total: 0 };
                                  acc[category].count++;
                                  acc[category].total += amount;
                                  return acc;
                                }, {})
                              ).map(([category, data]) => (
                                <tr key={category}>
                                  <td>{category}</td>
                                  <td>{data.count}</td>
                                  <td>{formatCurrency(data.total)}</td>
                                  <td>{totalExpense > 0 ? Math.round((data.total / totalExpense) * 100 * 10) / 10 : 0}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      ) : (
                        <Alert variant="info">Henüz gider kaydı bulunmuyor</Alert>
                      )}
                    </Col>
                  </Row>
                </div>
              </Tab>

              <Tab eventKey="incomes" title="💰 Gelirler">
                <div className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>Gelir Listesi ({filteredIncomes.length})</h5>
                    <Button as={Link} to="/incomes/new" variant="success" size="sm">
                      💰 Yeni Gelir Ekle
                    </Button>
                  </div>
                  {filteredIncomes.length > 0 ? (
                    <div className="table-responsive">
                      <Table hover>
                        <thead className="table-light">
                          <tr>
                            <th>Tarih</th>
                            <th>Başlık</th>
                            <th>Tür</th>
                            <th>Kaynak</th>
                            <th>Tutar</th>
                            <th>İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredIncomes.map((income) => (
                            <tr key={income.id}>
                              <td>{formatDate(income.income_date)}</td>
                              <td className="fw-bold">{income.title || 'Başlıksız'}</td>
                              <td>
                                <Badge bg="success">
                                  {getIncomeTypeLabel(income.income_type)}
                                </Badge>
                              </td>
                              <td>{income.source || 'Bilinmiyor'}</td>
                              <td className="text-success fw-bold">
                                {formatCurrency(income.amount)}
                              </td>
                              <td>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedItem(income);
                                    setShowIncomeModal(true);
                                  }}
                                >
                                  <FaEye />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <Alert variant="info">
                      Arama kriterlerinize uygun gelir kaydı bulunamadı.
                    </Alert>
                  )}
                </div>
              </Tab>

              <Tab eventKey="expenses" title="💸 Giderler">
                <div className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>Gider Listesi ({filteredExpenses.length})</h5>
                    <Button as={Link} to="/expenses/new" variant="danger" size="sm">
                      💸 Yeni Gider Ekle
                    </Button>
                  </div>
                  {filteredExpenses.length > 0 ? (
                    <div className="table-responsive">
                      <Table hover>
                        <thead className="table-light">
                          <tr>
                            <th>Tarih</th>
                            <th>Başlık</th>
                            <th>Kategori</th>
                            <th>Ödeme Yöntemi</th>
                            <th>Tutar</th>
                            <th>İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredExpenses.map((expense) => (
                            <tr key={expense.id}>
                              <td>{formatDate(expense.created_at)}</td>
                              <td className="fw-bold">{expense.title || 'Başlıksız'}</td>
                              <td>
                                <Badge 
                                  bg="secondary"
                                  style={{ backgroundColor: expense.category_color || '#6c757d' }}
                                >
                                  {expense.category_name || 'Kategori Yok'}
                                </Badge>
                              </td>
                              <td>{getPaymentMethodLabel(expense.payment_method)}</td>
                              <td className="text-danger fw-bold">
                                {formatCurrency(expense.amount)}
                              </td>
                              <td>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedItem(expense);
                                    setShowExpenseModal(true);
                                  }}
                                >
                                  <FaEye />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <Alert variant="info">
                      Arama kriterlerinize uygun gider kaydı bulunamadı.
                    </Alert>
                  )}
                </div>
              </Tab>

              <Tab eventKey="accounts" title="🏦 Hesaplar">
                <div className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>Hesap Listesi ({accounts.length})</h5>
                    <Button as={Link} to="/accounts/new" variant="info" size="sm">
                      🏦 Yeni Hesap Ekle
                    </Button>
                  </div>
                  {accounts.length > 0 ? (
                    <Row>
                      {accounts.map((account) => (
                        <Col md={6} lg={4} key={account.id} className="mb-3">
                          <Card className="h-100">
                            <Card.Header className="bg-info text-white">
                              <h6 className="mb-0">{account.account_name}</h6>
                            </Card.Header>
                            <Card.Body>
                              <div className="mb-2">
                                <strong>Banka:</strong> {account.bank_name}
                              </div>
                              <div className="mb-2">
                                <strong>Bakiye:</strong> 
                                <span className={`fw-bold ${(Number(account.current_balance) || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                                  {formatCurrency(account.current_balance)}
                                </span>
                              </div>
                              {account.is_credit_account && (
                                <div className="mb-2">
                                  <strong>Kredi Limiti:</strong> 
                                  <span className="fw-bold text-warning">
                                    {formatCurrency(account.credit_limit)}
                                  </span>
                                </div>
                              )}
                              <div className="mb-2">
                                <strong>Tür:</strong> 
                                <Badge bg={account.is_credit_account ? 'warning' : 'success'}>
                                  {account.is_credit_account ? 'Kredili Hesap' : 'Mevduat Hesabı'}
                                </Badge>
                              </div>
                              <div className="d-grid gap-2">
                                <Button variant="outline-info" size="sm">
                                  <FaEdit /> Düzenle
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <Alert variant="info">Henüz hesap kaydı bulunmuyor</Alert>
                  )}
                </div>
              </Tab>

              <Tab eventKey="credit-cards" title="💳 Kredi Kartları">
                <div className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>Kredi Kartı Listesi ({creditCards.length})</h5>
                    <Button as={Link} to="/credit-cards/new" variant="warning" size="sm">
                      💳 Yeni Kart Ekle
                    </Button>
                  </div>
                  {creditCards.length > 0 ? (
                    <Row>
                      {creditCards.map((card) => (
                        <Col md={6} lg={4} key={card.id} className="mb-3">
                          <Card className="h-100">
                            <Card.Header className="bg-warning text-dark">
                              <h6 className="mb-0">{card.card_name}</h6>
                            </Card.Header>
                            <Card.Body>
                              <div className="mb-2">
                                <strong>Banka:</strong> {card.bank_name}
                              </div>
                              <div className="mb-2">
                                <strong>Toplam Limit:</strong> 
                                <span className="fw-bold text-warning">
                                  {formatCurrency(card.credit_limit)}
                                </span>
                              </div>
                              <div className="mb-2">
                                <strong>Kalan Limit:</strong> 
                                <span className="fw-bold text-success">
                                  {formatCurrency(card.remaining_limit)}
                                </span>
                              </div>
                              <div className="mb-3">
                                <strong>Kullanım Oranı:</strong>
                                {(() => {
                                  const creditLimit = Number(card.credit_limit) || 0;
                                  const remainingLimit = Number(card.remaining_limit) || 0;
                                  const usedAmount = creditLimit - remainingLimit;
                                  const usagePercentage = creditLimit > 0 ? (usedAmount / creditLimit) * 100 : 0;
                                  
                                  return (
                                    <>
                                      <ProgressBar 
                                        variant="warning" 
                                        now={usagePercentage}
                                        className="mt-1"
                                      />
                                      <small className="text-muted">
                                        %{Math.round(usagePercentage * 10) / 10} kullanılmış
                                      </small>
                                    </>
                                  );
                                })()}
                              </div>
                              <div className="d-grid gap-2">
                                <Button variant="outline-warning" size="sm">
                                  <FaEdit /> Düzenle
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <Alert variant="info">Henüz kredi kartı kaydı bulunmuyor</Alert>
                  )}
                </div>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>

        {/* Detay Modal'ları */}
        <Modal show={showIncomeModal} onHide={() => setShowIncomeModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>💰 Gelir Detayları</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedItem && (
              <div>
                <Row>
                  <Col md={6}>
                    <strong>Başlık:</strong> {selectedItem.title}
                  </Col>
                  <Col md={6}>
                    <strong>Tutar:</strong> 
                    <span className="text-success fw-bold ms-2">
                      {formatCurrency(selectedItem.amount)}
                    </span>
                  </Col>
                </Row>
                <hr />
                <Row>
                  <Col md={6}>
                    <strong>Tür:</strong> {getIncomeTypeLabel(selectedItem.income_type)}
                  </Col>
                  <Col md={6}>
                    <strong>Kaynak:</strong> {selectedItem.source}
                  </Col>
                </Row>
                <hr />
                <Row>
                  <Col md={6}>
                    <strong>Tarih:</strong> {formatDate(selectedItem.income_date)}
                  </Col>
                  <Col md={6}>
                    <strong>Açıklama:</strong> {selectedItem.description || 'Açıklama yok'}
                  </Col>
                </Row>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowIncomeModal(false)}>
              Kapat
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showExpenseModal} onHide={() => setShowExpenseModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>💸 Gider Detayları</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedItem && (
              <div>
                <Row>
                  <Col md={6}>
                    <strong>Başlık:</strong> {selectedItem.title}
                  </Col>
                  <Col md={6}>
                    <strong>Tutar:</strong> 
                    <span className="text-danger fw-bold ms-2">
                      {formatCurrency(selectedItem.amount)}
                    </span>
                  </Col>
                </Row>
                <hr />
                <Row>
                  <Col md={6}>
                    <strong>Kategori:</strong> {selectedItem.category_name}
                  </Col>
                  <Col md={6}>
                    <strong>Ödeme Yöntemi:</strong> {getPaymentMethodLabel(selectedItem.payment_method)}
                  </Col>
                </Row>
                <hr />
                <Row>
                  <Col md={6}>
                    <strong>Tarih:</strong> {formatDate(selectedItem.created_at)}
                  </Col>
                  <Col md={6}>
                    <strong>Açıklama:</strong> {selectedItem.description || 'Açıklama yok'}
                  </Col>
                </Row>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowExpenseModal(false)}>
              Kapat
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Hızlı Erişim */}
        <Card className="dashboard-card mb-4">
          <Card.Header>
            <h5 className="mb-0">🚀 Hızlı Erişim</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={3} className="mb-2">
                <Button 
                  as={Link} 
                  to="/incomes/new" 
                  variant="success" 
                  size="lg" 
                  className="w-100 quick-action-btn"
                >
                  💰 Gelir Ekle
                </Button>
              </Col>
              <Col md={3} className="mb-2">
                <Button 
                  as={Link} 
                  to="/expenses/new" 
                  variant="danger" 
                  size="lg" 
                  className="w-100 quick-action-btn"
                >
                  💸 Gider Ekle
                </Button>
              </Col>
              <Col md={3} className="mb-2">
                <Button 
                  as={Link} 
                  to="/accounts/new" 
                  variant="info" 
                  size="lg" 
                  className="w-100 quick-action-btn"
                >
                  🏦 Hesap Ekle
                </Button>
              </Col>
              <Col md={3} className="mb-2">
                <Button 
                  as={Link} 
                  to="/credit-cards/new" 
                  variant="warning" 
                  size="lg" 
                  className="w-100 quick-action-btn"
                >
                  💳 Kart Ekle
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Footer */}
        <div className="text-center mb-4">
          <p className="text-muted">
            Son güncelleme: {new Date().toLocaleDateString('tr-TR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;