import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

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
      }
    } catch (error) {
      setError('Dashboard verileri yüklenirken hata oluştu');
      console.error('Dashboard hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="container mt-4 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Yükleniyor...</span>
        </Spinner>
        <p className="mt-3">Dashboard verileri yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <Alert variant="danger">
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
      <div className="container mt-4">
        <div className="text-center mb-5">
          <h1 className="display-4 text-primary">🎉 Hoş Geldiniz!</h1>
          <p className="lead text-muted">
            Gelir-Gider Takip uygulamanıza hoş geldiniz. İlk gelir ve giderlerinizi ekleyerek başlayın.
          </p>
        </div>

        {/* Hızlı Başlangıç Kartları */}
        <Row className="mb-4">
          <Col md={6}>
            <Card className="text-center border-success h-100 shadow">
              <Card.Body>
                <h2 className="text-success mb-3">💰</h2>
                <h4>İlk Gelirinizi Ekleyin</h4>
                <p className="text-muted">
                  Maaş, kira geliri veya diğer gelirlerinizi kaydedin ve finansal durumunuzu takip etmeye başlayın.
                </p>
                <Button 
                  as={Link} 
                  to="/incomes/new" 
                  variant="success" 
                  size="lg"
                  className="px-4"
                >
                  💰 Gelir Ekle
                </Button>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="text-center border-danger h-100 shadow">
              <Card.Body>
                <h2 className="text-danger mb-3">💸</h2>
                <h4>İlk Giderinizi Ekleyin</h4>
                <p className="text-muted">
                  Ev kirası, faturalar, market alışverişi gibi giderlerinizi kaydedin ve harcama alışkanlıklarınızı analiz edin.
                </p>
                <Button 
                  as={Link} 
                  to="/expenses/new" 
                  variant="danger" 
                  size="lg"
                  className="px-4"
                >
                  💸 Gider Ekle
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Hesap ve Kredi Kartı Kurulumu */}
        <Row className="mb-4">
          <Col md={12}>
            <Card className="shadow">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0">🏦 Hesap ve Kredi Kartı Kurulumu</h5>
              </Card.Header>
              <Card.Body>
                <p className="text-muted mb-3">
                  Daha detaylı takip için banka hesaplarınızı ve kredi kartlarınızı ekleyin.
                </p>
                <Row>
                  <Col md={6}>
                    <Button 
                      as={Link} 
                      to="/accounts/new" 
                      variant="outline-info" 
                      size="lg"
                      className="w-100 mb-2"
                    >
                      🏦 Hesap Ekle
                    </Button>
                  </Col>
                  <Col md={6}>
                    <Button 
                      as={Link} 
                      to="/credit-cards/new" 
                      variant="outline-warning" 
                      size="lg"
                      className="w-100 mb-2"
                    >
                      💳 Kredi Kartı Ekle
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Özellikler */}
        <Row className="mb-4">
          <Col md={12}>
            <Card className="shadow">
              <Card.Header className="bg-dark text-white">
                <h5 className="mb-0">✨ Uygulama Özellikleri</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4} className="text-center mb-3">
                    <h4 className="text-primary">📊</h4>
                    <h6>Detaylı Analiz</h6>
                    <small className="text-muted">
                      Gelir-gider trendlerinizi ve kategori bazında dağılımlarınızı görün
                    </small>
                  </Col>
                  <Col md={4} className="text-center mb-3">
                    <h4 className="text-success">💳</h4>
                    <h6>Limit Takibi</h6>
                    <small className="text-muted">
                      Kredi kartı ve hesap limitlerinizi gerçek zamanlı takip edin
                    </small>
                  </Col>
                  <Col md={4} className="text-center mb-3">
                    <h4 className="text-warning">🏠</h4>
                    <h6>Ev Kirası Detayları</h6>
                    <small className="text-muted">
                      Kira, aidat, vergi ve sigorta masraflarını ayrı ayrı kaydedin
                    </small>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Yenile Butonu */}
        <div className="text-center mb-4">
          <Button 
            variant="outline-primary" 
            size="lg"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            {loading ? 'Yenileniyor...' : '🔄 Verileri Yenile'}
          </Button>
        </div>
      </div>
    );
  }

  const {
    totalAccounts,
    totalCreditCards,
    totalBalance,
    totalCreditLimit,
    availableCreditLimit,
    totalIncome,
    totalExpense,
    netIncome,
    foodCardIncome,
    recentIncomes,
    recentExpenses,
    recentAccounts,
    recentCreditCards
  } = dashboardData;

  return (
    <div className="container mt-4">
      <h1 className="mb-4">💰 Gelir-Gider Takip Dashboard</h1>

      {/* Hızlı Erişim Butonları */}
      <Row className="mb-4">
        <Col md={12}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
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
                    className="w-100"
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
                    className="w-100"
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
                    className="w-100"
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
                    className="w-100"
                  >
                    💳 Kredi Kartı Ekle
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Finansal Özet */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-success h-100">
            <Card.Body>
              <h3 className="text-success">💰</h3>
              <h5>Toplam Gelir</h5>
              <h3 className="text-success">{formatCurrency(totalIncome)}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-danger h-100">
            <Card.Body>
              <h3 className="text-danger">💸</h3>
              <h5>Toplam Gider</h5>
              <h3 className="text-danger">{formatCurrency(totalExpense)}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className={`text-center h-100 ${netIncome >= 0 ? 'border-success' : 'border-danger'}`}>
            <Card.Body>
              <h3 className={netIncome >= 0 ? 'text-success' : 'text-danger'}>
                {netIncome >= 0 ? '📈' : '📉'}
              </h3>
              <h5>Net Gelir</h5>
              <h3 className={netIncome >= 0 ? 'text-success' : 'text-danger'}>
                {formatCurrency(netIncome)}
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-warning h-100">
            <Card.Body>
              <h3 className="text-warning">🍽️</h3>
              <h5>Yemek Kartı Geliri</h5>
              <h3 className="text-warning">{formatCurrency(foodCardIncome)}</h3>
              <small className="text-muted">Sadece yemek giderlerinde kullanılır</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Hesap ve Kredi Kartı Özeti */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow h-100">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">🏦 Hesap Özeti</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Toplam Hesap:</span>
                <Badge bg="primary" className="fs-5">{totalAccounts}</Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Toplam Bakiye:</span>
                <span className="fw-bold text-success fs-5">{formatCurrency(totalBalance)}</span>
              </div>
              <div className="d-grid gap-2">
                <Button 
                  as={Link} 
                  to="/accounts" 
                  variant="outline-info" 
                  size="sm"
                >
                  📋 Tüm Hesapları Görüntüle
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow h-100">
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0">💳 Kredi Kartı Özeti</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Toplam Kart:</span>
                <Badge bg="warning" className="fs-5">{totalCreditCards}</Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Toplam Limit:</span>
                <span className="fw-bold text-warning fs-5">{formatCurrency(totalCreditLimit)}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Kullanılabilir:</span>
                <span className="fw-bold text-success fs-5">{formatCurrency(availableCreditLimit)}</span>
              </div>
              <div className="d-grid gap-2">
                <Button 
                  as={Link} 
                  to="/credit-cards" 
                  variant="outline-warning" 
                  size="sm"
                >
                  📋 Tüm Kartları Görüntüle
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Son İşlemler */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow h-100">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">💰 Son Gelirler</h5>
            </Card.Header>
            <Card.Body>
              {recentIncomes && recentIncomes.length > 0 ? (
                <div>
                  {recentIncomes.map((income) => (
                    <div key={income.id} className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
                      <div>
                        <div className="fw-bold">{income.title}</div>
                        <small className="text-muted">
                          {getIncomeTypeLabel(income.income_type)} • {income.source}
                        </small>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold text-success">{formatCurrency(income.amount)}</div>
                        <small className="text-muted">
                          {new Date(income.income_date).toLocaleDateString('tr-TR')}
                        </small>
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
                </div>
              ) : (
                <div className="text-center text-muted py-3">
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
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow h-100">
            <Card.Header className="bg-danger text-white">
              <h5 className="mb-0">💸 Son Giderler</h5>
            </Card.Header>
            <Card.Body>
              {recentExpenses && recentExpenses.length > 0 ? (
                <div>
                  {recentExpenses.map((expense) => (
                    <div key={expense.id} className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
                      <div>
                        <div className="fw-bold">{expense.title}</div>
                        <small className="text-muted">
                          {expense.category_name} • {getPaymentMethodLabel(expense.payment_method)}
                        </small>
                        {expense.category_name && (
                          <Badge 
                            bg="secondary" 
                            className="ms-2"
                            style={{ backgroundColor: expense.category_color || '#6c757d' }}
                          >
                            {expense.category_name}
                          </Badge>
                        )}
                      </div>
                      <div className="text-end">
                        <div className="fw-bold text-danger">{formatCurrency(expense.amount)}</div>
                        <small className="text-muted">
                          {new Date(expense.created_at).toLocaleDateString('tr-TR')}
                        </small>
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
                </div>
              ) : (
                <div className="text-center text-muted py-3">
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
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Son Hesap ve Kredi Kartı İşlemleri */}
      <Row className="mb-4">
        <Col md={6}>
          <Card className="shadow h-100">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">🏦 Son Hesap İşlemleri</h5>
            </Card.Header>
            <Card.Body>
              {recentAccounts && recentAccounts.length > 0 ? (
                <div>
                  {recentAccounts.map((account) => (
                    <div key={account.id} className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
                      <div>
                        <div className="fw-bold">{account.account_name}</div>
                        <small className="text-muted">{account.bank_name}</small>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold text-info">{formatCurrency(account.current_balance)}</div>
                                                 <small className="text-muted">
                           {new Date(account.created_at).toLocaleDateString('tr-TR')}
                         </small>
                      </div>
                    </div>
                  ))}
                  <div className="text-center mt-3">
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
              ) : (
                <div className="text-center text-muted py-3">
                  <p>Henüz hesap kaydı bulunmuyor</p>
                  <Button 
                    as={Link} 
                    to="/accounts/new" 
                    variant="info" 
                    size="sm"
                  >
                    🏦 İlk Hesabı Ekle
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow h-100">
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0">💳 Son Kredi Kartı İşlemleri</h5>
            </Card.Header>
            <Card.Body>
              {recentCreditCards && recentCreditCards.length > 0 ? (
                <div>
                  {recentCreditCards.map((card) => (
                    <div key={card.id} className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
                      <div>
                        <div className="fw-bold">{card.card_name}</div>
                        <small className="text-muted">{card.bank_name}</small>
                      </div>
                      <div className="text-end">
                        <div className="fw-bold text-warning">{formatCurrency(card.remaining_limit)}</div>
                                                 <small className="text-muted">
                           {new Date(card.created_at).toLocaleDateString('tr-TR')}
                         </small>
                      </div>
                    </div>
                  ))}
                  <div className="text-center mt-3">
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
              ) : (
                <div className="text-center text-muted py-3">
                  <p>Henüz kredi kartı kaydı bulunmuyor</p>
                  <Button 
                    as={Link} 
                    to="/credit-cards/new" 
                    variant="warning" 
                    size="sm"
                  >
                    💳 İlk Kartı Ekle
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Detaylı Analiz */}
      <Row className="mb-4">
        <Col md={12}>
          <Card className="shadow">
            <Card.Header className="bg-dark text-white">
              <h5 className="mb-0">📊 Detaylı Analiz</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted mb-3">
                Gelir-gider trendlerinizi, kategori bazında dağılımlarınızı ve kullanılabilir limitlerinizi 
                detaylı olarak inceleyin.
              </p>
              <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                <Button 
                  as={Link} 
                  to="/analytics" 
                  variant="dark" 
                  size="lg"
                  className="px-4"
                >
                  📈 Detaylı Analizi Görüntüle
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Yenile Butonu */}
      <div className="text-center mb-4">
        <Button 
          variant="outline-primary" 
          size="lg"
          onClick={fetchDashboardData}
          disabled={loading}
        >
          {loading ? 'Yenileniyor...' : '🔄 Verileri Yenile'}
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
