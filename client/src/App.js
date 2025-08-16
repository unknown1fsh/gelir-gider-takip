import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import AccountForm from './components/AccountForm';
import CreditCardForm from './components/CreditCardForm';
import AccountsList from './components/AccountsList';
import CreditCardsList from './components/CreditCardsList';
import IncomeForm from './components/IncomeForm';
import ExpenseForm from './components/ExpenseForm';
import Analytics from './components/Analytics';
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
            <Route path="/accounts/new" element={<AccountForm />} />
            <Route path="/credit-cards/new" element={<CreditCardForm />} />
            <Route path="/accounts" element={<AccountsList />} />
            <Route path="/credit-cards" element={<CreditCardsList />} />
            <Route path="/incomes/new" element={<IncomeForm />} />
            <Route path="/expenses/new" element={<ExpenseForm />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
