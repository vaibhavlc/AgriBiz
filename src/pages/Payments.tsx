import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate, getFullAddress } from '../utils/dummyData';
import { Modal } from '../components/Modal';
import {
  Plus,
  Search,
  Trash,
  TrendingDown,
  TrendingUp,
  Printer,
  ArrowRightLeft,
  MoreVertical,
  Edit2,
  Eye,
  Tag,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import type { Payment } from '../types';

export const Payments: React.FC = () => {
  const {
    payments,
    customers,
    suppliers,
    addPayment,
    editPayment,
    deletePayment,
    searchQuery,
    setSearchQuery,
    showToast,
    setViewCustomer,
    setViewSupplier,
    setCurrentTab,
    paymentFormPreset,
    setPaymentFormPreset,
    settings,
  } = useApp();

  const upiIn = payments.filter((p) => p.type === 'CustomerReceipt' && p.paymentMethod === 'UPI').reduce((s, p) => s + p.amount, 0);
  const upiOut = payments.filter((p) => p.type === 'SupplierPayment' && p.paymentMethod === 'UPI').reduce((s, p) => s + p.amount, 0);
  const cashIn = payments.filter((p) => p.type === 'CustomerReceipt' && p.paymentMethod === 'Cash').reduce((s, p) => s + p.amount, 0);
  const cashOut = payments.filter((p) => p.type === 'SupplierPayment' && p.paymentMethod === 'Cash').reduce((s, p) => s + p.amount, 0);

  const totalCustomerDues = customers.reduce((s, c) => s + c.outstanding, 0);
  const totalSupplierOwed = suppliers.reduce((s, supp) => s + supp.outstanding, 0);

  const [activeTab, setActiveTab] = useState<'CustomerReceipt' | 'SupplierPayment'>('CustomerReceipt');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [activeMenuPaymentId, setActiveMenuPaymentId] = useState<string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  // New payment form states
  const [paymentType, setPaymentType] = useState<'CustomerReceipt' | 'SupplierPayment'>('CustomerReceipt');
  const [contactId, setContactId] = useState('');
  const [paymentDate, setPaymentDate] = useState('2026-07-01');
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque'>('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (paymentFormPreset) {
      setPaymentType(paymentFormPreset.type);
      setContactId(paymentFormPreset.contactId);
      setAmount(0);
      setReferenceNumber('');
      setNotes('');
      setEditingPaymentId(null);
      setIsFormOpen(true);
      setPaymentFormPreset(null);
    }
  }, [paymentFormPreset, setPaymentFormPreset]);

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

    if (editingPaymentId) {
      editPayment({
        id: editingPaymentId,
        date: paymentDate,
        type: paymentType,
        contactId,
        contactName,
        amount,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      showToast(`Payment of ${formatINR(amount)} updated successfully!`);
      setEditingPaymentId(null);
    } else {
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
    }

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
      {/* Segmented Tab Control matching Sales/Purchases tab header design */}
      <div className="no-print sales-segmented-tabs" style={{ 
        display: 'flex', 
        gap: '8px', 
        borderBottom: '1px solid var(--border-color)', 
        marginBottom: '24px',
        paddingBottom: '2px'
      }}>
        <button
          type="button"
          onClick={() => {
            setActiveTab('CustomerReceipt');
            setCurrentPage(1);
          }}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 700,
            border: 'none',
            background: 'none',
            color: activeTab === 'CustomerReceipt' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'CustomerReceipt' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <TrendingUp size={16} /> Customer Receipts
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('SupplierPayment');
            setCurrentPage(1);
          }}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 700,
            border: 'none',
            background: 'none',
            color: activeTab === 'SupplierPayment' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'SupplierPayment' ? '3px solid var(--primary)' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <TrendingDown size={16} /> Supplier Payments
        </button>
      </div>

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

      <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
        {/* UPI Ledger */}
        <div className="kpi-card" style={{ padding: '16px 20px', cursor: 'default' }}>
          <div className="kpi-info" style={{ gap: '2px' }}>
            <span className="kpi-label" style={{ fontSize: '11px' }}>UPI Ledger</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800 }}>
              {formatINR(upiIn + upiOut)}
            </span>
            <span className="kpi-subtext" style={{ fontSize: '10px' }}>
              In: {formatINR(upiIn)} | Out: {formatINR(upiOut)}
            </span>
          </div>
          <div className="kpi-icon-container blue" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--color-info)' }}>
            <Smartphone size={20} />
          </div>
        </div>

        {/* Cash Ledger */}
        <div className="kpi-card" style={{ padding: '16px 20px', cursor: 'default' }}>
          <div className="kpi-info" style={{ gap: '2px' }}>
            <span className="kpi-label" style={{ fontSize: '11px' }}>Cash Ledger</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800 }}>
              {formatINR(cashIn + cashOut)}
            </span>
            <span className="kpi-subtext" style={{ fontSize: '10px' }}>
              In: {formatINR(cashIn)} | Out: {formatINR(cashOut)}
            </span>
          </div>
          <div className="kpi-icon-container green" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--primary-dark)' }}>
            <Wallet size={20} />
          </div>
        </div>

        {/* Total Customer Dues */}
        <div className="kpi-card" style={{ padding: '16px 20px', cursor: 'default' }}>
          <div className="kpi-info" style={{ gap: '2px' }}>
            <span className="kpi-label" style={{ fontSize: '11px' }}>Customer Dues (Receivable)</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-warning-dark)' }}>
              {formatINR(totalCustomerDues)}
            </span>
            <span className="kpi-subtext" style={{ fontSize: '10px' }}>
              Total outstanding balance
            </span>
          </div>
          <div className="kpi-icon-container amber" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--color-warning-dark)' }}>
            <AlertCircle size={20} />
          </div>
        </div>

        {/* Total Supplier Owed */}
        <div className="kpi-card" style={{ padding: '16px 20px', cursor: 'default' }}>
          <div className="kpi-info" style={{ gap: '2px' }}>
            <span className="kpi-label" style={{ fontSize: '11px' }}>Supplier Owed (Payable)</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-danger-dark)' }}>
              {formatINR(totalSupplierOwed)}
            </span>
            <span className="kpi-subtext" style={{ fontSize: '10px' }}>
              Total accounts payable balance
            </span>
          </div>
          <div className="kpi-icon-container rose" style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--color-danger-dark)' }}>
            <TrendingDown size={20} />
          </div>
        </div>
      </div>

      {/* Style tweaks to support Sales-like responsive layout */}
      <style>{`
        .payments-filter-card {
          padding: 16px 20px;
          margin-bottom: 20px;
        }
        .payments-filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
        }
        .payments-filter-inputs {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          flex: 1 1 500px;
          min-width: 0;
        }
        .payments-filter-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
          flex: 0 1 auto;
        }
        @media (max-width: 768px) {
          .payments-filter-card {
            padding: 12px 14px;
          }
          .payments-filter-row {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .payments-filter-inputs {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            width: 100%;
            flex: none;
          }
          .payments-filter-inputs .search-input-wrapper {
            grid-column: span 1;
            width: 100% !important;
          }
          .payments-filter-inputs .method-select-wrapper {
            grid-column: span 1;
            width: 100% !important;
          }
          .payments-filter-inputs select {
            width: 100% !important;
            height: 38px;
          }
          .payments-filter-actions {
            width: 100%;
            flex: none;
          }
          .payments-filter-actions button,
          .payments-filter-actions .btn {
            width: 100% !important;
            margin: 0 !important;
            justify-content: center;
            height: 44px;
            font-size: 14px;
            font-weight: 700;
            border-radius: 10px;
          }
        }
      `}</style>

      {/* Navigation and filters wrapped inside a Card */}
      <div className="card payments-filter-card">
        <div className="payments-filter-row">
          <div className="payments-filter-inputs">
            {/* Search */}
            <div className="search-input-wrapper">
              <Search size={16} className="search-input-icon" />
              <input
                type="text"
                placeholder="Search contact or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* Payment Method Dropdown Filter */}
            <div className="method-select-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '14px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <Tag size={13} />
              </span>
              <select
                className="filter-select"
                style={{ paddingLeft: '36px', width: '100%' }}
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">All Methods</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="payments-filter-actions">
            <button
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onClick={() => {
                setPaymentType(activeTab);
                setContactId('');
                setAmount(0);
                setReferenceNumber('');
                setNotes('');
                setEditingPaymentId(null);
                setIsFormOpen(true);
              }}
            >
              <Plus size={16} /> Record Payment
            </button>
          </div>
        </div>
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
            {/* Desktop View */}
            <div className="desktop-only-table">
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
                        <td style={{ fontWeight: 600 }}>
                          <button
                            type="button"
                            className="table-link-btn supplier-link"
                            onClick={() => {
                              if (pay.type === 'CustomerReceipt') {
                                setViewCustomer(pay.contactId);
                                setCurrentTab('customers');
                              } else {
                                setViewSupplier(pay.contactId);
                                setCurrentTab('suppliers');
                              }
                            }}
                          >
                            {pay.contactName}
                          </button>
                        </td>
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
                        <td className="no-print" style={{ position: 'relative', textAlign: 'center', overflow: 'visible' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuPaymentId(activeMenuPaymentId === pay.id ? null : pay.id);
                            }}
                            title="Actions"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {activeMenuPaymentId === pay.id && (
                            <>
                              {/* Overlay to close the menu on clicking outside */}
                              <div 
                                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
                                onClick={() => setActiveMenuPaymentId(null)}
                              />
                              
                              {/* Dropdown Menu */}
                              <div className="card" style={{
                                position: 'absolute',
                                right: '100%',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                marginRight: '8px',
                                zIndex: 999,
                                minWidth: '150px',
                                padding: '6px 0',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                backgroundColor: 'var(--card-bg, #ffffff)',
                                border: '1px solid var(--border-color)',
                              }}>
                                <button 
                                  className="dropdown-item" 
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '8px 16px',
                                    border: 'none',
                                    background: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    color: 'var(--text-primary)',
                                  }}
                                  onClick={() => {
                                    setActiveMenuPaymentId(null);
                                    handleOpenReceipt(pay);
                                  }}
                                >
                                  <Eye size={14} /> View Voucher
                                </button>

                                <button 
                                  className="dropdown-item" 
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '8px 16px',
                                    border: 'none',
                                    background: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    color: 'var(--text-primary)',
                                  }}
                                  onClick={() => {
                                    setActiveMenuPaymentId(null);
                                    setPaymentType(pay.type);
                                    setContactId(pay.contactId);
                                    setPaymentDate(pay.date);
                                    setAmount(pay.amount);
                                    setPaymentMethod(pay.paymentMethod);
                                    setReferenceNumber(pay.referenceNumber || '');
                                    setNotes(pay.notes || '');
                                    setEditingPaymentId(pay.id);
                                    setIsFormOpen(true);
                                  }}
                                >
                                  <Edit2 size={14} /> Edit Record
                                </button>
                                
                                <button 
                                  className="dropdown-item danger" 
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '8px 16px',
                                    border: 'none',
                                    background: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    color: 'var(--color-danger)',
                                  }}
                                  onClick={() => {
                                    setActiveMenuPaymentId(null);
                                    handleDeletePayment(pay.id, pay.contactName, pay.type);
                                  }}
                                >
                                  <Trash size={14} /> Delete Record
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View */}
            <div className="mobile-card-list">
              {paginatedPayments.map((pay) => (
                <div key={pay.id} className="mobile-list-card">
                  <div className="mobile-list-card-header">
                    <div>
                      <h4 className="mobile-list-card-title">
                        <button
                          type="button"
                          className="table-link-btn supplier-link"
                          onClick={() => {
                            if (pay.type === 'CustomerReceipt') {
                              setViewCustomer(pay.contactId);
                              setCurrentTab('customers');
                            } else {
                              setViewSupplier(pay.contactId);
                              setCurrentTab('suppliers');
                            }
                          }}
                        >
                          {pay.contactName}
                        </button>
                      </h4>
                      <span className="mobile-list-card-subtitle">{formatDate(pay.date)} • <span className="badge badge-info">{pay.paymentMethod}</span></span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={(e) => { e.stopPropagation(); setActiveMenuPaymentId(activeMenuPaymentId === pay.id ? null : pay.id); }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {activeMenuPaymentId === pay.id && (
                        <>
                          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} onClick={() => setActiveMenuPaymentId(null)} />
                          <div className="card" style={{
                            position: 'absolute', right: '0', top: '100%', marginTop: '4px',
                            zIndex: 999, minWidth: '150px', padding: '6px 0',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                            display: 'flex', flexDirection: 'column', gap: '2px',
                            backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color)',
                          }}>
                            <button className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                              onClick={() => { setActiveMenuPaymentId(null); handleOpenReceipt(pay); }}>
                              <Eye size={14} /> View Voucher
                            </button>
                            <button className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                              onClick={() => {
                                setActiveMenuPaymentId(null);
                                setPaymentType(pay.type);
                                setContactId(pay.contactId);
                                setPaymentDate(pay.date);
                                setAmount(pay.amount);
                                setPaymentMethod(pay.paymentMethod);
                                setReferenceNumber(pay.referenceNumber || '');
                                setNotes(pay.notes || '');
                                setEditingPaymentId(pay.id);
                                setIsFormOpen(true);
                              }}>
                              <Edit2 size={14} /> Edit Record
                            </button>
                            <button className="dropdown-item danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--color-danger)' }}
                              onClick={() => { setActiveMenuPaymentId(null); handleDeletePayment(pay.id, pay.contactName, pay.type); }}>
                              <Trash size={14} /> Delete Record
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Voucher ID</span>
                    <span className="mobile-list-card-val" style={{ fontFamily: 'monospace' }}>{pay.id}</span>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Reference</span>
                    <span className="mobile-list-card-val" style={{ fontFamily: 'monospace' }}>{pay.referenceNumber || '—'}</span>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Amount</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700, color: pay.type === 'CustomerReceipt' ? 'var(--color-success-dark)' : 'var(--color-danger-dark)' }}>
                      {formatINR(pay.amount)}
                    </span>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Remarks</span>
                    <span className="mobile-list-card-val" style={{ fontStyle: 'italic', fontSize: '12px' }}>{pay.notes || '—'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-row">
                <span>
                  Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                  <strong>{Math.min(currentPage * itemsPerPage, filteredPayments.length)}</strong> of{' '}
                  <strong>{filteredPayments.length}</strong> transactions
                </span>
                <div className="pagination-btn-group">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                    title="Previous Page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                    title="Next Page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingPaymentId ? "Edit Transaction Record" : "Record New Transaction"}>
        <form onSubmit={handleSavePayment}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Transaction Type *</label>
            <div style={{
              display: 'flex',
              backgroundColor: 'var(--bg-app)',
              padding: '4px',
              borderRadius: '10px',
              border: '1.5px solid var(--border-color)',
              gap: '4px',
              width: '100%',
            }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
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
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
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

          <div className="form-group" style={{ marginBottom: '20px' }}>
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
                <div style={{
                  marginTop: '12px',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: cardColor,
                  border: `1px solid ${borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  animation: 'fadeIn 0.2s ease-out',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: borderColor,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '14px',
                    }}>
                      {selectedContact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{selectedContact.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selectedContact.phone}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{labelText}</div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: textColor }}>{formatINR(selectedContact.outstanding)}</div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="form-row" style={{ marginBottom: '16px' }}>
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

          <div className="form-row" style={{ marginBottom: '16px' }}>
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

          <div className="form-group" style={{ marginBottom: '24px' }}>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }} className="no-print">
            <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)} style={{ borderRadius: '8px' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{
              borderRadius: '8px',
              padding: '10px 20px',
              boxShadow: '0 4px 14px rgba(16,185,129,0.2)',
              fontWeight: 700,
            }}>
              {editingPaymentId ? '✓ Save Changes' : '✓ Log Transaction'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      <Modal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} title="Payment Voucher Slip">
        {selectedReceipt && (
          <div>
            {/* Printable Area */}
            <div className="printable-invoice-card" style={{ padding: '24px', border: '1px solid var(--border-color)', boxShadow: 'none', position: 'relative', overflow: 'hidden' }}>
              {/* Dynamic Logo Watermark in Center */}
              {settings.showLogo && (settings.watermarkLogo || settings.logo) && (
                <div className="print-watermark-logo">
                  <img src={settings.watermarkLogo || settings.logo} alt="Watermark" />
                </div>
              )}
              <div style={{ textAlign: 'center', borderBottom: '2px solid var(--primary)', paddingBottom: '16px', marginBottom: '20px', position: 'relative', zIndex: 2 }}>
                {settings.showLogo && settings.logo && (
                  <img src={settings.logo} alt="Business Logo" style={{ maxHeight: '100px', maxWidth: '240px', objectFit: 'contain', margin: 0, padding: 0 }} />
                )}
                <h2 style={{ fontSize: '18px', fontWeight: 800 }}>{(settings.businessName || "AgriBiz").toUpperCase()}</h2>
                {settings.showAddress && (
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0' }}>
                    {getFullAddress(settings)}
                  </p>
                )}
                {settings.showContact && (
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>
                    {[settings.phone, settings.email].filter(Boolean).join(' • ')}
                  </p>
                )}
                {settings.showGstin && settings.gstin && (
                  <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', margin: '2px 0 0 0' }}>
                    GSTIN: {settings.gstin}
                  </p>
                )}
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
