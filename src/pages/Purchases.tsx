import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate } from '../utils/dummyData';
import { SupplierModal } from '../components/SupplierModal';
import { ProductModal } from '../components/ProductModal';
import {
  Plus,
  Trash2,
  Printer,
  Download,
  ArrowLeft,
  Search,
  Eye,
  Trash,
  FileSpreadsheet,
  ArrowUpDown,
  Calendar,
  DollarSign,
  Percent,
  Truck,
  Info,
  Upload,
  X,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import type { PurchaseItem, Product } from '../types';

interface LocalPurchaseItem {
  productId: string;
  quantity: number;
  price: number;
  discount: number; // percentage
  gstRate: number;
}

export const Purchases: React.FC = () => {
  const {
    purchases,
    suppliers,
    products,
    addPurchase,
    deletePurchase,
    searchQuery,
    setSearchQuery,
    currentPurchaseId,
    setViewPurchase,
    isEnteringPurchase,
    setIsEnteringPurchase,
    showToast,
  } = useApp();

  // Redesigned local states for rich Purchase Entry
  const [purchaseBillNumber, setPurchaseBillNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [supplierInvoiceDate, setSupplierInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [purchaseType, setPurchaseType] = useState<'Cash' | 'Credit'>('Credit');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [purchaseStatus, setPurchaseStatus] = useState<'Received' | 'Ordered' | 'Pending'>('Received');

  // Products Table Row State
  const [items, setItems] = useState<LocalPurchaseItem[]>([
    { productId: '', quantity: 1, price: 0, discount: 0, gstRate: 0 }
  ]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeProductRowIndex, setActiveProductRowIndex] = useState<number | null>(null);

  // Additional Charges & Remarks
  const [transportCharges, setTransportCharges] = useState(0);
  const [loadingCharges, setLoadingCharges] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [notes, setNotes] = useState('');

  // Outflow & Payments details
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('Bank Transfer');
  const [amountPaid, setAmountPaid] = useState(0);
  const [transactionReference, setTransactionReference] = useState('');

  // GST Type Selection
  const [gstType, setGstType] = useState<'IntraState' | 'InterState'>('IntraState');

  // Attachments
  const [attachedFileName, setAttachedFileName] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);

  // Supplier quick add modal state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // Listing filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Mock download
  const handleDownload = (purchaseNo: string) => {
    showToast(`PDF exported for purchase voucher ${purchaseNo}`, 'info');
  };

  // --- Purchase Calculations ---
  const getProductUnit = (product: Product | undefined) => {
    if (!product) return 'Units';
    const cat = (product.category || '').toLowerCase();
    if (cat === 'seeds') return 'Bags (10kg)';
    if (cat.includes('fertil') || cat.includes('nutri')) return 'Bags (50kg)';
    if (cat.includes('pest') || cat.includes('chem') || cat.includes('liquid')) return 'Liters';
    if (cat.includes('irrig') || cat.includes('pipe')) return 'Meters';
    return 'Pieces';
  };

  const calculateRowTotal = (productId: string, qty: number, costPrice: number, discountPercent: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return { subtotal: 0, discountAmount: 0, gstAmount: 0, total: 0, gstRate: 0 };

    const baseAmount = costPrice * qty;
    const discountAmount = baseAmount * (discountPercent / 100);
    const subtotal = Math.max(0, baseAmount - discountAmount);
    const gstRate = product.gstRate;
    const gstAmount = subtotal * (gstRate / 100);
    const total = subtotal + gstAmount;

    return { subtotal, discountAmount, gstAmount, total, gstRate };
  };

  const getPurchaseTotals = () => {
    let subtotalTotal = 0;
    let discountTotal = 0;
    let gstTotal = 0;

    items.forEach((item) => {
      const calc = calculateRowTotal(item.productId, item.quantity, item.price, item.discount);
      subtotalTotal += item.price * item.quantity;
      discountTotal += calc.discountAmount;
      gstTotal += calc.gstAmount;
    });

    const taxableAmount = Math.max(0, subtotalTotal - discountTotal);
    const additionalCharges = (Number(transportCharges) || 0) + (Number(loadingCharges) || 0) + (Number(otherCharges) || 0);
    const finalGrandTotal = taxableAmount + gstTotal + additionalCharges;

    return {
      subtotal: subtotalTotal,
      discountTotal,
      taxableAmount,
      gstTotal,
      cgst: gstType === 'IntraState' ? gstTotal / 2 : 0,
      sgst: gstType === 'IntraState' ? gstTotal / 2 : 0,
      igst: gstType === 'InterState' ? gstTotal : 0,
      additionalCharges,
      grandTotal: finalGrandTotal,
      balanceDue: Math.max(0, finalGrandTotal - (Number(amountPaid) || 0)),
    };
  };

  const handleAddItemRow = () => {
    const defaultProduct = products[0];
    if (!defaultProduct) return;

    setItems((prev) => [
      ...prev,
      {
        productId: defaultProduct.id,
        quantity: 1,
        price: defaultProduct.purchasePrice,
        discount: 0,
        gstRate: defaultProduct.gstRate,
      },
    ]);
  };

  const handleUpdateItemRow = (index: number, field: keyof LocalPurchaseItem, value: any) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;

        const updated = { ...item, [field]: value };

        // If product changes, auto-update price to default purchase price
        if (field === 'productId') {
          const product = products.find((p) => p.id === value);
          if (product) {
            updated.price = product.purchasePrice;
            updated.gstRate = product.gstRate;
            updated.discount = 0;
          }
        }
        return updated;
      })
    );
  };

  const handleRemoveItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSavePurchaseWrapper = (e: React.FormEvent, keepOpen = false) => {
    if (e) e.preventDefault();

    // Validations
    if (!selectedSupplierId) {
      showToast('Please select a supplier to log stock purchase.', 'error');
      return;
    }
    if (!supplierInvoiceNumber.trim()) {
      showToast('Please enter the Supplier Invoice / Bill Number.', 'error');
      return;
    }
    if (items.length === 0 || !items[0].productId) {
      showToast('Please add at least one product line item to voucher.', 'error');
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supplier) return;

    const totals = getPurchaseTotals();

    const purchaseItems: PurchaseItem[] = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const calc = calculateRowTotal(item.productId, item.quantity, item.price, item.discount);
      return {
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: item.price,
        gstRate: calc.gstRate,
        gstAmount: calc.gstAmount,
        subtotal: calc.subtotal,
        total: calc.total,
      };
    });

    const paymentStatus =
      (Number(amountPaid) || 0) >= totals.grandTotal
        ? 'Paid'
        : (Number(amountPaid) || 0) > 0
        ? 'Partial'
        : 'Unpaid';

    // Structured metadata inside notes to avoid database schema updates
    const serializedNotes = `Invoice Ref: ${supplierInvoiceNumber.trim()} (Date: ${supplierInvoiceDate})
Type: ${purchaseType} | Status: ${purchaseStatus}
${purchaseType === 'Credit' ? `Payment Due Date: ${dueDate}\n` : ''}Charges: Transport ₹${transportCharges}, Loading ₹${loadingCharges}, Other ₹${otherCharges}
${transactionReference ? `Txn Reference: ${transactionReference}\n` : ''}${attachedFileName ? `Attachment: ${attachedFileName}\n` : ''}Remarks: ${notes}`;

    addPurchase({
      date: purchaseDate,
      supplierId: selectedSupplierId,
      supplierName: supplier.name,
      items: purchaseItems,
      subtotal: totals.taxableAmount, // subtotal after discounts
      gstTotal: totals.gstTotal,
      grandTotal: totals.grandTotal,
      amountPaid: Number(amountPaid) || 0,
      balanceDue: totals.balanceDue,
      paymentStatus,
      paymentMethod: amountPaid > 0 ? paymentMethod : '',
      notes: serializedNotes,
    });

    showToast(`Purchase bill ${supplierInvoiceNumber} saved successfully!`);

    // Reset states
    setSelectedSupplierId('');
    setSupplierInvoiceNumber('');
    setSupplierInvoiceDate(new Date().toISOString().split('T')[0]);
    setPurchaseType('Credit');
    setDueDate(() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().split('T')[0];
    });
    setPurchaseStatus('Received');
    setItems([{ productId: '', quantity: 1, price: 0, discount: 0, gstRate: 0 }]);
    setTransportCharges(0);
    setLoadingCharges(0);
    setOtherCharges(0);
    setNotes('');
    setAmountPaid(0);
    setTransactionReference('');
    setAttachedFileName('');
    setAttachedFile(null);
    if (!keepOpen) {
      setIsEnteringPurchase(false);
    }
  };

  const handleDeletePurchase = (id: string, purchaseNo: string) => {
    if (confirm(`Are you sure you want to delete purchase voucher ${purchaseNo}? This will deduct the added stock levels and adjust supplier balance.`)) {
      deletePurchase(id);
      showToast(`Purchase bill ${purchaseNo} deleted successfully.`, 'info');
      setViewPurchase(null);
    }
  };

  // --- Filtering and Sorting List ---
  const filteredPurchases = purchases.filter((pur) => {
    const matchesSearch =
      pur.purchaseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pur.supplierName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || pur.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedPurchases = [...filteredPurchases].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'date-asc') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    if (sortBy === 'amount-desc') {
      return b.grandTotal - a.grandTotal;
    }
    if (sortBy === 'amount-asc') {
      return a.grandTotal - b.grandTotal;
    }
    if (sortBy === 'number-desc') {
      return b.purchaseNumber.localeCompare(a.purchaseNumber);
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedPurchases.length / itemsPerPage);
  const paginatedPurchases = sortedPurchases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedPurchase = purchases.find((p) => p.id === currentPurchaseId);

  // --- RENDERING ---

  // 1. Voucher details A4 view
  if (selectedPurchase) {
    const supplierDetail = suppliers.find((s) => s.id === selectedPurchase.supplierId);
    const totals = {
      subtotal: selectedPurchase.subtotal,
      gstTotal: selectedPurchase.gstTotal,
      cgst: selectedPurchase.gstTotal / 2,
      sgst: selectedPurchase.gstTotal / 2,
      grandTotal: selectedPurchase.grandTotal,
      amountPaid: selectedPurchase.amountPaid,
      balanceDue: selectedPurchase.balanceDue,
    };

    return (
      <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
        <div className="filters-row no-print" style={{ marginBottom: '24px' }}>
          <button className="btn btn-secondary" onClick={() => setViewPurchase(null)}>
            <ArrowLeft size={16} /> Back to Purchases
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-danger" onClick={() => handleDeletePurchase(selectedPurchase.id, selectedPurchase.purchaseNumber)}>
              <Trash2 size={16} /> Delete
            </button>
            <button className="btn btn-secondary" onClick={() => handleDownload(selectedPurchase.purchaseNumber)}>
              <Download size={16} /> Export PDF
            </button>
            <button className="btn btn-primary" onClick={handlePrint}>
              <Printer size={16} /> Print Voucher
            </button>
          </div>
        </div>

        {/* Voucher layout */}
        <div className="printable-invoice-card">
          <div className="print-header" style={{ borderBottomColor: 'var(--color-info-dark)' }}>
            <div>
              <h2 style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                Goods Inward Receipt Store:
              </h2>
              <h1 className="print-business-title" style={{ fontSize: '22px' }}>AGRIBIZ SEEDS & IMPLEMENTS</h1>
              <p style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                GSTIN: 23AAACA9876C1Z9 (Recipient)
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 className="print-invoice-title" style={{ color: 'var(--color-info-dark)' }}>Purchase Voucher</h2>
              <p style={{ fontSize: '14px', fontWeight: 700, marginTop: '8px' }}>
                Bill No: {selectedPurchase.purchaseNumber}
              </p>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                Date: {formatDate(selectedPurchase.date)}
              </p>
            </div>
          </div>

          <div className="print-addresses">
            <div>
              <h4 style={{ textTransform: 'uppercase', fontSize: '11px', color: '#64748b', marginBottom: '6px', letterSpacing: '0.5px' }}>
                Supplier (Seller):
              </h4>
              <p style={{ fontWeight: 700, fontSize: '15px' }}>{selectedPurchase.supplierName}</p>
              {supplierDetail ? (
                <>
                  <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                    {supplierDetail.address || 'Address: N/A'}
                  </p>
                  <p style={{ fontSize: '13px', color: '#475569' }}>
                    Phone: {supplierDetail.phone}
                  </p>
                  {supplierDetail.gstin && (
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>
                      GSTIN: {supplierDetail.gstin}
                    </p>
                  )}
                </>
              ) : (
                <p style={{ fontSize: '13px', color: '#475569' }}>General Supplier</p>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <h4 style={{ textTransform: 'uppercase', fontSize: '11px', color: '#64748b', marginBottom: '6px', letterSpacing: '0.5px' }}>
                Voucher Summary:
              </h4>
              <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
                <span
                  className={`badge ${
                    selectedPurchase.paymentStatus === 'Paid'
                      ? 'badge-success'
                      : selectedPurchase.paymentStatus === 'Partial'
                      ? 'badge-warning'
                      : 'badge-danger'
                  }`}
                  style={{ alignSelf: 'flex-end', padding: '4px 12px' }}
                >
                  {selectedPurchase.paymentStatus.toUpperCase()}
                </span>
                {selectedPurchase.paymentMethod && (
                  <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                    Payment Mode: {selectedPurchase.paymentMethod}
                  </p>
                )}
              </div>
            </div>
          </div>

          <table className="print-items-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>Sr</th>
                <th>Product Inward Details</th>
                <th style={{ textAlign: 'center' }}>GST Rate</th>
                <th style={{ textAlign: 'right' }}>Base Cost (₹)</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Taxable Amt (₹)</th>
                <th style={{ textAlign: 'right' }}>GST Amt (₹)</th>
                <th style={{ textAlign: 'right' }}>Voucher Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {selectedPurchase.items.map((item, index) => (
                <tr key={index}>
                  <td style={{ textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ fontWeight: 600 }}>{item.productName}</td>
                  <td style={{ textAlign: 'center' }}>{item.gstRate}%</td>
                  <td style={{ textAlign: 'right' }}>{formatINR(item.price).replace('₹', '')}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{formatINR(item.subtotal).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right' }}>{formatINR(item.gstAmount).replace('₹', '')}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {formatINR(item.total).replace('₹', '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="print-totals-box">
            <table className="print-totals-table">
              <tbody>
                <tr>
                  <td>Total Purchase Base Value</td>
                  <td style={{ textAlign: 'right' }}>{formatINR(totals.subtotal)}</td>
                </tr>
                <tr>
                  <td>Input CGST (50% of GST)</td>
                  <td style={{ textAlign: 'right' }}>{formatINR(totals.cgst)}</td>
                </tr>
                <tr>
                  <td>Input SGST (50% of GST)</td>
                  <td style={{ textAlign: 'right' }}>{formatINR(totals.sgst)}</td>
                </tr>
                <tr className="total-row" style={{ borderTopColor: 'var(--color-info-dark)' }}>
                  <td><strong>Bill Grand Total</strong></td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '15px' }}>
                    {formatINR(totals.grandTotal)}
                  </td>
                </tr>
                <tr>
                  <td>Paid Amount</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-success-dark)', fontWeight: 600 }}>
                    {formatINR(totals.amountPaid)}
                  </td>
                </tr>
                <tr style={{ borderTop: '1px dashed #cbd5e1' }}>
                  <td><strong>Due Payable (Outstanding)</strong></td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 700,
                      color: totals.balanceDue > 0 ? 'var(--color-danger)' : 'inherit',
                    }}
                  >
                    {formatINR(totals.balanceDue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {selectedPurchase.notes && (
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '30px' }}>
              <h5 style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
                Purchase Comments / Bill Details:
              </h5>
              <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#475569' }}>
                {selectedPurchase.notes}
              </p>
            </div>
          )}

          <div className="print-footer">
            <p>AgriBiz Store Stock Management Division</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Create Purchase Voucher view
  if (isEnteringPurchase) {
    const totals = getPurchaseTotals();
    const supplierDetail = suppliers.find((s) => s.id === selectedSupplierId);

    // Initial prefill for Purchase Bill Number if empty
    if (!purchaseBillNumber) {
      const generatedNo = `PUR-${(purchases.length + 1).toString().padStart(3, '0')}`;
      setPurchaseBillNumber(generatedNo);
    }

    return (
      <div style={{ animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards', paddingBottom: '80px' }}>
        
        {/* TOP BAR ACTION BAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => {
                handleResetForm();
              }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={16} /> Exit Editor
              </button>
              <h3 style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0 }}>
                Log Inward Purchase Entry
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', marginLeft: '90px' }}>
              Record goods receipt notes, tax divisions, and update inventory ledger.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                if (!supplierInvoiceNumber) {
                  showToast('Please enter Supplier Invoice No. to print draft.', 'error');
                  return;
                }
                window.print();
              }}
              style={{ display: 'flex', gap: '6px' }}
            >
              <Printer size={15} /> Print Bill
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                showToast('Draft PDF generated successfully!', 'info');
              }}
              style={{ display: 'flex', gap: '6px' }}
            >
              <Download size={15} /> Download PDF
            </button>
          </div>
        </div>

        <form onSubmit={(e) => handleSavePurchaseWrapper(e, false)}>
          <div className="purchase-creator-grid">
            
            {/* LEFT COLUMN: SECTIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              
              {/* Section 1: Purchase Information */}
              <div className="card" style={{ padding: '24px 28px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '13px', fontWeight: 800,
                  }}>1</div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Purchase & Voucher Details</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Enter inward references and dates</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Purchase Bill No. *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={purchaseBillNumber}
                      onChange={(e) => setPurchaseBillNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Purchase Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">GST Type *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <select
                        className="form-control"
                        style={{ paddingRight: '36px' }}
                        value={gstType}
                        onChange={(e) => setGstType(e.target.value as any)}
                        required
                      >
                        <option value="IntraState">Intra-State (CGST + SGST)</option>
                        <option value="InterState">Inter-State (IGST)</option>
                      </select>
                      <span style={{ position: 'absolute', right: '14px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Select Supplier *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <select
                        className="form-control"
                        style={{ paddingRight: '36px' }}
                        value={selectedSupplierId}
                        onChange={(e) => setSelectedSupplierId(e.target.value)}
                        required
                      >
                        <option value="">-- Choose Supplier --</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} {s.phone ? `(${s.phone})` : ''}
                          </option>
                        ))}
                      </select>
                      <span style={{ position: 'absolute', right: '14px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsSupplierModalOpen(true)}
                    style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Plus size={16} /> Add Supplier
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Supplier Invoice No. *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. INWARD-9842"
                      value={supplierInvoiceNumber}
                      onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Supplier Invoice Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={supplierInvoiceDate}
                      onChange={(e) => setSupplierInvoiceDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Purchase Status *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <select
                        className="form-control"
                        style={{ paddingRight: '36px' }}
                        value={purchaseStatus}
                        onChange={(e) => setPurchaseStatus(e.target.value as any)}
                        required
                      >
                        <option value="Received">Goods Received</option>
                        <option value="Ordered">Ordered / Transit</option>
                        <option value="Pending">Pending Audit</option>
                      </select>
                      <span style={{ position: 'absolute', right: '14px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Purchase Type *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <select
                        className="form-control"
                        style={{ paddingRight: '36px' }}
                        value={purchaseType}
                        onChange={(e) => setPurchaseType(e.target.value as any)}
                        required
                      >
                        <option value="Credit">Credit / Outstanding Account</option>
                        <option value="Cash">Cash replenishment</option>
                      </select>
                      <span style={{ position: 'absolute', right: '14px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </span>
                    </div>
                  </div>
                  
                  {purchaseType === 'Credit' ? (
                    <div className="form-group" style={{ margin: 0, animation: 'fadeIn 0.2s ease-out' }}>
                      <label className="form-label">Payment Due Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        required
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '10px', padding: '10px 14px', border: '1px solid var(--border-color)', height: '40px', marginTop: '22px' }}>
                      <Info size={14} style={{ color: 'var(--primary-dark)', marginRight: '8px' }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Voucher value settles automatically under Cash accounts.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Supplier Details Card */}
              {supplierDetail && (
                <div className="card" style={{ padding: '20px 24px', borderRadius: '16px', border: '1px dashed var(--primary-dark)', backgroundColor: 'var(--card-bg)', display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fadeIn 0.25s ease-out' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={15} /> Active Supplier Ledger Profile
                    </div>
                    <span className="badge badge-info" style={{ fontSize: '10px' }}>ID: {supplierDetail.id}</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Supplier Name</span>
                      <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{supplierDetail.name}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>{supplierDetail.address || 'No Address Logged'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Contact Phone</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{supplierDetail.phone || 'N/A'}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>GSTIN</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{supplierDetail.gstin || 'Unregistered'}</span>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Outstanding Balance</span>
                      <strong style={{ fontSize: '18px', fontWeight: 800, color: supplierDetail.outstanding > 0 ? 'var(--color-danger)' : 'var(--color-success-dark)', marginTop: '2px' }}>
                        {formatINR(supplierDetail.outstanding)}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 3: Product Details Table */}
              <div className="card" style={{ padding: '24px 28px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '13px', fontWeight: 800,
                    }}>2</div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Agricultural Stock Inward Items</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Specify item lines, cost prices and trade discounts</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                      setActiveProductRowIndex(null);
                      setIsProductModalOpen(true);
                    }} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Plus size={13} /> New Product
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleAddItemRow} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Plus size={13} /> Add Row
                    </button>
                  </div>
                </div>

                {items.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px', border: '2px dashed var(--border-color)', borderRadius: '12px', background: 'var(--bg-app)' }}>
                    No products added to purchase draft. Click 'Add Row' to record items.
                  </div>
                ) : (
                  <div className="table-wrapper" style={{ margin: 0, overflowX: 'auto' }}>
                    <table className="data-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Product *</th>
                          <th style={{ width: '100px' }}>Category</th>
                          <th style={{ width: '80px', textAlign: 'center' }}>Unit</th>
                          <th style={{ width: '85px', textAlign: 'center' }}>Qty *</th>
                          <th style={{ width: '115px', textAlign: 'right' }}>Cost Price (₹) *</th>
                          <th style={{ width: '85px', textAlign: 'center' }}>Discount (%)</th>
                          <th style={{ width: '70px', textAlign: 'center' }}>GST</th>
                          <th style={{ width: '100px', textAlign: 'right' }}>Tax Amt (₹)</th>
                          <th style={{ width: '110px', textAlign: 'right' }}>Total (₹)</th>
                          <th style={{ width: '40px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => {
                          const product = products.find((p) => p.id === item.productId);
                          const unitLabel = getProductUnit(product);
                          const calc = calculateRowTotal(item.productId, item.quantity, item.price, item.discount);
                          const isEven = index % 2 === 0;

                          return (
                            <tr key={index} style={{ background: isEven ? 'transparent' : 'rgba(var(--primary-rgb), 0.01)' }}>
                              {/* Product select */}
                              <td>
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                                  <select
                                    className="form-control"
                                    style={{ fontSize: '13px', paddingRight: '24px', minWidth: '150px' }}
                                    value={item.productId}
                                    onChange={(e) => handleUpdateItemRow(index, 'productId', e.target.value)}
                                    required
                                  >
                                    <option value="">-- Choose --</option>
                                    {products.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name}
                                      </option>
                                    ))}
                                  </select>
                                  <span style={{ position: 'absolute', right: '8px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                  </span>
                                </div>
                                <button type="button" style={{ border: 'none', background: 'none', color: 'var(--primary-dark)', fontSize: '10px', fontWeight: 600, padding: '2px 0 0 0', cursor: 'pointer' }} onClick={() => {
                                  setActiveProductRowIndex(index);
                                  setIsProductModalOpen(true);
                                }}>
                                  + Create New
                                </button>
                              </td>

                              {/* Category */}
                              <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {product ? product.category : '—'}
                              </td>

                              {/* Unit */}
                              <td style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                <span className="badge badge-secondary" style={{ padding: '2px 6px', fontSize: '10px' }}>{unitLabel}</span>
                              </td>

                              {/* Qty */}
                              <td>
                                <input
                                  type="number"
                                  className="form-control text-center"
                                  style={{ fontSize: '13px', textAlign: 'center', padding: '6px' }}
                                  min="1"
                                  value={item.quantity || ''}
                                  onChange={(e) => handleUpdateItemRow(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                  required
                                />
                              </td>

                              {/* Cost Price */}
                              <td>
                                <input
                                  type="number"
                                  className="form-control text-right"
                                  style={{ fontSize: '13px', textAlign: 'right', padding: '6px' }}
                                  min="0"
                                  step="any"
                                  value={item.price || ''}
                                  onChange={(e) => handleUpdateItemRow(index, 'price', Math.max(0, parseFloat(e.target.value) || 0))}
                                  required
                                />
                              </td>

                              {/* Discount % */}
                              <td>
                                <input
                                  type="number"
                                  className="form-control text-center"
                                  style={{ fontSize: '13px', textAlign: 'center', padding: '6px' }}
                                  min="0"
                                  max="100"
                                  placeholder="0"
                                  value={item.discount || ''}
                                  onChange={(e) => handleUpdateItemRow(index, 'discount', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                />
                              </td>

                              {/* GST % */}
                              <td style={{ textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                {calc.gstRate}%
                              </td>

                              {/* Tax Amount */}
                              <td style={{ textAlign: 'right', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {formatINR(calc.gstAmount).replace('₹', '')}
                              </td>

                              {/* Total Amount */}
                              <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                                {formatINR(calc.total).replace('₹', '')}
                              </td>

                              {/* Remove action */}
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className="btn-icon danger"
                                  onClick={() => handleRemoveItemRow(index)}
                                  title="Remove product line"
                                >
                                  <Trash size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Section 4: Additional Charges & Notes */}
              <div className="card" style={{ padding: '24px 28px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '13px', fontWeight: 800,
                  }}>3</div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Additional Charges & Transit Remarks</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Input logistics costs and notes</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Truck size={14} /> Transport Charges (₹)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0.00"
                      min="0"
                      value={transportCharges || ''}
                      onChange={(e) => setTransportCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Loading/Unloading Charges (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0.00"
                      min="0"
                      value={loadingCharges || ''}
                      onChange={(e) => setLoadingCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Other Extra Charges (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0.00"
                      min="0"
                      value={otherCharges || ''}
                      onChange={(e) => setOtherCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Transit Notes / General Remarks</label>
                  <textarea
                    className="form-control"
                    placeholder="e.g. Weighbridge details, transport agent, freight receipt details"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Section 5: Payment Details */}
              <div className="card" style={{ padding: '24px 28px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '13px', fontWeight: 800,
                  }}>4</div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Payment & Settlements</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Enter paid amounts and payment modes</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Payment Mode *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <select
                        className="form-control"
                        style={{ paddingRight: '36px' }}
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        required
                      >
                        <option value="Bank Transfer">Bank Transfer (RTGS/NEFT)</option>
                        <option value="UPI">UPI / QR Scan</option>
                        <option value="Cash">Cash Ledger</option>
                        <option value="Cheque">Cheque Payment</option>
                      </select>
                      <span style={{ position: 'absolute', right: '14px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Transaction Reference No. (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. UTR-9824874523"
                      value={transactionReference}
                      onChange={(e) => setTransactionReference(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Amount Paid to Supplier (₹) *</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="₹ 0.00"
                      min="0"
                      max={totals.grandTotal}
                      value={amountPaid || ''}
                      onChange={(e) => setAmountPaid(Math.min(totals.grandTotal, Math.max(0, parseFloat(e.target.value) || 0)))}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-app)', padding: '12px 18px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Remaining Due:</span>
                      <strong style={{ fontSize: '15px', color: totals.balanceDue > 0 ? 'var(--color-danger)' : 'var(--color-success-dark)' }}>
                        {formatINR(totals.balanceDue)}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Clearance Status:</span>
                      <span className={`badge ${totals.balanceDue === 0 ? 'badge-success' : amountPaid > 0 ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                        {totals.balanceDue === 0 ? 'FULLY PAID' : amountPaid > 0 ? 'PARTIAL' : 'UNPAID'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 6: Attachments */}
              <div className="card" style={{ padding: '24px 28px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '4px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '13px', fontWeight: 800,
                  }}>5</div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Supplier Invoice Attachment</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Upload scans of purchase bills for document audits</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', alignItems: 'center' }}>
                  <div>
                    <input
                      type="file"
                      id="bill-attachment-upload"
                      style={{ display: 'none' }}
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAttachedFile(file);
                          setAttachedFileName(file.name);
                          showToast(`Document "${file.name}" uploaded successfully!`, 'success');
                        }
                      }}
                    />
                    <label htmlFor="bill-attachment-upload" className="btn btn-secondary" style={{ width: '100%', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', border: '1px dashed var(--primary-dark)' }}>
                      <Upload size={16} /> Choose File
                    </label>
                  </div>

                  <div>
                    {attachedFileName ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', animation: 'fadeIn 0.2s ease-out' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <FileText size={18} style={{ color: 'var(--primary-dark)', flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={attachedFileName}>
                            {attachedFileName}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '10px' }} onClick={() => setShowAttachmentPreview(true)}>
                            <Eye size={12} /> View
                          </button>
                          <button type="button" className="btn-icon danger" style={{ padding: '4px' }} onClick={() => {
                            setAttachedFileName('');
                            setAttachedFile(null);
                            showToast('Attachment removed.', 'info');
                          }}>
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        No bill attachment uploaded yet. PDF or image receipts supported.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: STICKY SUMMARY CARD */}
            <div style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{
                borderRadius: '16px',
                background: 'linear-gradient(145deg, var(--bg-card) 0%, color-mix(in srgb, var(--bg-card) 92%, var(--primary) 8%) 100%)',
                border: '1.5px solid color-mix(in srgb, var(--primary) 20%, var(--border-color))',
                padding: '24px',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.5px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
                  Voucher Value Summary
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Product Subtotal</span>
                  <span style={{ fontWeight: 600 }}>{formatINR(totals.subtotal)}</span>
                </div>

                {totals.discountTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Trade Discounts</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-success-dark)' }}>-{formatINR(totals.discountTotal)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Taxable Value</span>
                  <span style={{ fontWeight: 600 }}>{formatINR(totals.taxableAmount)}</span>
                </div>

                {gstType === 'IntraState' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)', paddingLeft: '8px' }}>• CGST (50%)</span>
                      <span style={{ fontWeight: 500 }}>{formatINR(totals.cgst)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)', paddingLeft: '8px' }}>• SGST (50%)</span>
                      <span style={{ fontWeight: 500 }}>{formatINR(totals.sgst)}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)', paddingLeft: '8px' }}>• IGST (Interstate)</span>
                    <span style={{ fontWeight: 600 }}>{formatINR(totals.igst)}</span>
                  </div>
                )}

                {totals.additionalCharges > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Logistics Charges</span>
                    <span style={{ fontWeight: 600 }}>{formatINR(totals.additionalCharges)}</span>
                  </div>
                )}

                <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '19px', fontWeight: 800 }}>
                  <span style={{ color: 'var(--text-primary)' }}>Grand Total</span>
                  <span style={{ color: 'var(--primary-dark)' }}>{formatINR(totals.grandTotal)}</span>
                </div>

                <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

                {amountPaid > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Paid amount</span>
                    <span style={{ fontWeight: 600, color: 'var(--color-success-dark)' }}>{formatINR(amountPaid)}</span>
                  </div>
                )}

                <div style={{
                  display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700,
                  padding: '10px 14px', borderRadius: '10px', marginTop: '6px',
                  background: totals.balanceDue > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                  color: totals.balanceDue > 0 ? 'var(--color-danger)' : 'var(--color-success-dark)',
                  border: `1px solid ${totals.balanceDue > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                }}>
                  <span>{totals.balanceDue > 0 ? 'Due Balance' : '✓ Full Settlement'}</span>
                  <span>{formatINR(totals.balanceDue)}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                  <button type="submit" className="btn btn-primary" style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    borderRadius: '10px',
                    boxShadow: '0 4px 16px rgba(16,185,129,0.25)',
                  }} disabled={items.length === 0 || !items[0].productId}>
                    ✓ Save Purchase
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={(e) => handleSavePurchaseWrapper(e, true)} style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '13px',
                    borderRadius: '10px',
                  }} disabled={items.length === 0 || !items[0].productId}>
                    Save & Add New
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    handleResetForm();
                  }} style={{ width: '100%', padding: '10px', fontSize: '13px', borderRadius: '10px' }}>
                    Discard Draft
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Quick add supplier modal */}
        <SupplierModal
          isOpen={isSupplierModalOpen}
          onClose={() => setIsSupplierModalOpen(false)}
          onSaveCallback={(s) => setSelectedSupplierId(s.id)}
        />

        {/* Quick add product modal */}
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setActiveProductRowIndex(null);
          }}
          onSaveCallback={(newProd) => {
            if (activeProductRowIndex !== null) {
              handleUpdateItemRow(activeProductRowIndex, 'productId', newProd.id);
            } else {
              setItems((prev) => {
                const updated = [...prev];
                // Replace first empty item or add new row
                if (updated.length === 1 && !updated[0].productId) {
                  updated[0] = {
                    productId: newProd.id,
                    quantity: 1,
                    price: newProd.purchasePrice,
                    discount: 0,
                    gstRate: newProd.gstRate,
                  };
                  return updated;
                }
                return [
                  ...prev,
                  {
                    productId: newProd.id,
                    quantity: 1,
                    price: newProd.purchasePrice,
                    discount: 0,
                    gstRate: newProd.gstRate,
                  }
                ];
              });
            }
            setIsProductModalOpen(false);
            setActiveProductRowIndex(null);
            showToast(`Product "${newProd.name}" added to list!`, 'success');
          }}
        />

        {/* Simulated Attachment Preview Modal */}
        {showAttachmentPreview && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, animation: 'fadeIn 0.2s ease-out'
          }}>
            <div className="card" style={{ width: '90%', maxWidth: '650px', padding: '24px', position: 'relative' }}>
              <button type="button" className="btn-icon" style={{ position: 'absolute', right: '16px', top: '16px' }} onClick={() => setShowAttachmentPreview(false)}>
                <X size={20} />
              </button>
              
              <h4 style={{ fontWeight: 700, fontSize: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: 'var(--primary-dark)' }} /> Invoice Attachment Preview
              </h4>

              <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '300px', display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: 'monospace', fontSize: '11px', color: '#334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #cbd5e1', paddingBottom: '10px' }}>
                  <div>
                    <strong>{supplierDetail ? supplierDetail.name.toUpperCase() : 'SUPPLIER CORP'}</strong>
                    <br />Address: {supplierDetail?.address || 'Supplier Road, Sector-4'}
                    <br />GSTIN: {supplierDetail?.gstin || '23SUPPL7732D2Z1'}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>INVOICE BILL</strong>
                    <br />Invoice No: {supplierInvoiceNumber || 'INV-TEMP'}
                    <br />Invoice Date: {supplierInvoiceDate}
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                      <th style={{ textAlign: 'left', padding: '4px' }}>Item description</th>
                      <th style={{ textAlign: 'center', padding: '4px', width: '50px' }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '4px', width: '80px' }}>Rate (₹)</th>
                      <th style={{ textAlign: 'right', padding: '4px', width: '90px' }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const prod = products.find((p) => p.id === item.productId);
                      if (!prod) return null;
                      const calc = calculateRowTotal(item.productId, item.quantity, item.price, item.discount);
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '4px' }}>{prod.name}</td>
                          <td style={{ textAlign: 'center', padding: '4px' }}>{item.quantity}</td>
                          <td style={{ textAlign: 'right', padding: '4px' }}>{formatINR(item.price).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right', padding: '4px' }}>{formatINR(calc.total).replace('₹', '')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div style={{ marginTop: 'auto', borderTop: '2px solid #cbd5e1', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', alignSelf: 'flex-end', width: '220px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Goods Value:</span>
                    <span>{formatINR(totals.subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Discounts:</span>
                    <span>-{formatINR(totals.discountTotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>GST Taxes:</span>
                    <span>{formatINR(totals.gstTotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #e2e8f0', paddingTop: '4px', fontSize: '12px' }}>
                    <span>Total Bill:</span>
                    <span>{formatINR(totals.grandTotal)}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAttachmentPreview(false)}>
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. Purchases List view
  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* Top filter row */}
      <div className="filters-row">
        <div className="filters-left">
          <div className="search-input-wrapper">
            <Search size={16} className="search-input-icon" />
            <input
              type="text"
              placeholder="Search bill number or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Segmented Filter Control */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-app)', padding: '3px', borderRadius: '10px', border: '1.5px solid var(--border-color)', gap: '2px' }}>
            {['All', 'Paid', 'Partial', 'Unpaid'].map((status) => {
              const isActive = statusFilter === status;
              return (
                <button
                  key={status}
                  className="btn-sm"
                  type="button"
                  style={{
                    padding: '5px 10px',
                    borderRadius: '7px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    backgroundColor: isActive ? 'var(--card-bg, #ffffff)' : 'transparent',
                    color: isActive ? 'var(--primary-dark)' : 'var(--text-secondary)',
                    boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.06)' : 'none',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => {
                    setStatusFilter(status);
                    setCurrentPage(1);
                  }}
                >
                  {status}
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '14px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <ArrowUpDown size={13} />
            </span>
            <select
              className="filter-select"
              style={{ paddingLeft: '36px' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Newest Date first</option>
              <option value="date-asc">Oldest Date first</option>
              <option value="amount-desc">Highest Bill amount</option>
              <option value="amount-asc">Lowest Bill amount</option>
              <option value="number-desc">Bill number desc</option>
            </select>
            <span style={{ position: 'absolute', right: '14px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => setIsEnteringPurchase(true)}>
          <Plus size={16} /> Enter Purchase
        </button>
      </div>

      {/* List Grid */}
      <div className="card">
        {sortedPurchases.length === 0 ? (
          <div className="empty-state">
            <FileSpreadsheet size={48} className="empty-state-icon" />
            <h4 className="empty-state-title">No Purchase Records</h4>
            <p className="empty-state-desc">
              No supplier purchases match your filters or searching criteria.
            </p>
            <button className="btn btn-primary" onClick={() => setIsEnteringPurchase(true)}>
              Log New Purchase
            </button>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-nowrap">Bill Number</th>
                    <th>Supplier Name</th>
                    <th className="text-nowrap">Receipt Date</th>
                    <th className="text-nowrap">Total Bill (₹)</th>
                    <th className="text-nowrap">Balance Owed (₹)</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center', width: '100px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPurchases.map((pur) => (
                    <tr key={pur.id}>
                      <td style={{ fontWeight: 600, color: 'var(--color-info)', whiteSpace: 'nowrap' }}>{pur.purchaseNumber}</td>
                      <td style={{ fontWeight: 600 }}>{pur.supplierName}</td>
                      <td className="text-nowrap">{formatDate(pur.date)}</td>
                      <td style={{ fontWeight: 700 }}>{formatINR(pur.grandTotal).replace('₹', '')}</td>
                      <td
                        style={{
                          fontWeight: pur.balanceDue > 0 ? 700 : 600,
                          color: pur.balanceDue > 0 ? 'var(--color-danger)' : 'var(--text-secondary)',
                        }}
                      >
                        {formatINR(pur.balanceDue).replace('₹', '')}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            pur.paymentStatus === 'Paid'
                              ? 'badge-success'
                              : pur.paymentStatus === 'Partial'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                        >
                          {pur.paymentStatus}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            className="btn-icon"
                            onClick={() => setViewPurchase(pur.id)}
                            title="View Voucher"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn-icon danger"
                            onClick={() => handleDeletePurchase(pur.id, pur.purchaseNumber)}
                            title="Delete Purchase Voucher"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-row">
                <span>
                  Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> (
                  {sortedPurchases.length} bills)
                </span>
                <div className="pagination-btn-group">
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((c) => c - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((c) => c + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
