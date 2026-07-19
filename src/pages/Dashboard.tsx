import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate } from '../utils/dummyData';
import { KpiCard } from '../components/KpiCard';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Truck,
  PlusCircle,
  ArrowDownLeft,
  ArrowRightLeft,
  DollarSign,
  FileText,
  Percent,
  ShoppingBag,
  Package,
  Activity,
  RefreshCw,
  Clock,
  X,
  Settings,
} from 'lucide-react';

interface AnimatedCounterProps {
  value: number;
  isCurrency?: boolean;
  isPercent?: boolean;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, isCurrency = false, isPercent = false }) => {
  let displayValue = '';
  if (isPercent) {
    displayValue = `${value.toFixed(1)}%`;
  } else if (isCurrency) {
    displayValue = formatINR(value);
  } else {
    displayValue = value.toLocaleString();
  }

  let lengthClass = 'kpi-val-short';
  if (displayValue.length > 11) {
    lengthClass = 'kpi-val-long';
  } else if (displayValue.length > 7) {
    lengthClass = 'kpi-val-medium';
  }

  return <span className={lengthClass}>{displayValue}</span>;
};

// Custom CSS Grid Bar Chart Component
const BarChart = ({
  data,
  label1,
  label2,
  color1 = 'var(--primary)',
  color2 = '#3b82f6',
}: {
  data: { label: string; value1: number; value2: number }[];
  label1: string;
  label2: string;
  color1?: string;
  color2?: string;
}) => {
  const maxVal = Math.max(...data.map((d) => Math.max(d.value1, d.value2, 1)));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '12px' }}>
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px', 
          fontSize: '10px', 
          flexWrap: 'wrap', 
          rowGap: '6px' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: color1 }} />
          <span style={{ color: 'var(--text-secondary)' }}>{label1}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: color2 }} />
          <span style={{ color: 'var(--text-secondary)' }}>{label2}</span>
        </div>
      </div>
      
      <div 
        style={{ 
          display: 'flex', 
          height: 'var(--chart-height, 220px)', 
          alignItems: 'flex-end', 
          gap: '8px', 
          borderBottom: '1px solid var(--border-color)', 
          paddingBottom: '8px',
          paddingTop: '20px',
          width: '100%'
        }}
      >
        {data.map((d, idx) => {
          const h1 = (d.value1 / maxVal) * 100;
          const h2 = (d.value2 / maxVal) * 100;
          // Strip year for compact labels
          const cleanLabel = d.label.replace(/,?\s*\d{4}/, '');
          
          return (
            <div 
              key={idx} 
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                height: '100%', 
                justifyContent: 'flex-end', 
                position: 'relative' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', width: '100%', height: '100%', justifyContent: 'center' }}>
                <div 
                  style={{ 
                    width: '38%', 
                    height: `${Math.max(1.5, h1)}%`, 
                    backgroundColor: color1, 
                    borderRadius: '3px 3px 0 0',
                    transition: 'height 0.3s ease-out',
                    opacity: d.value1 > 0 ? 0.9 : 0.2
                  }}
                  title={`${label1}: ${formatINR(d.value1)}`}
                />
                <div 
                  style={{ 
                    width: '38%', 
                    height: `${Math.max(1.5, h2)}%`, 
                    backgroundColor: color2, 
                    borderRadius: '3px 3px 0 0',
                    transition: 'height 0.3s ease-out',
                    opacity: d.value2 > 0 ? 0.9 : 0.2
                  }}
                  title={`${label2}: ${formatINR(d.value2)}`}
                />
              </div>
              <span className="chart-x-axis-label">
                {cleanLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
// Custom Horizontal Progress Bar
const ProgressBar = ({
  label,
  value,
  max,
  formatVal,
  color = 'var(--primary)',
  onClick,
}: {
  label: string;
  value: number;
  max: number;
  formatVal: (v: number) => string;
  color?: string;
  onClick?: () => void;
}) => {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div 
      onClick={onClick}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '6px', 
        width: '100%',
        cursor: onClick ? 'pointer' : 'default'
      }}
      className={onClick ? 'hover-scale-subtle' : ''}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ color: 'var(--text-muted)' }}>{formatVal(value)} ({percentage.toFixed(1)}%)</span>
      </div>
      <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: color, borderRadius: '4px', transition: 'width 0.4s ease-out' }} />
      </div>
    </div>
  );
};
export const Dashboard: React.FC = () => {
  const {
    products,
    customers,
    suppliers,
    invoices,
    purchases,
    payments,
    expenses,
    setCurrentTab,
    searchQuery,
    setSearchQuery,
    setIsCreatingInvoice,
    setIsEnteringPurchase,
    showToast,
    settings,
    updateSettings,
    openNewPaymentForm,
  } = useApp();

  // Filters State
  const [filterType, setFilterType] = useState('All');
  const [customRange, setCustomRange] = useState({ start: '2026-06-01', end: '2026-07-31' });
  const [activeKpiTab, setActiveKpiTab] = useState<'financial' | 'payments' | 'gst' | 'inventory'>('financial');
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'sales' | 'profit' | 'inventory' | 'entities'>('sales');
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);
  const [isAlertSettingsOpen, setIsAlertSettingsOpen] = useState(false);
  const lastRedirectQuery = useRef('');

  // Search Highlight Helper
  const shouldBlink = (keywords: string[]): boolean => {
    if (!searchQuery) return false;
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (normalizedQuery.length < 2) return false;
    return keywords.some(kw => normalizedQuery.includes(kw) || kw.includes(normalizedQuery));
  };

  // Auto-redirect KPI Tab based on search query keywords
  useEffect(() => {
    if (!searchQuery) {
      lastRedirectQuery.current = '';
      return;
    }
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) {
      lastRedirectQuery.current = '';
      return;
    }

    if (query === lastRedirectQuery.current) return;

    const tabKeywords: Record<'financial' | 'payments' | 'gst' | 'inventory', string[]> = {
      financial: [
        'sales', 'sale', 'revenue', 'taxable', 'purchases', 'purchase', 
        'buying', 'procurement', 'expenses', 'expense', 'spend', 'cost', 
        'profit', 'net', 'earnings', 'income', 'margin', 'gross', 'cogs', 
        'stock cost', 'financial'
      ],
      payments: [
        'collected', 'collection', 'receipt', 'payment', 'receivables', 
        'receivable', 'due', 'outstanding', 'customer outstanding', 'payables', 
        'payable', 'supplier outstanding', 'pending', 'uncollected', 
        'collections', 'book dues'
      ],
      gst: [
        'gst', 'tax', 'cgst', 'sgst', 'igst', 'liability', 'ledger'
      ],
      inventory: [
        'stock', 'inventory', 'items', 'products', 'stock value', 'valuation', 
        'low stock', 'out of stock', 'customers', 'suppliers', 'invoices', 
        'transactions', 'logs', 'entries'
      ]
    };

    for (const [tab, keywords] of Object.entries(tabKeywords)) {
      const isMatch = keywords.some(kw => query.includes(kw) || kw.includes(query));
      if (isMatch) {
        lastRedirectQuery.current = query;
        if (activeKpiTab !== tab) {
          setActiveKpiTab(tab as any);
        }
        break;
      }
    }
  }, [searchQuery, activeKpiTab]);

  // Center active KPI tab in header scroll container
  useEffect(() => {
    const activeBtn = document.getElementById(`kpi-tab-button-${activeKpiTab}`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeKpiTab]);

  // Center active Analysis tab in header scroll container
  useEffect(() => {
    const activeBtn = document.getElementById(`analysis-tab-button-${activeAnalysisTab}`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeAnalysisTab]);

  // Center active duration pill in horizontal scroll container
  useEffect(() => {
    const activeBtn = document.getElementById(`duration-pill-button-${filterType}`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [filterType]);

  // Simulated Reload
  const [isRefreshing, setIsRefreshing] = useState(false);
  const triggerRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Dashboard metrics recalculated', 'success');
    }, 600);
  };

  // 1. Calculate active date ranges
  const dateLimits = useMemo(() => {
    const today = new Date('2026-07-10'); // Set fixed system time
    today.setHours(0, 0, 0, 0);

    let start = new Date(2020, 0, 1);
    let end = new Date(2030, 0, 1);

    switch (filterType) {
      case 'today':
        start = new Date(today);
        end = new Date(today);
        break;
      case 'yesterday':
        start = new Date(today);
        start.setDate(today.getDate() - 1);
        end = new Date(start);
        break;
      case 'week':
        const day = today.getDay();
        start = new Date(today);
        start.setDate(today.getDate() - day);
        end = new Date(today);
        end.setDate(end.getDate() + (6 - day));
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'last_month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'quarter':
        const currentQuarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), currentQuarter * 3, 1);
        end = new Date(today.getFullYear(), (currentQuarter + 1) * 3, 0);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      case 'custom':
        start = new Date(customRange.start);
        end = new Date(customRange.end);
        break;
      default:
        break;
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [filterType, customRange]);

  // 2. Perform Dynamic calculations based on active date range
  const stats = useMemo(() => {
    const { start, end } = dateLimits;

    // Filter transactions
    const filteredInvoices = invoices.filter((i) => {
      const d = new Date(i.date);
      return d >= start && d <= end;
    });

    const filteredPurchases = purchases.filter((p) => {
      const d = new Date(p.date);
      return d >= start && d <= end;
    });

    const filteredPayments = payments.filter((p) => {
      const d = new Date(p.date);
      return d >= start && d <= end;
    });

    const filteredExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });

    // Sum totals
    const totalSales = filteredInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
    const totalSalesBase = filteredInvoices.reduce((sum, i) => sum + i.subtotal, 0);
    const totalPurchases = filteredPurchases.reduce((sum, p) => sum + p.grandTotal, 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Calculate COGS
    let cogs = 0;
    filteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const costPrice = prod ? prod.purchasePrice : 0;
        cogs += item.quantity * costPrice;
      });
    });

    const grossProfit = totalSalesBase - cogs;
    const netProfit = grossProfit - totalExpenses;
    const grossProfitMargin = totalSalesBase > 0 ? (grossProfit / totalSalesBase) * 100 : 0;

    // Receivables / Payables (Always current cumulative values)
    const receivables = customers.reduce((sum, c) => sum + (c.outstanding > 0 ? c.outstanding : 0), 0);
    const payables = suppliers.reduce((sum, s) => sum + (s.outstanding > 0 ? s.outstanding : 0), 0);

    // Collections
    const collectedAmount = filteredPayments
      .filter((p) => p.type === 'CustomerReceipt')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingCollection = filteredInvoices.reduce((sum, i) => sum + i.balanceDue, 0);

    // GST
    const gstCollected = filteredInvoices.reduce((sum, i) => sum + i.gstTotal, 0);
    const gstPaid = filteredPurchases.reduce((sum, p) => sum + p.gstTotal, 0);
    const gstLiability = gstCollected - gstPaid;

    // Inventory
    const stockValue = products.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0);
    const totalInventoryItems = products.reduce((sum, p) => sum + p.stock, 0);
    const lowStockCount = products.filter((p) => p.stock <= p.minStock && p.stock > 0).length;
    const outOfStockCount = products.filter((p) => p.stock === 0).length;

    // Transaction Counts
    const invoicesCount = filteredInvoices.length;
    const purchasesCount = filteredPurchases.length;
    const totalTransactions = invoicesCount + purchasesCount + filteredPayments.length + filteredExpenses.length;

    return {
      totalSales,
      totalSalesBase,
      totalPurchases,
      totalExpenses,
      cogs,
      grossProfit,
      netProfit,
      grossProfitMargin,
      receivables,
      payables,
      collectedAmount,
      pendingCollection,
      gstCollected,
      gstPaid,
      gstLiability,
      stockValue,
      totalInventoryItems,
      lowStockCount,
      outOfStockCount,
      invoicesCount,
      purchasesCount,
      totalTransactions,
      filteredInvoices,
      filteredPurchases,
      filteredPayments,
      filteredExpenses,
    };
  }, [invoices, purchases, payments, expenses, products, customers, suppliers, dateLimits]);

  // 3. Chart computations
  const chartData = useMemo(() => {
    // Generate dates based on filtered items
    const dataMap: { [key: string]: { value1: number; value2: number } } = {};
    
    // Group invoices & purchases by date
    stats.filteredInvoices.forEach((inv) => {
      const label = formatDate(inv.date);
      if (!dataMap[label]) dataMap[label] = { value1: 0, value2: 0 };
      dataMap[label].value1 += inv.grandTotal;
    });

    stats.filteredPurchases.forEach((pur) => {
      const label = formatDate(pur.date);
      if (!dataMap[label]) dataMap[label] = { value1: 0, value2: 0 };
      dataMap[label].value2 += pur.grandTotal;
    });

    // Convert map to sorted array
    const sortedLabels = Object.keys(dataMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    // Fallback if empty
    if (sortedLabels.length === 0) {
      return [
        { label: 'No Data', value1: 0, value2: 0 }
      ];
    }

    return sortedLabels.slice(-7).map((label) => ({
      label,
      value1: dataMap[label].value1,
      value2: dataMap[label].value2,
    }));
  }, [stats]);

  // 4. Top Selling / Profitable Products Analysis
  const productPerformance = useMemo(() => {
    const quantitiesSold: { [id: string]: number } = {};
    const revenueSold: { [id: string]: number } = {};
    const profitEarned: { [id: string]: number } = {};

    stats.filteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const qty = item.quantity;
        quantitiesSold[item.productId] = (quantitiesSold[item.productId] || 0) + qty;
        revenueSold[item.productId] = (revenueSold[item.productId] || 0) + item.total;

        // profit = item subtotal value - purchaseCost
        const prod = products.find((p) => p.id === item.productId);
        const cost = prod ? prod.purchasePrice * qty : 0;
        profitEarned[item.productId] = (profitEarned[item.productId] || 0) + (item.subtotal - cost);
      });
    });

    const mapped = products.map((p) => {
      const sold = quantitiesSold[p.id] || 0;
      const revenue = revenueSold[p.id] || 0;
      const profit = profitEarned[p.id] || 0;
      return {
        ...p,
        sold,
        revenue,
        profit,
      };
    });

    return {
      bestSelling: [...mapped].sort((a, b) => b.sold - a.sold).filter((p) => p.sold > 0).slice(0, 5),
      highestRevenue: [...mapped].sort((a, b) => b.revenue - a.revenue).filter((p) => p.revenue > 0).slice(0, 5),
      highestProfit: [...mapped].sort((a, b) => b.profit - a.profit).filter((p) => p.profit > 0).slice(0, 5),
      lowestSelling: [...mapped].sort((a, b) => a.sold - b.sold).slice(0, 5),
    };
  }, [stats, products]);

  // 5. Recent Activity Logs builder
  const recentActivities = useMemo(() => {
    const logs: { id: string; time: string; type: string; details: string; icon: string; bg: string; targetTab: string; targetQuery: string }[] = [];

    // Map Invoices
    stats.filteredInvoices.slice(0, 4).forEach((inv) => {
      logs.push({
        id: `act-${inv.id}`,
        time: inv.date,
        type: 'New Invoice Created',
        details: `Sales Invoice ${inv.invoiceNumber} raised for ${inv.customerName} - Total ${formatINR(inv.grandTotal)}`,
        icon: '💵',
        bg: 'var(--color-success-bg)',
        targetTab: 'sales',
        targetQuery: inv.invoiceNumber,
      });
    });

    // Map Purchases
    stats.filteredPurchases.slice(0, 4).forEach((pur) => {
      logs.push({
        id: `act-${pur.id}`,
        time: pur.date,
        type: 'Purchase Entry Added',
        details: `Supplier Bill ${pur.purchaseNumber} recorded for ${pur.supplierName} - Value ${formatINR(pur.grandTotal)}`,
        icon: '📦',
        bg: 'rgba(59, 130, 246, 0.1)',
        targetTab: 'purchases',
        targetQuery: pur.purchaseNumber,
      });
    });

    // Map Payments
    stats.filteredPayments.slice(0, 4).forEach((pay) => {
      logs.push({
        id: `act-${pay.id}`,
        time: pay.date,
        type: pay.type === 'CustomerReceipt' ? 'Customer Receipt' : 'Supplier Payment',
        details: `Payment of ${formatINR(pay.amount)} logged via ${pay.paymentMethod} for ${pay.contactName}`,
        icon: pay.type === 'CustomerReceipt' ? '📥' : '📤',
        bg: pay.type === 'CustomerReceipt' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
        targetTab: 'payments',
        targetQuery: pay.contactName,
      });
    });

    // Map Expenses
    stats.filteredExpenses.slice(0, 4).forEach((exp) => {
      logs.push({
        id: `act-${exp.id}`,
        time: exp.date,
        type: 'Expense Logged',
        details: `Operational spend of ${formatINR(exp.amount)} under ${exp.category} paid to ${exp.payee}`,
        icon: '🧾',
        bg: 'var(--color-danger-bg)',
        targetTab: 'expenses',
        targetQuery: exp.category,
      });
    });

    return logs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);
  }, [stats]);

  // 6. Action cards list
  const outstandingCustomers = useMemo(() => {
    return [...customers].sort((a, b) => b.outstanding - a.outstanding).filter((c) => c.outstanding > 0).slice(0, 5);
  }, [customers]);

  const outstandingSuppliers = useMemo(() => {
    return [...suppliers].sort((a, b) => b.outstanding - a.outstanding).filter((s) => s.outstanding > 0).slice(0, 5);
  }, [suppliers]);

  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* Alerts Panel */}
      {(() => {
        const isLowStockActive = settings.showLowStockAlert !== false && stats.lowStockCount > 0;
        const isOutOfStockActive = settings.showOutOfStockAlert !== false && stats.outOfStockCount > 0;
        const shouldShowAlert = (isLowStockActive || isOutOfStockActive) && !isAlertDismissed;

        if (!shouldShowAlert) return null;

        return (
          <div className="stock-warning-alert">
            <div className="stock-warning-left">
              <AlertTriangle size={18} />
              <span style={{ fontSize: '13px' }}>
                <strong>Inventory Warning:</strong>{' '}
                {isLowStockActive && isOutOfStockActive ? (
                  `${stats.lowStockCount} products are below safety limits, and ${stats.outOfStockCount} products are completely out of stock.`
                ) : isLowStockActive ? (
                  `${stats.lowStockCount} products are below safety limits.`
                ) : (
                  `${stats.outOfStockCount} products are completely out of stock.`
                )}
              </span>
            </div>
            <div className="stock-warning-right" style={{ position: 'relative' }}>
              <button className="alert-action-btn" onClick={() => setCurrentTab('inventory')} style={{ fontSize: '12px', padding: '6px 12px' }}>
                Reorder Stock
              </button>
              
              <button 
                type="button"
                className="alert-settings-btn"
                onClick={() => setIsAlertSettingsOpen(!isAlertSettingsOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-danger-dark)',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s',
                }}
                title="Alert settings"
              >
                <Settings size={16} />
              </button>

              {isAlertSettingsOpen && (
                <div className="alert-settings-popover">
                  <div className="alert-settings-header">
                    <span>Warning Settings</span>
                    <button type="button" onClick={() => setIsAlertSettingsOpen(false)}>×</button>
                  </div>
                  <div className="alert-settings-body">
                    <label className="alert-settings-option">
                      <input 
                        type="checkbox" 
                        checked={settings.showLowStockAlert !== false}
                        onChange={(e) => updateSettings({
                          ...settings,
                          showLowStockAlert: e.target.checked
                        })}
                      />
                      <span>Safety Limit Warning ({stats.lowStockCount})</span>
                    </label>
                    <label className="alert-settings-option">
                      <input 
                        type="checkbox" 
                        checked={settings.showOutOfStockAlert !== false}
                        onChange={(e) => updateSettings({
                          ...settings,
                          showOutOfStockAlert: e.target.checked
                        })}
                      />
                      <span>Out of Stock Warning ({stats.outOfStockCount})</span>
                    </label>
                  </div>
                </div>
              )}

              <button 
                onClick={() => setIsAlertDismissed(true)} 
                style={{ background: 'none', border: 'none', color: 'var(--color-danger-dark)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                title="Dismiss warning"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })()}
      {/* Date Filter & Title Toolbar */}
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '24px' 
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            {settings.showLogo && settings.logo && (
              <img 
                src={settings.logo} 
                alt="Business Logo" 
                style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '10px', flexShrink: 0 }} 
              />
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <h2 className="dashboard-title-text" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
                {settings.businessName || 'Business Intelligence Dashboard'}
              </h2>
              <p className="dashboard-welcome-text" style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.3 }}>
                Welcome back, {settings.ownerName || 'Partner'}
              </p>
            </div>
          </div>
          
          <button 
            className="btn btn-secondary btn-icon"
            onClick={triggerRefresh}
            title="Recalculate metrics"
            disabled={isRefreshing}
            style={{ 
              flexShrink: 0, 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: 0,
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)'
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Modern Segmented Pill Tabs */}
        <div className="pill-filter-bar">
          {[
            { value: 'All', label: 'All Time' },
            { value: 'today', label: 'Today' },
            { value: 'yesterday', label: 'Yesterday' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
            { value: 'last_month', label: 'Last Month' },
            { value: 'quarter', label: 'This Quarter' },
            { value: 'year', label: 'This Year' },
            { value: 'custom', label: 'Custom Date' },
          ].map((opt) => (
            <button
              key={opt.value}
              id={`duration-pill-button-${opt.value}`}
              className={`pill-filter-btn ${filterType === opt.value ? 'active' : ''}`}
              onClick={() => setFilterType(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom range date-picker */}
      {filterType === 'custom' && (
        <div 
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-color)', 
            padding: '10px 12px', 
            marginBottom: '20px', 
            display: 'flex', 
            gap: '10px', 
            borderRadius: '10px',
            animation: 'fadeIn 0.2s ease-out',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Start Date</span>
            <input 
              type="date" 
              className="filter-select" 
              style={{ 
                padding: '8px 10px', 
                fontSize: '12px', 
                width: '100%', 
                boxSizing: 'border-box',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)'
              }}
              value={customRange.start}
              onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>End Date</span>
            <input 
              type="date" 
              className="filter-select" 
              style={{ 
                padding: '8px 10px', 
                fontSize: '12px', 
                width: '100%', 
                boxSizing: 'border-box',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)'
              }}
              value={customRange.end}
              onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
            />
          </div>
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <div 
          style={{ 
            display: 'flex', 
            borderBottom: '1px solid var(--border-color)', 
            marginBottom: '16px', 
            gap: '16px', 
            overflowX: 'auto', 
            paddingBottom: '4px',
            scrollBehavior: 'smooth'
          }}
          className="no-scrollbar"
        >
          <button 
            id="kpi-tab-button-financial"
            style={{ padding: '8px 12px', border: 'none', background: 'none', fontSize: '13px', fontWeight: activeKpiTab === 'financial' ? 800 : 500, color: activeKpiTab === 'financial' ? 'var(--primary-dark)' : 'var(--text-muted)', borderBottom: activeKpiTab === 'financial' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={() => setActiveKpiTab('financial')}
          >
            Financial Health
          </button>
          <button 
            id="kpi-tab-button-payments"
            style={{ padding: '8px 12px', border: 'none', background: 'none', fontSize: '13px', fontWeight: activeKpiTab === 'payments' ? 800 : 500, color: activeKpiTab === 'payments' ? 'var(--primary-dark)' : 'var(--text-muted)', borderBottom: activeKpiTab === 'payments' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={() => setActiveKpiTab('payments')}
          >
            Collections & Book dues
          </button>
          <button 
            id="kpi-tab-button-gst"
            style={{ padding: '8px 12px', border: 'none', background: 'none', fontSize: '13px', fontWeight: activeKpiTab === 'gst' ? 800 : 500, color: activeKpiTab === 'gst' ? 'var(--primary-dark)' : 'var(--text-muted)', borderBottom: activeKpiTab === 'gst' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={() => setActiveKpiTab('gst')}
          >
            GST Ledger
          </button>
          <button 
            id="kpi-tab-button-inventory"
            style={{ padding: '8px 12px', border: 'none', background: 'none', fontSize: '13px', fontWeight: activeKpiTab === 'inventory' ? 800 : 500, color: activeKpiTab === 'inventory' ? 'var(--primary-dark)' : 'var(--text-muted)', borderBottom: activeKpiTab === 'inventory' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={() => setActiveKpiTab('inventory')}
          >
            Inventory & Entity Counts
          </button>
        </div>

        {/* Tab 1: Financial Health */}
        {activeKpiTab === 'financial' && (
          <div className="grid-cols-4 tab-content-enter">
            <KpiCard
              label="Total Sales Billing"
              value={<AnimatedCounter value={stats.totalSales} isCurrency />}
              subtext="Sales inclusive of GST"
              icon={<TrendingUp size={20} />}
              variant="success"
              onClick={() => setCurrentTab('sales')}
              className={shouldBlink(['sales', 'sale', 'billing', 'turnover']) ? 'search-blink-highlight' : ''}
            />
            
            <KpiCard
              label="Taxable Sales Revenue"
              value={<AnimatedCounter value={stats.totalSalesBase} isCurrency />}
              subtext="Excluding collected GST"
              icon={<TrendingUp size={20} />}
              variant="success"
              onClick={() => setCurrentTab('sales')}
              className={shouldBlink(['sales', 'sale', 'revenue', 'taxable']) ? 'search-blink-highlight' : ''}
            />

            <KpiCard
              label="Total Purchases Billing"
              value={<AnimatedCounter value={stats.totalPurchases} isCurrency />}
              subtext="Cumulative stock acquisitions"
              icon={<TrendingDown size={20} />}
              variant="warning"
              onClick={() => setCurrentTab('purchases')}
              className={shouldBlink(['purchases', 'purchase', 'buying', 'procurement']) ? 'search-blink-highlight' : ''}
            />

            <KpiCard
              label="Total Expenses Spends"
              value={<AnimatedCounter value={stats.totalExpenses} isCurrency />}
              subtext="Operational overhead costs"
              icon={<TrendingDown size={20} />}
              variant="danger"
              onClick={() => setCurrentTab('expenses')}
              className={shouldBlink(['expenses', 'expense', 'spend', 'cost']) ? 'search-blink-highlight' : ''}
            />

            <KpiCard
              label="Gross Sales Profit"
              value={<AnimatedCounter value={stats.grossProfit} isCurrency />}
              subtext="Sales subtotal minus COGS"
              icon={<DollarSign size={20} />}
              variant="success"
              className={shouldBlink(['profit', 'gross', 'margin']) ? 'search-blink-highlight' : ''}
            />

            <KpiCard
              label="Net Operating Profit"
              value={<AnimatedCounter value={stats.netProfit} isCurrency />}
              subtext="Gross profit minus expenses"
              icon={<DollarSign size={20} />}
              variant="success"
              className={shouldBlink(['profit', 'net', 'earnings', 'income']) ? 'search-blink-highlight' : ''}
            />

            <KpiCard
              label="Gross Profit Margin"
              value={<AnimatedCounter value={stats.grossProfitMargin} isPercent />}
              subtext="Efficiency percentage return"
              icon={<Percent size={20} />}
              variant="info"
              className={shouldBlink(['profit', 'margin', 'gross']) ? 'search-blink-highlight' : ''}
            />

            <KpiCard
              label="COGS (Stock Cost)"
              value={<AnimatedCounter value={stats.cogs} isCurrency />}
              subtext="Cost price of items sold"
              icon={<Package size={20} />}
              variant="danger"
              className={shouldBlink(['cogs', 'cost', 'stock cost']) ? 'search-blink-highlight' : ''}
            />
          </div>
        )}

        {/* Tab 2: Collections & Outstanding */}
        {activeKpiTab === 'payments' && (
          <div className="grid-cols-4 tab-content-enter">
            <KpiCard
              label="Total Amount Collected"
              value={<AnimatedCounter value={stats.collectedAmount} isCurrency />}
              subtext="Total receipts collected"
              icon={<ArrowDownLeft size={20} />}
              variant="success"
              onClick={() => setCurrentTab('payments')}
              className={shouldBlink(['collected', 'collection', 'receipt', 'payment']) ? 'search-blink-highlight' : ''}
            />

            <KpiCard
              label="Outstanding Receivables"
              value={<AnimatedCounter value={stats.receivables} isCurrency />}
              subtext="Dues left on invoices"
              icon={<Users size={20} />}
              variant="danger"
              onClick={() => setCurrentTab('sales')}
              className={shouldBlink(['receivables', 'receivable', 'due', 'outstanding', 'customer']) ? 'search-blink-highlight' : ''}
            />

            <KpiCard
              label="Outstanding Payables"
              value={<AnimatedCounter value={stats.payables} isCurrency />}
              subtext="Dues owed to manufacturers"
              icon={<Truck size={20} />}
              variant="danger"
              onClick={() => setCurrentTab('suppliers')}
              className={shouldBlink(['payables', 'payable', 'due', 'outstanding', 'supplier']) ? 'search-blink-highlight' : ''}
            />

            <KpiCard
              label="Pending Billing Collection"
              value={<AnimatedCounter value={stats.pendingCollection} isCurrency />}
              subtext="Amount yet to collect"
              icon={<Clock size={20} />}
              variant="warning"
              onClick={() => setCurrentTab('sales')}
              className={shouldBlink(['pending', 'uncollected', 'collection']) ? 'search-blink-highlight' : ''}
            />
          </div>
        )}

        {/* Tab 3: GST Ledger */}
        {activeKpiTab === 'gst' && (
          <div className="grid-cols-4 tab-content-enter">
            <KpiCard
              label="Total GST Collected"
              value={<AnimatedCounter value={stats.gstCollected} isCurrency />}
              subtext="Output tax collected"
              icon={<TrendingUp size={20} />}
              variant="success"
              onClick={() => setCurrentTab('reports')}
              className={shouldBlink(['gst', 'tax', 'collected', 'cgst', 'sgst']) ? 'search-blink-highlight' : ''}
            />

            <KpiCard
              label="Total GST Paid"
              value={<AnimatedCounter value={stats.gstPaid} isCurrency />}
              subtext="Input tax credit paid"
              icon={<TrendingDown size={20} />}
              variant="warning"
              onClick={() => setCurrentTab('reports')}
              className={shouldBlink(['gst', 'tax', 'paid', 'cgst', 'sgst']) ? 'search-blink-highlight' : ''}
            />

            <KpiCard
              label="Total GST Liability"
              value={<AnimatedCounter value={stats.gstLiability} isCurrency />}
              subtext="Output minus Input tax"
              icon={<FileText size={20} />}
              variant={stats.gstLiability > 0 ? "danger" : "info"}
              onClick={() => setCurrentTab('reports')}
              className={shouldBlink(['gst', 'tax', 'liability', 'cgst', 'sgst']) ? 'search-blink-highlight' : ''}
            />

            <KpiCard
              label="CGST / SGST Share"
              value={<AnimatedCounter value={stats.gstCollected / 2} isCurrency />}
              subtext="50% equal split values"
              icon={<Percent size={20} />}
              variant="info"
              onClick={() => setCurrentTab('reports')}
              className={shouldBlink(['gst', 'tax', 'cgst', 'sgst', 'share']) ? 'search-blink-highlight' : ''}
            />
          </div>
        )}
        {/* Tab 4: Inventory & Counts */}
        {activeKpiTab === 'inventory' && (
          <div className="grid-cols-4 tab-content-enter">
            <KpiCard
              label="Current Stock Value"
              value={<AnimatedCounter value={stats.stockValue} isCurrency />}
              subtext="Valuation of current stock"
              icon={<ShoppingBag size={20} />}
              variant="success"
              onClick={() => setCurrentTab('inventory')}
              className={shouldBlink(['stock', 'inventory', 'items', 'products', 'stock value', 'valuation']) ? 'search-blink-highlight' : ''}
            />

            <KpiCard
              label="Total Items in Stock"
              value={<AnimatedCounter value={stats.totalInventoryItems} />}
              subtext="Sum of all individual items"
              icon={<Package size={20} />}
              variant="info"
              onClick={() => setCurrentTab('inventory')}
              className={shouldBlink(['stock', 'inventory', 'items', 'products']) ? 'search-blink-highlight' : ''}
            />

            <KpiCard
              label="Low Stock Products"
              value={<AnimatedCounter value={stats.lowStockCount} />}
              subtext="Below safety buffer levels"
              icon={<AlertTriangle size={20} />}
              variant="danger"
              onClick={() => setCurrentTab('inventory')}
              className={shouldBlink(['stock', 'inventory', 'items', 'products', 'low stock']) ? 'search-blink-highlight' : ''}
            />

            <KpiCard
              label="Out of Stock Products"
              value={<AnimatedCounter value={stats.outOfStockCount} />}
              subtext="Zero inventory units"
              icon={<AlertTriangle size={20} />}
              variant="danger"
              onClick={() => setCurrentTab('inventory')}
              className={shouldBlink(['stock', 'inventory', 'items', 'products', 'out of stock']) ? 'search-blink-highlight' : ''}
            />

            <KpiCard
              label="Active Customers"
              value={<AnimatedCounter value={customers.length} />}
              subtext="Profiles in directories"
              icon={<Users size={20} />}
              variant="info"
              onClick={() => setCurrentTab('customers')}
              className={shouldBlink(['customers', 'customer', 'clients', 'client']) ? 'search-blink-highlight' : ''}
            />

            <KpiCard
              label="Active Suppliers"
              value={<AnimatedCounter value={suppliers.length} />}
              subtext="Suppliers registered"
              icon={<Truck size={20} />}
              variant="info"
              onClick={() => setCurrentTab('suppliers')}
              className={shouldBlink(['suppliers', 'supplier', 'vendors', 'vendor']) ? 'search-blink-highlight' : ''}
            />

            <KpiCard
              label="Total Invoices Raised"
              value={<AnimatedCounter value={stats.invoicesCount} />}
              subtext="Customer invoices generated"
              icon={<FileText size={20} />}
              variant="success"
              onClick={() => setCurrentTab('sales')}
              className={shouldBlink(['invoices', 'invoice', 'sales']) ? 'search-blink-highlight' : ''}
            />

            <KpiCard
              label="Total Transactions Logs"
              value={<AnimatedCounter value={stats.totalTransactions} />}
              subtext="Invoice, bills, receipts, spends"
              icon={<Activity size={20} />}
              variant="info"
              className={shouldBlink(['transactions', 'logs', 'entries']) ? 'search-blink-highlight' : ''}
            />
          </div>
        )}

      </div>

      {/* Quick Actions Panel */}
      <div className="card" style={{ padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 12px 0', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Quick Actions Console</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          <button 
            className="btn btn-primary" 
            style={{ fontSize: '12px', padding: '10px', justifyContent: 'center' }} 
            onClick={() => { setCurrentTab('sales'); setIsCreatingInvoice(true); }}
          >
            <PlusCircle size={15} /> New Invoice
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ fontSize: '12px', padding: '10px', justifyContent: 'center' }} 
            onClick={() => { setCurrentTab('purchases'); setIsEnteringPurchase(true); }}
          >
            <PlusCircle size={15} /> Add Purchase
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ fontSize: '12px', padding: '10px', justifyContent: 'center' }} 
            onClick={() => setCurrentTab('inventory')}
          >
            <Package size={15} /> Add Product
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ fontSize: '12px', padding: '10px', justifyContent: 'center' }} 
            onClick={() => setCurrentTab('customers')}
          >
            <Users size={15} /> Add Customer
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ fontSize: '12px', padding: '10px', justifyContent: 'center' }} 
            onClick={() => setCurrentTab('suppliers')}
          >
            <Truck size={15} /> Add Supplier
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ fontSize: '12px', padding: '10px', justifyContent: 'center' }} 
            onClick={() => setCurrentTab('expenses')}
          >
            <FileText size={15} /> Record Expense
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ fontSize: '12px', padding: '10px', justifyContent: 'center' }} 
            onClick={() => openNewPaymentForm()}
          >
            <ArrowRightLeft size={15} /> Record Payment
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ fontSize: '12px', padding: '10px', justifyContent: 'center' }} 
            onClick={() => setCurrentTab('reports')}
          >
            <TrendingUp size={15} /> View Reports
          </button>
        </div>
      </div>


      {/* Main Analysis Blocks divided into tab panels */}
      <div className="dashboard-main-layout">
        {/* Left Side: Dynamic Analytics Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, width: '100%' }}>
          {/* Tabs Navigation Bar */}
          <div 
            style={{ 
              display: 'flex', 
              borderBottom: '1px solid var(--border-color)', 
              gap: '12px', 
              overflowX: 'auto', 
              paddingBottom: '8px', 
              scrollbarWidth: 'none', 
              WebkitOverflowScrolling: 'touch',
              width: '100%'
            }}
            className="no-scrollbar"
          >
            {[
              { id: 'sales', label: 'Sales & Purchases' },
              { id: 'profit', label: 'Product Profitability' },
              { id: 'inventory', label: 'Stock Status' },
              { id: 'entities', label: 'Directories & Accounts' }
            ].map((tab) => (
              <button
                key={tab.id}
                id={`analysis-tab-button-${tab.id}`}
                style={{ 
                  padding: '8px 16px', 
                  border: 'none', 
                  background: 'none', 
                  fontSize: '13px', 
                  fontWeight: activeAnalysisTab === tab.id ? 800 : 500, 
                  color: activeAnalysisTab === tab.id ? 'var(--primary-dark)' : 'var(--text-muted)', 
                  borderBottom: activeAnalysisTab === tab.id ? '2px solid var(--primary)' : 'none', 
                  cursor: 'pointer', 
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setActiveAnalysisTab(tab.id as any)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Tab Panel Content */}
          <div style={{ width: '100%', minWidth: 0 }}>
            {/* Tab A: Sales & Purchases */}
            {activeAnalysisTab === 'sales' && (
              <div 
                className={`card${shouldBlink(['sales', 'purchases', 'billing', 'trend', 'chart', 'bar']) ? ' search-blink-highlight' : ''} tab-content-enter`}
                style={{ 
                  padding: '16px', 
                  borderRadius: '12px', 
                  width: '100%', 
                  minWidth: 0,
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Sales Billing vs Purchase Billing Trend</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Latest active periods</p>
                </div>
                <div style={{ width: '100%', minWidth: 0 }}>
                  <BarChart 
                    data={chartData} 
                    label1="Total Sales (₹)" 
                    label2="Total Purchases (₹)" 
                    color1="var(--primary)" 
                    color2="#3b82f6" 
                  />
                </div>
              </div>
            )}

            {/* Tab B: Product Profitability */}
            {activeAnalysisTab === 'profit' && (
              <div 
                className={`card${shouldBlink(['profitable', 'highest profit', 'revenue', 'products']) ? ' search-blink-highlight' : ''} tab-content-enter`}
                style={{ 
                  padding: '16px', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '24px', 
                  width: '100%', 
                  minWidth: 0,
                  boxSizing: 'border-box'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Top Highly Profitable Products</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                    {productPerformance.highestProfit.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>No sales data available in selected period.</p>
                    ) : (
                      productPerformance.highestProfit.map((prod, idx) => (
                        <ProgressBar 
                          key={idx} 
                          label={prod.name} 
                          value={prod.profit} 
                          max={stats.grossProfit} 
                          formatVal={(v) => formatINR(v)}
                          color="var(--primary)" 
                          onClick={() => {
                            setSearchQuery(prod.name);
                            setCurrentTab('inventory');
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Highest Revenue Generating Products</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                    {productPerformance.highestRevenue.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>No sales data available in selected period.</p>
                    ) : (
                      productPerformance.highestRevenue.map((prod, idx) => (
                        <ProgressBar 
                          key={idx} 
                          label={prod.name} 
                          value={prod.revenue} 
                          max={stats.totalSales} 
                          formatVal={(v) => formatINR(v)}
                          color="#3b82f6" 
                          onClick={() => {
                            setSearchQuery(prod.name);
                            setCurrentTab('inventory');
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab C: Stock Status */}
            {activeAnalysisTab === 'inventory' && (
              <div 
                className={`card${shouldBlink(['stock', 'inventory', 'fast-moving', 'registered']) ? ' search-blink-highlight' : ''} tab-content-enter`}
                style={{ 
                  padding: '16px', 
                  borderRadius: '12px', 
                  width: '100%', 
                  minWidth: 0,
                  boxSizing: 'border-box'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Fast-Moving Products (Quantity Sold)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                    {productPerformance.bestSelling.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>No sales registered.</p>
                    ) : (
                      productPerformance.bestSelling.map((prod, idx) => {
                        const totalQty = productPerformance.bestSelling.reduce((sum, p) => sum + p.sold, 0);
                        return (
                          <ProgressBar 
                            key={idx} 
                            label={prod.name} 
                            value={prod.sold} 
                            max={totalQty} 
                            formatVal={(v) => `${v} units`}
                            color="var(--primary)" 
                            onClick={() => {
                              setSearchQuery(prod.name);
                              setCurrentTab('inventory');
                            }}
                          />
                        );
                      })
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Recently Registered Stock Items</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                    {products.slice(-4).reverse().map((prod) => (
                      <div 
                        key={prod.id} 
                        onClick={() => {
                          setSearchQuery(prod.name);
                          setCurrentTab('inventory');
                        }}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '10px 12px', 
                          backgroundColor: 'var(--bg-app)', 
                          borderRadius: '8px', 
                          border: '1px solid var(--border-color)',
                          gap: '12px',
                          cursor: 'pointer'
                        }}
                        className="hover-scale-subtle"
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Category: {prod.category} • SKU: {prod.sku}</div>
                        </div>
                        <span className="badge badge-secondary" style={{ fontSize: '11px', flexShrink: 0 }}>{prod.stock} units</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab D: Directories & Accounts */}
            {activeAnalysisTab === 'entities' && (
              <div 
                className="tab-content-enter"
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '20px', 
                  width: '100%', 
                  minWidth: 0
                }}
              >
                <div 
                  className={`card${shouldBlink(['customer', 'outstanding', 'receivable', 'dues']) ? ' search-blink-highlight' : ''}`}
                  style={{ padding: '16px', borderRadius: '12px', width: '100%', boxSizing: 'border-box' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Top Customer Outstanding Balances</h4>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-danger)' }}>Receivable Dues</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {outstandingCustomers.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>No outstanding dues.</p>
                    ) : (
                      outstandingCustomers.map((cust) => (
                        <div 
                          key={cust.id} 
                          onClick={() => {
                            setSearchQuery(cust.name);
                            setCurrentTab('customers');
                          }}
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '10px 12px', 
                            backgroundColor: 'var(--bg-app)', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: '8px',
                            gap: '12px',
                            cursor: 'pointer'
                          }}
                          className="hover-scale-subtle"
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cust.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Phone: {cust.phone}</div>
                          </div>
                          <div style={{ fontWeight: 800, color: 'var(--color-danger)', fontSize: '13px', flexShrink: 0 }}>{formatINR(cust.outstanding)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div 
                  className={`card${shouldBlink(['supplier', 'outstanding', 'payables', 'bills']) ? ' search-blink-highlight' : ''}`}
                  style={{ padding: '16px', borderRadius: '12px', width: '100%', boxSizing: 'border-box' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Top Outstanding Payables to Suppliers</h4>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-danger)' }}>Supplier Bills</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {outstandingSuppliers.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>No outstanding payables.</p>
                    ) : (
                      outstandingSuppliers.map((supp) => (
                        <div 
                          key={supp.id} 
                          onClick={() => {
                            setSearchQuery(supp.name);
                            setCurrentTab('suppliers');
                          }}
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '10px 12px', 
                            backgroundColor: 'var(--bg-app)', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: '8px',
                            gap: '12px',
                            cursor: 'pointer'
                          }}
                          className="hover-scale-subtle"
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{supp.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Phone: {supp.phone}</div>
                          </div>
                          <div style={{ fontWeight: 800, color: 'var(--color-danger)', fontSize: '13px', flexShrink: 0 }}>{formatINR(supp.outstanding)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Recent Activity Feed */}
        <div 
          className={`card${shouldBlink(['activity', 'feed', 'logs', 'recent']) ? ' search-blink-highlight' : ''}`}
          style={{ 
            padding: '16px', 
            borderRadius: '12px', 
            display: 'flex', 
            flexDirection: 'column', 
            width: '100%', 
            boxSizing: 'border-box',
            minWidth: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <Activity size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Recent Activity Feed</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
            {recentActivities.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No recent activities logged in this period.</p>
            ) : (
              recentActivities.map((act) => (
                <div 
                  key={act.id} 
                  onClick={() => {
                    if (act.targetTab && act.targetQuery) {
                      setSearchQuery(act.targetQuery);
                      setCurrentTab(act.targetTab);
                    }
                  }}
                  style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    alignItems: 'flex-start', 
                    width: '100%',
                    cursor: (act.targetTab && act.targetQuery) ? 'pointer' : 'default'
                  }}
                  className={(act.targetTab && act.targetQuery) ? 'hover-scale-subtle' : ''}
                >
                  <div 
                    style={{ 
                      padding: '6px', 
                      borderRadius: '8px', 
                      backgroundColor: act.bg,
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {act.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.type}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4, wordBreak: 'break-word' }}>{act.details}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>Date: {new Date(act.time).toLocaleDateString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
