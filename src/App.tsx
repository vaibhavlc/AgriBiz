import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
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

const AppContent: React.FC = () => {
  const { currentTab } = useApp();

  const renderActivePage = () => {
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
      default:
        return <Dashboard />;
    }
  };

  return <Layout>{renderActivePage()}</Layout>;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
