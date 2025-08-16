import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import AccountForm from './components/AccountForm';
import CreditCardForm from './components/CreditCardForm';
import AccountsList from './components/AccountsList';
import CreditCardsList from './components/CreditCardsList';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <div className="container mt-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/hesap-ekle" element={<AccountForm />} />
            <Route path="/kredi-karti-ekle" element={<CreditCardForm />} />
            <Route path="/hesaplar" element={<AccountsList />} />
            <Route path="/kredi-kartlari" element={<CreditCardsList />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
