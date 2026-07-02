import React, { useState, useEffect, useRef } from 'react';
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
  Menu,
  Bell,
  ChevronDown,
  User,
  LogOut,
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
    showToast,
  } = useApp();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [userStatus, setUserStatus] = useState<'online' | 'busy' | 'away'>('online');
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Low Stock Alert',
      desc: 'Urea Fertilizer is below 15 bags.',
      time: '10 mins ago',
      type: 'warning',
    },
    {
      id: 2,
      title: 'New Invoice Created',
      desc: 'Invoice #INV-2026-042 generated for Vaibhav Agro.',
      time: '1 hour ago',
      type: 'success',
    },
    {
      id: 3,
      title: 'Payment Received',
      desc: 'Received ₹15,000 from Balaji Traders.',
      time: '3 hours ago',
      type: 'info',
    },
  ]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle clicking outside of dropdowns to close them
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.notification-wrapper')) {
        setIsNotificationOpen(false);
      }
      if (!target.closest('.profile-wrapper')) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

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
          {/* Left: Mobile Toggle & Page Title */}
          <div className="header-left">
            <button 
              className="menu-toggle no-print" 
              onClick={() => setIsMobileSidebarOpen(true)}
              title="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>
            <h2 className="header-title">{getPageTitle()}</h2>
          </div>

          {/* Middle: Global Search Input */}
          <div className="header-middle no-print">
            <div className="global-search-wrapper">
              <Search size={15} className="search-icon" />
              <div className="search-input-container">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="search-input"
                  placeholder={`Search in ${getPageTitle()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    className="search-clear-btn" 
                    onClick={() => setSearchQuery('')}
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <span className="search-shortcut">Ctrl K</span>
            </div>
          </div>

          {/* Right: Actions (Theme Toggle, Notifications, Profile Dropdown) */}
          <div className="header-right no-print">
            {/* Theme Toggle */}
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={settings.theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {settings.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Notifications Bell */}
            <div className="notification-wrapper">
              <button
                className="notification-btn"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                title="Notifications"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <>
                    <span className="notification-badge-pulse"></span>
                    <span className="notification-badge"></span>
                  </>
                )}
              </button>

              {isNotificationOpen && (
                <div className="notification-dropdown">
                  <div className="notification-dropdown-header">
                    <span className="notification-dropdown-title">Recent Notifications</span>
                    {notifications.length > 0 && (
                      <button
                        className="notification-dropdown-clear"
                        onClick={() => {
                          setNotifications([]);
                          showToast('Notifications cleared', 'success');
                        }}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="notification-dropdown-list">
                    {notifications.length === 0 ? (
                      <div className="notification-dropdown-empty">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className="notification-item">
                          <span className="notification-item-dot"></span>
                          <div className="notification-item-content">
                            <span className="notification-item-title">{notif.title}</span>
                            <span className="notification-item-desc">{notif.desc}</span>
                            <span className="notification-item-time">{notif.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="notification-dropdown-footer">
                    <a
                      href="#reports"
                      className="notification-view-all"
                      onClick={(e) => {
                        e.preventDefault();
                        handleTabChange('reports');
                        setIsNotificationOpen(false);
                      }}
                    >
                      View Reports Dashboard
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="profile-wrapper">
              <button
                className="profile-trigger"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                title="User Profile options"
              >
                <div className="avatar-wrapper">
                  <div className="avatar-circle">KC</div>
                  <span className={`status-indicator ${userStatus}`}></span>
                </div>
                <div className="profile-details">
                  <span className="profile-username">Kunal C.</span>
                  <span className="profile-status">{userStatus.charAt(0).toUpperCase() + userStatus.slice(1)}</span>
                </div>
                <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
              </button>

              {isProfileDropdownOpen && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-user">
                    <div className="profile-dropdown-name">Kunal Chaudhari</div>
                    <div className="profile-dropdown-role">Owner • AgriBiz Dealer</div>
                  </div>
                  
                  <button
                    className="profile-dropdown-item"
                    onClick={() => {
                      handleTabChange('settings');
                      setIsProfileDropdownOpen(false);
                    }}
                  >
                    <User size={14} />
                    <span>Profile Settings</span>
                  </button>

                  <div className="status-selector-header">Set Status</div>
                  <div className="status-selector">
                    <button
                      className={`status-dot-btn ${userStatus === 'online' ? 'active' : ''}`}
                      onClick={() => {
                        setUserStatus('online');
                        showToast('Status updated to Online', 'success');
                      }}
                      title="Set status to Online"
                    >
                      <span className="status-dot online"></span>
                      <span>Online</span>
                    </button>
                    <button
                      className={`status-dot-btn ${userStatus === 'busy' ? 'active' : ''}`}
                      onClick={() => {
                        setUserStatus('busy');
                        showToast('Status updated to Busy', 'success');
                      }}
                      title="Set status to Busy"
                    >
                      <span className="status-dot busy"></span>
                      <span>Busy</span>
                    </button>
                    <button
                      className={`status-dot-btn ${userStatus === 'away' ? 'active' : ''}`}
                      onClick={() => {
                        setUserStatus('away');
                        showToast('Status updated to Away', 'success');
                      }}
                      title="Set status to Away"
                    >
                      <span className="status-dot away"></span>
                      <span>Away</span>
                    </button>
                  </div>

                  <div className="profile-dropdown-divider"></div>

                  <button
                    className="profile-dropdown-item logout"
                    onClick={() => {
                      showToast('Logout simulation triggered', 'info');
                      setIsProfileDropdownOpen(false);
                    }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
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
