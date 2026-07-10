import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate } from '../utils/dummyData';
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
  Calendar,
  Percent,
  ShoppingBag,
  Package,
  Activity,
  RefreshCw,
  Clock,
} from 'lucide-react';

interface AnimatedCounterProps {
  value: number;
  isCurrency?: boolean;
  isPercent?: boolean;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, isCurrency = false, isPercent = false }) => {
  if (isPercent) {
    return <>{value.toFixed(1)}%</>;
  }
  if (isCurrency) {
    return <>{formatINR(value)}</>;
  }
  return <>{value.toLocaleString()}</>;
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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', fontSize: '11px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: color1 }} />
          <span style={{ color: 'var(--text-secondary)' }}>{label1}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: color2 }} />
          <span style={{ color: 'var(--text-secondary)' }}>{label2}</span>
        </div>
      </div>
      <div 
        style={{ 
          display: 'flex', 
          height: '220px', 
          alignItems: 'flex-end', 
          gap: '12px', 
          borderBottom: '1px solid var(--border-color)', 
          paddingBottom: '8px',
          paddingTop: '20px'
        }}
      >
        {data.map((d, idx) => {
          const h1 = (d.value1 / maxVal) * 100;
          const h2 = (d.value2 / maxVal) * 100;
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
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', width: '100%', height: '100%' }}>
                <div 
                  style={{ 
                    flex: 1, 
                    height: `${Math.max(1, h1)}%`, 
                    backgroundColor: color1, 
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease-out',
                    opacity: d.value1 > 0 ? 0.9 : 0.2
                  }}
                  title={`${label1}: ${formatINR(d.value1)}`}
                />
                <div 
                  style={{ 
                    flex: 1, 
                    height: `${Math.max(1, h2)}%`, 
                    backgroundColor: color2, 
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease-out',
                    opacity: d.value2 > 0 ? 0.9 : 0.2
                  }}
                  title={`${label2}: ${formatINR(d.value2)}`}
                />
              </div>
              <span 
                style={{ 
                  fontSize: '9px', 
                  color: 'var(--text-muted)', 
                  marginTop: '8px', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  maxWidth: '50px',
                  textAlign: 'center' 
                }}
              >
                {d.label}
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
}: {
  label: string;
  value: number;
  max: number;
  formatVal: (v: number) => string;
  color?: string;
}) => {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
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
    setIsCreatingInvoice,
    setIsEnteringPurchase,
    showToast,
  } = useApp();

  // Filters State
  const [filterType, setFilterType] = useState('All');
  const [customRange, setCustomRange] = useState({ start: '2026-06-01', end: '2026-07-31' });
  const [activeKpiTab, setActiveKpiTab] = useState<'financial' | 'payments' | 'gst' | 'inventory'>('financial');
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'sales' | 'profit' | 'inventory' | 'entities'>('sales');

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
    const logs: { id: string; time: string; type: string; details: string; icon: string; bg: string }[] = [];

    // Map Invoices
    stats.filteredInvoices.slice(0, 4).forEach((inv) => {
      logs.push({
        id: `act-${inv.id}`,
        time: inv.date,
        type: 'New Invoice Created',
        details: `Sales Invoice ${inv.invoiceNumber} raised for ${inv.customerName} - Total ${formatINR(inv.grandTotal)}`,
        icon: '💵',
        bg: 'var(--color-success-bg)',
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
      {stats.lowStockCount > 0 && (
        <div className="alert-banner" style={{ marginBottom: '20px' }}>
          <div className="alert-content">
            <AlertTriangle size={18} />
            <span style={{ fontSize: '13px' }}>
              <strong>Inventory Warning:</strong> {stats.lowStockCount} products are below safety limits, and {stats.outOfStockCount} products are completely out of stock.
            </span>
          </div>
          <button className="alert-action-btn" onClick={() => setCurrentTab('inventory')}>
            Reorder Stock
          </button>
        </div>
      )}

      {/* Date Filter & Title Toolbar */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '12px',
          marginBottom: '24px' 
        }}
      >
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Business Intelligence Dashboard</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Real-time summaries calculated directly from local transactions ledger.</p>
        </div>

        {/* Filters Select */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary btn-icon"
            onClick={triggerRefresh}
            title="Recalculate metrics"
            disabled={isRefreshing}
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', display: 'flex', pointerEvents: 'none' }}>
              <Calendar size={14} />
            </span>
            <select
              className="filter-select"
              style={{ paddingLeft: '32px' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="All">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
        </div>
      </div>

      {/* Custom range date-picker */}
      {filterType === 'custom' && (
        <div 
          className="card" 
          style={{ 
            padding: '12px 16px', 
            marginBottom: '20px', 
            display: 'flex', 
            gap: '12px', 
            flexWrap: 'wrap', 
            alignItems: 'center',
            borderRadius: '10px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Start Date:</span>
            <input 
              type="date" 
              className="filter-select" 
              style={{ padding: '6px 10px' }}
              value={customRange.start}
              onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>End Date:</span>
            <input 
              type="date" 
              className="filter-select" 
              style={{ padding: '6px 10px' }}
              value={customRange.end}
              onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* 23 KPI Summary Cards divided into tab panels */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', gap: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button 
            style={{ padding: '8px 12px', border: 'none', background: 'none', fontSize: '13px', fontWeight: activeKpiTab === 'financial' ? 800 : 500, color: activeKpiTab === 'financial' ? 'var(--primary-dark)' : 'var(--text-muted)', borderBottom: activeKpiTab === 'financial' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={() => setActiveKpiTab('financial')}
          >
            Financial Health
          </button>
          <button 
            style={{ padding: '8px 12px', border: 'none', background: 'none', fontSize: '13px', fontWeight: activeKpiTab === 'payments' ? 800 : 500, color: activeKpiTab === 'payments' ? 'var(--primary-dark)' : 'var(--text-muted)', borderBottom: activeKpiTab === 'payments' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={() => setActiveKpiTab('payments')}
          >
            Collections & Book dues
          </button>
          <button 
            style={{ padding: '8px 12px', border: 'none', background: 'none', fontSize: '13px', fontWeight: activeKpiTab === 'gst' ? 800 : 500, color: activeKpiTab === 'gst' ? 'var(--primary-dark)' : 'var(--text-muted)', borderBottom: activeKpiTab === 'gst' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={() => setActiveKpiTab('gst')}
          >
            GST Ledger
          </button>
          <button 
            style={{ padding: '8px 12px', border: 'none', background: 'none', fontSize: '13px', fontWeight: activeKpiTab === 'inventory' ? 800 : 500, color: activeKpiTab === 'inventory' ? 'var(--primary-dark)' : 'var(--text-muted)', borderBottom: activeKpiTab === 'inventory' ? '2px solid var(--primary)' : 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
            onClick={() => setActiveKpiTab('inventory')}
          >
            Inventory & Entity Counts
          </button>
        </div>

        {/* Tab 1: Financial Health */}
        {activeKpiTab === 'financial' && (
          <div className="grid-cols-4" style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div className="kpi-card" onClick={() => setCurrentTab('sales')}>
              <div className="kpi-info">
                <span className="kpi-label">Total Sales Billing</span>
                <span className="kpi-value"><AnimatedCounter value={stats.totalSales} isCurrency /></span>
                <span className="kpi-subtext">Sales inclusive of GST</span>
              </div>
              <div className="kpi-icon-container emerald"><TrendingUp size={20} /></div>
            </div>
            
            <div className="kpi-card" onClick={() => setCurrentTab('sales')}>
              <div className="kpi-info">
                <span className="kpi-label">Taxable Sales Revenue</span>
                <span className="kpi-value"><AnimatedCounter value={stats.totalSalesBase} isCurrency /></span>
                <span className="kpi-subtext">Excluding collected GST</span>
              </div>
              <div className="kpi-icon-container emerald"><TrendingUp size={20} /></div>
            </div>

            <div className="kpi-card" onClick={() => setCurrentTab('purchases')}>
              <div className="kpi-info">
                <span className="kpi-label">Total Purchases Billing</span>
                <span className="kpi-value" style={{ color: 'var(--color-warning-dark)' }}><AnimatedCounter value={stats.totalPurchases} isCurrency /></span>
                <span className="kpi-subtext">Cumulative stock acquisitions</span>
              </div>
              <div className="kpi-icon-container amber"><TrendingDown size={20} /></div>
            </div>

            <div className="kpi-card" onClick={() => setCurrentTab('expenses')}>
              <div className="kpi-info">
                <span className="kpi-label">Total Expenses Spends</span>
                <span className="kpi-value" style={{ color: 'var(--color-danger)' }}><AnimatedCounter value={stats.totalExpenses} isCurrency /></span>
                <span className="kpi-subtext">Operational overhead costs</span>
              </div>
              <div className="kpi-icon-container rose"><TrendingDown size={20} /></div>
            </div>

            <div className="kpi-card">
              <div className="kpi-info">
                <span className="kpi-label">Gross Sales Profit</span>
                <span className="kpi-value" style={{ color: 'var(--color-success-dark)' }}><AnimatedCounter value={stats.grossProfit} isCurrency /></span>
                <span className="kpi-subtext">Sales subtotal minus COGS</span>
              </div>
              <div className="kpi-icon-container emerald"><DollarSign size={20} /></div>
            </div>

            <div className="kpi-card">
              <div className="kpi-info">
                <span className="kpi-label">Net Operating Profit</span>
                <span className="kpi-value" style={{ color: 'var(--color-success-dark)' }}><AnimatedCounter value={stats.netProfit} isCurrency /></span>
                <span className="kpi-subtext">Gross profit minus expenses</span>
              </div>
              <div className="kpi-icon-container emerald"><DollarSign size={20} /></div>
            </div>

            <div className="kpi-card">
              <div className="kpi-info">
                <span className="kpi-label">Gross Profit Margin</span>
                <span className="kpi-value" style={{ color: 'var(--color-info)' }}><AnimatedCounter value={stats.grossProfitMargin} isPercent /></span>
                <span className="kpi-subtext">Efficiency percentage return</span>
              </div>
              <div className="kpi-icon-container blue"><Percent size={20} /></div>
            </div>

            <div className="kpi-card">
              <div className="kpi-info">
                <span className="kpi-label">COGS (Stock Cost)</span>
                <span className="kpi-value"><AnimatedCounter value={stats.cogs} isCurrency /></span>
                <span className="kpi-subtext">Cost price of items sold</span>
              </div>
              <div className="kpi-icon-container rose"><Package size={20} /></div>
            </div>
          </div>
        )}

        {/* Tab 2: Collections & Outstanding */}
        {activeKpiTab === 'payments' && (
          <div className="grid-cols-4" style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div className="kpi-card" onClick={() => setCurrentTab('payments')}>
              <div className="kpi-info">
                <span className="kpi-label">Total Amount Collected</span>
                <span className="kpi-value" style={{ color: 'var(--color-success-dark)' }}><AnimatedCounter value={stats.collectedAmount} isCurrency /></span>
                <span className="kpi-subtext">Total receipts collected</span>
              </div>
              <div className="kpi-icon-container emerald"><ArrowDownLeft size={20} /></div>
            </div>

            <div className="kpi-card" onClick={() => setCurrentTab('sales')}>
              <div className="kpi-info">
                <span className="kpi-label">Outstanding Receivables</span>
                <span className="kpi-value" style={{ color: 'var(--color-danger)' }}><AnimatedCounter value={stats.receivables} isCurrency /></span>
                <span className="kpi-subtext">Dues left on invoices</span>
              </div>
              <div className="kpi-icon-container rose"><Users size={20} /></div>
            </div>

            <div className="kpi-card" onClick={() => setCurrentTab('suppliers')}>
              <div className="kpi-info">
                <span className="kpi-label">Outstanding Payables</span>
                <span className="kpi-value" style={{ color: 'var(--color-danger)' }}><AnimatedCounter value={stats.payables} isCurrency /></span>
                <span className="kpi-subtext">Dues owed to manufacturers</span>
              </div>
              <div className="kpi-icon-container rose"><Truck size={20} /></div>
            </div>

            <div className="kpi-card" onClick={() => setCurrentTab('sales')}>
              <div className="kpi-info">
                <span className="kpi-label">Pending Billing Collection</span>
                <span className="kpi-value" style={{ color: 'var(--color-warning-dark)' }}><AnimatedCounter value={stats.pendingCollection} isCurrency /></span>
                <span className="kpi-subtext">Amount yet to collect</span>
              </div>
              <div className="kpi-icon-container amber"><Clock size={20} /></div>
            </div>
          </div>
        )}

        {/* Tab 3: GST Ledger */}
        {activeKpiTab === 'gst' && (
          <div className="grid-cols-4" style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div className="kpi-card" onClick={() => setCurrentTab('reports')}>
              <div className="kpi-info">
                <span className="kpi-label">Total GST Collected</span>
                <span className="kpi-value" style={{ color: 'var(--color-success-dark)' }}><AnimatedCounter value={stats.gstCollected} isCurrency /></span>
                <span className="kpi-subtext">Output tax collected</span>
              </div>
              <div className="kpi-icon-container emerald"><TrendingUp size={20} /></div>
            </div>

            <div className="kpi-card" onClick={() => setCurrentTab('reports')}>
              <div className="kpi-info">
                <span className="kpi-label">Total GST Paid</span>
                <span className="kpi-value" style={{ color: 'var(--color-warning-dark)' }}><AnimatedCounter value={stats.gstPaid} isCurrency /></span>
                <span className="kpi-subtext">Input tax credit paid</span>
              </div>
              <div className="kpi-icon-container amber"><TrendingDown size={20} /></div>
            </div>

            <div className="kpi-card" onClick={() => setCurrentTab('reports')}>
              <div className="kpi-info">
                <span className="kpi-label">Total GST Liability</span>
                <span className="kpi-value" style={{ color: stats.gstLiability > 0 ? 'var(--color-danger)' : 'inherit' }}><AnimatedCounter value={stats.gstLiability} isCurrency /></span>
                <span className="kpi-subtext">Output minus Input tax</span>
              </div>
              <div className="kpi-icon-container blue"><FileText size={20} /></div>
            </div>

            <div className="kpi-card" onClick={() => setCurrentTab('reports')}>
              <div className="kpi-info">
                <span className="kpi-label">CGST / SGST Share</span>
                <span className="kpi-value"><AnimatedCounter value={stats.gstCollected / 2} isCurrency /></span>
                <span className="kpi-subtext">50% equal split values</span>
              </div>
              <div className="kpi-icon-container blue"><Percent size={20} /></div>
            </div>
          </div>
        )}

        {/* Tab 4: Inventory & Counts */}
        {activeKpiTab === 'inventory' && (
          <div className="grid-cols-4" style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div className="kpi-card" onClick={() => setCurrentTab('inventory')}>
              <div className="kpi-info">
                <span className="kpi-label">Current Stock Value</span>
                <span className="kpi-value" style={{ color: 'var(--primary-dark)' }}><AnimatedCounter value={stats.stockValue} isCurrency /></span>
                <span className="kpi-subtext">Valuation of current stock</span>
              </div>
              <div className="kpi-icon-container emerald"><ShoppingBag size={20} /></div>
            </div>

            <div className="kpi-card" onClick={() => setCurrentTab('inventory')}>
              <div className="kpi-info">
                <span className="kpi-label">Total Items in Stock</span>
                <span className="kpi-value"><AnimatedCounter value={stats.totalInventoryItems} /></span>
                <span className="kpi-subtext">Sum of all individual items</span>
              </div>
              <div className="kpi-icon-container blue"><Package size={20} /></div>
            </div>

            <div className="kpi-card" onClick={() => setCurrentTab('inventory')}>
              <div className="kpi-info">
                <span className="kpi-label">Low Stock Products</span>
                <span className="kpi-value" style={{ color: stats.lowStockCount > 0 ? 'var(--color-danger)' : 'inherit' }}><AnimatedCounter value={stats.lowStockCount} /></span>
                <span className="kpi-subtext">Below safety buffer levels</span>
              </div>
              <div className="kpi-icon-container rose"><AlertTriangle size={20} /></div>
            </div>

            <div className="kpi-card" onClick={() => setCurrentTab('inventory')}>
              <div className="kpi-info">
                <span className="kpi-label">Out of Stock Products</span>
                <span className="kpi-value" style={{ color: stats.outOfStockCount > 0 ? 'var(--color-danger)' : 'inherit' }}><AnimatedCounter value={stats.outOfStockCount} /></span>
                <span className="kpi-subtext">Zero inventory units</span>
              </div>
              <div className="kpi-icon-container rose"><AlertTriangle size={20} /></div>
            </div>

            <div className="kpi-card" onClick={() => setCurrentTab('customers')}>
              <div className="kpi-info">
                <span className="kpi-label">Active Customers</span>
                <span className="kpi-value"><AnimatedCounter value={customers.length} /></span>
                <span className="kpi-subtext">Profiles in directories</span>
              </div>
              <div className="kpi-icon-container blue"><Users size={20} /></div>
            </div>

            <div className="kpi-card" onClick={() => setCurrentTab('suppliers')}>
              <div className="kpi-info">
                <span className="kpi-label">Active Suppliers</span>
                <span className="kpi-value"><AnimatedCounter value={suppliers.length} /></span>
                <span className="kpi-subtext">Suppliers registered</span>
              </div>
              <div className="kpi-icon-container blue"><Truck size={20} /></div>
            </div>

            <div className="kpi-card" onClick={() => setCurrentTab('sales')}>
              <div className="kpi-info">
                <span className="kpi-label">Total Invoices Raised</span>
                <span className="kpi-value"><AnimatedCounter value={stats.invoicesCount} /></span>
                <span className="kpi-subtext">Customer invoices generated</span>
              </div>
              <div className="kpi-icon-container emerald"><FileText size={20} /></div>
            </div>

            <div className="kpi-card">
              <div className="kpi-info">
                <span className="kpi-label">Total Transactions Logs</span>
                <span className="kpi-value"><AnimatedCounter value={stats.totalTransactions} /></span>
                <span className="kpi-subtext">Invoice, bills, receipts, spends</span>
              </div>
              <div className="kpi-icon-container blue"><Activity size={20} /></div>
            </div>
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
            onClick={() => setCurrentTab('payments')}
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
      <div className="grid-main-recent" style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: '24px', marginBottom: '24px' }}>
        {/* Left Side: Dynamic Analytics Tabs */}
        <div>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', gap: '16px' }}>
            <button 
              style={{ padding: '8px 12px', border: 'none', background: 'none', fontSize: '13px', fontWeight: activeAnalysisTab === 'sales' ? 800 : 500, color: activeAnalysisTab === 'sales' ? 'var(--primary-dark)' : 'var(--text-muted)', borderBottom: activeAnalysisTab === 'sales' ? '2px solid var(--primary)' : 'none', cursor: 'pointer' }}
              onClick={() => setActiveAnalysisTab('sales')}
            >
              Sales & Purchases
            </button>
            <button 
              style={{ padding: '8px 12px', border: 'none', background: 'none', fontSize: '13px', fontWeight: activeAnalysisTab === 'profit' ? 800 : 500, color: activeAnalysisTab === 'profit' ? 'var(--primary-dark)' : 'var(--text-muted)', borderBottom: activeAnalysisTab === 'profit' ? '2px solid var(--primary)' : 'none', cursor: 'pointer' }}
              onClick={() => setActiveAnalysisTab('profit')}
            >
              Product Profitability
            </button>
            <button 
              style={{ padding: '8px 12px', border: 'none', background: 'none', fontSize: '13px', fontWeight: activeAnalysisTab === 'inventory' ? 800 : 500, color: activeAnalysisTab === 'inventory' ? 'var(--primary-dark)' : 'var(--text-muted)', borderBottom: activeAnalysisTab === 'inventory' ? '2px solid var(--primary)' : 'none', cursor: 'pointer' }}
              onClick={() => setActiveAnalysisTab('inventory')}
            >
              Stock Status
            </button>
            <button 
              style={{ padding: '8px 12px', border: 'none', background: 'none', fontSize: '13px', fontWeight: activeAnalysisTab === 'entities' ? 800 : 500, color: activeAnalysisTab === 'entities' ? 'var(--primary-dark)' : 'var(--text-muted)', borderBottom: activeAnalysisTab === 'entities' ? '2px solid var(--primary)' : 'none', cursor: 'pointer' }}
              onClick={() => setActiveAnalysisTab('entities')}
            >
              Directories Accounts
            </button>
          </div>

          {/* Analysis Tab A: Sales & Purchases */}
          {activeAnalysisTab === 'sales' && (
            <div className="card" style={{ animation: 'fadeIn 0.2s ease-out' }}>
              <div className="card-title" style={{ marginBottom: '16px' }}>
                <span>Sales Billing vs Purchase Billing Trend</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Latest active periods</span>
              </div>
              <BarChart 
                data={chartData} 
                label1="Total Sales (₹)" 
                label2="Total Purchases (₹)" 
                color1="var(--primary)" 
                color2="#3b82f6" 
              />
            </div>
          )}

          {/* Analysis Tab B: Product Profitability */}
          {activeAnalysisTab === 'profit' && (
            <div className="card" style={{ animation: 'fadeIn 0.2s ease-out', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Top Highly Profitable Products</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {productPerformance.highestProfit.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>No sales data available in selected period.</p>
                  ) : (
                    productPerformance.highestProfit.map((prod, idx) => (
                      <ProgressBar 
                        key={idx} 
                        label={prod.name} 
                        value={prod.profit} 
                        max={stats.grossProfit} 
                        formatVal={(v) => formatINR(v)}
                        color="var(--primary)" 
                      />
                    ))
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Highest Revenue Generating Products</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {productPerformance.highestRevenue.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>No sales data available in selected period.</p>
                  ) : (
                    productPerformance.highestRevenue.map((prod, idx) => (
                      <ProgressBar 
                        key={idx} 
                        label={prod.name} 
                        value={prod.revenue} 
                        max={stats.totalSales} 
                        formatVal={(v) => formatINR(v)}
                        color="#3b82f6" 
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Analysis Tab C: Stock Status */}
          {activeAnalysisTab === 'inventory' && (
            <div className="card" style={{ animation: 'fadeIn 0.2s ease-out' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Fast-Moving Products (Quantity Sold)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {productPerformance.bestSelling.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No sales registered.</p>
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
                      />
                    );
                  })
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Recently Registered Stock Items</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {products.slice(-4).reverse().map((prod) => (
                    <div key={prod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'var(--bg-app)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{prod.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Category: {prod.category} • SKU: {prod.sku}</div>
                      </div>
                      <span className="badge badge-secondary" style={{ fontSize: '11px' }}>{prod.stock} left</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analysis Tab D: Directories Accounts */}
          {activeAnalysisTab === 'entities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.2s ease-out' }}>
              <div className="card">
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Top Customer Outstanding Balances</span>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-danger)' }}>Receivable Dues</span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {outstandingCustomers.map((cust) => (
                    <div key={cust.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700 }}>{cust.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Phone: {cust.phone}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--color-danger)', fontSize: '13px' }}>{formatINR(cust.outstanding)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Top Outstanding Payables to Suppliers</span>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-danger)' }}>Supplier Bills</span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {outstandingSuppliers.map((supp) => (
                    <div key={supp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700 }}>{supp.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Phone: {supp.phone}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--color-danger)', fontSize: '13px' }}>{formatINR(supp.outstanding)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Activity Log Feed */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <Activity size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>Recent Activity Feed</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
            {recentActivities.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No recent activities logged in this period.</p>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div 
                    style={{ 
                      padding: '6px', 
                      borderRadius: '8px', 
                      backgroundColor: act.bg,
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {act.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{act.type}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>{act.details}</div>
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
