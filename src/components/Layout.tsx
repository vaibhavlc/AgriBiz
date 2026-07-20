import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';
import { Modal } from './Modal';
import { formatINR } from '../utils/dummyData';
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
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  TrendingDown,
  Trash2,
  Globe,
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
    isFormDirty,
    setIsFormDirty,
    isPaymentFormOpen,
    setIsPaymentFormOpen,
    paymentType,
    setPaymentType,
    contactId,
    setContactId,
    paymentDate,
    setPaymentDate,
    amount,
    setAmount,
    paymentMethod,
    setPaymentMethod,
    referenceNumber,
    setReferenceNumber,
    notes,
    setNotes,
    editingPaymentId,
    handleSavePayment,
    customers,
    suppliers,
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

  const mainWrapperRef = useRef<HTMLDivElement>(null);
  const bottomNavRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'mr' | 'hi'>('en');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // UX Priority states
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(false);

  const LANGUAGES = [
    { code: 'en', label: 'English', nativeLabel: 'English' },
    { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
    { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (mainWrapperRef.current) {
        setScrolled(mainWrapperRef.current.scrollTop > 8);
      }
    };
    const wrapper = mainWrapperRef.current;
    if (wrapper) {
      wrapper.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      if (wrapper) {
        wrapper.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.lang-selector-wrapper')) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Touch swipe navigation for mobile
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const isHorizontallyScrollable = (element: HTMLElement | null): boolean => {
      if (!element) return false;
      let curr: HTMLElement | null = element;
      while (curr && curr !== document.body) {
        const style = window.getComputedStyle(curr);
        const overflowX = style.overflowX;
        const isScrollable = overflowX === 'auto' || overflowX === 'scroll';
        const hasScrollableContent = curr.scrollWidth > curr.clientWidth;
        
        if (isScrollable && hasScrollableContent) {
          return true;
        }
        curr = curr.parentElement;
      }
      return false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (window.innerWidth > 1024) return;

      const target = e.target as HTMLElement;

      // Do not trigger swipe page navigation inside any horizontally scrollable container
      if (isHorizontallyScrollable(target)) {
        return;
      }

      // Do not trigger swipe inside modals, inputs, and controls
      if (
        target.closest('.modal') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select') ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('.prem-nav-menu')
      ) {
        return;
      }
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (window.innerWidth > 1024) return;
      if (touchStartX === 0 || touchStartY === 0) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const diffX = touchStartX - touchEndX;
      const diffY = touchStartY - touchEndY;

      // Reset coordinates
      touchStartX = 0;
      touchStartY = 0;

      // Must be a horizontal swipe (X diff larger than Y diff) and above threshold (e.g. 75px)
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 75) {
        const orderedTabs = [
          'dashboard',
          'sales',
          'purchases',
          'inventory',
          'expenses',
          'payments',
          'customers',
          'suppliers',
          'reports',
          'recycle_bin',
          'settings'
        ];
        const currentIndex = orderedTabs.indexOf(currentTab);
        if (currentIndex === -1) return;

        if (diffX > 0) {
          // Swiped Left -> Next Tab
          const nextIndex = currentIndex + 1;
          if (nextIndex < orderedTabs.length) {
            handleTabChange(orderedTabs[nextIndex]);
          } else {
            handleTabChange(orderedTabs[0]); // Wrap last -> first
          }
        } else {
          // Swiped Right -> Previous Tab
          if (currentIndex === orderedTabs.length - 1) {
            // From last page on right swipe, go to first page
            handleTabChange(orderedTabs[0]);
          } else {
            const prevIndex = currentIndex - 1;
            if (prevIndex >= 0) {
              handleTabChange(orderedTabs[prevIndex]);
            } else {
              handleTabChange(orderedTabs[orderedTabs.length - 1]); // Wrap first -> last
            }
          }
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentTab]);

  // Center the active mobile bottom nav tab item when currentTab changes
  useEffect(() => {
    if (bottomNavRef.current) {
      const activeBtn = bottomNavRef.current.querySelector('[data-active="true"]');
      if (activeBtn) {
        activeBtn.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [currentTab]);

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

  // Prevent unsaved changes loss on browser close / reload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty]);

  const handleTabChange = (tab: string) => {
    if (isFormDirty) {
      setPendingTab(tab);
      setShowUnsavedModal(true);
      return;
    }
    executeTabChange(tab);
  };

  const executeTabChange = (tab: string) => {
    setIsPageLoading(true);
    setTimeout(() => {
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
      setIsPageLoading(false);

      // Always open every page at the top after navigation
      window.scrollTo({ top: 0, behavior: 'auto' });
    }, 180);
  };

  const handleConfirmDiscard = () => {
    setIsFormDirty(false);
    setShowUnsavedModal(false);
    if (pendingTab) {
      executeTabChange(pendingTab);
      setPendingTab(null);
    }
  };

  const handleCancelDiscard = () => {
    setShowUnsavedModal(false);
    setPendingTab(null);
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
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard size={18} /> },
    { id: 'sales', label: 'Sales', icon: <FileSpreadsheet size={18} /> },
    { id: 'purchases', label: 'Purchases', icon: <ShoppingBag size={18} /> },
    { id: 'inventory', label: 'Inventory', icon: <Package size={18} /> },
    { id: 'expenses', label: 'Expenses', icon: <TrendingDown size={18} /> },
    { id: 'payments', label: 'Payments', icon: <IndianRupee size={18} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={18} /> },
    { id: 'suppliers', label: 'Suppliers', icon: <Truck size={18} /> },
    { id: 'reports', label: 'Reports', icon: <TrendingUp size={18} /> },
    { id: 'recycle_bin', label: 'Recycle Bin', icon: <Trash2 size={18} /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={18} /> },
  ];

  const handleBottomNavClick = (tabId: string) => {
    handleTabChange(tabId);
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
      { id: 'expenses', label: 'Expenses Book', icon: <TrendingDown size={20} />, desc: 'Store operational costs', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
      { id: 'payments', label: 'Payments Book', icon: <IndianRupee size={20} />, desc: 'Ledger & Cashbook', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
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
      <div className="mobile-bottom-nav no-print" ref={bottomNavRef}>
        {bottomNavItems.map((item) => {
          const isSelected = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleBottomNavClick(item.id)}
              data-active={isSelected ? "true" : "false"}
              style={{
                background: 'none', border: 'none', padding: '6px 0',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '4px', flex: '0 0 20%', width: '20%', cursor: 'pointer',
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
                fontSize: '9.5px', fontWeight: isSelected ? 700 : 500,
                color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                whiteSpace: 'nowrap'
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
    <div className="app-container" style={{ position: 'relative' }}>
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
          {/* Glass logo frame */}
          <div className="prem-logo-frame prem-logo-large">
            {settings.showLogo && settings.logo ? (
              <img src={settings.logo} alt={settings.businessName || 'Logo'} />
            ) : (
              <div className="prem-logo-fallback">
                <Store size={32} />
              </div>
            )}
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

      </aside>

      {/* Edge Collapse Toggle Button */}
      <button
        type="button"
        className="prem-edge-collapse-btn no-print"
        onClick={toggleSidebarCollapse}
        title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          left: isSidebarCollapsed ? '60px' : '252px',
        }}
      >
        {isSidebarCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* Main Content Area */}
      <div className="main-wrapper" ref={mainWrapperRef}>
        <div className="header-outer-wrapper no-print">
          <header className={`header${scrolled ? ' scrolled' : ''}`}>
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
                <div className="header-logo-container">
                  <img src={settings.logo} alt="Logo" />
                </div>
              ) : (
                <div className="header-brand-logo">
                  <Store size={18} />
                </div>
              )}
              <span className="brand-name">{settings.businessName || 'AgriBiz'}</span>
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

            {/* Language Selector (Farma Style - Non-functional) */}
            <div className="lang-selector-wrapper">
              <button
                type="button"
                className={`lang-selector-btn${isLangDropdownOpen ? ' active' : ''}`}
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                title="Select Language"
              >
                <Globe size={18} className="lang-selector-globe" style={{ margin: 0 }} />
              </button>
              {isLangDropdownOpen && (
                <div className="lang-dropdown animate-fade-in-scale">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      className={`lang-dropdown-item${lang.code === selectedLanguage ? ' active' : ''}`}
                      onClick={() => {
                        setSelectedLanguage(lang.code as 'en' | 'mr' | 'hi');
                        setIsLangDropdownOpen(false);
                      }}
                    >
                      <span className="lang-indicator-dot" />
                      <span style={{ fontFamily: lang.code !== 'en' ? "'Noto Sans Devanagari', sans-serif" : 'inherit' }}>
                        {lang.nativeLabel}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

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
        </div>

        <main className="content-body">
          {isPageLoading ? (
            <div className="skeleton-page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
              {/* Header Skeleton */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="skeleton-shimmer" style={{ width: '220px', height: '24px', borderRadius: '6px' }} />
                <div className="skeleton-shimmer" style={{ width: '380px', height: '14px', borderRadius: '4px' }} />
              </div>
              
              {/* KPI Cards Grid Skeleton */}
              <div className="skeleton-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px',
                width: '100%'
              }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="card" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="skeleton-shimmer" style={{ width: '100px', height: '14px', borderRadius: '4px' }} />
                      <div className="skeleton-shimmer" style={{ width: '28px', height: '28px', borderRadius: '8px' }} />
                    </div>
                    <div className="skeleton-shimmer" style={{ width: '150px', height: '28px', borderRadius: '6px', marginTop: '6px' }} />
                    <div className="skeleton-shimmer" style={{ width: '120px', height: '12px', borderRadius: '4px', marginTop: '4px' }} />
                  </div>
                ))}
              </div>

              {/* Main Content Area Skeleton (simulated table/list) */}
              <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <div className="skeleton-shimmer" style={{ width: '150px', height: '18px', borderRadius: '4px' }} />
                  <div className="skeleton-shimmer" style={{ width: '80px', height: '32px', borderRadius: '6px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div className="skeleton-shimmer" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div className="skeleton-shimmer" style={{ width: '140px', height: '14px', borderRadius: '4px' }} />
                          <div className="skeleton-shimmer" style={{ width: '80px', height: '10px', borderRadius: '4px' }} />
                        </div>
                      </div>
                      <div className="skeleton-shimmer" style={{ width: '70px', height: '16px', borderRadius: '4px' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {renderMobileBottomNav()}
      {renderMobileMoreBottomSheet()}

      {/* Unsaved Changes Warning Modal */}
      {showUnsavedModal && (
        <div className="modal-overlay no-print" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          backdropFilter: 'blur(3px)',
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div className="card" style={{
            width: 'calc(100% - 32px)', maxWidth: '400px', padding: '24px',
            borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
            display: 'flex', flexDirection: 'column', gap: '16px',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            animation: 'slideUp 0.25s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-danger)' }}>
              <AlertCircle size={22} />
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Unsaved Changes!</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              You have unsaved edits on the current page. Leaving will discard all entered draft information.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelDiscard}
                style={{ flex: 1, height: '42px', fontWeight: 700, fontSize: '13px', borderRadius: '8px', justifyContent: 'center' }}
              >
                Keep Editing
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDiscard}
                style={{ flex: 1, height: '42px', fontWeight: 700, fontSize: '13px', borderRadius: '8px', justifyContent: 'center', background: 'var(--color-danger)', color: '#fff' }}
              >
                Discard & Leave
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Global Record/Edit Payment Modal */}
      <Modal 
        isOpen={isPaymentFormOpen} 
        onClose={() => setIsPaymentFormOpen(false)} 
        title={editingPaymentId ? "Edit Transaction Record" : "Record New Transaction"}
      >
        <form onSubmit={handleSavePayment}>
          <div className="form-group">
            <label className="form-label">Transaction Type *</label>
            <div className="payment-type-toggle">
              <button
                type="button"
                className="payment-type-btn"
                style={{
                  backgroundColor: paymentType === 'CustomerReceipt' ? 'rgba(16,185,129,0.15)' : 'transparent',
                  color: paymentType === 'CustomerReceipt' ? 'var(--color-success-dark)' : 'var(--text-secondary)',
                  border: paymentType === 'CustomerReceipt' ? '1px solid var(--color-success-dark)' : '1px solid transparent',
                }}
                onClick={() => {
                  setPaymentType('CustomerReceipt');
                  setContactId('');
                }}
              >
                Inward Receipt (Customer)
              </button>
              <button
                type="button"
                className="payment-type-btn"
                style={{
                  backgroundColor: paymentType === 'SupplierPayment' ? 'rgba(239,68,68,0.12)' : 'transparent',
                  color: paymentType === 'SupplierPayment' ? 'var(--color-danger-dark)' : 'var(--text-secondary)',
                  border: paymentType === 'SupplierPayment' ? '1px solid var(--color-danger-dark)' : '1px solid transparent',
                }}
                onClick={() => {
                  setPaymentType('SupplierPayment');
                  setContactId('');
                }}
              >
                Outward Payout (Supplier)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Select {paymentType === 'CustomerReceipt' ? 'Customer' : 'Supplier'} *
            </label>
            <select
              className="form-control"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              required
              style={{ paddingRight: '36px' }}
            >
              <option value="">-- Choose Contact --</option>
              {paymentType === 'CustomerReceipt'
                ? customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — Dues: {formatINR(c.outstanding)}
                    </option>
                  ))
                : suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — Owed: {formatINR(s.outstanding)}
                    </option>
                  ))}
            </select>

            {contactId && (() => {
              const selectedContact = paymentType === 'CustomerReceipt'
                ? customers.find(c => c.id === contactId)
                : suppliers.find(s => s.id === contactId);

              if (!selectedContact) return null;

              const isOwed = selectedContact.outstanding > 0;
              const cardColor = paymentType === 'CustomerReceipt' 
                ? (isOwed ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)')
                : (isOwed ? 'rgba(239,68,68,0.05)' : 'rgba(16,185,129,0.06)');
              const borderColor = paymentType === 'CustomerReceipt'
                ? (isOwed ? 'var(--color-warning)' : 'var(--color-success)')
                : (isOwed ? 'var(--color-danger)' : 'var(--color-success)');
              const textColor = paymentType === 'CustomerReceipt'
                ? (isOwed ? 'var(--color-warning-dark)' : 'var(--color-success-dark)')
                : (isOwed ? 'var(--color-danger-dark)' : 'var(--color-success-dark)');
              const labelText = paymentType === 'CustomerReceipt' ? 'Customer Dues' : 'Balance We Owe';

              return (
                <div className="selected-contact-card" style={{ background: cardColor, borderColor: borderColor } as React.CSSProperties}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="selected-contact-avatar" style={{ background: borderColor }}>
                      {selectedContact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="selected-contact-name">{selectedContact.name}</div>
                      <div className="selected-contact-phone">{selectedContact.phone}</div>
                    </div>
                  </div>
                  <div className="selected-contact-balance-block">
                    <div className="selected-contact-balance-label">{labelText}</div>
                    <div className="selected-contact-balance-val" style={{ color: textColor }}>{formatINR(selectedContact.outstanding)}</div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="form-row">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Payment Date *</label>
              <input
                type="date"
                className="form-control"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Amount Transferred *</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  pointerEvents: 'none',
                }}>₹</span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0.00"
                  value={amount || ''}
                  onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  required
                  style={{ paddingLeft: '26px' }}
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Payment Method *</label>
              <select
                className="form-control"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Cash">Cash Ledger</option>
                <option value="Bank Transfer">Bank Transfer (IMPS/RTGS)</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Reference Number (Txn/Cheque ID)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. UPI82012019"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Remarks / Description</label>
            <textarea
              className="form-control"
              placeholder="e.g. Settle outstanding bill payment"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="modal-form-actions no-print">
            <button type="button" className="btn btn-secondary" onClick={() => setIsPaymentFormOpen(false)} style={{ borderRadius: '8px' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{
              borderRadius: '8px',
              boxShadow: '0 4px 14px rgba(16,185,129,0.2)',
              fontWeight: 700,
            }}>
              {editingPaymentId ? '✓ Save Changes' : '✓ Log Transaction'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
