import React, { useState, useEffect } from 'react';
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
import { RecycleBin } from './pages/RecycleBin';
import SplashScreen from './components/SplashScreen';

const AppContent: React.FC = () => {
  const { currentTab } = useApp();
  const [appReady, setAppReady] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);

  useEffect(() => {
    // Simulate application initialization (fetching settings, loading database keys, loading CSS)
    const initTimer = setTimeout(() => {
      setAppReady(true);
    }, 800); // 800ms minimum initialization time
    return () => clearTimeout(initTimer);
  }, []);

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
      case 'recycle_bin':
        return <RecycleBin />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      {!splashComplete && (
        <SplashScreen
          appReady={appReady}
          onComplete={() => setSplashComplete(true)}
        />
      )}
      <div
        style={{
          opacity: splashComplete ? 1 : 0,
          visibility: splashComplete ? 'visible' : 'hidden',
          transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1)',
          height: '100%',
          width: '100%',
        }}
      >
        <Layout>{renderActivePage()}</Layout>
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;

