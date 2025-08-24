import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import SidebarNavigation from './components/SidebarNavigation';
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
import IncomeDetail from './components/IncomeDetail';
import IncomeEditForm from './components/IncomeEditForm';
import IncomesList from './components/IncomesList';
import ExpenseForm from './components/ExpenseForm';
import ExpensesList from './components/ExpensesList';
import Analytics from './components/Analytics';
import UserProfile from './components/UserProfile';
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
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <div className="App">
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin" element={<AdminPanel />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <div className="app-layout">
                  <SidebarNavigation />
                  <div className="main-content">
                    <Dashboard />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/accounts/new" element={
              <ProtectedRoute>
                <div className="app-layout">
                  <SidebarNavigation />
                  <div className="main-content">
                    <AccountForm />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/credit-cards/new" element={
              <ProtectedRoute>
                <div className="app-layout">
                  <SidebarNavigation />
                  <div className="main-content">
                    <CreditCardForm />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/accounts" element={
              <ProtectedRoute>
                <div className="app-layout">
                  <SidebarNavigation />
                  <div className="main-content">
                    <AccountsList />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/credit-cards" element={
              <ProtectedRoute>
                <div className="app-layout">
                  <SidebarNavigation />
                  <div className="main-content">
                    <CreditCardsList />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/incomes" element={
              <ProtectedRoute>
                <div className="app-layout">
                  <SidebarNavigation />
                  <div className="main-content">
                    <IncomesList />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/incomes/new" element={
              <ProtectedRoute>
                <div className="app-layout">
                  <SidebarNavigation />
                  <div className="main-content">
                    <IncomeForm />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/incomes/:id" element={
              <ProtectedRoute>
                <div className="app-layout">
                  <SidebarNavigation />
                  <div className="main-content">
                    <IncomeDetail />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/incomes/:id/edit" element={
              <ProtectedRoute>
                <div className="app-layout">
                  <SidebarNavigation />
                  <div className="main-content">
                    <IncomeEditForm />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/expenses" element={
              <ProtectedRoute>
                <div className="app-layout">
                  <SidebarNavigation />
                  <div className="main-content">
                    <ExpensesList />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/expenses/new" element={
              <ProtectedRoute>
                <div className="app-layout">
                  <SidebarNavigation />
                  <div className="main-content">
                    <ExpenseForm />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <div className="app-layout">
                  <SidebarNavigation />
                  <div className="main-content">
                    <Analytics />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <div className="app-layout">
                  <SidebarNavigation />
                  <div className="main-content">
                    <UserProfile />
                  </div>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
