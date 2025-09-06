import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Spinner, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BackButton from './BackButton';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Gelir türü etiketlerini Türkçe'ye çevir
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

  // Ödeme yöntemi etiketlerini Türkçe'ye çevir
  const getPaymentMethodLabel = (method) => {
    const methods = {
      'cash': 'Nakit',
      'credit_card': 'Kredi Kartı',
      'bank_transfer': 'Banka Transferi',
      'credit_account': 'Kredili Hesap'
    };
    return methods[method] || method;
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.dashboard);
      } else {
        // Veri yoksa boş dashboard göster
        setDashboardData({
          totalIncome: 0,
          totalExpense: 0,
          netIncome: 0,
          savingsRate: 0,
          recentTransactions: [],
          upcomingPayments: [],
          creditCardUsage: []
        });
      }
    } catch (error) {
      console.error('Dashboard hatası:', error);
      // Sadece gerçek hata durumlarında mesaj göster
      if (error.response?.status !== 404) {
        setError('Dashboard verileri yüklenirken hata oluştu');
      } else {
        // 404 durumunda boş dashboard göster
        setDashboardData({
          totalIncome: 0,
          totalExpense: 0,
          netIncome: 0,
          savingsRate: 0,
          recentTransactions: [],
          upcomingPayments: [],
          creditCardUsage: []
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const value = amount || 0;
    const formatted = new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(Math.abs(value));
    
    // Negatif değerler için eksi işaretini başa ekle
    return value < 0 ? `-${formatted}` : formatted;
  };

  const getCurrentMonth = () => {
    return new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Spinner animation="border" role="status" variant="primary" size="lg">
          <span className="visually-hidden">Yükleniyor...</span>
        </Spinner>
        <p>Dashboard verileri yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <Alert variant="danger" className="border-0 shadow">
          <Alert.Heading>Hata!</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchDashboardData}>
            🔄 Tekrar Dene
          </Button>
        </Alert>
      </div>
    );
  }

  // Veri yoksa hoş geldin mesajı göster
  if (!dashboardData || (dashboardData.totalIncome === 0 && dashboardData.totalExpense === 0)) {
    return (
      <div className="dashboard-page">
        <div className="container-fluid">
          {/* Hero Section */}
          <div className="hero-section text-center py-5 mb-5">
            <div className="hero-content">
              <h1 className="hero-title">🎉 Hoş Geldiniz!</h1>
              <p className="hero-subtitle">
                Gelir-Gider Takip uygulamanıza hoş geldiniz. Finansal durumunuzu kontrol altına alın.
              </p>
            </div>
          </div>

          {/* Quick Start Cards */}
          <Row className="mb-5">
            <Col lg={6} className="mb-4">
              <Card className="stat-card stat-card-income h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="stat-icon">
                    <i className="fas fa-plus"></i>
                  </div>
                  <div className="stat-content">
                    <h4 className="stat-label">İlk Gelirinizi Ekleyin</h4>
                    <p className="text-muted mb-3">
                      Maaş, kira geliri veya diğer gelirlerinizi kaydedin ve finansal durumunuzu takip etmeye başlayın.
                    </p>
                    <Button 
                      as={Link} 
                      to="/incomes/new" 
                      variant="success" 
                      size="lg"
                      className="quick-action-btn"
                    >
                      💰 Gelir Ekle
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6} className="mb-4">
              <Card className="stat-card stat-card-expense h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="stat-icon">
                    <i className="fas fa-minus"></i>
                  </div>
                  <div className="stat-content">
                    <h4 className="stat-label">İlk Giderinizi Ekleyin</h4>
                    <p className="text-muted mb-3">
                      Ev kirası, faturalar, market alışverişi gibi giderlerinizi kaydedin ve harcama alışkanlıklarınızı analiz edin.
                    </p>
                    <Button 
                      as={Link} 
                      to="/expenses/new" 
                      variant="danger" 
                      size="lg"
                      className="quick-action-btn"
                    >
                      💸 Gider Ekle
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Setup Cards */}
          <Row className="mb-5">
            <Col lg={6} className="mb-4">
              <Card className="dashboard-card h-100">
                <Card.Header>
                  <h5 className="mb-0">🏦 Hesap Kurulumu</h5>
                </Card.Header>
                <Card.Body>
                  <p className="text-muted mb-3">
                    Daha detaylı takip için banka hesaplarınızı ekleyin ve bakiyelerinizi takip edin.
                  </p>
                  <Button 
                    as={Link} 
                    to="/accounts/new" 
                    variant="outline-info" 
                    size="lg"
                    className="w-100"
                  >
                    🏦 Hesap Ekle
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6} className="mb-4">
              <Card className="dashboard-card h-100">
                <Card.Header>
                  <h5 className="mb-0">💳 Kredi Kartı Kurulumu</h5>
                </Card.Header>
                <Card.Body>
                  <p className="text-muted mb-3">
                    Kredi kartlarınızı ekleyin ve limitlerinizi gerçek zamanlı takip edin.
                  </p>
                  <Button 
                    as={Link} 
                    to="/credit-cards/new" 
                    variant="outline-warning" 
                    size="lg"
                    className="w-100"
                  >
                    💳 Kredi Kartı Ekle
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Features */}
          <Card className="dashboard-card mb-5">
            <Card.Header>
              <h5 className="mb-0">✨ Uygulama Özellikleri</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4} className="text-center mb-4">
                  <div className="feature-icon mb-3">
                    <i className="fas fa-chart-line fa-3x text-primary"></i>
                  </div>
                  <h6 className="fw-bold">Detaylı Analiz</h6>
                  <small className="text-muted">
                    Gelir-gider trendlerinizi ve kategori bazında dağılımlarınızı görün
                  </small>
                </Col>
                <Col md={4} className="text-center mb-4">
                  <div className="feature-icon mb-3">
                    <i className="fas fa-credit-card fa-3x text-success"></i>
                  </div>
                  <h6 className="fw-bold">Limit Takibi</h6>
                  <small className="text-muted">
                    Kredi kartı ve hesap limitlerinizi gerçek zamanlı takip edin
                  </small>
                </Col>
                <Col md={4} className="text-center mb-4">
                  <div className="feature-icon mb-3">
                    <i className="fas fa-home fa-3x text-warning"></i>
                  </div>
                  <h6 className="fw-bold">Ev Kirası Detayları</h6>
                  <small className="text-muted">
                    Kira, aidat, vergi ve sigorta masraflarını ayrı ayrı kaydedin
                  </small>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Refresh Button */}
          <div className="text-center mb-4">
            <Button 
              variant="outline-primary" 
              size="lg"
              onClick={fetchDashboardData}
              disabled={loading}
              className="px-4"
            >
              {loading ? 'Yenileniyor...' : '🔄 Verileri Yenile'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard verilerini güvenli bir şekilde al
  const {
    totalAccounts = 0,
    totalCreditCards = 0,
    totalBalance = 0,
    totalCreditLimit = 0,
    availableCreditLimit = 0,
    totalIncome = 0,
    totalExpense = 0,
    netIncome = 0,
    foodCardIncome = 0,
    recentIncomes = [],
    recentExpenses = [],
    recentAccounts = [],
    recentCreditCards = []
  } = dashboardData || {};

  const savingsRate = totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : 0;

  return (
    <div className="dashboard-page">
      <div className="container-fluid">
        {/* Header Section */}
        <div className="dashboard-header mb-4">
          <div>
            <h1 className="dashboard-title">{getGreeting()}! 👋</h1>
            <p className="dashboard-subtitle">{getCurrentMonth()} Finansal Durumunuz</p>
          </div>
          <div className="dashboard-actions">
            <Button 
              variant="outline-primary" 
              onClick={fetchDashboardData}
              disabled={loading}
              size="sm"
            >
              {loading ? 'Yenileniyor...' : '🔄 Yenile'}
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="dashboard-card mb-4">
          <Card.Header>
            <h5 className="mb-0">🚀 Hızlı İşlemler</h5>
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

        {/* Financial Overview Cards */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-4">
            <Card className="stat-card stat-card-income">
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon">
                  <i className="fas fa-arrow-up"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-label">Toplam Gelir</div>
                  <div className="stat-value text-success">{formatCurrency(totalIncome)}</div>
                  <Badge bg="success" className="stat-badge">
                    Bu Ay
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <Card className="stat-card stat-card-expense">
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon">
                  <i className="fas fa-arrow-down"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-label">Toplam Gider</div>
                  <div className="stat-value text-danger">{formatCurrency(totalExpense)}</div>
                  <Badge bg="danger" className="stat-badge">
                    Bu Ay
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <Card className={`stat-card ${netIncome >= 0 ? 'stat-card-net' : 'stat-card-expense'}`}>
              <Card.Body className="d-flex align-items-center">
                <div className="stat-icon">
                  <i className={`fas ${netIncome >= 0 ? 'fa-chart-line' : 'fa-chart-line-down'}`}></i>
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
                  <i className="fas fa-piggy-bank"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-label">Tasarruf Oranı</div>
                  <div className="stat-value text-warning">%{savingsRate}</div>
                  <Badge bg="warning" className="stat-badge">
                    Hedef: %20
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Accounts & Credit Cards Overview */}
        <Row className="mb-4">
          <Col lg={6} className="mb-4">
            <Card className="dashboard-card h-100">
              <Card.Header>
                <h5 className="mb-0">🏦 Hesap Özeti</h5>
              </Card.Header>
              <Card.Body>
                <div className="accounts-summary">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fw-bold">Toplam Hesap:</span>
                    <Badge bg="primary" className="fs-6">{totalAccounts}</Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fw-bold">Toplam Bakiye:</span>
                    <span className="fw-bold text-success fs-5">{formatCurrency(totalBalance)}</span>
                  </div>
                  {recentAccounts && recentAccounts.length > 0 && (
                    <div className="mt-3">
                      <h6 className="text-muted mb-2">Son Eklenen Hesaplar:</h6>
                      {recentAccounts.slice(0, 3).map((account) => (
                        <div key={account.id} className="account-item">
                          <div className="account-info">
                            <div className="account-name">{account.account_name || 'İsimsiz Hesap'}</div>
                            <div className="account-bank">{account.bank_name || 'Banka Yok'}</div>
                          </div>
                          <div className="account-balance">
                            <div className="balance-amount">{formatCurrency(account.current_balance || 0)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="d-grid gap-2 mt-3">
                    <Button 
                      as={Link} 
                      to="/accounts" 
                      variant="outline-info" 
                      size="sm"
                    >
                      📋 Tüm Hesapları Görüntüle
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6} className="mb-4">
            <Card className="dashboard-card h-100">
              <Card.Header>
                <h5 className="mb-0">💳 Kredi Kartı Özeti</h5>
              </Card.Header>
              <Card.Body>
                <div className="credit-cards-summary">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fw-bold">Toplam Kart:</span>
                    <Badge bg="warning" className="fs-6">{totalCreditCards}</Badge>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fw-bold">Toplam Limit:</span>
                    <span className="fw-bold text-warning fs-5">{formatCurrency(totalCreditLimit)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fw-bold">Kullanılabilir:</span>
                    <span className="fw-bold text-success fs-5">{formatCurrency(availableCreditLimit)}</span>
                  </div>
                  {totalCreditLimit > 0 && (
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <small className="text-muted">Limit Kullanımı</small>
                        <small className="text-muted">
                          %{((totalCreditLimit - availableCreditLimit) / totalCreditLimit * 100).toFixed(1)}
                        </small>
                      </div>
                      <ProgressBar 
                        variant="warning" 
                        now={(totalCreditLimit - availableCreditLimit) / totalCreditLimit * 100}
                        className="usage-progress"
                      />
                    </div>
                  )}
                  {recentCreditCards && recentCreditCards.length > 0 && (
                    <div className="mt-3">
                      <h6 className="text-muted mb-2">Son Eklenen Kartlar:</h6>
                      {recentCreditCards.slice(0, 3).map((card) => (
                        <div key={card.id} className="credit-card-item">
                          <div className="card-info">
                            <div className="card-name">{card.card_name || 'İsimsiz Kart'}</div>
                            <div className="card-limit">{card.bank_name || 'Banka Yok'}</div>
                          </div>
                          <div className="card-usage">
                            <div className="usage-bar">
                              <ProgressBar 
                                variant="warning" 
                                now={(card.credit_limit - card.remaining_limit) / card.credit_limit * 100}
                                className="usage-progress"
                              />
                            </div>
                            <div className="usage-text">
                              {formatCurrency(card.remaining_limit || 0)} kalan
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="d-grid gap-2 mt-3">
                    <Button 
                      as={Link} 
                      to="/credit-cards" 
                      variant="outline-warning" 
                      size="sm"
                    >
                      📋 Tüm Kartları Görüntüle
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recent Transactions */}
        <Row className="mb-4">
          <Col lg={6} className="mb-4">
            <Card className="dashboard-card h-100">
              <Card.Header>
                <h5 className="mb-0">💰 Son Gelirler</h5>
              </Card.Header>
              <Card.Body>
                <div className="transactions-list">
                  {recentIncomes && recentIncomes.length > 0 ? (
                    <>
                      {recentIncomes.slice(0, 5).map((income) => (
                        <div key={income.id} className="transaction-item">
                          <div className="transaction-icon">
                            <i className="fas fa-arrow-up text-success"></i>
                          </div>
                          <div className="transaction-details">
                            <div className="transaction-title">{income.title || 'Başlıksız Gelir'}</div>
                            <div className="transaction-category">
                              {getIncomeTypeLabel(income.income_type || 'other')} • {income.source || 'Bilinmiyor'}
                            </div>
                            <div className="transaction-date">
                              {income.income_date ? new Date(income.income_date).toLocaleDateString('tr-TR') : 'Tarih Yok'}
                            </div>
                          </div>
                          <div className="transaction-amount">
                            <div className="amount-success">{formatCurrency(income.amount || 0)}</div>
                          </div>
                        </div>
                      ))}
                      <div className="text-center mt-3">
                        <Button 
                          as={Link} 
                          to="/incomes" 
                          variant="outline-success" 
                          size="sm"
                        >
                          📋 Tüm Gelirleri Görüntüle
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted py-4">
                      <i className="fas fa-inbox fa-3x mb-3"></i>
                      <p>Henüz gelir kaydı bulunmuyor</p>
                      <Button 
                        as={Link} 
                        to="/incomes/new" 
                        variant="success" 
                        size="sm"
                      >
                        💰 İlk Geliri Ekle
                      </Button>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={6} className="mb-4">
            <Card className="dashboard-card h-100">
              <Card.Header>
                <h5 className="mb-0">💸 Son Giderler</h5>
              </Card.Header>
              <Card.Body>
                <div className="transactions-list">
                  {recentExpenses && recentExpenses.length > 0 ? (
                    <>
                      {recentExpenses.slice(0, 5).map((expense) => (
                        <div key={expense.id} className="transaction-item">
                          <div className="transaction-icon">
                            <i className="fas fa-arrow-down text-danger"></i>
                          </div>
                          <div className="transaction-details">
                            <div className="transaction-title">{expense.title || 'Başlıksız Gider'}</div>
                            <div className="transaction-category">
                              {expense.category_name || 'Kategori Yok'} • {getPaymentMethodLabel(expense.payment_method || 'cash')}
                            </div>
                            <div className="transaction-date">
                              {expense.created_at ? new Date(expense.created_at).toLocaleDateString('tr-TR') : 'Tarih Yok'}
                            </div>
                          </div>
                          <div className="transaction-amount">
                            <div className="amount-danger">{formatCurrency(expense.amount || 0)}</div>
                          </div>
                        </div>
                      ))}
                      <div className="text-center mt-3">
                        <Button 
                          as={Link} 
                          to="/expenses" 
                          variant="outline-danger" 
                          size="sm"
                        >
                          📋 Tüm Giderleri Görüntüle
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted py-4">
                      <i className="fas fa-shopping-cart fa-3x mb-3"></i>
                      <p>Henüz gider kaydı bulunmuyor</p>
                      <Button 
                        as={Link} 
                        to="/expenses/new" 
                        variant="danger" 
                        size="sm"
                      >
                        💸 İlk Gideri Ekle
                      </Button>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Analytics & Reports */}
        <Card className="dashboard-card mb-4">
          <Card.Header>
            <h5 className="mb-0">📊 Detaylı Analiz & Raporlar</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={8}>
                <p className="text-muted mb-3">
                  Gelir-gider trendlerinizi, kategori bazında dağılımlarınızı ve finansal sağlığınızı 
                  detaylı olarak inceleyin. Grafikler ve istatistiklerle finansal durumunuzu analiz edin.
                </p>
                <div className="d-flex gap-2 flex-wrap">
                  <Button 
                    as={Link} 
                    to="/analytics" 
                    variant="primary" 
                    size="lg"
                    className="px-4"
                  >
                    📈 Detaylı Analizi Görüntüle
                  </Button>
                  <Button 
                    as={Link} 
                    to="/reports" 
                    variant="outline-primary" 
                    size="lg"
                    className="px-4"
                  >
                    📋 Raporları İndir
                  </Button>
                </div>
              </Col>
              <Col md={4} className="text-center">
                <div className="chart-placeholder">
                  <div className="chart-container">
                    <div className="chart-bars">
                      <div className="chart-bar-group">
                        <div className="chart-bar income" style={{ height: '60%' }}></div>
                        <div className="chart-label">Gelir</div>
                      </div>
                      <div className="chart-bar-group">
                        <div className="chart-bar expense" style={{ height: '40%' }}></div>
                        <div className="chart-label">Gider</div>
                      </div>
                    </div>
                    <div className="chart-legend">
                      <div className="legend-item">
                        <div className="legend-color income"></div>
                        <span>Gelir</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-color expense"></div>
                        <span>Gider</span>
                      </div>
                    </div>
                  </div>
                </div>
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

export default Dashboard;