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
    settings,
  } = useApp();

  const [activeReport, setActiveReport] = useState<'sales' | 'purchase' | 'profit' | 'stock' | 'gst' | 'custLedger' | 'suppLedger'>('sales');
  
  // Date filtering state
  const [dateRange, setDateRange] = useState('All');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-07-01');

  // Toast status alert
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  
  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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
  const totalStockQty = products.reduce((s, p) => s + p.stock, 0);
  const totalAssetVal = products.reduce((s, p) => s + (p.stock * p.purchasePrice), 0);
  const totalRetailVal = products.reduce((s, p) => s + (p.stock * p.sellingPrice), 0);

  // 5. GST Report (Tax filing summary)
  const totalCGSTCollected = totalSalesTax / 2;
  const totalSGSTCollected = totalSalesTax / 2;
  const totalCGSTPaid = totalPurchasesTax / 2;
  const totalSGSTPaid = totalPurchasesTax / 2;
  const netGSTDue = totalSalesTax - totalPurchasesTax;

  // 6. Customer Ledger Report
  const totalCustomers = customers.length;
  const pendingReceivables = customers.reduce((sum, c) => sum + (c.outstanding > 0 ? c.outstanding : 0), 0);
  const averageReceivable = customers.length > 0 ? (pendingReceivables / customers.length) : 0;

  // 7. Supplier Ledger Report
  const totalSuppliers = suppliers.length;
  const pendingPayables = suppliers.reduce((sum, s) => sum + (s.outstanding > 0 ? s.outstanding : 0), 0);
  const averagePayable = suppliers.length > 0 ? (pendingPayables / suppliers.length) : 0;

  // --- Export CSV Handler ---
  const handleExport = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeReport === 'sales') {
      headers = ['Invoice No', 'Customer Name', 'Date', 'Taxable Amt (INR)', 'Tax Collected (INR)', 'Grand Total (INR)', 'Status'];
      rows = filteredInvoices.map(inv => [
        inv.invoiceNumber,
        inv.customerName,
        formatDate(inv.date),
        (inv.subtotal - inv.discountTotal).toFixed(2),
        inv.gstTotal.toFixed(2),
        inv.grandTotal.toFixed(2),
        inv.paymentStatus
      ]);
      rows.push(['Report Summary Total', '', '', totalSalesBase.toFixed(2), totalSalesTax.toFixed(2), totalSalesVal.toFixed(2), '']);
    } else if (activeReport === 'purchase') {
      headers = ['Bill Number', 'Supplier Name', 'Receipt Date', 'Base Cost (INR)', 'Tax Paid (INR)', 'Total Cost (INR)', 'Status'];
      rows = filteredPurchases.map(pur => [
        pur.purchaseNumber,
        pur.supplierName,
        formatDate(pur.date),
        pur.subtotal.toFixed(2),
        pur.gstTotal.toFixed(2),
        pur.grandTotal.toFixed(2),
        pur.paymentStatus
      ]);
      rows.push(['Report Summary Total', '', '', totalPurchasesBase.toFixed(2), totalPurchasesTax.toFixed(2), totalPurchasesVal.toFixed(2), '']);
    } else if (activeReport === 'profit') {
      headers = ['Invoice No', 'Date', 'Customer', 'Taxable Sales (INR)', 'Cost Price (INR)', 'Net Profit (INR)', 'Margin (%)'];
      rows = filteredInvoices.map(inv => {
        const invoiceCOGS = inv.items.reduce((s, i) => {
          const cost = products.find((p) => p.id === i.productId)?.purchasePrice || 0;
          return s + (i.quantity * cost);
        }, 0);
        const invProfit = inv.subtotal - invoiceCOGS;
        const invMargin = inv.subtotal > 0 ? (invProfit / inv.subtotal) * 100 : 0;
        return [
          inv.invoiceNumber,
          formatDate(inv.date),
          inv.customerName,
          inv.subtotal.toFixed(2),
          invoiceCOGS.toFixed(2),
          invProfit.toFixed(2),
          `${invMargin.toFixed(1)}%`
        ];
      });
      rows.push(['Report Summary Total', '', '', totalSalesBase.toFixed(2), coGS.toFixed(2), grossProfit.toFixed(2), `${profitMarginPercent.toFixed(1)}%`]);
    } else if (activeReport === 'stock') {
      headers = ['SKU Code', 'Product Name', 'Category', 'Available Qty', 'Cost Price (INR)', 'Asset Valuation (INR)', 'Retail Rate (INR)', 'Retail Valuation (INR)'];
      rows = products.map(p => [
        p.sku,
        p.name,
        p.category,
        p.stock.toString(),
        p.purchasePrice.toFixed(2),
        (p.stock * p.purchasePrice).toFixed(2),
        p.sellingPrice.toFixed(2),
        (p.stock * p.sellingPrice).toFixed(2)
      ]);
      rows.push(['Stock Summary Total', '', '', totalStockQty.toString(), '', totalAssetVal.toFixed(2), '', totalRetailVal.toFixed(2)]);
    } else if (activeReport === 'gst') {
      headers = ['Transaction Type', 'Document Count', 'Goods Value (INR)', 'Central GST (CGST) (INR)', 'State GST (SGST) (INR)', 'Total Tax Liability (INR)'];
      rows = [
        ['Outward Supply (Sales Invoices)', filteredInvoices.length.toString(), totalSalesBase.toFixed(2), totalCGSTCollected.toFixed(2), totalSGSTCollected.toFixed(2), totalSalesTax.toFixed(2)],
        ['Inward Supply (Supplier Bills)', filteredPurchases.length.toString(), totalPurchasesBase.toFixed(2), totalCGSTPaid.toFixed(2), totalSGSTPaid.toFixed(2), totalPurchasesTax.toFixed(2)],
        ['Net Payable Tax Dues', '', (totalSalesBase - totalPurchasesBase).toFixed(2), (totalCGSTCollected - totalCGSTPaid).toFixed(2), (totalSGSTCollected - totalSGSTPaid).toFixed(2), netGSTDue.toFixed(2)]
      ];
    } else if (activeReport === 'custLedger') {
      headers = ['Customer ID', 'Customer Name', 'Phone Number', 'GSTIN Identification', 'Outstanding Balance (INR)', 'Status'];
      rows = customers.map(c => [
        c.id,
        c.name,
        c.phone,
        c.gstin || '—',
        c.outstanding.toFixed(2),
        c.outstanding === 0 ? 'Settled' : c.outstanding > 0 ? 'Dues Pending' : 'Advance Credit'
      ]);
      rows.push(['Accumulated Customer Dues', '', '', '', pendingReceivables.toFixed(2), '']);
    } else if (activeReport === 'suppLedger') {
      headers = ['Supplier ID', 'Supplier Name', 'Phone Number', 'GSTIN Identification', 'Balance Owed (INR)', 'Status'];
      rows = suppliers.map(s => [
        s.id,
        s.name,
        s.phone,
        s.gstin || '—',
        s.outstanding.toFixed(2),
        s.outstanding === 0 ? 'Settled' : 'Payable Pending'
      ]);
      rows.push(['Accumulated We Owe Suppliers', '', '', '', pendingPayables.toFixed(2), '']);
    }

    // Convert data items to comma-separated text
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Compile blob and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Report exported as CSV successfully!');
  };

  // --- Save PDF Handler (Clean Statement Table) ---
  const handleDownloadPDF = () => {
    const element = document.getElementById('pdf-report-printout');
    if (!element) {
      showToast('Could not find report printout element.', 'error');
      return;
    }

    showToast('Compiling high-definition PDF statement...', 'info');
    setIsGeneratingPDF(true);

    // Yield execution to allow React to paint the loading blur overlay on screen
    setTimeout(() => {
      // Make element temporarily visible but behind everything at 0, 0
      const htmlElement = element as HTMLElement;
      htmlElement.style.display = 'block';
      htmlElement.style.position = 'absolute';
      htmlElement.style.left = '0';
      htmlElement.style.top = '0';
      htmlElement.style.zIndex = '99998'; // sit underneath the loading overlay
      htmlElement.style.width = '210mm'; // Standard A4 width

      const generatePDF = (html2pdfLib: any) => {
        const opt = {
          margin:       0,
          filename:     `${activeReport}_report_${new Date().toISOString().split('T')[0]}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, logging: false },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdfLib().from(element).set(opt).save().then(() => {
          showToast('PDF downloaded successfully!');
          htmlElement.style.display = 'none';
          setIsGeneratingPDF(false);
        }).catch((err: any) => {
          console.error(err);
          showToast('Error exporting PDF document.', 'error');
          htmlElement.style.display = 'none';
          setIsGeneratingPDF(false);
        });
      };

      const globalWindow = window as any;
      if (globalWindow.html2pdf) {
        generatePDF(globalWindow.html2pdf);
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.crossOrigin = 'anonymous';
        script.onload = () => {
          if (globalWindow.html2pdf) {
            generatePDF(globalWindow.html2pdf);
          }
        };
        script.onerror = () => {
          showToast('Failed to load PDF engine from CDN.', 'error');
          htmlElement.style.display = 'none';
          setIsGeneratingPDF(false);
        };
        document.body.appendChild(script);
      }
    }, 150);
  };

  // Auto-fitting responsive grid style for KPIs
  const kpiGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  };

  const renderReportContent = () => {
    switch (activeReport) {
      case 'sales':
        return (
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div style={kpiGridStyle}>
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
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div style={kpiGridStyle}>
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
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div style={kpiGridStyle}>
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

            <div className="card" style={{ padding: '20px', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
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
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div style={kpiGridStyle}>
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
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            {/* GST Summary metrics */}
            <div style={kpiGridStyle}>
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
            <div className="card" style={{ border: '1px solid var(--border-color)', boxShadow: 'none' }}>
              <h3 className="card-title" style={{ padding: '20px 20px 0 20px', margin: 0, fontWeight: 700 }}>GSTR Summary Ledger Logs</h3>
              <div style={{ padding: '20px' }}>
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
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div style={kpiGridStyle}>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Registered Customers</span>
                  <span className="kpi-value">{totalCustomers}</span>
                  <span className="kpi-subtext">Active accounts</span>
                </div>
                <div className="kpi-icon-container blue"><Users size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Total Outstanding Dues</span>
                  <span className="kpi-value" style={{ color: 'var(--color-danger)' }}>{formatINR(pendingReceivables)}</span>
                  <span className="kpi-subtext">Collectable assets</span>
                </div>
                <div className="kpi-icon-container rose"><TrendingUp size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Average Outstanding</span>
                  <span className="kpi-value">{formatINR(averageReceivable)}</span>
                  <span className="kpi-subtext">Per active customer account</span>
                </div>
                <div className="kpi-icon-container blue"><DollarSign size={20} /></div>
              </div>
            </div>

            {/* Desktop View */}
            <div className="desktop-only-table">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer ID</th>
                      <th>Customer Name</th>
                      <th>Phone Number</th>
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
                        {formatINR(pendingReceivables)}
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
                    {formatINR(pendingReceivables)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'suppLedger':
        return (
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div style={kpiGridStyle}>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Registered Suppliers</span>
                  <span className="kpi-value">{totalSuppliers}</span>
                  <span className="kpi-subtext">Active accounts</span>
                </div>
                <div className="kpi-icon-container blue"><Truck size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Total Balance Owed</span>
                  <span className="kpi-value" style={{ color: 'var(--color-danger)' }}>{formatINR(pendingPayables)}</span>
                  <span className="kpi-subtext">Accounts payable cost</span>
                </div>
                <div className="kpi-icon-container rose"><TrendingDown size={20} /></div>
              </div>
              <div className="kpi-card" style={{ cursor: 'default' }}>
                <div className="kpi-info">
                  <span className="kpi-label">Average Payable</span>
                  <span className="kpi-value">{formatINR(averagePayable)}</span>
                  <span className="kpi-subtext">Per active supplier account</span>
                </div>
                <div className="kpi-icon-container blue"><DollarSign size={20} /></div>
              </div>
            </div>

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
                        {formatINR(pendingPayables)}
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
                    <span className={`badge ${s.outstanding === 0 ? 'badge-success' : s.outstanding >-1 ? 'badge-warning' : 'badge-info'}`}>
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
                    {formatINR(pendingPayables)}
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

  // --- Print-Only PDF content renderer ---
  const renderPrintReportContent = () => {
    switch (activeReport) {
      case 'sales':
        return (
          <div>
            <h2 style={{ textAlign: 'center', fontSize: '15px', textTransform: 'uppercase', marginBottom: '16px', color: '#2F3E33' }}>
              Sales Transaction Statement
            </h2>
            
            {/* Summary metrics block */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '11px' }}>
              <div><strong>Invoices count:</strong> {filteredInvoices.length} bills</div>
              <div><strong>Taxable Amount:</strong> {formatINR(totalSalesBase)}</div>
              <div><strong>Total Sales (Inc. GST):</strong> {formatINR(totalSalesVal)}</div>
            </div>

            {/* Print Grid Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Invoice No</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Customer Name</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Date</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Taxable Amt (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Tax (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Grand Total (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv, idx) => (
                  <tr key={inv.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F9FAF9' }}>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace', fontWeight: 'bold' }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{inv.customerName}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{formatDate(inv.date)}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(inv.subtotal - inv.discountTotal).replace('₹', '')}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(inv.gstTotal).replace('₹', '')}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold' }}>{formatINR(inv.grandTotal).replace('₹', '')}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{inv.paymentStatus}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#E2E9E0' }}>
                  <td colSpan={3} style={{ padding: '8px', border: '1px solid #C8D3C5' }}>Report Summary Total:</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalSalesBase).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalSalesTax).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalSalesVal).replace('₹', '')}</td>
                  <td style={{ border: '1px solid #C8D3C5' }}></td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'purchase':
        return (
          <div>
            <h2 style={{ textAlign: 'center', fontSize: '15px', textTransform: 'uppercase', marginBottom: '16px', color: '#2F3E33' }}>
              Purchase Transaction Statement
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '11px' }}>
              <div><strong>Bills Logged:</strong> {filteredPurchases.length} invoices</div>
              <div><strong>Taxable Purchases:</strong> {formatINR(totalPurchasesBase)}</div>
              <div><strong>Total Cost (Inc. GST):</strong> {formatINR(totalPurchasesVal)}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Bill Number</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Supplier Name</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Date</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Base Cost (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Tax Paid (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Total Cost (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((pur, idx) => (
                  <tr key={pur.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F9FAF9' }}>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace', fontWeight: 'bold' }}>{pur.purchaseNumber}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{pur.supplierName}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{formatDate(pur.date)}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(pur.subtotal).replace('₹', '')}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(pur.gstTotal).replace('₹', '')}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold' }}>{formatINR(pur.grandTotal).replace('₹', '')}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{pur.paymentStatus}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#E2E9E0' }}>
                  <td colSpan={3} style={{ padding: '8px', border: '1px solid #C8D3C5' }}>Report Summary Total:</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalPurchasesBase).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalPurchasesTax).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalPurchasesVal).replace('₹', '')}</td>
                  <td style={{ border: '1px solid #C8D3C5' }}></td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'profit':
        return (
          <div>
            <h2 style={{ textAlign: 'center', fontSize: '15px', textTransform: 'uppercase', marginBottom: '16px', color: '#2F3E33' }}>
              Sales Profit & Loss Statement
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '11px' }}>
              <div><strong>Sales Revenue:</strong> {formatINR(totalSalesBase)}</div>
              <div><strong>Cost of Goods (COGS):</strong> {formatINR(coGS)}</div>
              <div><strong>Net Profit Margin:</strong> {formatINR(grossProfit)} ({profitMarginPercent.toFixed(1)}%)</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Invoice No</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Date</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Customer</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Taxable Sales (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Cost Price (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Net Profit (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>Margin</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv, idx) => {
                  const invoiceCOGS = inv.items.reduce((s, i) => {
                    const cost = products.find((p) => p.id === i.productId)?.purchasePrice || 0;
                    return s + (i.quantity * cost);
                  }, 0);
                  const invProfit = inv.subtotal - invoiceCOGS;
                  const invMargin = inv.subtotal > 0 ? (invProfit / inv.subtotal) * 100 : 0;
                  return (
                    <tr key={inv.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F9FAF9' }}>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace', fontWeight: 'bold' }}>{inv.invoiceNumber}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{formatDate(inv.date)}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{inv.customerName}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(inv.subtotal).replace('₹', '')}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(invoiceCOGS).replace('₹', '')}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold', color: invProfit >= 0 ? '#27AE60' : '#BE3144' }}>{formatINR(invProfit).replace('₹', '')}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'center', fontWeight: 'bold' }}>{invMargin.toFixed(1)}%</td>
                    </tr>
                  );
                })}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#E2E9E0' }}>
                  <td colSpan={3} style={{ padding: '8px', border: '1px solid #C8D3C5' }}>Report Summary Total:</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalSalesBase).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(coGS).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(grossProfit).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'center' }}>{profitMarginPercent.toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'stock':
        return (
          <div>
            <h2 style={{ textAlign: 'center', fontSize: '15px', textTransform: 'uppercase', marginBottom: '16px', color: '#2F3E33' }}>
              Stock Inventory Asset Valuation
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '11px' }}>
              <div><strong>Total Items:</strong> {totalStockQty} units</div>
              <div><strong>Asset Value (Cost):</strong> {formatINR(totalAssetVal)}</div>
              <div><strong>Retail Value (Potential):</strong> {formatINR(totalRetailVal)}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>SKU</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Product Name</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Category</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>Qty</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Cost Price (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Asset Value (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Retail Price (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Retail Value (₹)</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, idx) => {
                  const itemAssetVal = p.stock * p.purchasePrice;
                  const itemRetailVal = p.stock * p.sellingPrice;
                  return (
                    <tr key={p.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F9FAF9' }}>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{p.sku}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontWeight: 'bold' }}>{p.name}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{p.category}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'center', fontWeight: 'bold' }}>{p.stock}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(p.purchasePrice).replace('₹', '')}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold' }}>{formatINR(itemAssetVal).replace('₹', '')}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(p.sellingPrice).replace('₹', '')}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(itemRetailVal).replace('₹', '')}</td>
                    </tr>
                  );
                })}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#E2E9E0' }}>
                  <td colSpan={3} style={{ padding: '8px', border: '1px solid #C8D3C5' }}>Stock Summary Total:</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'center' }}>{totalStockQty}</td>
                  <td style={{ border: '1px solid #C8D3C5' }}></td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalAssetVal).replace('₹', '')}</td>
                  <td style={{ border: '1px solid #C8D3C5' }}></td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalRetailVal).replace('₹', '')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'gst':
        return (
          <div>
            <h2 style={{ textAlign: 'center', fontSize: '15px', textTransform: 'uppercase', marginBottom: '16px', color: '#2F3E33' }}>
              GST Tax Ledger Summary
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '11px' }}>
              <div><strong>Output GST Collected:</strong> {formatINR(totalSalesTax)}</div>
              <div><strong>Input GST ITC Paid:</strong> {formatINR(totalPurchasesTax)}</div>
              <div><strong>Net GST Payable:</strong> {formatINR(netGSTDue)}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Transaction Supply Type</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>Doc Count</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Base Goods Value (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Central GST (CGST) (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>State GST (SGST) (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Total Tax Liability (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', fontWeight: 'bold' }}>Outward Supply (Sales Invoices)</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{filteredInvoices.length}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(totalSalesBase).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(totalCGSTCollected).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(totalSGSTCollected).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold' }}>{formatINR(totalSalesTax).replace('₹', '')}</td>
                </tr>
                <tr style={{ backgroundColor: '#F9FAF9' }}>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', fontWeight: 'bold' }}>Inward Supply (Supplier Bills)</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{filteredPurchases.length}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(totalPurchasesBase).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(totalCGSTPaid).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right' }}>{formatINR(totalSGSTPaid).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold' }}>{formatINR(totalPurchasesTax).replace('₹', '')}</td>
                </tr>
                <tr style={{ fontWeight: 'bold', backgroundColor: '#E2E9E0' }}>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5' }}>Net Payable Tax Dues:</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'center' }}></td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalSalesBase - totalPurchasesBase).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalCGSTCollected - totalCGSTPaid).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right' }}>{formatINR(totalSGSTCollected - totalSGSTPaid).replace('₹', '')}</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right', color: netGSTDue >= 0 ? '#BE3144' : '#27AE60' }}>{formatINR(netGSTDue).replace('₹', '')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'custLedger':
        return (
          <div>
            <h2 style={{ textAlign: 'center', fontSize: '15px', textTransform: 'uppercase', marginBottom: '16px', color: '#2F3E33' }}>
              Customer Outstanding Balances Statement
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '11px' }}>
              <div><strong>Registered Customers:</strong> {totalCustomers} accounts</div>
              <div><strong>Accumulated Dues:</strong> {formatINR(pendingReceivables)}</div>
              <div><strong>Average Dues:</strong> {formatINR(averageReceivable)}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Customer ID</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Customer Name</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Phone Number</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>GSTIN</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Outstanding (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, idx) => (
                  <tr key={c.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F9FAF9' }}>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{c.id}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontWeight: 'bold' }}>{c.name}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{c.phone}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{c.gstin || '—'}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold', color: c.outstanding > 0 ? '#BE3144' : c.outstanding < 0 ? '#27AE60' : 'inherit' }}>{formatINR(c.outstanding).replace('₹', '')}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{c.outstanding === 0 ? 'Settled' : c.outstanding > 0 ? 'Dues' : 'Advance'}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#E2E9E0' }}>
                  <td colSpan={4} style={{ padding: '8px', border: '1px solid #C8D3C5' }}>Accumulated Outstanding Dues Total:</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right', color: '#BE3144' }}>{formatINR(pendingReceivables).replace('₹', '')}</td>
                  <td style={{ border: '1px solid #C8D3C5' }}></td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'suppLedger':
        return (
          <div>
            <h2 style={{ textAlign: 'center', fontSize: '15px', textTransform: 'uppercase', marginBottom: '16px', color: '#2F3E33' }}>
              Supplier Account Payables Statement
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', padding: '10px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '16px', backgroundColor: '#F9FAF9', fontSize: '11px' }}>
              <div><strong>Registered Suppliers:</strong> {totalSuppliers} accounts</div>
              <div><strong>Accumulated Owed:</strong> {formatINR(pendingPayables)}</div>
              <div><strong>Average Payables:</strong> {formatINR(averagePayable)}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Supplier ID</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Company / Supplier Name</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>Phone Number</th>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #2F3E33' }}>GSTIN</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #2F3E33' }}>Balance Owed (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #2F3E33' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s, idx) => (
                  <tr key={s.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F9FAF9' }}>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{s.id}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontWeight: 'bold' }}>{s.name}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{s.phone}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{s.gstin || '—'}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold', color: s.outstanding > 0 ? '#BE3144' : 'inherit' }}>{formatINR(s.outstanding).replace('₹', '')}</td>
                    <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'center' }}>{s.outstanding === 0 ? 'Settled' : 'Payable'}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#E2E9E0' }}>
                  <td colSpan={4} style={{ padding: '8px', border: '1px solid #C8D3C5' }}>Accumulated Supplier Payables Total:</td>
                  <td style={{ padding: '8px', border: '1px solid #C8D3C5', textAlign: 'right', color: '#BE3144' }}>{formatINR(pendingPayables).replace('₹', '')}</td>
                  <td style={{ border: '1px solid #C8D3C5' }}></td>
                </tr>
              </tbody>
            </table>
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
        <div className="filters-group-one" style={{ flexWrap: 'wrap', gap: '8px' }}>
          {/* Preset Ranges */}
          <select className="filter-select" style={{ minWidth: '160px' }} value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="All">All Historical Records</option>
            <option value="Custom">Custom Date Range</option>
          </select>

          {dateRange === 'Custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap', flex: '1 1 auto', minWidth: '240px' }}>
              <input
                type="date"
                className="filter-select"
                style={{ flex: 1, minWidth: '110px', padding: '6px 8px' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>to</span>
              <input
                type="date"
                className="filter-select"
                style={{ flex: 1, minWidth: '110px', padding: '6px 8px' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="filters-group-two" style={{ flexWrap: 'wrap', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-secondary" onClick={handleDownloadPDF}>
            <FileText size={16} /> Save PDF
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

      {/* Hidden A4 Printable Report Element used for PDF generation */}
      <div id="pdf-report-printout" style={{
        display: 'none',
        width: '210mm',
        backgroundColor: '#ffffff',
        fontFamily: 'var(--font-sans)',
        color: '#000000',
        padding: '15mm',
        boxSizing: 'border-box'
      }}>
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #2F3E33', paddingBottom: '12px', marginBottom: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#2F3E33' }}>{settings.businessName}</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#555555' }}>{settings.address}</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#555555', fontWeight: 600 }}>GSTIN: {settings.gstin}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Financial Audit Report
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#555555' }}>
              Period: {dateRange === 'All' ? 'All Historical Records' : `${formatDate(startDate)} to ${formatDate(endDate)}`}
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#555555' }}>
              Date Generated: {formatDate(new Date().toISOString())}
            </p>
          </div>
        </div>

        {/* Dynamic content */}
        {renderPrintReportContent()}

        {/* Signatory Blocks */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', fontSize: '10px', color: '#555555' }}>
          <div>Prepared By: ___________________________</div>
          <div>Authorized Signatory: ___________________________</div>
        </div>
      </div>

      {/* Status Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '12px 20px',
          backgroundColor: toast.type === 'error' ? '#BE3144' : toast.type === 'info' ? '#3182CE' : '#27AE60',
          color: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 99999,
          fontSize: '13px',
          fontWeight: 600,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {toast.message}
        </div>
      )}

      {/* Loading Overlay */}
      {isGeneratingPDF && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <div className="animate-spin" style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--border-color)',
            borderTopColor: 'var(--primary-dark)',
            borderRadius: '50%'
          }} />
          <p style={{ marginTop: '16px', fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
            Generating A4 PDF Report Statement...
          </p>
        </div>
      )}
    </div>
  );
};
