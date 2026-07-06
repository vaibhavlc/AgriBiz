import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate } from '../utils/dummyData';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  Layers,
  Percent,
  FileText,
  Printer,
  Download,
  Users,
  Truck,
  BookOpen,
} from 'lucide-react';

export const Reports: React.FC = () => {
  const {
    invoices,
    purchases,
    products,
    customers,
    suppliers,
  } = useApp();

  const [activeReport, setActiveReport] = useState<'sales' | 'purchase' | 'profit' | 'stock' | 'gst' | 'custLedger' | 'suppLedger'>('sales');
  
  // Date filtering state
  const [dateRange, setDateRange] = useState('All');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-07-01');

  // Filter callback
  const filterByDate = (dateStr: string) => {
    if (dateRange === 'All') return true;
    const date = new Date(dateStr).getTime();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return date >= start && date <= end;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    alert(`Mock: Report data exported to Excel/CSV format!`);
  };

  // --- Reports calculations ---

  // 1. Sales Report
  const filteredInvoices = invoices.filter((inv) => filterByDate(inv.date));
  const totalSalesVal = filteredInvoices.reduce((s, i) => s + i.grandTotal, 0);
  const totalSalesTax = filteredInvoices.reduce((s, i) => s + i.gstTotal, 0);
  const totalSalesBase = filteredInvoices.reduce((s, i) => s + i.subtotal - i.discountTotal, 0);

  // 2. Purchase Report
  const filteredPurchases = purchases.filter((pur) => filterByDate(pur.date));
  const totalPurchasesVal = filteredPurchases.reduce((s, i) => s + i.grandTotal, 0);
  const totalPurchasesTax = filteredPurchases.reduce((s, i) => s + i.gstTotal, 0);
  const totalPurchasesBase = filteredPurchases.reduce((s, i) => s + i.subtotal, 0);

  // 3. Profit Report
  // Profit = Taxable sales (revenue) minus COGS
  const coGS = filteredInvoices.reduce((sum, inv) => {
    const invCOGS = inv.items.reduce((invSum, item) => {
      const prod = products.find((p) => p.id === item.productId);
      const cost = prod ? prod.purchasePrice : 0;
      return invSum + (item.quantity * cost);
    }, 0);
    return sum + invCOGS;
  }, 0);
  const grossProfit = totalSalesBase - coGS;
  const profitMarginPercent = totalSalesBase > 0 ? (grossProfit / totalSalesBase) * 100 : 0;

  // 4. Stock Valuation Report
  // Valued at purchase price (assets) and selling price (potential value)
  const totalStockQty = products.reduce((s, p) => s + p.stock, 0);
  const totalAssetVal = products.reduce((s, p) => s + (p.stock * p.purchasePrice), 0);
  const totalRetailVal = products.reduce((s, p) => s + (p.stock * p.sellingPrice), 0);

  // 5. GST Report (Tax filing summary)
  // GSTR-1 (Output tax collected) vs GSTR-2 (Input tax credit paid)
  const totalCGSTCollected = totalSalesTax / 2;
  const totalSGSTCollected = totalSalesTax / 2;
  const totalCGSTPaid = totalPurchasesTax / 2;
  const totalSGSTPaid = totalPurchasesTax / 2;
  const netGSTDue = totalSalesTax - totalPurchasesTax;

  // --- Rendering sub-sheets ---

  const renderReportContent = () => {
    switch (activeReport) {
      case 'sales':
        return (
          <div>
            <div className="grid-cols-3" style={{ marginBottom: '24px' }}>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Sales Invoices Count</span>
                  <span className="kpi-value">{filteredInvoices.length}</span>
                  <span className="kpi-subtext">Tax bills generated</span>
                </div>
                <div className="kpi-icon-container emerald"><BookOpen size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Total Taxable Sales</span>
                  <span className="kpi-value">{formatINR(totalSalesBase)}</span>
                  <span className="kpi-subtext">Excludes GST tax</span>
                </div>
                <div className="kpi-icon-container emerald"><DollarSign size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Total Invoice Value</span>
                  <span className="kpi-value" style={{ color: 'var(--primary-dark)' }}>{formatINR(totalSalesVal)}</span>
                  <span className="kpi-subtext">Inclusive of GST</span>
                </div>
                <div className="kpi-icon-container emerald"><TrendingUp size={20} /></div>
              </div>
            </div>

            {/* Desktop View */}
            <div className="desktop-only-table">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice No</th>
                      <th>Customer Name</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Taxable Amt (₹)</th>
                      <th style={{ textAlign: 'right' }}>Tax collected (₹)</th>
                      <th style={{ textAlign: 'right' }}>Grand Total (₹)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{inv.invoiceNumber}</td>
                        <td>{inv.customerName}</td>
                        <td>{formatDate(inv.date)}</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(inv.subtotal - inv.discountTotal).replace('₹', '')}</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(inv.gstTotal).replace('₹', '')}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatINR(inv.grandTotal).replace('₹', '')}</td>
                        <td>
                          <span className={`badge ${inv.paymentStatus === 'Paid' ? 'badge-success' : inv.paymentStatus === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>
                            {inv.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                      <td colSpan={3}>Report Summary Total:</td>
                      <td style={{ textAlign: 'right' }}>{formatINR(totalSalesBase).replace('₹', '')}</td>
                      <td style={{ textAlign: 'right' }}>{formatINR(totalSalesTax).replace('₹', '')}</td>
                      <td style={{ textAlign: 'right' }}>{formatINR(totalSalesVal).replace('₹', '')}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View */}
            <div className="mobile-card-list">
              {filteredInvoices.map((inv) => (
                <div key={inv.id} className="mobile-list-card">
                  <div className="mobile-list-card-header">
                    <div>
                      <h4 className="mobile-list-card-title">{inv.invoiceNumber}</h4>
                      <span className="mobile-list-card-subtitle">{inv.customerName}</span>
                    </div>
                    <span className={`badge ${inv.paymentStatus === 'Paid' ? 'badge-success' : inv.paymentStatus === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>
                      {inv.paymentStatus}
                    </span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Date</span>
                    <span className="mobile-list-card-val">{formatDate(inv.date)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Taxable Amt</span>
                    <span className="mobile-list-card-val">{formatINR(inv.subtotal - inv.discountTotal)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Tax Collected</span>
                    <span className="mobile-list-card-val">{formatINR(inv.gstTotal)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Grand Total</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(inv.grandTotal)}</span>
                  </div>
                </div>
              ))}
              
              <div className="mobile-list-card" style={{ borderLeftColor: 'var(--primary-dark)', background: 'var(--bg-app)' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Report Summary Total</div>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label">Total Taxable</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(totalSalesBase)}</span>
                </div>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label">Total Tax</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(totalSalesTax)}</span>
                </div>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label">Total Value</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 800, color: 'var(--primary-dark)', fontSize: '15px' }}>{formatINR(totalSalesVal)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'purchase':
        return (
          <div>
            <div className="grid-cols-3" style={{ marginBottom: '24px' }}>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Bills logged</span>
                  <span className="kpi-value">{filteredPurchases.length}</span>
                  <span className="kpi-subtext">Supplier inward vouchers</span>
                </div>
                <div className="kpi-icon-container blue"><BookOpen size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Total Base Purchases</span>
                  <span className="kpi-value">{formatINR(totalPurchasesBase)}</span>
                  <span className="kpi-subtext">Taxable raw cost</span>
                </div>
                <div className="kpi-icon-container blue"><DollarSign size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Total Outward Cost</span>
                  <span className="kpi-value" style={{ color: 'var(--color-danger-dark)' }}>{formatINR(totalPurchasesVal)}</span>
                  <span className="kpi-subtext">Inclusive of GST</span>
                </div>
                <div className="kpi-icon-container rose"><TrendingDown size={20} /></div>
              </div>
            </div>

            {/* Desktop View */}
            <div className="desktop-only-table">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Bill Number</th>
                      <th>Supplier Name</th>
                      <th>Receipt Date</th>
                      <th style={{ textAlign: 'right' }}>Base Cost (₹)</th>
                      <th style={{ textAlign: 'right' }}>Tax paid (₹)</th>
                      <th style={{ textAlign: 'right' }}>Total Cost (₹)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchases.map((pur) => (
                      <tr key={pur.id}>
                        <td style={{ fontWeight: 600, color: 'var(--color-info)' }}>{pur.purchaseNumber}</td>
                        <td>{pur.supplierName}</td>
                        <td>{formatDate(pur.date)}</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(pur.subtotal).replace('₹', '')}</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(pur.gstTotal).replace('₹', '')}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatINR(pur.grandTotal).replace('₹', '')}</td>
                        <td>
                          <span className={`badge ${pur.paymentStatus === 'Paid' ? 'badge-success' : pur.paymentStatus === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>
                            {pur.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                      <td colSpan={3}>Report Summary Total:</td>
                      <td style={{ textAlign: 'right' }}>{formatINR(totalPurchasesBase).replace('₹', '')}</td>
                      <td style={{ textAlign: 'right' }}>{formatINR(totalPurchasesTax).replace('₹', '')}</td>
                      <td style={{ textAlign: 'right' }}>{formatINR(totalPurchasesVal).replace('₹', '')}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View */}
            <div className="mobile-card-list">
              {filteredPurchases.map((pur) => (
                <div key={pur.id} className="mobile-list-card">
                  <div className="mobile-list-card-header">
                    <div>
                      <h4 className="mobile-list-card-title">{pur.purchaseNumber}</h4>
                      <span className="mobile-list-card-subtitle">{pur.supplierName}</span>
                    </div>
                    <span className={`badge ${pur.paymentStatus === 'Paid' ? 'badge-success' : pur.paymentStatus === 'Partial' ? 'badge-warning' : 'badge-danger'}`}>
                      {pur.paymentStatus}
                    </span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Receipt Date</span>
                    <span className="mobile-list-card-val">{formatDate(pur.date)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Base Cost</span>
                    <span className="mobile-list-card-val">{formatINR(pur.subtotal)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Tax Paid</span>
                    <span className="mobile-list-card-val">{formatINR(pur.gstTotal)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Total Cost</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(pur.grandTotal)}</span>
                  </div>
                </div>
              ))}
              
              <div className="mobile-list-card" style={{ borderLeftColor: 'var(--color-info)', background: 'var(--bg-app)' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Report Summary Total</div>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label">Total Base</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(totalPurchasesBase)}</span>
                </div>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label">Total Tax</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(totalPurchasesTax)}</span>
                </div>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label">Total Cost</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 800, color: 'var(--color-danger-dark)', fontSize: '15px' }}>{formatINR(totalPurchasesVal)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'profit':
        return (
          <div>
            <div className="grid-cols-3" style={{ marginBottom: '24px' }}>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Sales Revenue (Taxable)</span>
                  <span className="kpi-value">{formatINR(totalSalesBase)}</span>
                  <span className="kpi-subtext">Goods value dispatched</span>
                </div>
                <div className="kpi-icon-container emerald"><TrendingUp size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Cost of Goods Sold (COGS)</span>
                  <span className="kpi-value">{formatINR(coGS)}</span>
                  <span className="kpi-subtext">Original inventory purchase cost</span>
                </div>
                <div className="kpi-icon-container rose"><TrendingDown size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Gross Net Margin</span>
                  <span className="kpi-value" style={{ color: 'var(--primary-dark)' }}>{formatINR(grossProfit)}</span>
                  <span className="kpi-subtext">Profit percentage: {profitMarginPercent.toFixed(1)}%</span>
                </div>
                <div className="kpi-icon-container emerald"><Percent size={20} /></div>
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '14px' }}>Sales Profit Breakdown by Invoices</h4>
              {/* Desktop View */}
              <div className="desktop-only-table">
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Invoice No</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th style={{ textAlign: 'right' }}>Taxable Sales (₹)</th>
                        <th style={{ textAlign: 'right' }}>Cost Price (₹)</th>
                        <th style={{ textAlign: 'right' }}>Net Profit (₹)</th>
                        <th style={{ textAlign: 'center' }}>Margin (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((inv) => {
                        const invoiceCOGS = inv.items.reduce((s, i) => {
                          const cost = products.find((p) => p.id === i.productId)?.purchasePrice || 0;
                          return s + (i.quantity * cost);
                        }, 0);
                        const invProfit = inv.subtotal - invoiceCOGS;
                        const invMargin = inv.subtotal > 0 ? (invProfit / inv.subtotal) * 100 : 0;

                        return (
                          <tr key={inv.id}>
                            <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{inv.invoiceNumber}</td>
                            <td>{formatDate(inv.date)}</td>
                            <td>{inv.customerName}</td>
                            <td style={{ textAlign: 'right' }}>{formatINR(inv.subtotal).replace('₹', '')}</td>
                            <td style={{ textAlign: 'right' }}>{formatINR(invoiceCOGS).replace('₹', '')}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: invProfit >= 0 ? 'var(--color-success-dark)' : 'var(--color-danger-dark)' }}>
                              {formatINR(invProfit).replace('₹', '')}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>{invMargin.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                      <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                        <td colSpan={3}>Report Summary Total:</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(totalSalesBase).replace('₹', '')}</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(coGS).replace('₹', '')}</td>
                        <td style={{ textAlign: 'right', color: 'var(--primary-dark)' }}>{formatINR(grossProfit).replace('₹', '')}</td>
                        <td style={{ textAlign: 'center' }}>{profitMarginPercent.toFixed(1)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View */}
              <div className="mobile-card-list">
                {filteredInvoices.map((inv) => {
                  const invoiceCOGS = inv.items.reduce((s, i) => {
                    const cost = products.find((p) => p.id === i.productId)?.purchasePrice || 0;
                    return s + (i.quantity * cost);
                  }, 0);
                  const invProfit = inv.subtotal - invoiceCOGS;
                  const invMargin = inv.subtotal > 0 ? (invProfit / inv.subtotal) * 100 : 0;

                  return (
                    <div key={inv.id} className="mobile-list-card">
                      <div className="mobile-list-card-header">
                        <div>
                          <h4 className="mobile-list-card-title">{inv.invoiceNumber}</h4>
                          <span className="mobile-list-card-subtitle">{inv.customerName}</span>
                        </div>
                        <span className="badge" style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>{invMargin.toFixed(1)}% Margin</span>
                      </div>
                      <div className="mobile-list-card-row">
                        <span className="mobile-list-card-label">Date</span>
                        <span className="mobile-list-card-val">{formatDate(inv.date)}</span>
                      </div>
                      <div className="mobile-list-card-row">
                        <span className="mobile-list-card-label">Taxable Sales</span>
                        <span className="mobile-list-card-val">{formatINR(inv.subtotal)}</span>
                      </div>
                      <div className="mobile-list-card-row">
                        <span className="mobile-list-card-label">Cost Price</span>
                        <span className="mobile-list-card-val">{formatINR(invoiceCOGS)}</span>
                      </div>
                      <div className="mobile-list-card-row">
                        <span className="mobile-list-card-label">Net Profit</span>
                        <span className="mobile-list-card-val" style={{ fontWeight: 700, color: invProfit >= 0 ? 'var(--color-success-dark)' : 'var(--color-danger-dark)' }}>{formatINR(invProfit)}</span>
                      </div>
                    </div>
                  );
                })}
                
                <div className="mobile-list-card" style={{ borderLeftColor: 'var(--primary-dark)', background: 'var(--bg-app)' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Report Summary Total</div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Total Sales</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(totalSalesBase)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Total Cost</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(coGS)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Total Profit</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 800, color: 'var(--primary-dark)', fontSize: '15px' }}>{formatINR(grossProfit)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Average Margin</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 800 }}>{profitMarginPercent.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'stock':
        return (
          <div>
            <div className="grid-cols-3" style={{ marginBottom: '24px' }}>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Total Stock Quantity</span>
                  <span className="kpi-value">{totalStockQty} items</span>
                  <span className="kpi-subtext">Available in warehouse</span>
                </div>
                <div className="kpi-icon-container blue"><Layers size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Stock Valuation (Asset Cost)</span>
                  <span className="kpi-value" style={{ color: 'var(--primary-dark)' }}>{formatINR(totalAssetVal)}</span>
                  <span className="kpi-subtext">Valued at base purchase price</span>
                </div>
                <div className="kpi-icon-container emerald"><DollarSign size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Potential Value (Retail)</span>
                  <span className="kpi-value">{formatINR(totalRetailVal)}</span>
                  <span className="kpi-subtext">Valued at sales retail price</span>
                </div>
                <div className="kpi-icon-container blue"><TrendingUp size={20} /></div>
              </div>
            </div>

            {/* Desktop View */}
            <div className="desktop-only-table">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>SKU Code</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th style={{ textAlign: 'center' }}>Available Qty</th>
                      <th style={{ textAlign: 'right' }}>Cost Price (₹)</th>
                      <th style={{ textAlign: 'right' }}>Asset Valuation (₹)</th>
                      <th style={{ textAlign: 'right' }}>Retail Rate (₹)</th>
                      <th style={{ textAlign: 'right' }}>Retail Valuation (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => {
                      const itemAssetVal = p.stock * p.purchasePrice;
                      const itemRetailVal = p.stock * p.sellingPrice;
                      return (
                        <tr key={p.id}>
                          <td style={{ fontFamily: 'monospace' }}>{p.sku}</td>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td>{p.category}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{p.stock}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(p.purchasePrice).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatINR(itemAssetVal).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(p.sellingPrice).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(itemRetailVal).replace('₹', '')}</td>
                        </tr>
                      );
                    })}
                    <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                      <td colSpan={3}>Stock Summary Total:</td>
                      <td style={{ textAlign: 'center' }}>{totalStockQty}</td>
                      <td></td>
                      <td style={{ textAlign: 'right' }}>{formatINR(totalAssetVal).replace('₹', '')}</td>
                      <td></td>
                      <td style={{ textAlign: 'right' }}>{formatINR(totalRetailVal).replace('₹', '')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View */}
            <div className="mobile-card-list">
              {products.map((p) => {
                const itemAssetVal = p.stock * p.purchasePrice;
                const itemRetailVal = p.stock * p.sellingPrice;
                return (
                  <div key={p.id} className="mobile-list-card">
                    <div className="mobile-list-card-header">
                      <div>
                        <h4 className="mobile-list-card-title">{p.name}</h4>
                        <span className="mobile-list-card-subtitle">{p.category} • SKU: {p.sku}</span>
                      </div>
                      <span className="badge badge-info" style={{ fontWeight: 700 }}>{p.stock} Units</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Cost / Retail Rate</span>
                      <span className="mobile-list-card-val">{formatINR(p.purchasePrice)} / {formatINR(p.sellingPrice)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Asset Valuation</span>
                      <span className="mobile-list-card-val" style={{ fontWeight: 600 }}>{formatINR(itemAssetVal)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Retail Valuation</span>
                      <span className="mobile-list-card-val" style={{ fontWeight: 600 }}>{formatINR(itemRetailVal)}</span>
                    </div>
                  </div>
                );
              })}
              
              <div className="mobile-list-card" style={{ borderLeftColor: 'var(--primary-dark)', background: 'var(--bg-app)' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Stock Summary Total</div>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label">Total Qty</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{totalStockQty} items</span>
                </div>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label">Total Asset Value</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>{formatINR(totalAssetVal)}</span>
                </div>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label">Total Retail Value</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 800 }}>{formatINR(totalRetailVal)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'gst':
        return (
          <div>
            {/* GST Summary metrics */}
            <div className="grid-cols-3" style={{ marginBottom: '24px' }}>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Output GST (Collected)</span>
                  <span className="kpi-value" style={{ color: 'var(--color-success-dark)' }}>{formatINR(totalSalesTax)}</span>
                  <span className="kpi-subtext">CGST: {formatINR(totalCGSTCollected)} | SGST: {formatINR(totalSGSTCollected)}</span>
                </div>
                <div className="kpi-icon-container emerald"><TrendingUp size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Input GST (ITC Paid)</span>
                  <span className="kpi-value" style={{ color: 'var(--color-info-dark)' }}>{formatINR(totalPurchasesTax)}</span>
                  <span className="kpi-subtext">CGST: {formatINR(totalCGSTPaid)} | SGST: {formatINR(totalSGSTPaid)}</span>
                </div>
                <div className="kpi-icon-container blue"><TrendingDown size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Net GST Liability</span>
                  <span className="kpi-value" style={{ color: netGSTDue >= 0 ? 'var(--color-danger)' : 'var(--color-success-dark)' }}>
                    {formatINR(netGSTDue)}
                  </span>
                  <span className="kpi-subtext">{netGSTDue >= 0 ? 'Cash Payable to Govt' : 'Carry Forward Credit'}</span>
                </div>
                <div className="kpi-icon-container rose"><Percent size={20} /></div>
              </div>
            </div>

            {/* GST summary log */}
            <div className="card">
              <h3 className="card-title">GSTR Summary Ledger Logs</h3>
              <div className="table-wrapper">
              {/* Desktop View */}
              <div className="desktop-only-table">
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Transaction Type</th>
                        <th>Document Count</th>
                        <th style={{ textAlign: 'right' }}>Goods Value (Base cost)</th>
                        <th style={{ textAlign: 'right' }}>Central GST (CGST)</th>
                        <th style={{ textAlign: 'right' }}>State GST (SGST)</th>
                        <th style={{ textAlign: 'right' }}>Total Tax Liability (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600, color: 'var(--color-success-dark)' }}>Outward Supply (Sales Invoices)</td>
                        <td>{filteredInvoices.length}</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(totalSalesBase).replace('₹', '')}</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(totalCGSTCollected).replace('₹', '')}</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(totalSGSTCollected).replace('₹', '')}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-success-dark)' }}>
                          {formatINR(totalSalesTax).replace('₹', '')}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                        <td style={{ fontWeight: 600, color: 'var(--color-info-dark)' }}>Inward Supply (Supplier Bills)</td>
                        <td>{filteredPurchases.length}</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(totalPurchasesBase).replace('₹', '')}</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(totalCGSTPaid).replace('₹', '')}</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(totalSGSTPaid).replace('₹', '')}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-info-dark)' }}>
                          {formatINR(totalPurchasesTax).replace('₹', '')}
                        </td>
                      </tr>
                      <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                        <td colSpan={2}>Net Payable Tax Dues:</td>
                        <td style={{ textAlign: 'right' }}>{formatINR(totalSalesBase - totalPurchasesBase).replace('₹', '')}</td>
                        <td style={{ textAlign: 'right' , color: netGSTDue >= 0 ? 'var(--color-danger)' : 'var(--color-success-dark)' }}>
                          {formatINR(totalCGSTCollected - totalCGSTPaid).replace('₹', '')}
                        </td>
                        <td style={{ textAlign: 'right' , color: netGSTDue >= 0 ? 'var(--color-danger)' : 'var(--color-success-dark)' }}>
                          {formatINR(totalSGSTCollected - totalSGSTPaid).replace('₹', '')}
                        </td>
                        <td style={{ textAlign: 'right' , color: netGSTDue >= 0 ? 'var(--color-danger)' : 'var(--color-success-dark)' }}>
                          {formatINR(netGSTDue).replace('₹', '')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View */}
              <div className="mobile-card-list">
                <div className="mobile-list-card" style={{ borderLeftColor: 'var(--color-success-dark)' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--color-success-dark)' }}>Outward Supply (Sales)</div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Document Count</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 600 }}>{filteredInvoices.length}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Goods Value (Base)</span>
                    <span className="mobile-list-card-val">{formatINR(totalSalesBase)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">CGST collected</span>
                    <span className="mobile-list-card-val">{formatINR(totalCGSTCollected)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">SGST collected</span>
                    <span className="mobile-list-card-val">{formatINR(totalSGSTCollected)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Total Output GST</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700, color: 'var(--color-success-dark)' }}>{formatINR(totalSalesTax)}</span>
                  </div>
                </div>

                <div className="mobile-list-card" style={{ borderLeftColor: 'var(--color-info-dark)' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--color-info-dark)' }}>Inward Supply (Purchases)</div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Document Count</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 600 }}>{filteredPurchases.length}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Goods Value (Base)</span>
                    <span className="mobile-list-card-val">{formatINR(totalPurchasesBase)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">CGST Paid</span>
                    <span className="mobile-list-card-val">{formatINR(totalCGSTPaid)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">SGST Paid</span>
                    <span className="mobile-list-card-val">{formatINR(totalSGSTPaid)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Total Input ITC</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700, color: 'var(--color-info-dark)' }}>{formatINR(totalPurchasesTax)}</span>
                  </div>
                </div>

                <div className="mobile-list-card" style={{ borderLeftColor: netGSTDue >= 0 ? 'var(--color-danger)' : 'var(--color-success-dark)', background: 'var(--bg-app)' }}>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: 'var(--text-primary)' }}>Net Payable Tax Dues</div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Net Goods Difference</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 600 }}>{formatINR(totalSalesBase - totalPurchasesBase)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Net CGST</span>
                    <span className="mobile-list-card-val" style={{ color: netGSTDue >= 0 ? 'var(--color-danger)' : 'var(--color-success-dark)' }}>{formatINR(totalCGSTCollected - totalCGSTPaid)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Net SGST</span>
                    <span className="mobile-list-card-val" style={{ color: netGSTDue >= 0 ? 'var(--color-danger)' : 'var(--color-success-dark)' }}>{formatINR(totalSGSTCollected - totalSGSTPaid)}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Net Liability</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 800, color: netGSTDue >= 0 ? 'var(--color-danger)' : 'var(--color-success-dark)', fontSize: '15px' }}>{formatINR(netGSTDue)}</span>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        );

      case 'custLedger':
        return (
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '14px' }}>Customer Outstanding Summary Ledger</h4>
            {/* Desktop View */}
            <div className="desktop-only-table">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer ID</th>
                      <th>Customer Name</th>
                      <th>Phone / Contact</th>
                      <th>GSTIN Identification</th>
                      <th style={{ textAlign: 'right' }}>Outstanding Balance (₹)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontFamily: 'monospace' }}>{c.id}</td>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td>{c.phone}</td>
                        <td style={{ fontFamily: 'monospace' }}>{c.gstin || '—'}</td>
                        <td
                          style={{
                            textAlign: 'right',
                            fontWeight: 700,
                            color: c.outstanding > 0 ? 'var(--color-danger)' : c.outstanding < 0 ? 'var(--color-success-dark)' : 'inherit',
                          }}
                        >
                          {formatINR(c.outstanding)}
                        </td>
                        <td>
                          <span className={`badge ${c.outstanding === 0 ? 'badge-success' : c.outstanding > 0 ? 'badge-warning' : 'badge-info'}`}>
                            {c.outstanding === 0 ? 'Settled' : c.outstanding > 0 ? 'Dues Pending' : 'Advance Credit'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                      <td colSpan={4}>Accumulated Customer Dues:</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>
                        {formatINR(customers.reduce((s, c) => s + c.outstanding, 0))}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View */}
            <div className="mobile-card-list">
              {customers.map((c) => (
                <div key={c.id} className="mobile-list-card">
                  <div className="mobile-list-card-header">
                    <div>
                      <h4 className="mobile-list-card-title">{c.name}</h4>
                      <span className="mobile-list-card-subtitle">ID: {c.id} • {c.phone}</span>
                    </div>
                    <span className={`badge ${c.outstanding === 0 ? 'badge-success' : c.outstanding > 0 ? 'badge-warning' : 'badge-info'}`}>
                      {c.outstanding === 0 ? 'Settled' : c.outstanding > 0 ? 'Dues Pending' : 'Advance Credit'}
                    </span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">GSTIN</span>
                    <span className="mobile-list-card-val" style={{ fontFamily: 'monospace' }}>{c.gstin || '—'}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Outstanding Balance</span>
                    <span className="mobile-list-card-val" style={{
                      fontWeight: 700,
                      color: c.outstanding > 0 ? 'var(--color-danger)' : c.outstanding < 0 ? 'var(--color-success-dark)' : 'inherit',
                    }}>{formatINR(c.outstanding)}</span>
                  </div>
                </div>
              ))}
              
              <div className="mobile-list-card" style={{ borderLeftColor: 'var(--color-danger)', background: 'var(--bg-app)' }}>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label" style={{ fontWeight: 700 }}>Accumulated Customer Dues</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 800, color: 'var(--color-danger)', fontSize: '15px' }}>
                    {formatINR(customers.reduce((s, c) => s + c.outstanding, 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'suppLedger':
        return (
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: '14px' }}>Supplier Payable Summary Ledger</h4>
            {/* Desktop View */}
            <div className="desktop-only-table">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Supplier ID</th>
                      <th>Company / Supplier Name</th>
                      <th>Phone / Contact</th>
                      <th>GSTIN Identification</th>
                      <th style={{ textAlign: 'right' }}>Balance Owed (₹)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontFamily: 'monospace' }}>{s.id}</td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.phone}</td>
                        <td style={{ fontFamily: 'monospace' }}>{s.gstin || '—'}</td>
                        <td
                          style={{
                            textAlign: 'right',
                            fontWeight: 700,
                            color: s.outstanding > 0 ? 'var(--color-danger)' : 'inherit',
                          }}
                        >
                          {formatINR(s.outstanding)}
                        </td>
                        <td>
                          <span className={`badge ${s.outstanding === 0 ? 'badge-success' : 'badge-warning'}`}>
                            {s.outstanding === 0 ? 'Settled' : 'Payable Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 700, backgroundColor: 'var(--bg-app)' }}>
                      <td colSpan={4}>Accumulated We Owe Suppliers:</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>
                        {formatINR(suppliers.reduce((sum, s) => sum + s.outstanding, 0))}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View */}
            <div className="mobile-card-list">
              {suppliers.map((s) => (
                <div key={s.id} className="mobile-list-card">
                  <div className="mobile-list-card-header">
                    <div>
                      <h4 className="mobile-list-card-title">{s.name}</h4>
                      <span className="mobile-list-card-subtitle">ID: {s.id} • {s.phone}</span>
                    </div>
                    <span className={`badge ${s.outstanding === 0 ? 'badge-success' : 'badge-warning'}`}>
                      {s.outstanding === 0 ? 'Settled' : 'Payable Pending'}
                    </span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">GSTIN</span>
                    <span className="mobile-list-card-val" style={{ fontFamily: 'monospace' }}>{s.gstin || '—'}</span>
                  </div>
                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Balance Owed</span>
                    <span className="mobile-list-card-val" style={{
                      fontWeight: 700,
                      color: s.outstanding > 0 ? 'var(--color-danger)' : 'inherit',
                    }}>{formatINR(s.outstanding)}</span>
                  </div>
                </div>
              ))}
              
              <div className="mobile-list-card" style={{ borderLeftColor: 'var(--color-danger)', background: 'var(--bg-app)' }}>
                <div className="mobile-list-card-row">
                  <span className="mobile-list-card-label" style={{ fontWeight: 700 }}>Accumulated Owed Balance</span>
                  <span className="mobile-list-card-val" style={{ fontWeight: 800, color: 'var(--color-danger)', fontSize: '15px' }}>
                    {formatINR(suppliers.reduce((sum, s) => sum + s.outstanding, 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const reportTabs = [
    { id: 'sales', label: 'Sales Report', icon: <FileText size={18} /> },
    { id: 'purchase', label: 'Purchase Report', icon: <FileText size={18} /> },
    { id: 'profit', label: 'Profit & Loss Summary', icon: <Briefcase size={18} /> },
    { id: 'stock', label: 'Stock Asset Value', icon: <Layers size={18} /> },
    { id: 'gst', label: 'GST Tax Summary', icon: <Percent size={18} /> },
    { id: 'custLedger', label: 'Customer Dues Ledger', icon: <Users size={18} /> },
    { id: 'suppLedger', label: 'Supplier Payables Ledger', icon: <Truck size={18} /> },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* Top filter row */}
      <div className="filters-row-unified no-print">
        <div className="filters-group-one">
          {/* Preset Ranges */}
          <select className="filter-select" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="All">All Historical Records</option>
            <option value="Custom">Custom Date Range</option>
          </select>

          {dateRange === 'Custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="date"
                className="filter-select"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>to</span>
              <input
                type="date"
                className="filter-select"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="filters-group-two">
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* Main panel layout */}
      <div className="report-sidebar-layout">
        {/* Left Side Menu */}
        <div className="report-menu no-print">
          {reportTabs.map((tab) => (
            <a
              key={tab.id}
              className={`report-menu-item ${activeReport === tab.id ? 'active' : ''}`}
              onClick={() => setActiveReport(tab.id as any)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </a>
          ))}
        </div>

        {/* Right Side Content */}
        <div style={{ flex: 1 }}>
          <div className="card" style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
            {renderReportContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
