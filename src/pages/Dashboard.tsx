import React from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate } from '../utils/dummyData';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Truck,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowRight,
  DollarSign,
  FileText,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    products,
    customers,
    suppliers,
    invoices,
    purchases,
    payments,
    setCurrentTab,
    setIsCreatingInvoice,
    setIsEnteringPurchase,
  } = useApp();

  const todayStr = '2026-07-01'; // Today date matching metadata

  // --- Dynamic Calculations ---
  
  // 1. Today's metrics
  const todaySales = invoices
    .filter((inv) => inv.date === todayStr)
    .reduce((sum, inv) => sum + inv.grandTotal, 0);

  const todayPurchases = purchases
    .filter((pur) => pur.date === todayStr)
    .reduce((sum, pur) => sum + pur.grandTotal, 0);

  // 2. Historical cumulative totals
  const totalSales = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalPurchases = purchases.reduce((sum, pur) => sum + pur.grandTotal, 0);

  // 3. Profit = Taxable sales value minus original purchase cost of products billed
  const totalCOGS = invoices.reduce((sum, inv) => {
    const invCOGS = inv.items.reduce((itemSum, item) => {
      const prod = products.find((p) => p.id === item.productId);
      const cost = prod ? prod.purchasePrice : 0;
      return itemSum + (item.quantity * cost);
    }, 0);
    return sum + invCOGS;
  }, 0);
  const totalSalesBase = invoices.reduce((sum, inv) => sum + inv.subtotal, 0);
  const totalProfit = totalSalesBase - totalCOGS;

  // 4. Outstanding Dues
  const totalCustomerOutstanding = customers.reduce((sum, c) => sum + c.outstanding, 0);
  const totalSupplierOutstanding = suppliers.reduce((sum, s) => sum + s.outstanding, 0);

  // 5. Low stock alerting
  const lowStockItems = products.filter((p) => p.stock <= p.minStock);

  // Recent feeds limits
  const recentSales = invoices.slice(0, 5);
  const recentPurchases = purchases.slice(0, 5);
  const recentPayments = payments.slice(0, 5);

  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="alert-banner">
          <div className="alert-content">
            <AlertTriangle size={20} />
            <span>
              <strong>Low Stock Alert:</strong> {lowStockItems.length} products are running below their designated safety limits.
            </span>
          </div>
          <button className="alert-action-btn" onClick={() => setCurrentTab('inventory')}>
            Manage Inventory
          </button>
        </div>
      )}

      {/* Structured Dashboard KPI Groups */}
      
      {/* Section 1: Today's Operations & Alerts */}
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
        Daily Performance & Alerts
      </h3>
      <div className="grid-cols-3" style={{ marginBottom: '32px' }}>
        {/* Today's Sales */}
        <div className="kpi-card" onClick={() => setCurrentTab('sales')} title="View today's sales invoices">
          <div className="kpi-info">
            <span className="kpi-label">Today's Sales</span>
            <span className="kpi-value" style={{ color: 'var(--color-success-dark)' }}>{formatINR(todaySales)}</span>
            <span className="kpi-subtext">Date: {formatDate(todayStr)}</span>
          </div>
          <div className="kpi-icon-container emerald">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Today's Purchases */}
        <div className="kpi-card" onClick={() => setCurrentTab('purchases')} title="View today's purchase receipts">
          <div className="kpi-info">
            <span className="kpi-label">Today's Purchases</span>
            <span className="kpi-value" style={{ color: 'var(--color-warning-dark)' }}>{formatINR(todayPurchases)}</span>
            <span className="kpi-subtext">Date: {formatDate(todayStr)}</span>
          </div>
          <div className="kpi-icon-container amber">
            <TrendingDown size={24} />
          </div>
        </div>

        {/* Low Stock count */}
        <div className="kpi-card" onClick={() => setCurrentTab('inventory')} title="View low stock products">
          <div className="kpi-info">
            <span className="kpi-label">Low Stock Products</span>
            <span className="kpi-value" style={{ color: lowStockItems.length > 0 ? 'var(--color-danger)' : 'inherit' }}>
              {lowStockItems.length}
            </span>
            <span className="kpi-subtext">Requires procurement order</span>
          </div>
          <div className={`kpi-icon-container ${lowStockItems.length > 0 ? 'rose' : 'emerald'}`}>
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Section 2: Financial Dues Ledger */}
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
        Dues & Dues Recovery
      </h3>
      <div className="grid-cols-2" style={{ marginBottom: '32px' }}>
        {/* Customer Outstanding */}
        <div className="kpi-card" onClick={() => setCurrentTab('customers')} title="View customer directory">
          <div className="kpi-info">
            <span className="kpi-label">Customer Outstanding Balance</span>
            <span className="kpi-value" style={{ color: 'var(--color-danger)' }}>{formatINR(totalCustomerOutstanding)}</span>
            <span className="kpi-subtext">Dues to recover from farmers</span>
          </div>
          <div className="kpi-icon-container rose">
            <Users size={24} />
          </div>
        </div>

        {/* Supplier Outstanding */}
        <div className="kpi-card" onClick={() => setCurrentTab('suppliers')} title="View supplier directory">
          <div className="kpi-info">
            <span className="kpi-label">Supplier Dues (We Owe)</span>
            <span className="kpi-value" style={{ color: 'var(--color-danger)' }}>{formatINR(totalSupplierOutstanding)}</span>
            <span className="kpi-subtext">Dues to pay to manufacturers</span>
          </div>
          <div className="kpi-icon-container rose">
            <Truck size={24} />
          </div>
        </div>
      </div>

      {/* Section 3: Financial Totals */}
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
        Financial Health Summary
      </h3>
      <div className="grid-cols-3" style={{ marginBottom: '32px' }}>
        {/* Total Sales */}
        <div className="kpi-card" onClick={() => setCurrentTab('sales')} title="View sales report">
          <div className="kpi-info">
            <span className="kpi-label">Total Sales Revenue</span>
            <span className="kpi-value">{formatINR(totalSales)}</span>
            <span className="kpi-subtext">Cumulative sales inclusive of tax</span>
          </div>
          <div className="kpi-icon-container emerald">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Total Purchases */}
        <div className="kpi-card" onClick={() => setCurrentTab('purchases')} title="View purchase report">
          <div className="kpi-info">
            <span className="kpi-label">Total Purchase Value</span>
            <span className="kpi-value">{formatINR(totalPurchases)}</span>
            <span className="kpi-subtext">Cumulative inventory inward billings</span>
          </div>
          <div className="kpi-icon-container blue">
            <TrendingDown size={24} />
          </div>
        </div>

        {/* Total Profit */}
        <div className="kpi-card" onClick={() => setCurrentTab('reports')} title="View profit reports">
          <div className="kpi-info">
            <span className="kpi-label">Total Net Profit</span>
            <span className="kpi-value" style={{ color: 'var(--color-success-dark)' }}>{formatINR(totalProfit)}</span>
            <span className="kpi-subtext">Taxable sales revenue minus COGS</span>
          </div>
          <div className="kpi-icon-container emerald">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Main Grid: Feeds and Quick Actions */}
      <div className="grid-main-recent">
        {/* Left Side: Recent Sales & Recent Purchases */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Recent Invoices Table */}
          <div className="card">
            <div className="card-title">
              <span>Recent Sales Invoices</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setCurrentTab('sales')}>
                View All <ArrowRight size={12} style={{ marginLeft: '4px' }} />
              </button>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Customer Name</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Total (₹)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                        No invoices logged.
                      </td>
                    </tr>
                  ) : (
                    recentSales.map((inv) => (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{inv.invoiceNumber}</td>
                        <td>{inv.customerName}</td>
                        <td>{formatDate(inv.date)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatINR(inv.grandTotal).replace('₹', '')}</td>
                        <td>
                          <span className={`badge ${inv.paymentStatus === 'Paid' ? 'badge-success' : inv.paymentStatus === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>
                            {inv.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Purchases Table */}
          <div className="card">
            <div className="card-title">
              <span>Recent Supplier Purchases</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setCurrentTab('purchases')}>
                View All <ArrowRight size={12} style={{ marginLeft: '4px' }} />
              </button>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Bill Number</th>
                    <th>Supplier Name</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Total (₹)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                        No purchases logged.
                      </td>
                    </tr>
                  ) : (
                    recentPurchases.map((pur) => (
                      <tr key={pur.id}>
                        <td style={{ fontWeight: 600, color: 'var(--color-info)' }}>{pur.purchaseNumber}</td>
                        <td>{pur.supplierName}</td>
                        <td>{formatDate(pur.date)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatINR(pur.grandTotal).replace('₹', '')}</td>
                        <td>
                          <span className={`badge ${pur.paymentStatus === 'Paid' ? 'badge-success' : pur.paymentStatus === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>
                            {pur.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Tasks & Payments Book */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Quick Tasks */}
          <div className="card">
            <h3 className="card-title">Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={() => {
                  setCurrentTab('sales');
                  setIsCreatingInvoice(true);
                }}
              >
                <PlusCircle size={18} />
                <span>New Sales Invoice</span>
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={() => {
                  setCurrentTab('purchases');
                  setIsEnteringPurchase(true);
                }}
              >
                <PlusCircle size={18} />
                <span>New Purchase Entry</span>
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={() => setCurrentTab('payments')}
              >
                <ArrowRightLeft size={18} />
                <span>Record Payment receipt</span>
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={() => setCurrentTab('reports')}
              >
                <FileText size={18} />
                <span>GST & Profit Reports</span>
              </button>
            </div>
          </div>

          {/* Recent Payments Feed */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-title">
              <span>Transaction Cash Book</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setCurrentTab('payments')}>
                View All <ArrowRight size={12} style={{ marginLeft: '4px' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
              {recentPayments.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0' }}>
                  No payments logged yet.
                </div>
              ) : (
                recentPayments.map((pay) => (
                  <div
                    key={pay.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingBottom: '12px',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          padding: '6px',
                          borderRadius: '50%',
                          backgroundColor: pay.type === 'CustomerReceipt' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                          color: pay.type === 'CustomerReceipt' ? 'var(--color-success-dark)' : 'var(--color-danger-dark)',
                        }}
                      >
                        {pay.type === 'CustomerReceipt' ? (
                          <ArrowDownLeft size={16} />
                        ) : (
                          <ArrowUpRight size={16} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{pay.contactName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {formatDate(pay.date)} • {pay.paymentMethod}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '14px',
                        color: pay.type === 'CustomerReceipt' ? 'var(--color-success-dark)' : 'var(--color-danger-dark)',
                      }}
                    >
                      {pay.type === 'CustomerReceipt' ? '+' : '-'} {formatINR(pay.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
