import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import WelcomePage from './components/WelcomePage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import AdminPanel from './components/AdminPanel';
import Dashboard from './components/Dashboard';
import AccountForm from './components/AccountForm';
import CreditCardForm from './components/CreditCardForm';
import AccountsList from './components/AccountsList';
import CreditCardsList from './components/CreditCardsList';
import IncomeForm from './components/IncomeForm';
import IncomesList from './components/IncomesList';
import ExpenseForm from './components/ExpenseForm';
import ExpensesList from './components/ExpensesList';
import Analytics from './components/Analytics';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin" element={<AdminPanel />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <>
                  <Navigation />
                  <div className="container mt-4">
                    <Dashboard />
                  </div>
                </>
              </ProtectedRoute>
            } />
            <Route path="/accounts/new" element={
              <ProtectedRoute>
                <>
                  <Navigation />
                  <div className="container mt-4">
                    <AccountForm />
                  </div>
                </>
              </ProtectedRoute>
            } />
            <Route path="/credit-cards/new" element={
              <ProtectedRoute>
                <>
                  <Navigation />
                  <div className="container mt-4">
                    <CreditCardForm />
                  </div>
                </>
              </ProtectedRoute>
            } />
            <Route path="/accounts" element={
              <ProtectedRoute>
                <>
                  <Navigation />
                  <div className="container mt-4">
                    <AccountsList />
                  </div>
                </>
              </ProtectedRoute>
            } />
            <Route path="/credit-cards" element={
              <ProtectedRoute>
                <>
                  <Navigation />
                  <div className="container mt-4">
                    <CreditCardsList />
                  </div>
                </>
              </ProtectedRoute>
            } />
            <Route path="/incomes" element={
              <ProtectedRoute>
                <>
                  <Navigation />
                  <div className="container mt-4">
                    <IncomesList />
                  </div>
                </>
              </ProtectedRoute>
            } />
            <Route path="/incomes/new" element={
              <ProtectedRoute>
                <>
                  <Navigation />
                  <div className="container mt-4">
                    <IncomeForm />
                  </div>
                </>
              </ProtectedRoute>
            } />
            <Route path="/expenses" element={
              <ProtectedRoute>
                <>
                  <Navigation />
                  <div className="container mt-4">
                    <ExpensesList />
                  </div>
                </>
              </ProtectedRoute>
            } />
            <Route path="/expenses/new" element={
              <ProtectedRoute>
                <>
                  <Navigation />
                  <div className="container mt-4">
                    <ExpenseForm />
                  </div>
                </>
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <>
                  <Navigation />
                  <div className="container mt-4">
                    <Analytics />
                  </div>
                </>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
