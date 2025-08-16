import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardTitle, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalCreditCards: 0,
    totalBalance: 0,
    totalCreditLimit: 0,
    totalRemainingCredit: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/api/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Dashboard verileri yüklenemedi:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount || 0);
  };

  return (
    <div>
      <h2 className="mb-4 text-center">💰 Gelir Gider Takip Dashboard</h2>
      
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center h-100">
            <CardBody>
              <CardTitle>🏦 Toplam Hesaplar</CardTitle>
              <h3 className="text-primary">{stats.totalAccounts}</h3>
              <Button 
                variant="outline-primary" 
                onClick={() => navigate('/hesaplar')}
                className="mt-2"
              >
                Hesapları Görüntüle
              </Button>
            </CardBody>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="text-center h-100">
            <CardBody>
              <CardTitle>💳 Toplam Kredi Kartları</CardTitle>
              <h3 className="text-success">{stats.totalCreditCards}</h3>
              <Button 
                variant="outline-success" 
                onClick={() => navigate('/kredi-kartlari')}
                className="mt-2"
              >
                Kredi Kartlarını Görüntüle
              </Button>
            </CardBody>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="text-center h-100">
            <CardBody>
              <CardTitle>💵 Toplam Bakiye</CardTitle>
              <h3 className={stats.totalBalance >= 0 ? 'text-success' : 'text-danger'}>
                {formatCurrency(stats.totalBalance)}
              </h3>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="text-center h-100">
            <CardBody>
              <CardTitle>🎯 Toplam Kredi Limiti</CardTitle>
              <h4 className="text-info">{formatCurrency(stats.totalCreditLimit)}</h4>
            </CardBody>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="text-center h-100">
            <CardBody>
              <CardTitle>💳 Kalan Kredi</CardTitle>
              <h4 className="text-warning">{formatCurrency(stats.totalRemainingCredit)}</h4>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="text-center">
        <Col>
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => navigate('/hesap-ekle')}
            className="me-3"
          >
            🏦 Yeni Hesap Ekle
          </Button>
          <Button 
            variant="success" 
            size="lg" 
            onClick={() => navigate('/kredi-karti-ekle')}
          >
            💳 Yeni Kredi Kartı Ekle
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
