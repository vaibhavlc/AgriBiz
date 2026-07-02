import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate } from '../utils/dummyData';
import { Modal } from '../components/Modal';
import {
  Plus,
  Search,
  Trash,
  TrendingDown,
  TrendingUp,
  Printer,
  ArrowRightLeft,
} from 'lucide-react';
import type { Payment } from '../types';

export const Payments: React.FC = () => {
  const {
    payments,
    customers,
    suppliers,
    addPayment,
    deletePayment,
    searchQuery,
    setSearchQuery,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'CustomerReceipt' | 'SupplierPayment'>('CustomerReceipt');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  // New payment form states
  const [paymentType, setPaymentType] = useState<'CustomerReceipt' | 'SupplierPayment'>('CustomerReceipt');
  const [contactId, setContactId] = useState('');
  const [paymentDate, setPaymentDate] = useState('2026-07-01');
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque'>('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Filtering states
  const [methodFilter, setMethodFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleOpenReceipt = (pay: Payment) => {
    setSelectedReceipt(pay);
    setIsReceiptOpen(true);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId) {
      showToast('Please select a contact to log payment.', 'error');
      return;
    }
    if (amount <= 0) {
      showToast('Please enter a valid amount greater than zero.', 'error');
      return;
    }

    const contactName =
      paymentType === 'CustomerReceipt'
        ? customers.find((c) => c.id === contactId)?.name || 'Unknown Customer'
        : suppliers.find((s) => s.id === contactId)?.name || 'Unknown Supplier';

    addPayment({
      date: paymentDate,
      type: paymentType,
      contactId,
      contactName,
      amount,
      paymentMethod,
      referenceNumber: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    showToast(`Payment of ${formatINR(amount)} logged successfully!`);

    // Reset states
    setContactId('');
    setAmount(0);
    setReferenceNumber('');
    setNotes('');
    setIsFormOpen(false);
  };

  const handleDeletePayment = (id: string, name: string, type: string) => {
    const confirmationMsg =
      type === 'CustomerReceipt'
        ? `Are you sure you want to delete this payment receipt from ${name}? This will INCREASE their outstanding balance.`
        : `Are you sure you want to delete this payment payout to ${name}? This will INCREASE our outstanding balance owed.`;

    if (confirm(confirmationMsg)) {
      deletePayment(id);
      showToast('Payment record deleted successfully.', 'info');
    }
  };

  // --- Filtering & Paginating Payments list ---
  const filteredPayments = payments.filter((p) => {
    const matchesTab = p.type === activeTab;

    const matchesSearch =
      p.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMethod = methodFilter === 'All' || p.paymentMethod === methodFilter;

    return matchesTab && matchesSearch && matchesMethod;
  });

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* Quick stats for payments overview */}
      <div className="grid-cols-2" style={{ marginBottom: '24px' }}>
        <div
          className="kpi-card"
          onClick={() => {
            setActiveTab('CustomerReceipt');
            setCurrentPage(1);
          }}
          style={{ borderColor: activeTab === 'CustomerReceipt' ? 'var(--primary)' : 'var(--border-color)' }}
        >
          <div className="kpi-info">
            <span className="kpi-label">Customer Receipts (Inward)</span>
            <span className="kpi-value" style={{ color: 'var(--color-success-dark)' }}>
              {formatINR(payments.filter((p) => p.type === 'CustomerReceipt').reduce((s, p) => s + p.amount, 0))}
            </span>
            <span className="kpi-subtext">Total collection bank deposits</span>
          </div>
          <div className="kpi-icon-container emerald">
            <TrendingUp size={24} />
          </div>
        </div>

        <div
          className="kpi-card"
          onClick={() => {
            setActiveTab('SupplierPayment');
            setCurrentPage(1);
          }}
          style={{ borderColor: activeTab === 'SupplierPayment' ? 'var(--primary)' : 'var(--border-color)' }}
        >
          <div className="kpi-info">
            <span className="kpi-label">Supplier Payments (Outward)</span>
            <span className="kpi-value" style={{ color: 'var(--color-danger)' }}>
              {formatINR(payments.filter((p) => p.type === 'SupplierPayment').reduce((s, p) => s + p.amount, 0))}
            </span>
            <span className="kpi-subtext">Total supplier cash outlays</span>
          </div>
          <div className="kpi-icon-container rose">
            <TrendingDown size={24} />
          </div>
        </div>
      </div>

      {/* Navigation and filters */}
      <div className="filters-row">
        <div className="filters-left">
          {/* Tab switches */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-app)',
              padding: '4px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'CustomerReceipt' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', borderRadius: '6px' }}
              onClick={() => {
                setActiveTab('CustomerReceipt');
                setCurrentPage(1);
              }}
            >
              Customer Receipts
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'SupplierPayment' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', borderRadius: '6px' }}
              onClick={() => {
                setActiveTab('SupplierPayment');
                setCurrentPage(1);
              }}
            >
              Supplier Payments
            </button>
          </div>

          {/* Search */}
          <div className="search-input-wrapper">
            <Search size={16} className="search-input-icon" />
            <input
              type="text"
              placeholder="Search contact or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Segmented Filter Control */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-app)', padding: '3px', borderRadius: '10px', border: '1.5px solid var(--border-color)', gap: '2px' }}>
            {[
              { value: 'All', label: 'All Methods' },
              { value: 'UPI', label: 'UPI' },
              { value: 'Cash', label: 'Cash' },
              { value: 'Bank Transfer', label: 'Bank' },
              { value: 'Cheque', label: 'Cheque' }
            ].map((opt) => {
              const isActive = methodFilter === opt.value;
              return (
                <button
                  key={opt.value}
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
                    setMethodFilter(opt.value);
                    setCurrentPage(1);
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setPaymentType(activeTab);
            setContactId('');
            setAmount(0);
            setIsFormOpen(true);
          }}
        >
          <Plus size={16} /> Record Payment
        </button>
      </div>

      {/* Main transaction list */}
      <div className="card">
        {filteredPayments.length === 0 ? (
          <div className="empty-state">
            <ArrowRightLeft size={48} className="empty-state-icon" />
            <h4 className="empty-state-title">No Payments Recorded</h4>
            <p className="empty-state-desc">
              There are no transactions matching your search query or selected method filters.
            </p>
            <button className="btn btn-primary" onClick={() => setIsFormOpen(true)}>
              Record First Payment
            </button>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-nowrap">Receipt Date</th>
                    <th className="text-nowrap">ID Code</th>
                    <th>{activeTab === 'CustomerReceipt' ? 'Customer' : 'Supplier'} Name</th>
                    <th className="text-nowrap">Amount Paid (₹)</th>
                    <th className="text-nowrap">Payment Method</th>
                    <th className="text-nowrap">Reference / Document No</th>
                    <th>Remarks / Notes</th>
                    <th className="text-nowrap" style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.map((pay) => (
                    <tr key={pay.id}>
                      <td className="text-nowrap">{formatDate(pay.date)}</td>
                      <td className="text-nowrap" style={{ fontWeight: 600, fontFamily: 'monospace' }}>{pay.id}</td>
                      <td style={{ fontWeight: 600 }}>{pay.contactName}</td>
                      <td
                        className="text-nowrap"
                        style={{
                          fontWeight: 700,
                          color: pay.type === 'CustomerReceipt' ? 'var(--color-success-dark)' : 'var(--color-danger-dark)',
                        }}
                      >
                        {formatINR(pay.amount)}
                      </td>
                      <td className="text-nowrap">
                        <span className="badge badge-info">{pay.paymentMethod}</span>
                      </td>
                      <td className="text-nowrap" style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                        {pay.referenceNumber || '—'}
                      </td>
                      <td style={{ fontStyle: 'italic', fontSize: '13px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pay.notes || '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            className="btn-icon"
                            onClick={() => handleOpenReceipt(pay)}
                            title="Print / View Receipt voucher"
                          >
                            <Printer size={16} />
                          </button>
                          <button
                            className="btn-icon danger"
                            onClick={() => handleDeletePayment(pay.id, pay.contactName, pay.type)}
                            title="Delete Payment record"
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
                  {filteredPayments.length} transactions)
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

      {/* Record Payment Form Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Record New Transaction">
        <form onSubmit={handleSavePayment}>
          <div className="form-group">
            <label className="form-label">Transaction Type *</label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="radio"
                  name="payType"
                  checked={paymentType === 'CustomerReceipt'}
                  onChange={() => {
                    setPaymentType('CustomerReceipt');
                    setContactId('');
                  }}
                />
                Customer Receipt (Inward)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="radio"
                  name="payType"
                  checked={paymentType === 'SupplierPayment'}
                  onChange={() => {
                    setPaymentType('SupplierPayment');
                    setContactId('');
                  }}
                />
                Supplier Payout (Outward)
              </label>
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
            >
              <option value="">-- Choose Contact --</option>
              {paymentType === 'CustomerReceipt'
                ? customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — Outstanding Dues: {formatINR(c.outstanding)}
                    </option>
                  ))
                : suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — Balance Owed: {formatINR(s.outstanding)}
                    </option>
                  ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Payment Date *</label>
              <input
                type="date"
                className="form-control"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Amount Transferred (₹) *</label>
              <input
                type="number"
                className="form-control"
                placeholder="₹ 0.00"
                value={amount || ''}
                onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <select
                className="form-control"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              >
                <option value="UPI">UPI / GPay / BHIM</option>
                <option value="Cash">Cash Ledger</option>
                <option value="Bank Transfer">Bank Transfer (IMPS/RTGS)</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div className="form-group">
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
              placeholder="e.g. Settle clear invoice AB-2026-002"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Log Payment Receipt
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      <Modal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} title="Payment Voucher Slip">
        {selectedReceipt && (
          <div>
            {/* Printable Area */}
            <div className="printable-invoice-card" style={{ padding: '24px', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid var(--primary)', paddingBottom: '16px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800 }}>AGRIBIZ SEEDS & IMPLEMENTS</h2>
                <p style={{ fontSize: '11px', color: '#64748b' }}>
                  Pipariya complex, MP • contact@agribizstore.com
                </p>
                <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginTop: '10px', color: 'var(--primary-dark)' }}>
                  {selectedReceipt.type === 'CustomerReceipt' ? 'Receipt Voucher' : 'Payment Outflow Voucher'}
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Voucher Number:</span>
                  <strong style={{ fontFamily: 'monospace' }}>{selectedReceipt.id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Transaction Date:</span>
                  <strong>{formatDate(selectedReceipt.date)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                  <span style={{ color: '#64748b' }}>
                    {selectedReceipt.type === 'CustomerReceipt' ? 'Received From (Customer):' : 'Paid To (Supplier):'}
                  </span>
                  <strong>{selectedReceipt.contactName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Transfer Method:</span>
                  <strong>{selectedReceipt.paymentMethod}</strong>
                </div>
                {selectedReceipt.referenceNumber && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Txn Reference ID:</span>
                    <strong style={{ fontFamily: 'monospace' }}>{selectedReceipt.referenceNumber}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a', padding: '8px 0', fontSize: '16px', fontWeight: 700 }}>
                  <span>Amount Transferred:</span>
                  <span style={{ color: 'var(--primary-dark)' }}>{formatINR(selectedReceipt.amount)}</span>
                </div>

                {selectedReceipt.notes && (
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>Remarks / Notes:</span>
                    <p style={{ fontStyle: 'italic', fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                      {selectedReceipt.notes}
                    </p>
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '11px', color: '#94a3b8', borderTop: '1px dashed #cbd5e1', paddingTop: '12px' }}>
                <p>Computer generated transaction voucher. Thank you!</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }} className="no-print">
              <button type="button" className="btn btn-secondary" onClick={() => setIsReceiptOpen(false)}>
                Close
              </button>
              <button type="button" className="btn btn-primary" onClick={handlePrintReceipt}>
                <Printer size={16} /> Print Voucher
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
