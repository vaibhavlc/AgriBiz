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

const AuthApp: React.FC = () => {
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot'>('login');

  switch (authView) {
    case 'register':
      return <Register onSwitchToLogin={() => setAuthView('login')} />;
    case 'forgot':
      return <ForgotPassword onSwitchToLogin={() => setAuthView('login')} />;
    case 'login':
    default:
      return (
        <Login
          onSwitchToRegister={() => setAuthView('register')}
          onSwitchToForgot={() => setAuthView('forgot')}
        />
      );
  }
};

const AppContent: React.FC = () => {
  const { currentTab, setCurrentTab } = useApp();
  const { hasPermission } = useAuth();

  // Guarantee initial scroll position at top right below header on app load
  useEffect(() => {
    window.scrollTo(0, 0);
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
