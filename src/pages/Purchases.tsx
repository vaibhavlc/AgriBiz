import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate } from '../utils/dummyData';
import { SupplierModal } from '../components/SupplierModal';
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
} from 'lucide-react';
import type { PurchaseItem } from '../types';

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

  // Local state for purchase entry
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('2026-07-01');
  const [items, setItems] = useState<Omit<PurchaseItem, 'productName' | 'gstAmount' | 'subtotal' | 'total'>[]>([
    { productId: '', quantity: 1, price: 0, gstRate: 0 }
  ]);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [notes, setNotes] = useState('');

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
  const calculateRowTotal = (productId: string, qty: number, costPrice: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return { subtotal: 0, gstAmount: 0, total: 0, gstRate: 0 };

    const subtotal = costPrice * qty;
    const gstRate = product.gstRate;
    const gstAmount = subtotal * (gstRate / 100);
    const total = subtotal + gstAmount;

    return { subtotal, gstAmount, total, gstRate };
  };

  const getPurchaseTotals = () => {
    let subtotalTotal = 0;
    let gstTotal = 0;
    let grandTotal = 0;

    items.forEach((item) => {
      const calc = calculateRowTotal(item.productId, item.quantity, item.price);
      subtotalTotal += calc.subtotal;
      gstTotal += calc.gstAmount;
      grandTotal += calc.total;
    });

    return {
      subtotal: subtotalTotal,
      gstTotal,
      grandTotal,
      balanceDue: Math.max(0, grandTotal - amountPaid),
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
        gstRate: defaultProduct.gstRate,
      },
    ]);
  };

  const handleUpdateItemRow = (index: number, field: string, value: any) => {
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
          }
        }
        return updated;
      })
    );
  };

  const handleRemoveItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      showToast('Please select a supplier to log stock purchase.', 'error');
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
      const calc = calculateRowTotal(item.productId, item.quantity, item.price);
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
      amountPaid >= totals.grandTotal
        ? 'Paid'
        : amountPaid > 0
        ? 'Partial'
        : 'Unpaid';

    addPurchase({
      date: purchaseDate,
      supplierId: selectedSupplierId,
      supplierName: supplier.name,
      items: purchaseItems,
      subtotal: totals.subtotal,
      gstTotal: totals.gstTotal,
      grandTotal: totals.grandTotal,
      amountPaid,
      balanceDue: totals.balanceDue,
      paymentStatus,
      paymentMethod: amountPaid > 0 ? paymentMethod : '',
      notes,
    });

    showToast(`Purchase voucher logged successfully!`);

    // Reset state
    setSelectedSupplierId('');
    setItems([{ productId: '', quantity: 1, price: 0, gstRate: 0 }]);
    setAmountPaid(0);
    setNotes('');
    setIsEnteringPurchase(false);
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

    return (
      <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsEnteringPurchase(false)}>
            <ArrowLeft size={16} /> Cancel
          </button>
          <h3 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            Log Supplier Purchase Entry
          </h3>
        </div>

        <form onSubmit={handleSavePurchase}>
          <div className="invoice-creator-container">
            {/* Left side form */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Supplier selection header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '16px',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '20px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <label className="form-label">Select Supplier *</label>
                  <select
                    className="form-control"
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.phone ? `(${s.phone})` : ''} — Balance owed: {formatINR(s.outstanding)}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsSupplierModalOpen(true)}
                  style={{ display: 'flex', gap: '6px' }}
                >
                  <Plus size={16} /> Add Supplier
                </button>
              </div>

              {/* Items Section */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                  }}
                >
                  <h4 style={{ fontWeight: 700 }}>Inward Products details</h4>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItemRow}>
                    <Plus size={14} /> Add Product Row
                  </button>
                </div>

                {items.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      padding: '30px',
                      border: '2px dashed var(--border-color)',
                      borderRadius: '8px',
                    }}
                  >
                    No products added yet. Click 'Add Product Row' to start entering stock items.
                  </div>
                ) : (
                  <div>
                    {/* Item labels header */}
                    <div className="invoice-item-grid-row" style={{ gridTemplateColumns: '4fr 2fr 1.5fr 2fr auto', fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                      <div>Product *</div>
                      <div>Unit Purchase Cost (₹) *</div>
                      <div style={{ textAlign: 'center' }}>Quantity *</div>
                      <div style={{ textAlign: 'right' }}>Total (₹)</div>
                      <div></div>
                    </div>

                    {items.map((item, index) => {
                      const selectedProduct = products.find((p) => p.id === item.productId);
                      const calc = selectedProduct
                        ? calculateRowTotal(item.productId, item.quantity, item.price)
                        : { total: 0 };

                      return (
                        <div key={index} className="invoice-item-grid-row" style={{ gridTemplateColumns: '4fr 2fr 1.5fr 2fr auto' }}>
                          {/* Product select */}
                          <div>
                            <select
                              className="form-control"
                              value={item.productId}
                              onChange={(e) => handleUpdateItemRow(index, 'productId', e.target.value)}
                              required
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Price */}
                          <div>
                            <input
                              type="number"
                              className="form-control"
                              value={item.price}
                              onChange={(e) => handleUpdateItemRow(index, 'price', parseFloat(e.target.value) || 0)}
                              required
                            />
                          </div>

                          {/* Qty */}
                          <div>
                            <input
                              type="number"
                              className="form-control"
                              style={{ textAlign: 'center' }}
                              value={item.quantity}
                              min={1}
                              onChange={(e) => handleUpdateItemRow(index, 'quantity', parseInt(e.target.value) || 1)}
                              required
                            />
                          </div>

                          {/* Line total */}
                          <div style={{ textAlign: 'right', fontWeight: 600 }}>
                            {formatINR(calc.total).replace('₹', '')}
                          </div>

                          {/* Delete Row button */}
                          <div>
                            <button
                              type="button"
                              className="btn-icon danger"
                              onClick={() => handleRemoveItemRow(index)}
                              aria-label="Remove item"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right side config */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Meta & Date */}
              <div className="card">
                <h4 style={{ fontWeight: 700, marginBottom: '16px' }}>Voucher Config</h4>
                <div className="form-group">
                  <label className="form-label">Purchase Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Payment Details */}
              <div className="card">
                <h4 style={{ fontWeight: 700, marginBottom: '16px' }}>Paid Outflow</h4>
                <div className="form-group">
                  <label className="form-label">Amount Paid to Supplier (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="₹ 0.00"
                    value={amountPaid || ''}
                    max={totals.grandTotal}
                    onChange={(e) => setAmountPaid(Math.min(totals.grandTotal, Math.max(0, parseFloat(e.target.value) || 0)))}
                  />
                </div>

                {amountPaid > 0 && (
                  <div className="form-group">
                    <label className="form-label">Payment Outflow Mode *</label>
                    <select
                      className="form-control"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="Bank Transfer">Bank Transfer (RTGS/NEFT)</option>
                      <option value="Cheque">Cheque</option>
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Voucher Notes / Bill details</label>
                  <textarea
                    className="form-control"
                    placeholder="e.g. Bill reference code, transit details"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Calculations summary */}
              <div className="card" style={{ backgroundColor: 'var(--color-info-bg)', borderColor: 'rgba(59,130,246,0.2)' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--color-info-dark)' }}>Voucher Value</h4>
                <table className="invoice-totals-table">
                  <tbody>
                    <tr>
                      <td style={{ color: 'var(--text-secondary)' }}>Product Base Value</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatINR(totals.subtotal)}</td>
                    </tr>
                    <tr>
                      <td style={{ color: 'var(--text-secondary)' }}>Input GST Dues</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatINR(totals.gstTotal)}</td>
                    </tr>
                    <tr className="grand-total" style={{ borderTopColor: 'rgba(59,130,246,0.4)' }}>
                      <td style={{ color: 'var(--color-info-dark)' }}>Voucher Total</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-info-dark)' }}>{formatINR(totals.grandTotal)}</td>
                    </tr>
                    <tr style={{ fontSize: '13px' }}>
                      <td style={{ color: 'var(--text-secondary)', paddingTop: '8px' }}>Balance We Owe</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: totals.balanceDue > 0 ? 'var(--color-danger)' : 'inherit', paddingTop: '8px' }}>
                        {formatINR(totals.balanceDue)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '20px', backgroundColor: 'var(--color-info-dark)' }}
                  disabled={items.length === 0}
                >
                  Log Purchase Voucher
                </button>
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

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">All Purchases</option>
            <option value="Paid">Paid status</option>
            <option value="Partial">Partial outstanding</option>
            <option value="Unpaid">Unpaid status</option>
          </select>

          <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date-desc">Newest Date first</option>
            <option value="date-asc">Oldest Date first</option>
            <option value="amount-desc">Highest Bill amount</option>
            <option value="amount-asc">Lowest Bill amount</option>
            <option value="number-desc">Bill number desc</option>
          </select>
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
                    <th>Bill Number</th>
                    <th>Supplier Name</th>
                    <th>Receipt Date</th>
                    <th style={{ textAlign: 'right' }}>Total Bill (₹)</th>
                    <th style={{ textAlign: 'right' }}>Balance Owed (₹)</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center', width: '100px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPurchases.map((pur) => (
                    <tr key={pur.id}>
                      <td style={{ fontWeight: 600, color: 'var(--color-info)' }}>{pur.purchaseNumber}</td>
                      <td style={{ fontWeight: 600 }}>{pur.supplierName}</td>
                      <td>{formatDate(pur.date)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatINR(pur.grandTotal).replace('₹', '')}</td>
                      <td
                        style={{
                          textAlign: 'right',
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
