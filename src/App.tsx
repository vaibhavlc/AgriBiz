import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { useAuth } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Sales } from './pages/Sales';
import { Purchases } from './pages/Purchases';
import { Inventory } from './pages/Inventory';
import { Customers } from './pages/Customers';
import { Suppliers } from './pages/Suppliers';
import { Payments } from './pages/Payments';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { RecycleBin } from './pages/RecycleBin';

import { VerifyEmail } from './pages/VerifyEmail';
import { ResetOwnerPin } from './pages/ResetOwnerPin';

const AuthApp: React.FC = () => {
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot' | 'verify' | 'reset-owner-pin'>('login');
  const [regStep, setRegStep] = useState<1 | 2 | 3 | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step');
    if (window.location.pathname.startsWith('/reset-owner-pin')) {
      setAuthView('reset-owner-pin');
    } else if (stepParam === '3') {
      setRegStep(3);
      setAuthView('register');
    } else if (params.get('view') === 'register' || params.has('step')) {
      setAuthView('register');
    } else if (params.has('token') || params.has('verifyToken') || window.location.pathname.startsWith('/verify-email')) {
      setAuthView('verify');
    }
  }, []);

  switch (authView) {
    case 'reset-owner-pin':
      return <ResetOwnerPin onSwitchToLogin={() => setAuthView('login')} />;
    case 'verify':
      return (
        <VerifyEmail
          onSwitchToLogin={() => setAuthView('login')}
          onSwitchToRegisterStep3={() => {
            setRegStep(3);
            setAuthView('register');
          }}
        />
      );
    case 'register':
      return <Register onSwitchToLogin={() => setAuthView('login')} initialStep={regStep} />;
    case 'forgot':
      return <ForgotPassword onSwitchToLogin={() => setAuthView('login')} />;
    case 'login':
    default:
      return (
        <Login
          onSwitchToRegister={() => {
            localStorage.removeItem('agribiz_verified_email');
            localStorage.removeItem('agribiz_reg_draft');
            sessionStorage.removeItem('agribiz_registration_session_id');
            setRegStep(1);
            setAuthView('register');
          }}
          onSwitchToForgot={() => setAuthView('forgot')}
        />
      );
  }
};

const AppContent: React.FC = () => {
  const { currentTab, setCurrentTab } = useApp();
  const { hasPermission } = useAuth();

  // Guarantee initial scroll position and clean up registration URL parameters on login
  useEffect(() => {
    window.scrollTo(0, 0);
    if (typeof window !== 'undefined' && (window.location.search.includes('token') || window.location.search.includes('step') || window.location.search.includes('view'))) {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // If user lacks permission for currentTab, automatically redirect to first permitted tab
  useEffect(() => {
    if (!hasPermission(currentTab)) {
      if (hasPermission('dashboard')) setCurrentTab('dashboard');
      else if (hasPermission('sales')) setCurrentTab('sales');
      else if (hasPermission('purchases')) setCurrentTab('purchases');
      else setCurrentTab('inventory');
    }
  }, [currentTab, hasPermission, setCurrentTab]);

  const renderActivePage = () => {
    if (!hasPermission(currentTab)) {
      return <Dashboard />;
    }

    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'sales':
        return <Sales />;
      case 'purchases':
        return <Purchases />;
      case 'inventory':
        return <Inventory />;
      case 'customers':
        return <Customers />;
      case 'suppliers':
        return <Suppliers />;
      case 'payments':
        return <Payments />;
      case 'expenses':
        return <Expenses />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      case 'recycle_bin':
        return <RecycleBin />;
      default:
        return <Dashboard />;
    }
  };

  return <Layout>{renderActivePage()}</Layout>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <ProtectedRoute fallback={<AuthApp />}>
          <AppContent />
        </ProtectedRoute>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
