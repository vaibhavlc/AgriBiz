import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate } from '../utils/dummyData';
import { translatePaymentMethod } from '../utils/statusTranslation';
import { KpiCard } from '../components/KpiCard';
import { SupplierModal } from '../components/SupplierModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  FileText,
  ArrowUpRight,
  Truck,
  MoreVertical,
  Tag,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Scale,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import type { Supplier } from '../types';

export const Suppliers: React.FC = () => {
  const { t } = useTranslation();
  const {
    suppliers,
    purchases,
    payments,
    deleteSupplier,
    searchQuery,
    setSearchQuery,
    currentSupplierId,
    setViewSupplier,
    setViewPurchase,
    setCurrentTab,
    isEditingSupplier,
    setIsEditingSupplier,
    setPurchaseFormPresetSupplierId,
    settings,
    openNewPaymentForm,
    showToast,
  } = useApp();

  const totalSuppliers = suppliers.length;
  const pendingPayables = suppliers.reduce((sum, s) => sum + (s.outstanding > 0 ? s.outstanding : 0), 0);
  const activeAccounts = suppliers.filter(s => purchases.some(pur => pur.supplierId === s.id)).length;
  const averagePayable = suppliers.length > 0 ? (pendingPayables / suppliers.length) : 0;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [outstandingFilter, setOutstandingFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenuSupplierId, setActiveMenuSupplierId] = useState<string | null>(null);
  const itemsPerPage = 8;

  const handleEditClick = (s: Supplier) => {
    setIsEditingSupplier(s);
    setIsModalOpen(true);
  };

  const handleAddNewClick = () => {
    setIsEditingSupplier(null);
    setIsModalOpen(true);
  };

  const [isDeletingSupplier, setIsDeletingSupplier] = useState(false);
  const [deletingSupplierTarget, setDeletingSupplierTarget] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteSupplier = (id: string, name: string) => {
    setDeletingSupplierTarget({ id, name });
  };

  const confirmDeleteSupplier = async () => {
    if (isDeletingSupplier || !deletingSupplierTarget) return;
    setIsDeletingSupplier(true);
    try {
      await deleteSupplier(deletingSupplierTarget.id);
      showToast(t('supplier.deletedSuccess', 'Supplier {{name}} deleted successfully.', { name: deletingSupplierTarget.name }), 'info');
      setDeletingSupplierTarget(null);
    } catch (err: any) {
      showToast(t('supplier.deleteFailed', 'Failed to delete supplier: {{error}}', { error: err.message || err }), 'error');
    } finally {
      setIsDeletingSupplier(false);
    }
  };

  // --- Filtering & Sorting ---
  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery) ||
      (s.gstin && s.gstin.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesOutstanding = true;
    if (outstandingFilter === 'Owed') {
      matchesOutstanding = s.outstanding > 0;
    } else if (outstandingFilter === 'Zero') {
      matchesOutstanding = s.outstanding === 0;
    }

    return matchesSearch && matchesOutstanding;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedSupplier = suppliers.find((s) => s.id === currentSupplierId);

  // --- Supplier Ledger Account view ---
  if (selectedSupplier) {
    const supplierPurchases = purchases.filter((pur) => pur.supplierId === selectedSupplier.id);
    const supplierPayments = payments.filter((pay) => pay.contactId === selectedSupplier.id && pay.type === 'SupplierPayment');

    const totalPurchased = supplierPurchases.reduce((sum, pur) => sum + pur.grandTotal, 0);
    const totalPaid = supplierPayments.reduce((sum, pay) => sum + pay.amount, 0);
    const totalBillCount = supplierPurchases.length;
    const totalPaymentCount = supplierPayments.length;
    const allDates = [...supplierPurchases.map(p => p.date), ...supplierPayments.map(p => p.date)];
    const lastTxDate = allDates.length > 0 ? allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] : null;

    const ledgerEntries = [
      ...supplierPurchases.map((pur) => ({
        id: pur.id,
        date: pur.date,
        docNo: pur.purchaseNumber,
        type: 'Purchase',
        desc: `${t('supplier.purchaseReceipt', 'Purchase Receipt')} - ${pur.items.map((i) => i.productName).slice(0, 2).join(', ')}`,
        debit: pur.grandTotal,
        credit: 0,
        refId: pur.id,
      })),
      ...supplierPayments.map((pay) => ({
        id: pay.id,
        date: pay.date,
        docNo: pay.referenceNumber || 'N/A',
        type: 'Payment',
        desc: `${t('supplier.paymentIssued', 'Payment Issued')} - ${translatePaymentMethod(t, pay.paymentMethod)}${pay.notes ? ` (${pay.notes})` : ''}`,
        debit: 0,
        credit: pay.amount,
        refId: pay.id,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBal = 0;
    const ledgerWithBalance = ledgerEntries.map((entry) => {
      runningBal = runningBal + entry.debit - entry.credit;
      return { ...entry, balance: runningBal };
    });

    const outstandingColor = selectedSupplier.outstanding > 0
      ? 'var(--text-primary)'
      : selectedSupplier.outstanding < 0
        ? 'var(--color-success-dark)'
        : 'var(--text-primary)';

    return (
      <div style={{ position: 'relative' }}>
        {/* Web View Profile (hidden on print) */}
        <div className="cust-profile-root screen-only" style={{ animation: 'fadeIn 0.2s ease-out' }}>

        {/* ── Top Navigation Bar ── */}
        <div className="cust-profile-topbar no-print">
          <button className="btn btn-secondary" onClick={() => setViewSupplier(null)}>
            <ArrowLeft size={16} /> <span className="cust-back-label">{t('common.back', 'Back')}</span>
          </button>
          <div className="cust-profile-topbar-actions">
            <button className="btn btn-secondary" onClick={() => handleEditClick(selectedSupplier)}>
              <Edit2 size={15} /> <span>{t('common.edit', 'Edit')}</span>
            </button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              <FileText size={15} /> <span>{t('common.print', 'Print')}</span>
            </button>
          </div>
        </div>

        {/* ── Hero Identity Card ── */}
        <div className="cust-hero-card card">
          {/* Avatar + Name */}
          <div className="cust-hero-identity">
            <div className="cust-avatar" style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
              {selectedSupplier.name.charAt(0).toUpperCase()}
            </div>
            <div className="cust-hero-name-block">
              <h2 className="cust-hero-name">{selectedSupplier.name}</h2>
              <span className="badge badge-info">{t('supplier.supplierId', 'Supplier ID:')} {selectedSupplier.id}</span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="cust-hero-contacts">
            <div className="cust-contact-item">
              <Phone size={14} className="cust-contact-icon" />
              <span>{selectedSupplier.phone}</span>
            </div>
            {selectedSupplier.email && (
              <div className="cust-contact-item">
                <Mail size={14} className="cust-contact-icon" />
                <span>{selectedSupplier.email}</span>
              </div>
            )}
            {selectedSupplier.address && (
              <div className="cust-contact-item">
                <MapPin size={14} className="cust-contact-icon" />
                <span>{selectedSupplier.address}</span>
              </div>
            )}
            {selectedSupplier.gstin && (
              <div className="cust-contact-item">
                <FileText size={14} className="cust-contact-icon" />
                <span>{t('common.gstinLabel', 'GSTIN:')} <strong>{selectedSupplier.gstin}</strong></span>
              </div>
            )}
          </div>

          {/* Outstanding Balance Banner */}
          <div
            className="cust-outstanding-banner"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-app, #f9fafb)',
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            <div>
              <div className="cust-outstanding-label">{t('supplier.balanceWeOwe', 'Balance We Owe')}</div>
              <div className="cust-outstanding-sub">
                {selectedSupplier.outstanding > 0
                  ? t('supplier.pendingPaymentToSupplier', 'Pending payment to supplier')
                  : selectedSupplier.outstanding < 0
                    ? t('supplier.overpaidAdvanceBalance', 'Overpaid — advance balance')
                    : t('supplier.allBillsFullySettled', 'All bills fully settled')}
              </div>
            </div>
            <div className="cust-outstanding-amount" style={{ color: selectedSupplier.outstanding > 0 ? 'var(--color-warning-dark, #b45309)' : outstandingColor }}>
              {formatINR(selectedSupplier.outstanding)}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="cust-quick-actions no-print">
            <button
              className="btn btn-primary cust-action-btn"
              onClick={() => {
                setPurchaseFormPresetSupplierId(selectedSupplier.id);
                setCurrentTab('purchases');
              }}
            >
              <FileText size={15} /> {t('purchases.createBill', 'Create Purchase Bill')}
            </button>
            <button
              className="btn btn-secondary cust-action-btn"
              onClick={() => openNewPaymentForm({ contactId: selectedSupplier.id, type: 'SupplierPayment' })}
            >
              <ArrowUpRight size={15} /> {t('payments.recordPayout', 'Record Payout')}
            </button>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
          <KpiCard
            label={t('supplier.totalPurchased', 'Total Purchased')}
            value={formatINR(totalPurchased)}
            subtext={`${totalBillCount} ${totalBillCount !== 1 ? t('supplier.bills', 'bills') : t('supplier.bill', 'bill')}`}
            icon={<FileText size={20} />}
            variant="info"
          />
          <KpiCard
            label={t('supplier.totalPaid', 'Total Paid')}
            value={formatINR(totalPaid)}
            subtext={`${totalPaymentCount} ${totalPaymentCount !== 1 ? t('supplier.payments', 'payments') : t('supplier.payment', 'payment')}`}
            icon={<CreditCard size={20} />}
            variant="success"
          />
          <KpiCard
            label={t('supplier.balanceOwed', 'Balance Owed')}
            value={formatINR(selectedSupplier.outstanding)}
            subtext={selectedSupplier.outstanding > 0 ? t('supplier.pending', 'Pending') : selectedSupplier.outstanding < 0 ? t('supplier.overpaid', 'Overpaid') : t('supplier.settled', 'Settled')}
            icon={<Scale size={20} />}
            variant={selectedSupplier.outstanding > 0 ? "danger" : "success"}
          />
          <KpiCard
            label={t('supplier.lastTransaction', 'Last Transaction')}
            value={lastTxDate ? formatDate(lastTxDate) : '—'}
            subtext={`${ledgerEntries.length} ${t('supplier.entriesTotal', 'entries total')}`}
            icon={<Activity size={20} />}
            variant="info"
          />
        </div>

        {/* ── Ledger Table (Desktop) / Cards (Mobile) ── */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>{t('supplier.supplierAccountLedger', 'Supplier Account Ledger')}</h3>

          {ledgerWithBalance.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <FileText size={40} className="empty-state-icon" />
              <h4 className="empty-state-title">{t('supplier.noTransactionsYet', 'No Transactions Yet')}</h4>
              <p className="empty-state-desc">{t('supplier.noTransactionsDesc', 'No ledger entries found for this supplier.')}</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="cust-ledger-desktop">
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('common.date', 'Date')}</th>
                        <th>{t('common.docNo', 'Doc No')}</th>
                        <th>{t('common.description', 'Description')}</th>
                        <th>{t('supplier.debit', 'Debit (+)')}</th>
                        <th>{t('supplier.credit', 'Credit (-)')}</th>
                        <th>{t('supplier.balance', 'Balance (₹)')}</th>
                        <th className="no-print" style={{ textAlign: 'center' }}>{t('common.view', 'View')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerWithBalance.map((entry, idx) => (
                        <tr key={idx}>
                          <td className="text-nowrap">{formatDate(entry.date)}</td>
                          <td className="text-nowrap" style={{ fontWeight: 600, fontFamily: 'monospace' }}>{entry.docNo}</td>
                          <td style={{ fontSize: '13px' }}>{entry.desc}</td>
                          <td className="text-nowrap" style={{ color: entry.debit > 0 ? 'var(--color-danger-dark)' : 'inherit' }}>
                            {entry.debit > 0 ? formatINR(entry.debit).replace('₹', '') : '—'}
                          </td>
                          <td className="text-nowrap" style={{ color: entry.credit > 0 ? 'var(--color-success-dark)' : 'inherit' }}>
                            {entry.credit > 0 ? formatINR(entry.credit).replace('₹', '') : '—'}
                          </td>
                          <td style={{ fontWeight: 600, color: entry.balance > 0 ? 'var(--color-danger)' : entry.balance < 0 ? 'var(--color-success-dark)' : 'inherit' }}>
                            {formatINR(entry.balance).replace('₹', '')}
                          </td>
                          <td className="no-print" style={{ textAlign: 'center' }}>
                            {entry.type === 'Purchase' ? (
                              <button className="btn-icon" onClick={() => { setViewPurchase(entry.refId); setCurrentTab('purchases'); }} title={t('purchases.viewBill', 'View Bill')}>
                                <Eye size={14} />
                              </button>
                            ) : (
                              <button className="btn-icon" onClick={() => setCurrentTab('payments')} title={t('payments.viewPayout', 'View Payout')}>
                                <ArrowUpRight size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

               {/* Mobile / Tablet Cards */}
               <div className="cust-ledger-mobile">
                 {ledgerWithBalance.map((entry, idx) => {
                   const isPurchase = entry.type === 'Purchase';
                   
                   return (
                     <div key={idx} className="mobile-list-card" style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: 'var(--shadow-sm)' }}>
                       {/* Header row */}
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <div style={{
                             width: '32px', height: '32px', borderRadius: '50%',
                             backgroundColor: isPurchase ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                             color: isPurchase ? 'var(--color-info)' : 'var(--color-success-dark)',
                             display: 'flex', alignItems: 'center', justifyContent: 'center'
                           }}>
                             {isPurchase ? <FileText size={16} /> : <CreditCard size={16} />}
                           </div>
                           <div>
                             <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                               {entry.docNo}
                             </h4>
                             <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(entry.date)}</span>
                           </div>
                         </div>
                         <span className={`badge ${isPurchase ? 'badge-info' : 'badge-success'}`}>
                           {isPurchase ? t('purchases.purchase', 'Purchase') : t('payments.payment', 'Payment')}
                         </span>
                       </div>
 
                       {/* Description */}
                       <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '6px 0', borderBottom: '1px dashed var(--border-color)' }}>
                         {entry.desc}
                       </div>

                       {/* Debit and Credit in one row */}
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                         <div>
                           <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '6px' }}>{t('supplier.debitLabel', 'Debit:')}</span>
                           <span style={{ fontSize: '12px', fontWeight: 700, color: entry.debit > 0 ? 'var(--color-danger-dark)' : 'var(--text-secondary)' }}>
                             {entry.debit > 0 ? formatINR(entry.debit) : '—'}
                           </span>
                         </div>
                         <div>
                           <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '6px' }}>{t('supplier.creditLabel', 'Credit:')}</span>
                           <span style={{ fontSize: '12px', fontWeight: 700, color: entry.credit > 0 ? 'var(--color-success-dark)' : 'var(--text-secondary)' }}>
                             {entry.credit > 0 ? formatINR(entry.credit) : '—'}
                           </span>
                         </div>
                       </div>

                       {/* Balance and Action button in one row */}
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                         <div>
                           <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '6px' }}>{t('supplier.balanceLabel', 'Balance:')}</span>
                           <span style={{ fontSize: '13px', fontWeight: 800, color: entry.balance > 0 ? 'var(--color-warning-dark, #b45309)' : entry.balance < 0 ? 'var(--color-success-dark)' : 'var(--text-primary)' }}>
                             {formatINR(entry.balance)}
                           </span>
                         </div>
                         <div>
                           {isPurchase ? (
                             <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '11px' }} onClick={() => { setViewPurchase(entry.refId); setCurrentTab('purchases'); }}>
                               <Eye size={12} /> {t('purchases.viewBill', 'View Bill')}
                             </button>
                           ) : (
                             <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '11px' }} onClick={() => setCurrentTab('payments')}>
                               <ArrowUpRight size={12} /> {t('payments.viewPayout', 'View Payout')}
                             </button>
                           )}
                         </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
            </>
          )}
        </div>

        {/* Edit Supplier Modal */}
        <SupplierModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          editSupplierData={isEditingSupplier}
        />
      </div>

      {/* Informative Table Statement Print View (visible ONLY on print) */}
      <div className="print-only-ledger" style={{ padding: "16px", fontFamily: "var(--font-sans)", color: "#000000", backgroundColor: "#ffffff" }}>
        {/* Header Block */}
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #2F3E33", paddingBottom: "12px", marginBottom: "16px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#2F3E33" }}>{settings.businessName}</h1>
            <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#555555" }}>{settings.address}</p>
            <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#555555", fontWeight: 600 }}>{t('common.gstinLabel', 'GSTIN:')} {settings.gstin}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#555555", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {t('supplier.accountLedgerStatement', 'Account Ledger Statement')}
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#555555" }}>{t('supplier.dateGenerated', 'Date Generated')}: {formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        {/* Supplier Details & Summary Box */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px", marginBottom: "16px", padding: "12px", border: "1px solid #C8D3C5", borderRadius: "6px", backgroundColor: "#F9FAF9" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "11px", textTransform: "uppercase", color: "#556B5D", fontWeight: 700, letterSpacing: "0.5px" }}>
              {t('supplier.accountHolderDetails', 'Account Holder Details')}
            </h3>
            <h2 style={{ margin: "4px 0", fontSize: "15px", fontWeight: 800, color: "#1E352F" }}>{selectedSupplier.name}</h2>
            <p style={{ margin: "2px 0", fontSize: "11px", color: "#555555" }}>{t('common.phoneLabel', 'Phone:')} {selectedSupplier.phone}</p>
            {selectedSupplier.email && <p style={{ margin: "2px 0", fontSize: "11px", color: "#555555" }}>{t('common.emailLabel', 'Email:')} {selectedSupplier.email}</p>}
            {selectedSupplier.address && <p style={{ margin: "2px 0", fontSize: "11px", color: "#555555" }}>{t('common.addressLabel', 'Address:')} {selectedSupplier.address}</p>}
            {selectedSupplier.gstin && <p style={{ margin: "2px 0", fontSize: "11px", color: "#1E352F", fontWeight: 600 }}>{t('common.gstinLabel', 'GSTIN:')} {selectedSupplier.gstin}</p>}
          </div>
          <div style={{ borderLeft: "1px solid #C8D3C5", paddingLeft: "20px" }}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "11px", textTransform: "uppercase", color: "#556B5D", fontWeight: 700, letterSpacing: "0.5px" }}>
              {t('supplier.ledgerSummary', 'Ledger Summary')}
            </h3>
            <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "3px 0", color: "#555555" }}>{t('supplier.totalPurchasedLabel', 'Total Purchased:')}</td>
                  <td style={{ padding: "3px 0", textAlign: "right", fontWeight: 700 }}>{formatINR(totalPurchased)}</td>
                </tr>
                <tr>
                  <td style={{ padding: "3px 0", color: "#555555" }}>{t('supplier.totalPaidLabel', 'Total Paid:')}</td>
                  <td style={{ padding: "3px 0", textAlign: "right", fontWeight: 700 }}>{formatINR(totalPaid)}</td>
                </tr>
                <tr style={{ borderTop: "1px solid #C8D3C5", fontWeight: 800 }}>
                  <td style={{ padding: "6px 0 0 0", color: "#2F3E33" }}>{t('supplier.outstandingBalanceLabel', 'Outstanding Balance:')}</td>
                  <td style={{ padding: "6px 0 0 0", textAlign: "right", color: selectedSupplier.outstanding > 0 ? "#BE3144" : "#27AE60" }}>
                    {formatINR(selectedSupplier.outstanding)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Ledger Transactions Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "32px" }}>
          <thead>
            <tr style={{ backgroundColor: "#2F3E33", color: "#ffffff" }}>
              <th style={{ padding: "8px 10px", textAlign: "left", border: "1px solid #2F3E33" }}>{t('common.date', 'Date')}</th>
              <th style={{ padding: "8px 10px", textAlign: "left", border: "1px solid #2F3E33" }}>{t('common.docNo', 'Doc No')}</th>
              <th style={{ padding: "8px 10px", textAlign: "left", border: "1px solid #2F3E33" }}>{t('common.description', 'Description')}</th>
              <th style={{ padding: "8px 10px", textAlign: "right", border: "1px solid #2F3E33", width: "90px" }}>{t('supplier.debit', 'Debit (+)')}</th>
              <th style={{ padding: "8px 10px", textAlign: "right", border: "1px solid #2F3E33", width: "90px" }}>{t('supplier.credit', 'Credit (-)')}</th>
              <th style={{ padding: "8px 10px", textAlign: "right", border: "1px solid #2F3E33", width: "100px" }}>{t('supplier.balance', 'Balance (₹)')}</th>
            </tr>
          </thead>
          <tbody>
            {ledgerWithBalance.map((entry, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#F9FAF9" }}>
                <td style={{ padding: "8px 10px", border: "1px solid #E2E9E0", whiteSpace: "nowrap" }}>{formatDate(entry.date)}</td>
                <td style={{ padding: "8px 10px", border: "1px solid #E2E9E0", fontFamily: "monospace", fontWeight: 600, whiteSpace: "nowrap" }}>{entry.docNo}</td>
                <td style={{ padding: "8px 10px", border: "1px solid #E2E9E0" }}>{entry.desc}</td>
                <td style={{ padding: "8px 10px", border: "1px solid #E2E9E0", textAlign: "right", color: entry.debit > 0 ? "#BE3144" : "inherit" }}>
                  {entry.debit > 0 ? formatINR(entry.debit).replace("₹", "") : "—"}
                </td>
                <td style={{ padding: "8px 10px", border: "1px solid #E2E9E0", textAlign: "right", color: entry.credit > 0 ? "#27AE60" : "inherit" }}>
                  {entry.credit > 0 ? formatINR(entry.credit).replace("₹", "") : "—"}
                </td>
                <td style={{ padding: "8px 10px", border: "1px solid #E2E9E0", textAlign: "right", fontWeight: 600, color: entry.balance > 0 ? "#BE3144" : entry.balance < 0 ? "#27AE60" : "inherit" }}>
                  {formatINR(entry.balance).replace("₹", "")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Signatures */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px", padding: "0 10px" }}>
          <div style={{ textAlign: "center", width: "150px" }}>
            <div style={{ height: "40px", borderBottom: "1px solid #C8D3C5" }}></div>
            <p style={{ margin: "6px 0 0 0", fontSize: "10px", color: "#555555", fontWeight: 600 }}>{t('supplier.supplierSignature', 'Supplier Signature')}</p>
          </div>
          <div style={{ textAlign: "center", width: "150px" }}>
            <div style={{ height: "40px", borderBottom: "1px solid #C8D3C5" }}></div>
            <p style={{ margin: "6px 0 0 0", fontSize: "10px", color: "#555555", fontWeight: 600 }}>{t('supplier.authorizedSignatory', 'Authorized Signatory')}</p>
          </div>
        </div>
      </div>
    </div>
  );
  }
  // --- Directory list view ---
  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* Suppliers KPI Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
        <KpiCard
          label={t('supplier.totalSuppliers', 'Total Suppliers')}
          value={totalSuppliers}
          subtext={t('supplier.registeredDirectoryEntries', 'Registered directory entries')}
          icon={<Truck size={20} />}
          variant="info"
        />
        <KpiCard
          label={t('supplier.pendingPayables', 'Pending Payables')}
          value={formatINR(pendingPayables)}
          subtext={t('supplier.totalOutstandingBalanceWeOwe', 'Total outstanding balance we owe')}
          icon={<AlertTriangle size={20} />}
          variant="danger"
        />
        <KpiCard
          label={t('supplier.activeAccounts', 'Active Accounts')}
          value={`${activeAccounts} ${t('supplier.accounts', 'accounts')}`}
          subtext={t('supplier.supplierVoucherActivity', 'Supplier voucher activity')}
          icon={<Activity size={20} />}
          variant="success"
        />
        <KpiCard
          label={t('supplier.averagePayable', 'Average Payable')}
          value={formatINR(averagePayable)}
          subtext={t('supplier.perSupplierOutstanding', 'Per supplier outstanding')}
          icon={<Scale size={20} />}
          variant="info"
        />
      </div>

      {/* Style tweaks to support Sales-like responsive layout */}
      <style>{`
        .suppliers-filter-card {
          padding: 16px 20px;
          margin-bottom: 20px;
        }
        .suppliers-filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
        }
        .suppliers-filter-inputs {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          flex: 1 1 500px;
          min-width: 0;
        }
        .suppliers-filter-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
          flex: 0 1 auto;
        }
        @media (max-width: 768px) {
          .suppliers-filter-card {
            padding: 12px 14px;
          }
          .suppliers-filter-row {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .suppliers-filter-inputs {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            width: 100%;
            flex: none;
          }
          .suppliers-filter-inputs .search-input-wrapper {
            grid-column: span 1;
            width: 100% !important;
          }
          .suppliers-filter-inputs .outstanding-select-wrapper {
            grid-column: span 1;
            width: 100% !important;
          }
          .suppliers-filter-inputs select {
            width: 100% !important;
            height: 38px;
          }
          .suppliers-filter-actions {
            width: 100%;
            flex: none;
          }
          .suppliers-filter-actions button,
          .suppliers-filter-actions .btn {
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

      {/* Directory filters wrapped inside a Card */}
      <div className="card suppliers-filter-card">
        <div className="suppliers-filter-row">
          <div className="suppliers-filter-inputs">
            <div className="search-input-wrapper">
              <Search size={16} className="search-input-icon" />
              <input
                type="text"
                placeholder={t('supplier.searchPlaceholder', 'Search supplier name, phone, or GSTIN...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* Outstanding Balance Dropdown Filter */}
            <div className="outstanding-select-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '14px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <Tag size={13} />
              </span>
              <select
                className="filter-select"
                style={{ paddingLeft: '36px', width: '100%' }}
                value={outstandingFilter}
                onChange={(e) => {
                  setOutstandingFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">{t('supplier.allSuppliers', 'All Suppliers')}</option>
                <option value="Owed">{t('supplier.outstanding', 'Outstanding')}</option>
                <option value="Zero">{t('supplier.fullyPaid', 'Fully Paid')}</option>
              </select>
            </div>
          </div>

          <div className="suppliers-filter-actions">
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
              onClick={handleAddNewClick}
            >
              <Plus size={16} /> {t('supplier.addSupplier', 'Add Supplier')}
            </button>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="card">
        {filteredSuppliers.length === 0 ? (
          <div className="empty-state">
            <Truck size={48} className="empty-state-icon" />
            <h4 className="empty-state-title">{t('supplier.noSuppliersRegistered', 'No Suppliers Registered')}</h4>
            <p className="empty-state-desc">
              {t('supplier.noSuppliersDesc', 'No supplier directory entries found matching query filter options.')}
            </p>
            <button className="btn btn-primary" onClick={handleAddNewClick}>
              {t('supplier.addFirstSupplier', 'Add First Supplier')}
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
                      <th>{t('supplier.supplierCompanyName', 'Supplier Company / Name')}</th>
                      <th className="text-nowrap">{t('supplier.phoneContact', 'Phone / Contact')}</th>
                      <th>{t('supplier.billingAddress', 'Billing Address')}</th>
                      <th className="text-nowrap">{t('supplier.gstinIdentification', 'GSTIN Identification')}</th>
                      <th className="text-nowrap">{t('supplier.weOweDues', 'We Owe Dues (₹)')}</th>
                      <th style={{ textAlign: 'center' }}>{t('common.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSuppliers.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>
                          <button
                            type="button"
                            className="table-link-btn supplier-link"
                            onClick={() => setViewSupplier(s.id)}
                          >
                            {s.name}
                          </button>
                        </td>
                        <td className="text-nowrap">{s.phone}</td>
                        <td style={{ fontSize: '13px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.address || '—'}
                        </td>
                        <td className="text-nowrap" style={{ fontFamily: 'monospace' }}>{s.gstin || '—'}</td>
                        <td
                          className="text-nowrap"
                          style={{
                            fontWeight: 700,
                            color: s.outstanding > 0 ? 'var(--color-danger)' : 'inherit',
                          }}
                        >
                          {formatINR(s.outstanding)}
                        </td>
                        <td className="no-print" style={{ position: 'relative', textAlign: 'center', overflow: 'visible' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuSupplierId(activeMenuSupplierId === s.id ? null : s.id);
                            }}
                            title={t('common.actions', 'Actions')}
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {activeMenuSupplierId === s.id && (
                            <>
                              {/* Overlay to close the menu on clicking outside */}
                              <div 
                                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
                                onClick={() => setActiveMenuSupplierId(null)}
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
                                    setActiveMenuSupplierId(null);
                                    setViewSupplier(s.id);
                                  }}
                                >
                                  <Eye size={14} /> {t('supplier.viewProfile', 'View Profile')}
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
                                    setActiveMenuSupplierId(null);
                                    handleEditClick(s);
                                  }}
                                >
                                  <Edit2 size={14} /> {t('supplier.editDetails', 'Edit Details')}
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
                                    setActiveMenuSupplierId(null);
                                    handleDeleteSupplier(s.id, s.name);
                                  }}
                                >
                                  <Trash2 size={14} /> {t('supplier.deleteProfile', 'Delete Profile')}
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
               {paginatedSuppliers.map((s) => (
                 <div key={s.id} className="mobile-list-card">
                   <div className="mobile-list-card-header">
                     <div>
                       <h4 className="mobile-list-card-title">
                         <button type="button" className="table-link-btn supplier-link" onClick={() => setViewSupplier(s.id)}>
                           {s.name}
                         </button>
                       </h4>
                       <span className="mobile-list-card-subtitle">{s.phone}</span>
                     </div>
                     <div style={{ position: 'relative' }}>
                       <button
                         type="button"
                         className="btn btn-secondary btn-sm"
                         style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                         onClick={(e) => { e.stopPropagation(); setActiveMenuSupplierId(activeMenuSupplierId === s.id ? null : s.id); }}
                       >
                         <MoreVertical size={16} />
                       </button>
                       {activeMenuSupplierId === s.id && (
                         <>
                           <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} onClick={() => setActiveMenuSupplierId(null)} />
                           <div className="card" style={{
                             position: 'absolute', right: '0', top: '100%', marginTop: '4px',
                             zIndex: 999, minWidth: '150px', padding: '6px 0',
                             boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                             display: 'flex', flexDirection: 'column', gap: '2px',
                             backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color)',
                           }}>
                             <button className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                               onClick={() => { setActiveMenuSupplierId(null); setViewSupplier(s.id); }}>
                               <Eye size={14} /> {t('supplier.viewProfile', 'View Profile')}
                             </button>
                             <button className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                               onClick={() => { setActiveMenuSupplierId(null); handleEditClick(s); }}>
                               <Edit2 size={14} /> {t('supplier.editDetails', 'Edit Details')}
                             </button>
                             <button className="dropdown-item danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--color-danger)' }}
                               onClick={() => { setActiveMenuSupplierId(null); handleDeleteSupplier(s.id, s.name); }}>
                               <Trash2 size={14} /> {t('supplier.deleteProfile', 'Delete Profile')}
                             </button>
                           </div>
                         </>
                       )}
                     </div>
                   </div>
 
                   <div className="mobile-list-card-row">
                     <span className="mobile-list-card-label">GSTIN</span>
                     <span className="mobile-list-card-val" style={{ fontFamily: 'monospace' }}>{s.gstin || '—'}</span>
                   </div>
 
                   <div className="mobile-list-card-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                     <span className="mobile-list-card-label" style={{ flexShrink: 0 }}>{t('supplier.address', 'Address')}</span>
                     <span className="mobile-list-card-val" style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%', textAlign: 'right' }} title={s.address || '—'}>
                       {s.address || '—'}
                     </span>
                   </div>
 
                   <div className="mobile-list-card-row">
                     <span className="mobile-list-card-label">{t('supplier.weOweDuesLabel', 'We Owe Dues')}</span>
                     <span className="mobile-list-card-val" style={{ fontWeight: 700, color: s.outstanding > 0 ? 'var(--color-warning-dark, #b45309)' : 'inherit' }}>
                       {formatINR(s.outstanding)}
                     </span>
                   </div>
                 </div>
               ))}
             </div>
 
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-row">
                <span>
                  {t('common.showing', 'Showing')} <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> {t('common.to', 'to')}{' '}
                  <strong>{Math.min(currentPage * itemsPerPage, filteredSuppliers.length)}</strong> {t('common.of', 'of')}{' '}
                  <strong>{filteredSuppliers.length}</strong> {t('supplier.suppliers', 'suppliers')}
                </span>
                <div className="pagination-btn-group">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                    title={t('common.previousPage', 'Previous Page')}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                    title={t('common.nextPage', 'Next Page')}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Supplier Modal */}
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editSupplierData={isEditingSupplier}
      />

      <DeleteConfirmModal
        isOpen={!!deletingSupplierTarget}
        onClose={() => {
          if (!isDeletingSupplier) setDeletingSupplierTarget(null);
        }}
        onConfirm={confirmDeleteSupplier}
        title={t('supplier.deleteSupplier', 'Delete Supplier')}
        itemName={deletingSupplierTarget?.name}
        description={deletingSupplierTarget ? (
          <>
            {t('supplier.deleteConfirmDesc', 'Are you sure you want to delete supplier {{name}}? All billing history and credit ledgers will be deleted.', { name: deletingSupplierTarget.name })}
          </>
        ) : ''}
        isLoading={isDeletingSupplier}
      />
    </div>
  );
};
