import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  MoreHorizontal,
  TrendingDown,
  Trash2,
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
  const handleGlowMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--glow-x', `${x}%`);
    card.style.setProperty('--glow-y', `${y}%`);
  };
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
  });
  const [navTooltip, setNavTooltip] = useState<{ label: string; top: number } | null>(null);
  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('sidebar-collapsed', String(next)); } catch {}
      return next;
    });
  };
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
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
      case 'expenses':
        return 'Expense Manager';
      case 'recycle_bin':
        return 'Recycle Bin';
      default:
        return settings.businessName || 'AgriBiz';
    }
  };

  const operationsItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, color: '#10b981', glow: 'rgba(16, 185, 129, 0.15)' },
    { id: 'sales', label: 'Sales Invoices', icon: <FileSpreadsheet size={18} />, color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.15)' },
    { id: 'purchases', label: 'Purchases Ledger', icon: <ShoppingBag size={18} />, color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.15)' },
    { id: 'inventory', label: 'Inventory Stock', icon: <Package size={18} />, color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.15)' },
    { id: 'expenses', label: 'Expenses Book', icon: <TrendingDown size={18} />, color: '#ef4444', glow: 'rgba(239, 68, 68, 0.15)' },
  ];

  const directoriesItems = [
    { id: 'payments', label: 'Payments Book', icon: <IndianRupee size={18} />, color: '#0d9488', glow: 'rgba(13, 148, 136, 0.15)' },
    { id: 'customers', label: 'Customers List', icon: <Users size={18} />, color: '#ec4899', glow: 'rgba(236, 72, 153, 0.15)' },
    { id: 'suppliers', label: 'Suppliers List', icon: <Truck size={18} />, color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.15)' },
  ];

  const adminItems = [
    { id: 'reports', label: 'Business Reports', icon: <TrendingUp size={18} />, color: '#6366f1', glow: 'rgba(99, 102, 241, 0.15)' },
    { id: 'recycle_bin', label: 'Recycle Bin', icon: <Trash2 size={18} />, color: '#ef4444', glow: 'rgba(239, 68, 68, 0.15)' },
    { id: 'settings', label: 'Store Settings', icon: <SettingsIcon size={18} />, color: '#64748b', glow: 'rgba(100, 116, 139, 0.15)' },
  ];

  const bottomNavItems = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
    { id: 'sales', label: 'Sales', icon: <FileSpreadsheet size={20} /> },
    { id: 'purchases', label: 'Purchases', icon: <ShoppingBag size={20} /> },
    { id: 'inventory', label: 'Inventory', icon: <Package size={20} /> },
    { id: 'more', label: 'More', icon: <MoreHorizontal size={20} /> },
  ];

  const handleBottomNavClick = (tabId: string) => {
    if (tabId === 'more') {
      setIsMobileMoreOpen(true);
    } else {
      handleTabChange(tabId);
      setIsMobileMoreOpen(false);
    }
  };

  const renderNavGroup = (title: string, items: typeof operationsItems) => (
    <div className="prem-nav-group">
      <div className="prem-nav-group-label">{title}</div>
      {items.map((item) => {
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`prem-nav-item${isActive ? ' active' : ''}`}
            onClick={() => handleTabChange(item.id)}
            onMouseEnter={(e) => {
              if (isSidebarCollapsed) {
                const rect = e.currentTarget.getBoundingClientRect();
                setNavTooltip({ label: item.label, top: rect.top + rect.height / 2 });
              }
            }}
            onMouseLeave={() => setNavTooltip(null)}
            style={{ '--prem-nav-active-color': item.color, '--prem-icon-active-bg': item.glow } as React.CSSProperties}
            title={isSidebarCollapsed ? item.label : undefined}
          >
            <span
              className="prem-nav-icon"
              style={{ color: isActive ? item.color : undefined }}
            >
              {item.icon}
            </span>
            <span className="prem-nav-label">{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  const renderMobileMoreBottomSheet = () => {
    if (!isMobileMoreOpen) return null;

    const moreItems = [
      { id: 'payments', label: 'Payments Book', icon: <IndianRupee size={20} />, desc: 'Ledger & Cashbook', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
      { id: 'expenses', label: 'Expenses Book', icon: <TrendingDown size={20} />, desc: 'Store operational costs', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
      { id: 'customers', label: 'Customers', icon: <Users size={20} />, desc: 'Client Directory', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
      { id: 'suppliers', label: 'Suppliers', icon: <Truck size={20} />, desc: 'Vendor Contacts', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
      { id: 'reports', label: 'Tax & Reports', icon: <TrendingUp size={20} />, desc: 'GSTR & P&L Analytics', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
      { id: 'recycle_bin', label: 'Recycle Bin', icon: <Trash2 size={20} />, desc: 'Restore deleted records', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
      { id: 'settings', label: 'Settings', icon: <SettingsIcon size={20} />, desc: 'Store Preferences', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' },
    ];

    return createPortal(
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
        zIndex: 2001, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        animation: 'fadeIn 0.25s ease-out'
      }} onClick={() => setIsMobileMoreOpen(false)}>
        <div 
          style={{
            backgroundColor: 'var(--bg-card)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
            borderTop: '1px solid var(--border-color)', padding: '24px 20px 40px 20px',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.2)', width: '100%',
            animation: 'scaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: '85vh', overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle */}
          <div style={{ width: '46px', height: '5px', backgroundColor: 'var(--border-color)', borderRadius: '3px', margin: '0 auto 24px auto', opacity: 0.8 }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0 }}>
              Store Management
            </h3>
            <button
              type="button"
              className="btn-icon"
              style={{ padding: '6px', backgroundColor: 'var(--bg-app)', borderRadius: '50%' }}
              onClick={() => setIsMobileMoreOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {moreItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '16px', borderRadius: '16px',
                    backgroundColor: isActive ? 'var(--bg-app)' : 'var(--bg-card)',
                    border: isActive ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    textAlign: 'left', cursor: 'pointer', width: '100%',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onClick={() => {
                    handleTabChange(item.id);
                    setIsMobileMoreOpen(false);
                  }}
                >
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    backgroundColor: item.bg, color: item.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: isActive ? 700 : 600, color: isActive ? 'var(--primary-dark)' : 'var(--text-primary)' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.desc}
                    </div>
                  </div>
                  {isActive && (
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      backgroundColor: 'var(--primary)', boxShadow: '0 0 8px var(--primary)'
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const renderMobileBottomNav = () => {
    return (
      <div className="mobile-bottom-nav no-print">
        {bottomNavItems.map((item) => {
          const isSelected = item.id === 'more' ? isMobileMoreOpen : currentTab === item.id && !isMobileMoreOpen;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleBottomNavClick(item.id)}
              style={{
                background: 'none', border: 'none', padding: '6px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '4px', flex: 1, cursor: 'pointer',
                color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                transition: 'all 0.2s ease', position: 'relative'
              }}
            >
              <div style={{
                transform: isSelected ? 'scale(1.18) translateY(-2px)' : 'none',
                transition: 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {item.icon}
                {item.id === 'dashboard' && notifications.length > 0 && (
                  <span style={{
                    position: 'absolute', top: '-2px', right: '-2px',
                    width: '6px', height: '6px', backgroundColor: 'var(--color-danger, #ef4444)',
                    borderRadius: '50%', border: '1px solid var(--bg-card)'
                  }} />
                )}
              </div>
              <span style={{
                fontSize: '10px', fontWeight: isSelected ? 700 : 500,
                color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)'
              }}>
                {item.label}
              </span>
              {isSelected && (
                <span style={{
                  position: 'absolute', bottom: '0px', width: '16px', height: '3px',
                  backgroundColor: 'var(--primary)', borderRadius: '2px',
                  boxShadow: '0 -2px 6px var(--primary)'
                }} />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Sidebar Backdrop Blur Overlay on Mobile */}
      {isMobileSidebarOpen && (
        <div 
          className="sidebar-backdrop no-print"
          onClick={() => setIsMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            zIndex: 99,
            animation: 'fadeIn 0.25s ease-out'
          }}
        />
      )}

      {/* Sidebar navigation */}
      <aside
        className={`sidebar no-print${isMobileSidebarOpen ? ' open' : ''}${isSidebarCollapsed ? ' collapsed' : ''}`}
        style={{
          background: settings.theme === 'dark'
            ? 'linear-gradient(180deg, #070a13 0%, #0f1420 100%)'
            : 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)',
          borderRight: `1px solid ${settings.theme === 'dark' ? 'rgba(255,255,255,0.055)' : '#e8edf2'}`,
        }}
      >
        {/* ── Logo-only branding area ── */}
        <div
          className="prem-workspace-card prem-logo-only"
          onMouseMove={handleGlowMove}
          onClick={() => handleTabChange('settings')}
          role="button"
          tabIndex={0}
          title="Go to Settings"
        >
          {/* Animated border ring + logo */}
          <div className="prem-logo-anim-ring">
            <div className="prem-logo-frame prem-logo-large">
              {settings.showLogo && settings.logo ? (
                <img src={settings.logo} alt={settings.businessName || 'Logo'} />
              ) : (
                <div className="prem-logo-fallback">
                  <Store size={32} />
                </div>
              )}
            </div>
          </div>

          {/* Mobile close button */}
          {isMobileSidebarOpen && (
            <button
              type="button"
              className="prem-mobile-close"
              onClick={(e) => { e.stopPropagation(); setIsMobileSidebarOpen(false); }}
              title="Close menu"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ── Navigation Menu ── */}
        <nav className="prem-nav-menu" aria-label="Main navigation">
          {renderNavGroup('Operations', operationsItems)}
          {renderNavGroup('Directories', directoriesItems)}
          {renderNavGroup('Admin', adminItems)}
        </nav>

        {/* ── Tooltip portal for collapsed mode ── */}
        {isSidebarCollapsed && navTooltip && createPortal(
          <div
            className="prem-nav-tooltip"
            style={{ top: navTooltip.top }}
            aria-hidden="true"
          >
            {navTooltip.label}
          </div>,
          document.body
        )}

        {/* ── Collapse Toggle Footer ── */}
        <div className="prem-sidebar-footer no-print">
          <button
            type="button"
            className="prem-collapse-btn"
            onClick={toggleSidebarCollapse}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="prem-collapse-icon">
              <ChevronDown size={14} style={{ transform: 'rotate(90deg)' }} />
            </span>
            <span className="prem-collapse-label">Collapse sidebar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        <header className="header">
          {/* Left: Brand logo & badge */}
          <div className="header-left">
            <button 
              className="menu-toggle no-print" 
              onClick={() => setIsMobileSidebarOpen(true)}
              title="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>
            <div className="header-brand-container">
              {settings.showLogo && settings.logo ? (
                <img src={settings.logo} alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain', marginRight: '8px', borderRadius: '6px' }} />
              ) : (
                <div className="header-brand-logo">
                  <Store size={18} />
                </div>
              )}
              <span className="brand-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{settings.businessName || 'AgriBiz'}</span>
              <span className="brand-badge desktop-only">{getPageTitle()}</span>
            </div>
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
                  placeholder={`Search...`}
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

          {/* Right Actions */}
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
                  <div className="avatar-circle">
                    {settings.ownerName ? settings.ownerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'KC'}
                  </div>
                  <span className={`status-indicator ${userStatus}`}></span>
                </div>
                <div className="profile-details">
                  <span className="profile-username">
                    {settings.ownerName ? settings.ownerName.split(' ')[0] + ' ' + (settings.ownerName.split(' ')[1] ? settings.ownerName.split(' ')[1][0] + '.' : '') : 'Kunal C.'}
                  </span>
                  <span className="profile-status">{userStatus.charAt(0).toUpperCase() + userStatus.slice(1)}</span>
                </div>
                <ChevronDown size={14} className="profile-chevron" style={{ color: 'var(--text-secondary)' }} />
              </button>

              {isProfileDropdownOpen && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-user">
                    <div className="profile-dropdown-name">{settings.ownerName || 'Kunal Chaudhari'}</div>
                    <div className="profile-dropdown-role">Owner • {settings.businessName || 'AgriBiz'}</div>
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

      {renderMobileBottomNav()}
      {renderMobileMoreBottomSheet()}

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
