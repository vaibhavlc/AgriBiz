import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  FileSpreadsheet,
  ShoppingBag,
  Package,
  Users,
  Truck,
  IndianRupee,
  TrendingUp,
  Settings as SettingsIcon,
  X,
  Store,
  CheckCircle2,
  AlertCircle,
  Info,
  Search,
  Sun,
  Moon,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const {
    currentTab,
    setCurrentTab,
    settings,
    updateSettings,
    searchQuery,
    setSearchQuery,
    setViewInvoice,
    setViewPurchase,
    setViewCustomer,
    setViewSupplier,
    setIsCreatingInvoice,
    setIsEnteringPurchase,
    toast,
  } = useApp();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    setSearchQuery(''); // Clear search on page navigation
    setIsMobileSidebarOpen(false);

    // Reset drill-down views
    setViewInvoice(null);
    setViewPurchase(null);
    setViewCustomer(null);
    setViewSupplier(null);
    setIsCreatingInvoice(false);
    setIsEnteringPurchase(false);
  };

  const toggleTheme = () => {
    updateSettings({
      ...settings,
      theme: settings.theme === 'light' ? 'dark' : 'light',
    });
  };



  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Business Overview';
      case 'sales':
        return 'Sales Invoices';
      case 'purchases':
        return 'Supplier Purchases';
      case 'inventory':
        return 'Inventory Stock';
      case 'customers':
        return 'Customer Directory';
      case 'suppliers':
        return 'Supplier Directory';
      case 'payments':
        return 'Payments Ledger';
      case 'reports':
        return 'Business Reports';
      case 'settings':
        return 'Application Settings';
      default:
        return 'AgriBiz';
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'sales', label: 'Sales Invoices', icon: <FileSpreadsheet size={20} /> },
    { id: 'purchases', label: 'Purchases', icon: <ShoppingBag size={20} /> },
    { id: 'inventory', label: 'Inventory', icon: <Package size={20} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={20} /> },
    { id: 'suppliers', label: 'Suppliers', icon: <Truck size={20} /> },
    { id: 'payments', label: 'Payments Book', icon: <IndianRupee size={20} /> },
    { id: 'reports', label: 'Reports', icon: <TrendingUp size={20} /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={20} /> },
  ];

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <aside className={`sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div
            style={{
              background: 'var(--primary-light)',
              padding: '8px',
              borderRadius: '8px',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Store size={22} />
          </div>
          <div>
            <h1 className="sidebar-logo-text">AgriBiz</h1>
            <p className="sidebar-logo-sub">Dealer System</p>
          </div>
          {isMobileSidebarOpen && (
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <a
              key={item.id}
              className={`sidebar-item ${currentTab === item.id ? 'active' : ''}`}
              onClick={() => handleTabChange(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-business-name" title={settings.businessName}>
            {settings.businessName}
          </div>
          <div className="sidebar-fy">F.Y. {settings.financialYear}</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="header">
          {/* Left: Page Title */}
          <div className="header-left">
            <h2 className="header-title">{getPageTitle()}</h2>
          </div>

          {/* Middle: Centered Search Input with keyboard shortcut */}
          <div className="header-middle no-print">
            <div className="global-search-wrapper">
              <Search size={15} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder={`Search in ${getPageTitle()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="search-shortcut">Ctrl K</span>
            </div>
          </div>

          {/* Right: Actions (Theme Toggle & Profile) */}
          <div className="header-right no-print">
            {/* Theme Toggle */}
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={settings.theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {settings.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Profile Avatar */}
            <div className="profile-container">
              <div className="avatar-circle">KC</div>
              <div className="profile-details">
                <span className="profile-username">Kunal C.</span>
                <span className="profile-status">Owner</span>
              </div>
            </div>
          </div>
        </header>

        <main className="content-body">{children}</main>
      </div>

      {/* Global Toast Notification */}
      {toast && (
        <div className="toast-container no-print">
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' && <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />}
            {toast.type === 'error' && <AlertCircle size={18} style={{ color: 'var(--color-danger)' }} />}
            {toast.type === 'info' && <Info size={18} style={{ color: 'var(--color-info)' }} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
