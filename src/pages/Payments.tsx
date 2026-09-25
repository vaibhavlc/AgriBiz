import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate, getFullAddress } from '../utils/dummyData';
import { Modal } from '../components/Modal';
import { KpiCard } from '../components/KpiCard';
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
    openNewPaymentForm,
    openEditPaymentForm,
  } = useApp();

  const upiIn = payments.filter((p) => p.type === 'CustomerReceipt' && p.paymentMethod === 'UPI').reduce((s, p) => s + p.amount, 0);
  const upiOut = payments.filter((p) => p.type === 'SupplierPayment' && p.paymentMethod === 'UPI').reduce((s, p) => s + p.amount, 0);
  const cashIn = payments.filter((p) => p.type === 'CustomerReceipt' && p.paymentMethod === 'Cash').reduce((s, p) => s + p.amount, 0);
  const cashOut = payments.filter((p) => p.type === 'SupplierPayment' && p.paymentMethod === 'Cash').reduce((s, p) => s + p.amount, 0);

  const totalCustomerDues = customers.reduce((s, c) => s + c.outstanding, 0);
  const totalSupplierOwed = suppliers.reduce((s, supp) => s + supp.outstanding, 0);

  const [activeTab, setActiveTab] = useState<'CustomerReceipt' | 'SupplierPayment'>('CustomerReceipt');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [activeMenuPaymentId, setActiveMenuPaymentId] = useState<string | null>(null);

  useEffect(() => {
    if (paymentFormPreset) {
      openNewPaymentForm(paymentFormPreset);
      setPaymentFormPreset(null);
    }
  }, [paymentFormPreset, setPaymentFormPreset, openNewPaymentForm]);

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
        <KpiCard
          label="Customer Receipts (Inward)"
          value={formatINR(payments.filter((p) => p.type === 'CustomerReceipt').reduce((s, p) => s + p.amount, 0))}
          subtext="Total collection bank deposits"
          icon={<TrendingUp size={24} />}
          variant="success"
          onClick={() => {
            setActiveTab('CustomerReceipt');
            setCurrentPage(1);
          }}
          style={{ borderColor: activeTab === 'CustomerReceipt' ? 'var(--primary)' : 'var(--border-color)' }}
        />

        <KpiCard
          label="Supplier Payments (Outward)"
          value={formatINR(payments.filter((p) => p.type === 'SupplierPayment').reduce((s, p) => s + p.amount, 0))}
          subtext="Total supplier cash outlays"
          icon={<TrendingDown size={24} />}
          variant="danger"
          onClick={() => {
            setActiveTab('SupplierPayment');
            setCurrentPage(1);
          }}
          style={{ borderColor: activeTab === 'SupplierPayment' ? 'var(--primary)' : 'var(--border-color)' }}
        />
      </div>

      <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
        {/* UPI Ledger */}
        <KpiCard
          label="UPI Ledger"
          value={formatINR(upiIn + upiOut)}
          subtext={`In: ${formatINR(upiIn)} | Out: ${formatINR(upiOut)}`}
          icon={<Smartphone size={20} />}
          variant="info"
        />

        {/* Cash Ledger */}
        <KpiCard
          label="Cash Ledger"
          value={formatINR(cashIn + cashOut)}
          subtext={`In: ${formatINR(cashIn)} | Out: ${formatINR(cashOut)}`}
          icon={<Wallet size={20} />}
          variant="success"
        />

        {/* Total Customer Dues */}
        <KpiCard
          label="Customer Dues (Receivable)"
          value={formatINR(totalCustomerDues)}
          subtext="Total outstanding balance"
          icon={<AlertCircle size={20} />}
          variant="warning"
        />

        {/* Total Supplier Owed */}
        <KpiCard
          label="Supplier Owed (Payable)"
          value={formatINR(totalSupplierOwed)}
          subtext="Total accounts payable balance"
          icon={<TrendingDown size={20} />}
          variant="danger"
        />
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
                openNewPaymentForm({ contactId: '', type: activeTab });
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
            <button className="btn btn-primary" onClick={() => openNewPaymentForm({ contactId: '', type: activeTab })}>
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
                                    openEditPaymentForm(pay);
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
                                openEditPaymentForm(pay);
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
