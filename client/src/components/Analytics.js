import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, ProgressBar, Alert, Spinner, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaCheckCircle, FaExclamationTriangle, FaLightbulb, FaRobot } from 'react-icons/fa';
import BackButton from './BackButton';

const Analytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [generatingAnalysis, setGeneratingAnalysis] = useState(false);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/analytics');
            if (response.data.success) {
                setAnalytics(response.data.analytics);
            }
        } catch (error) {
            setError('Analiz verileri yüklenirken hata oluştu');
            console.error('Analiz hatası:', error);
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

    const formatPercentage = (value, total) => {
        if (!total || total === 0) return '0%';
        return `${((value / total) * 100).toFixed(1)}%`;
    };

    const getCategoryColor = (color) => {
        return color || '#007bff';
    };

    // AI Destekli Analiz Notu Oluştur
    const generateAIAnalysis = async () => {
        if (!analytics) return;
        
        setGeneratingAnalysis(true);
        
        try {
            // Finansal duruma göre AI analizi oluştur
            const analysis = createFinancialAnalysis();
            setAiAnalysis(analysis);
        } catch (error) {
            console.error('AI analiz hatası:', error);
        } finally {
            setGeneratingAnalysis(false);
        }
    };

    // Finansal duruma göre analiz oluştur
    const createFinancialAnalysis = () => {
        const { totalIncome, totalExpense, netIncome, categoryExpenses, availableLimits } = analytics;
        
        let analysis = {
            summary: '',
            recommendations: [],
            warnings: [],
            positivePoints: [],
            category: ''
        };

        // Net gelir durumuna göre kategori belirle
        if (netIncome > 0) {
            if (netIncome > totalIncome * 0.3) {
                analysis.category = 'excellent';
                analysis.summary = 'Mükemmel! Finansal durumunuz çok iyi.';
            } else {
                analysis.category = 'good';
                analysis.summary = 'İyi! Finansal durumunuz dengeli.';
            }
        } else if (netIncome === 0) {
            analysis.category = 'balanced';
            analysis.summary = 'Dengeli! Gelir ve giderleriniz eşit.';
        } else {
            if (Math.abs(netIncome) > totalIncome * 0.3) {
                analysis.category = 'critical';
                analysis.summary = 'Dikkat! Finansal durumunuz kritik.';
            } else {
                analysis.category = 'warning';
                analysis.summary = 'Uyarı! Gelirleriniz giderlerinizden az.';
            }
        }

        // Gelir-gider oranı analizi
        const expenseRatio = totalExpense / totalIncome;
        if (expenseRatio > 0.9) {
            analysis.warnings.push('Giderleriniz gelirlerinizin %90\'ından fazla. Tasarruf yapmanız gerekiyor.');
        } else if (expenseRatio < 0.6) {
            analysis.positivePoints.push('Mükemmel tasarruf oranı! Gelirlerinizin %40\'ından fazlasını tasarruf ediyorsunuz.');
        }

        // Kategori bazında öneriler
        if (categoryExpenses && categoryExpenses.length > 0) {
            const topExpense = categoryExpenses[0];
            const topExpenseRatio = (topExpense.total / totalExpense) * 100;
            
            if (topExpenseRatio > 40) {
                analysis.warnings.push(`${topExpense.name} kategorisinde çok yüksek harcama (${topExpenseRatio.toFixed(1)}%). Bu alanda tasarruf yapmayı düşünün.`);
            }
        }

        // Limit kullanım analizi
        if (availableLimits && availableLimits.length > 0) {
            availableLimits.forEach(limit => {
                if (limit.type === 'credit_cards' && limit.total_available < limit.total_available * 0.2) {
                    analysis.warnings.push('Kredi kartı limitleriniz kritik seviyede. Harcamalarınızı kontrol edin.');
                }
            });
        }

        // Genel öneriler
        if (analysis.category === 'excellent' || analysis.category === 'good') {
            analysis.recommendations.push('Mevcut tasarruf alışkanlığınızı sürdürün.');
            analysis.recommendations.push('Yatırım yapmayı düşünebilirsiniz.');
            analysis.recommendations.push('Acil durum fonu oluşturmayı hedefleyin.');
        } else if (analysis.category === 'warning' || analysis.category === 'critical') {
            analysis.recommendations.push('Giderlerinizi detaylı analiz edin.');
            analysis.recommendations.push('Gereksiz harcamaları azaltın.');
            analysis.recommendations.push('Ek gelir kaynakları arayın.');
            analysis.recommendations.push('Bütçe planı yapın.');
        }

        return analysis;
    };

    // Alert variant'ını belirle
    const getAlertVariant = (category) => {
        switch (category) {
            case 'excellent':
                return 'success';
            case 'good':
                return 'info';
            case 'balanced':
                return 'warning';
            case 'warning':
                return 'warning';
            case 'critical':
                return 'danger';
            default:
                return 'info';
        }
    };

    if (loading) {
        return (
            <div className="container mt-4 text-center">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Yükleniyor...</span>
                </Spinner>
                <p className="mt-3">Analiz verileri yükleniyor...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-4">
                <Alert variant="danger">
                    <Alert.Heading>Hata!</Alert.Heading>
                    <p>{error}</p>
                    <Button variant="outline-danger" onClick={fetchAnalytics}>
                        🔄 Tekrar Dene
                    </Button>
                </Alert>
            </div>
        );
    }

    // Veri yoksa hoş geldin mesajı göster
    if (!analytics || (analytics.totalIncome === 0 && analytics.totalExpense === 0)) {
        return (
            <div className="container mt-4">
                <div className="text-center mb-5">
                    <h1 className="display-4 text-primary">📊 Analiz Sayfası</h1>
                    <p className="lead text-muted">
                        Finansal analizlerinizi görmek için önce gelir ve gider verilerinizi ekleyin.
                    </p>
                </div>

                {/* Hızlı Başlangıç */}
                <Row className="mb-4">
                    <Col md={6}>
                        <Card className="text-center border-success h-100 shadow">
                            <Card.Body>
                                <h2 className="text-success mb-3">💰</h2>
                                <h4>İlk Gelirinizi Ekleyin</h4>
                                <p className="text-muted">
                                    Maaş, kira geliri veya diğer gelirlerinizi kaydedin.
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
                                    Ev kirası, faturalar, market alışverişi gibi giderlerinizi kaydedin.
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

                {/* Özellikler */}
                <Row className="mb-4">
                    <Col md={12}>
                        <Card className="shadow">
                            <Card.Header className="bg-info text-white">
                                <h5 className="mb-0">✨ Analiz Özellikleri</h5>
                            </Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={4} className="text-center mb-3">
                                        <h4 className="text-primary">📈</h4>
                                        <h6>Aylık Trendler</h6>
                                        <small className="text-muted">
                                            Gelir-gider trendlerinizi aylık olarak takip edin
                                        </small>
                                    </Col>
                                    <Col md={4} className="text-center mb-3">
                                        <h4 className="text-warning">📊</h4>
                                        <h6>Kategori Analizi</h6>
                                        <small className="text-muted">
                                            Giderlerinizi kategorilere göre analiz edin
                                        </small>
                                    </Col>
                                    <Col md={4} className="text-center mb-3">
                                        <h4 className="text-success">💳</h4>
                                        <h6>Limit Takibi</h6>
                                        <small className="text-muted">
                                            Kullanılabilir limitlerinizi gerçek zamanlı görün
                                        </small>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Dashboard'a Dön */}
                <div className="text-center mb-4">
                    <Button 
                        as={Link} 
                        to="/" 
                        variant="outline-primary" 
                        size="lg"
                        className="px-4"
                    >
                        🏠 Dashboard'a Dön
                    </Button>
                </div>
            </div>
        );
    }

    const { totalIncome, totalExpense, netIncome, categoryExpenses, monthlyTrend, availableLimits } = analytics;

    return (
        <div className="container mt-4">
            <BackButton />
            <h2 className="mb-4">📊 Finansal Analiz</h2>

            {/* Genel Özet */}
            <Row className="mb-4">
                <Col md={4}>
                    <Card className="text-center border-success h-100">
                        <Card.Body>
                            <h3 className="text-success">💰</h3>
                            <h5>Toplam Gelir</h5>
                            <h3 className="text-success">{formatCurrency(totalIncome)}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-center border-danger h-100">
                        <Card.Body>
                            <h3 className="text-danger">💸</h3>
                            <h5>Toplam Gider</h5>
                            <h3 className="text-danger">{formatCurrency(totalExpense)}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
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
            </Row>

            {/* AI Destekli Analiz Notu */}
            <Row className="mb-4">
                <Col md={12}>
                    <Card className="shadow">
                        <Card.Header className="bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                            <div className="d-flex justify-content-between align-items-center">
                                                                    <h5 className="mb-0"><FaRobot className="me-2" />AI Destekli Finansal Analiz</h5>
                                <Button 
                                    variant="light" 
                                    size="sm"
                                    onClick={generateAIAnalysis}
                                    disabled={generatingAnalysis}
                                >
                                    {generatingAnalysis ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Analiz Oluşturuluyor...
                                        </>
                                    ) : (
                                        '🧠 Analiz Notu Al'
                                    )}
                                </Button>
                            </div>
                        </Card.Header>
                        <Card.Body>
                            {!aiAnalysis ? (
                                <div className="text-center py-4">
                                    <h6 className="text-muted mb-3">AI destekli finansal analiz notu almak için butona tıklayın</h6>
                                    <p className="text-muted small">
                                        Finansal durumunuz analiz edilecek ve size özel öneriler sunulacak
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    {/* Özet */}
                                    <div className={`alert alert-${getAlertVariant(aiAnalysis.category)} mb-3`}>
                                        <h6 className="mb-1">📋 Finansal Durum Özeti</h6>
                                        <p className="mb-0 fw-bold">{aiAnalysis.summary}</p>
                                    </div>

                                    {/* Pozitif Noktalar */}
                                    {aiAnalysis.positivePoints.length > 0 && (
                                        <div className="mb-3">
                                            <h6 className="text-success mb-2">✅ Güçlü Yönleriniz</h6>
                                            <ul className="list-unstyled">
                                                {aiAnalysis.positivePoints.map((point, index) => (
                                                    <li key={index} className="text-success mb-1">
                                                        <FaCheckCircle className="me-2" />
                                                        {point}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Uyarılar */}
                                    {aiAnalysis.warnings.length > 0 && (
                                        <div className="mb-3">
                                            <h6 className="text-warning mb-2">⚠️ Dikkat Edilmesi Gerekenler</h6>
                                            <ul className="list-unstyled">
                                                {aiAnalysis.warnings.map((warning, index) => (
                                                    <li key={index} className="text-warning mb-1">
                                                        <FaExclamationTriangle className="me-2" />
                                                        {warning}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Öneriler */}
                                    {aiAnalysis.recommendations.length > 0 && (
                                        <div className="mb-3">
                                            <h6 className="text-info mb-2">💡 Öneriler</h6>
                                            <ul className="list-unstyled">
                                                {aiAnalysis.recommendations.map((recommendation, index) => (
                                                    <li key={index} className="text-info mb-1">
                                                        <FaLightbulb className="me-2" />
                                                        {recommendation}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Yenile Butonu */}
                                    <div className="text-center mt-3">
                                        <Button 
                                            variant="outline-primary" 
                                            size="sm"
                                            onClick={generateAIAnalysis}
                                            disabled={generatingAnalysis}
                                        >
                                            🔄 Analizi Yenile
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Kullanılabilir Limitler */}
            <Row className="mb-4">
                <Col md={12}>
                    <Card className="shadow">
                        <Card.Header className="bg-info text-white">
                            <h5 className="mb-0">💳 Kullanılabilir Limitler</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                {availableLimits.map((limit, index) => (
                                    <Col md={6} key={index}>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <span className="fw-bold">
                                                {limit.type === 'accounts' ? '🏦 Hesaplar' : '💳 Kredi Kartları'}
                                            </span>
                                            <Badge bg="primary" className="fs-6">
                                                {limit.count} adet
                                            </Badge>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span>Kullanılabilir:</span>
                                            <span className="fw-bold text-success">
                                                {formatCurrency(limit.total_available)}
                                            </span>
                                        </div>
                                        <ProgressBar 
                                            now={limit.total_available > 0 ? 100 : 0} 
                                            variant="success" 
                                            className="mt-2"
                                        />
                                    </Col>
                                ))}
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Kategori Bazında Gider Dağılımı */}
            <Row className="mb-4">
                <Col md={12}>
                    <Card className="shadow">
                        <Card.Header className="bg-warning text-dark">
                            <h5 className="mb-0">📊 Kategori Bazında Gider Dağılımı</h5>
                        </Card.Header>
                        <Card.Body>
                            {categoryExpenses.length > 0 ? (
                                <Row>
                                    {categoryExpenses.map((category, index) => (
                                        <Col md={6} lg={4} key={index} className="mb-3">
                                            <Card className="border-0 shadow-sm">
                                                <Card.Body>
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <span className="fw-bold">{category.name}</span>
                                                        <Badge 
                                                            style={{ backgroundColor: getCategoryColor(category.color) }}
                                                        >
                                                            {formatPercentage(category.total, totalExpense)}
                                                        </Badge>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <span>Tutar:</span>
                                                        <span className="fw-bold text-danger">
                                                            {formatCurrency(category.total)}
                                                        </span>
                                                    </div>
                                                    <ProgressBar 
                                                        now={(category.total / totalExpense) * 100} 
                                                        style={{ backgroundColor: getCategoryColor(category.color) }}
                                                        className="mt-2"
                                                    />
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            ) : (
                                <Alert variant="info">
                                    Henüz gider kategorisi bulunmuyor. İlk giderinizi ekleyerek başlayın.
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Aylık Trend */}
            <Row className="mb-4">
                <Col md={12}>
                    <Card className="shadow">
                        <Card.Header className="bg-primary text-white">
                            <h5 className="mb-0">📈 Aylık Gelir-Gider Trendi</h5>
                        </Card.Header>
                        <Card.Body>
                            {monthlyTrend.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Ay</th>
                                                <th className="text-success">Gelir</th>
                                                <th className="text-danger">Gider</th>
                                                <th>Net</th>
                                                <th>Trend</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {monthlyTrend.map((month, index) => {
                                                const monthNet = month.income - month.expense;
                                                const monthName = new Date(month.month + '-01').toLocaleDateString('tr-TR', {
                                                    year: 'numeric',
                                                    month: 'long'
                                                });
                                                
                                                return (
                                                    <tr key={index}>
                                                        <td className="fw-bold">{monthName}</td>
                                                        <td className="text-success fw-bold">
                                                            {formatCurrency(month.income)}
                                                        </td>
                                                        <td className="text-danger fw-bold">
                                                            {formatCurrency(month.expense)}
                                                        </td>
                                                        <td className={`fw-bold ${monthNet >= 0 ? 'text-success' : 'text-danger'}`}>
                                                            {formatCurrency(monthNet)}
                                                        </td>
                                                        <td>
                                                            <Badge 
                                                                bg={monthNet >= 0 ? 'success' : 'danger'}
                                                                className="fs-6"
                                                            >
                                                                {monthNet >= 0 ? '📈 Pozitif' : '📉 Negatif'}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <Alert variant="info">
                                    Henüz aylık trend verisi bulunmuyor. Gelir ve gider ekleyerek trend verilerinizi oluşturun.
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Özet Kartları */}
            <Row className="mb-4">
                <Col md={6}>
                    <Card className="text-center border-info h-100">
                        <Card.Body>
                            <h3 className="text-info">💡</h3>
                            <h6>Tasarruf Oranı</h6>
                            <h4 className="text-info">
                                {totalIncome > 0 ? `${((netIncome / totalIncome) * 100).toFixed(1)}%` : '0%'}
                            </h4>
                            <small className="text-muted">
                                Gelirlerinizin ne kadarını tasarruf ediyorsunuz
                            </small>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="text-center border-warning h-100">
                        <Card.Body>
                            <h3 className="text-warning">⚖️</h3>
                            <h6>Gelir-Gider Oranı</h6>
                            <h4 className="text-warning">
                                {totalIncome > 0 ? `${((totalExpense / totalIncome) * 100).toFixed(1)}%` : '0%'}
                            </h4>
                            <small className="text-muted">
                                Gelirlerinizin ne kadarını harcıyorsunuz
                            </small>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Hızlı Erişim */}
            <Row className="mb-4">
                <Col md={12}>
                    <Card className="shadow">
                        <Card.Header className="bg-success text-white">
                            <h5 className="mb-0">🚀 Hızlı Erişim</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={4} className="mb-2">
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
                                <Col md={4} className="mb-2">
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
                                <Col md={4} className="mb-2">
                                    <Button 
                                        as={Link} 
                                        to="/" 
                                        variant="primary" 
                                        size="lg" 
                                        className="w-100"
                                    >
                                        🏠 Dashboard
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Yenile Butonu */}
            <div className="text-center mb-4">
                <button 
                    className="btn btn-primary btn-lg"
                    onClick={fetchAnalytics}
                    disabled={loading}
                >
                    {loading ? 'Yenileniyor...' : '🔄 Verileri Yenile'}
                </button>
            </div>
        </div>
    );
};

export default Analytics;
