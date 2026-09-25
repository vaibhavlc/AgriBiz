import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate } from '../utils/dummyData';
import { CustomerModal } from '../components/CustomerModal';
import { KpiCard } from '../components/KpiCard';
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
  ArrowDownLeft,
  Users,
  MoreVertical,
  Tag,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Scale,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import type { Customer } from '../types';

export const Customers: React.FC = () => {
  const {
    customers,
    invoices,
    payments,
    deleteCustomer,
    searchQuery,
    setSearchQuery,
    currentCustomerId,
    setViewCustomer,
    setViewInvoice,
    setCurrentTab,
    isEditingCustomer,
    setIsEditingCustomer,
    setSalesFormPresetCustomerId,
    settings,
    openNewPaymentForm,
  } = useApp();

  const totalCustomers = customers.length;
  const pendingReceivables = customers.reduce((sum, c) => sum + (c.outstanding > 0 ? c.outstanding : 0), 0);
  const activeBilling = customers.filter(c => invoices.some(inv => inv.customerId === c.id)).length;
  const averageReceivable = customers.length > 0 ? (pendingReceivables / customers.length) : 0;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [outstandingFilter, setOutstandingFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenuCustomerId, setActiveMenuCustomerId] = useState<string | null>(null);
  const itemsPerPage = 8;

  const handleEditClick = (c: Customer) => {
    setIsEditingCustomer(c);
    setIsModalOpen(true);
  };

  const handleAddNewClick = () => {
    setIsEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete customer ${name}? All outstanding balances and history logs will be removed.`)) {
      deleteCustomer(id);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.gstin && c.gstin.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesOutstanding = true;
    if (outstandingFilter === 'Owed') {
      matchesOutstanding = c.outstanding > 0;
    } else if (outstandingFilter === 'Credit') {
      matchesOutstanding = c.outstanding < 0;
    } else if (outstandingFilter === 'Zero') {
      matchesOutstanding = c.outstanding === 0;
    }

    return matchesSearch && matchesOutstanding;
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedCustomer = customers.find((c) => c.id === currentCustomerId);

  // ─── PROFILE VIEW ───────────────────────────────────────────────────────────
  if (selectedCustomer) {
    const customerInvoices = invoices.filter((inv) => inv.customerId === selectedCustomer.id);
    const customerPayments = payments.filter((pay) => pay.contactId === selectedCustomer.id && pay.type === 'CustomerReceipt');

    const totalInvoiced = customerInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalReceived = customerPayments.reduce((sum, pay) => sum + pay.amount, 0);
    const totalInvoiceCount = customerInvoices.length;
    const totalPaymentCount = customerPayments.length;
    const allDates = [...customerInvoices.map(i => i.date), ...customerPayments.map(p => p.date)];
    const lastTxDate = allDates.length > 0 ? allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] : null;

    const ledgerEntries = [
      ...customerInvoices.map((inv) => ({
        id: inv.id,
        date: inv.date,
        docNo: inv.invoiceNumber,
        type: 'Invoice',
        desc: `Sales Invoice - ${inv.items.map((i) => i.productName).slice(0, 2).join(', ')}`,
        debit: inv.grandTotal,
        credit: 0,
        refId: inv.id,
      })),
      ...customerPayments.map((pay) => ({
        id: pay.id,
        date: pay.date,
        docNo: pay.referenceNumber || 'N/A',
        type: 'Receipt',
        desc: `Payment Received - ${pay.paymentMethod}${pay.notes ? ` (${pay.notes})` : ''}`,
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

    const outstandingColor = selectedCustomer.outstanding > 0
      ? 'var(--text-primary)'
      : selectedCustomer.outstanding < 0
        ? 'var(--color-success-dark)'
        : 'var(--text-primary)';

    return (
      <div style={{ position: 'relative' }}>
        {/* Web View Profile (hidden on print) */}
        <div className="cust-profile-root screen-only" style={{ animation: 'fadeIn 0.2s ease-out' }}>

        {/* Top Nav Bar */}
        <div className="cust-profile-topbar no-print">
          <button className="btn btn-secondary" onClick={() => setViewCustomer(null)}>
            <ArrowLeft size={16} /> <span>Back</span>
          </button>
          <div className="cust-profile-topbar-actions">
            <button className="btn btn-secondary" onClick={() => handleEditClick(selectedCustomer)}>
              <Edit2 size={15} /> <span>Edit</span>
            </button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              <FileText size={15} /> <span>Print</span>
            </button>
          </div>
        </div>

        {/* Hero Identity Card */}
        <div className="cust-hero-card card">
          <div className="cust-hero-identity">
            <div className="cust-avatar">
              {selectedCustomer.name.charAt(0).toUpperCase()}
            </div>
            <div className="cust-hero-name-block">
              <h2 className="cust-hero-name">{selectedCustomer.name}</h2>
              <span className="badge badge-info">ID: {selectedCustomer.id}</span>
            </div>
          </div>

          <div className="cust-hero-contacts">
            <div className="cust-contact-item">
              <Phone size={14} className="cust-contact-icon" />
              <span>{selectedCustomer.phone}</span>
            </div>
            {selectedCustomer.email && (
              <div className="cust-contact-item">
                <Mail size={14} className="cust-contact-icon" />
                <span>{selectedCustomer.email}</span>
              </div>
            )}
            {selectedCustomer.address && (
              <div className="cust-contact-item">
                <MapPin size={14} className="cust-contact-icon" />
                <span>{selectedCustomer.address}{selectedCustomer.state && `, ${selectedCustomer.state}`}</span>
              </div>
            )}
            {selectedCustomer.gstin && (
              <div className="cust-contact-item">
                <FileText size={14} className="cust-contact-icon" />
                <span>GSTIN: <strong>{selectedCustomer.gstin}</strong></span>
              </div>
            )}
          </div>

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
              <div className="cust-outstanding-label">Outstanding Balance</div>
              <div className="cust-outstanding-sub">
                {selectedCustomer.outstanding > 0 ? 'Amount customer owes you' : selectedCustomer.outstanding < 0 ? 'Advance credit balance' : 'Account fully settled'}
              </div>
            </div>
            <div className="cust-outstanding-amount" style={{ color: selectedCustomer.outstanding > 0 ? 'var(--color-warning-dark, #b45309)' : outstandingColor }}>
              {formatINR(selectedCustomer.outstanding)}
            </div>
          </div>

          <div className="cust-quick-actions no-print">
            <button
              className="btn btn-primary cust-action-btn"
              onClick={() => { setSalesFormPresetCustomerId(selectedCustomer.id); setCurrentTab('sales'); }}
            >
              <FileText size={15} /> Create Invoice
            </button>
            <button
              className="btn btn-secondary cust-action-btn"
              onClick={() => openNewPaymentForm({ contactId: selectedCustomer.id, type: 'CustomerReceipt' })}
            >
              <ArrowDownLeft size={15} /> Record Receipt
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
          <KpiCard
            label="Total Invoiced"
            value={formatINR(totalInvoiced)}
            subtext={`${totalInvoiceCount} invoice${totalInvoiceCount !== 1 ? 's' : ''}`}
            icon={<FileText size={20} />}
            variant="info"
          />
          
          <KpiCard
            label="Total Received"
            value={formatINR(totalReceived)}
            subtext={`${totalPaymentCount} payment${totalPaymentCount !== 1 ? 's' : ''}`}
            icon={<CreditCard size={20} />}
            variant="success"
          />

          <KpiCard
            label="Balance Due"
            value={formatINR(selectedCustomer.outstanding)}
            subtext={selectedCustomer.outstanding > 0 ? 'Pending' : selectedCustomer.outstanding < 0 ? 'Advance' : 'Settled'}
            icon={<Scale size={20} />}
            variant={selectedCustomer.outstanding > 0 ? 'warning' : selectedCustomer.outstanding < 0 ? 'success' : 'info'}
          />

          <KpiCard
            label="Last Transaction"
            value={lastTxDate ? formatDate(lastTxDate) : '—'}
            subtext={`${ledgerEntries.length} entries total`}
            icon={<Activity size={20} />}
            variant="info"
          />
        </div>

        {/* Ledger */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>Customer Ledger Account</h3>

          {ledgerWithBalance.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <FileText size={40} className="empty-state-icon" />
              <h4 className="empty-state-title">No Transactions Yet</h4>
              <p className="empty-state-desc">No ledger entries found for this customer.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="cust-ledger-desktop">
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Doc No</th>
                        <th>Description</th>
                        <th>Debit (+)</th>
                        <th>Credit (-)</th>
                        <th>Balance (₹)</th>
                        <th className="no-print" style={{ textAlign: 'center' }}>View</th>
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
                            {entry.type === 'Invoice' ? (
                              <button className="btn-icon" onClick={() => { setViewInvoice(entry.refId); setCurrentTab('sales'); }} title="View Invoice">
                                <Eye size={14} />
                              </button>
                            ) : (
                              <button className="btn-icon" onClick={() => setCurrentTab('payments')} title="View Payment">
                                <ArrowDownLeft size={14} />
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
                  const isInvoice = entry.type === 'Invoice';
                  
                  return (
                    <div key={idx} className="mobile-list-card" style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: 'var(--shadow-sm)' }}>
                      {/* Header row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            backgroundColor: isInvoice ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: isInvoice ? 'var(--color-info)' : 'var(--color-success-dark)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {isInvoice ? <FileText size={16} /> : <CreditCard size={16} />}
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {entry.docNo}
                            </h4>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(entry.date)}</span>
                          </div>
                        </div>
                        <span className={`badge ${isInvoice ? 'badge-info' : 'badge-success'}`}>
                          {entry.type}
                        </span>
                      </div>

                      {/* Description */}
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '6px 0', borderBottom: '1px dashed var(--border-color)' }}>
                        {entry.desc}
                      </div>

                      {/* Debit and Credit in one row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '6px' }}>Debit:</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: entry.debit > 0 ? 'var(--color-danger-dark)' : 'var(--text-secondary)' }}>
                            {entry.debit > 0 ? formatINR(entry.debit) : '—'}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '6px' }}>Credit:</span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: entry.credit > 0 ? 'var(--color-success-dark)' : 'var(--text-secondary)' }}>
                            {entry.credit > 0 ? formatINR(entry.credit) : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Balance and Action button in one row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '6px' }}>Balance:</span>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: entry.balance > 0 ? 'var(--color-warning-dark, #b45309)' : entry.balance < 0 ? 'var(--color-success-dark)' : 'var(--text-primary)' }}>
                            {formatINR(entry.balance)}
                          </span>
                        </div>
                        <div>
                          {isInvoice ? (
                            <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '11px' }} onClick={() => { setViewInvoice(entry.refId); setCurrentTab('sales'); }}>
                              <Eye size={12} /> View Invoice
                            </button>
                          ) : (
                            <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '11px' }} onClick={() => setCurrentTab('payments')}>
                              <ArrowDownLeft size={12} /> View Receipt
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

        <CustomerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          editCustomerData={isEditingCustomer}
        />
      </div>

      {/* Informative Table Statement Print View (visible ONLY on print) */}
      <div className="print-only-ledger" style={{ padding: "16px", fontFamily: "var(--font-sans)", color: "#000000", backgroundColor: "#ffffff" }}>
        {/* Header Block */}
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #2F3E33", paddingBottom: "12px", marginBottom: "16px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#2F3E33" }}>{settings.businessName}</h1>
            <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#555555" }}>{settings.address}</p>
            <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#555555", fontWeight: 600 }}>GSTIN: {settings.gstin}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#555555", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Account Ledger Statement
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#555555" }}>Date Generated: {formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        {/* Customer Details & Summary Box */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px", marginBottom: "16px", padding: "12px", border: "1px solid #C8D3C5", borderRadius: "6px", backgroundColor: "#F9FAF9" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "11px", textTransform: "uppercase", color: "#556B5D", fontWeight: 700, letterSpacing: "0.5px" }}>
              Account Holder Details
            </h3>
            <h2 style={{ margin: "4px 0", fontSize: "15px", fontWeight: 800, color: "#1E352F" }}>{selectedCustomer.name}</h2>
            <p style={{ margin: "2px 0", fontSize: "11px", color: "#555555" }}>Phone: {selectedCustomer.phone}</p>
            {selectedCustomer.email && <p style={{ margin: "2px 0", fontSize: "11px", color: "#555555" }}>Email: {selectedCustomer.email}</p>}
            {selectedCustomer.address && <p style={{ margin: "2px 0", fontSize: "11px", color: "#555555" }}>Address: {selectedCustomer.address}</p>}
            {selectedCustomer.gstin && <p style={{ margin: "2px 0", fontSize: "11px", color: "#1E352F", fontWeight: 600 }}>GSTIN: {selectedCustomer.gstin}</p>}
          </div>
          <div style={{ borderLeft: "1px solid #C8D3C5", paddingLeft: "20px" }}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "11px", textTransform: "uppercase", color: "#556B5D", fontWeight: 700, letterSpacing: "0.5px" }}>
              Ledger Summary
            </h3>
            <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "3px 0", color: "#555555" }}>Total Invoiced:</td>
                  <td style={{ padding: "3px 0", textAlign: "right", fontWeight: 700 }}>{formatINR(totalInvoiced)}</td>
                </tr>
                <tr>
                  <td style={{ padding: "3px 0", color: "#555555" }}>Total Received:</td>
                  <td style={{ padding: "3px 0", textAlign: "right", fontWeight: 700 }}>{formatINR(totalReceived)}</td>
                </tr>
                <tr style={{ borderTop: "1px solid #C8D3C5", fontWeight: 800 }}>
                  <td style={{ padding: "6px 0 0 0", color: "#2F3E33" }}>Outstanding Balance:</td>
                  <td style={{ padding: "6px 0 0 0", textAlign: "right", color: selectedCustomer.outstanding > 0 ? "#BE3144" : "#27AE60" }}>
                    {formatINR(selectedCustomer.outstanding)}
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
              <th style={{ padding: "8px 10px", textAlign: "left", border: "1px solid #2F3E33" }}>Date</th>
              <th style={{ padding: "8px 10px", textAlign: "left", border: "1px solid #2F3E33" }}>Doc No</th>
              <th style={{ padding: "8px 10px", textAlign: "left", border: "1px solid #2F3E33" }}>Description</th>
              <th style={{ padding: "8px 10px", textAlign: "right", border: "1px solid #2F3E33", width: "90px" }}>Debit (+)</th>
              <th style={{ padding: "8px 10px", textAlign: "right", border: "1px solid #2F3E33", width: "90px" }}>Credit (-)</th>
              <th style={{ padding: "8px 10px", textAlign: "right", border: "1px solid #2F3E33", width: "100px" }}>Balance (₹)</th>
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
            <p style={{ margin: "6px 0 0 0", fontSize: "10px", color: "#555555", fontWeight: 600 }}>Customer Signature</p>
          </div>
          <div style={{ textAlign: "center", width: "150px" }}>
            <div style={{ height: "40px", borderBottom: "1px solid #C8D3C5" }}></div>
            <p style={{ margin: "6px 0 0 0", fontSize: "10px", color: "#555555", fontWeight: 600 }}>Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
  }

  // ─── DIRECTORY LIST VIEW ─────────────────────────────────────────────────────
  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* KPI Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
        <KpiCard
          label="Total Customers"
          value={totalCustomers}
          subtext="Registered accounts"
          icon={<Users size={20} />}
          variant="info"
        />
        <KpiCard
          label="Pending Receivables"
          value={formatINR(pendingReceivables)}
          subtext="Total outstanding balance"
          icon={<AlertTriangle size={20} />}
          variant="danger"
        />
        <KpiCard
          label="Active Billing"
          value={`${activeBilling} accounts`}
          subtext="Invoice transaction activity"
          icon={<Activity size={20} />}
          variant="success"
        />
        <KpiCard
          label="Average Receivable"
          value={formatINR(averageReceivable)}
          subtext="Per account outstanding"
          icon={<Scale size={20} />}
          variant="info"
        />
      </div>

      {/* Style tweaks to support Sales-like responsive layout */}
      <style>{`
        .customers-filter-card {
          padding: 16px 20px;
          margin-bottom: 20px;
        }
        .customers-filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
        }
        .customers-filter-inputs {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          flex: 1 1 500px;
          min-width: 0;
        }
        .customers-filter-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
          flex: 0 1 auto;
        }
        @media (max-width: 768px) {
          .customers-filter-card {
            padding: 12px 14px;
          }
          .customers-filter-row {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .customers-filter-inputs {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            width: 100%;
            flex: none;
          }
          .customers-filter-inputs .search-input-wrapper {
            grid-column: span 1;
            width: 100% !important;
          }
          .customers-filter-inputs .outstanding-select-wrapper {
            grid-column: span 1;
            width: 100% !important;
          }
          .customers-filter-inputs select {
            width: 100% !important;
            height: 38px;
          }
          .customers-filter-actions {
            width: 100%;
            flex: none;
          }
          .customers-filter-actions button,
          .customers-filter-actions .btn {
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
      <div className="card customers-filter-card">
        <div className="customers-filter-row">
          <div className="customers-filter-inputs">
            <div className="search-input-wrapper">
              <Search size={16} className="search-input-icon" />
              <input
                type="text"
                placeholder="Search customer name, phone, or GSTIN..."
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
                <option value="All">All Dues</option>
                <option value="Owed">Pending Dues</option>
                <option value="Credit">Advance Paid</option>
                <option value="Zero">Fully Settled</option>
              </select>
            </div>
          </div>

          <div className="customers-filter-actions">
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
              <Plus size={16} /> Add Customer
            </button>
          </div>
        </div>
      </div>

      {/* Main card list */}
      <div className="card">
        {filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <Users size={48} className="empty-state-icon" />
            <h4 className="empty-state-title">No Customers Registered</h4>
            <p className="empty-state-desc">No customer entries found matching your query or selected outstanding balance filter.</p>
            <button className="btn btn-primary" onClick={handleAddNewClick}>Add First Customer</button>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="desktop-only-table">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th className="text-nowrap">Phone / Contact</th>
                      <th>Billing Address</th>
                      <th className="text-nowrap">GSTIN Identification</th>
                      <th className="text-nowrap">Outstanding Balance (₹)</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCustomers.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>
                          <button type="button" className="table-link-btn supplier-link" onClick={() => setViewCustomer(c.id)}>
                            {c.name}
                          </button>
                        </td>
                        <td className="text-nowrap">{c.phone}</td>
                        <td style={{ fontSize: '13px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.address ? `${c.address} (${c.state || 'Madhya Pradesh'})` : '—'}
                        </td>
                        <td className="text-nowrap" style={{ fontFamily: 'monospace' }}>{c.gstin || '—'}</td>
                        <td
                          className="text-nowrap"
                          style={{ fontWeight: 700, color: c.outstanding > 0 ? 'var(--color-danger)' : c.outstanding < 0 ? 'var(--color-success-dark)' : 'inherit' }}
                        >
                          {formatINR(c.outstanding)}
                        </td>
                        <td className="no-print" style={{ position: 'relative', textAlign: 'center', overflow: 'visible' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
                            onClick={(e) => { e.stopPropagation(); setActiveMenuCustomerId(activeMenuCustomerId === c.id ? null : c.id); }}
                            title="Actions"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeMenuCustomerId === c.id && (
                            <>
                              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} onClick={() => setActiveMenuCustomerId(null)} />
                              <div className="card" style={{
                                position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px',
                                zIndex: 999, minWidth: '150px', padding: '6px 0',
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                                display: 'flex', flexDirection: 'column', gap: '2px',
                                backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color)',
                              }}>
                                <button className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                                  onClick={() => { setActiveMenuCustomerId(null); setViewCustomer(c.id); }}>
                                  <Eye size={14} /> View Profile
                                </button>
                                <button className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                                  onClick={() => { setActiveMenuCustomerId(null); handleEditClick(c); }}>
                                  <Edit2 size={14} /> Edit Details
                                </button>
                                <button className="dropdown-item danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--color-danger)' }}
                                  onClick={() => { setActiveMenuCustomerId(null); handleDeleteCustomer(c.id, c.name); }}>
                                  <Trash2 size={14} /> Delete Profile
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
              {paginatedCustomers.map((c) => (
                <div key={c.id} className="mobile-list-card">
                  <div className="mobile-list-card-header">
                    <div>
                      <h4 className="mobile-list-card-title">
                        <button type="button" className="table-link-btn supplier-link" onClick={() => setViewCustomer(c.id)}>
                          {c.name}
                        </button>
                      </h4>
                      <span className="mobile-list-card-subtitle">{c.phone}</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={(e) => { e.stopPropagation(); setActiveMenuCustomerId(activeMenuCustomerId === c.id ? null : c.id); }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {activeMenuCustomerId === c.id && (
                        <>
                          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} onClick={() => setActiveMenuCustomerId(null)} />
                          <div className="card" style={{
                            position: 'absolute', right: '0', top: '100%', marginTop: '4px',
                            zIndex: 999, minWidth: '150px', padding: '6px 0',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                            display: 'flex', flexDirection: 'column', gap: '2px',
                            backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color)',
                          }}>
                            <button className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                              onClick={() => { setActiveMenuCustomerId(null); setViewCustomer(c.id); }}>
                              <Eye size={14} /> View Profile
                            </button>
                            <button className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                              onClick={() => { setActiveMenuCustomerId(null); handleEditClick(c); }}>
                              <Edit2 size={14} /> Edit Details
                            </button>
                            <button className="dropdown-item danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--color-danger)' }}
                              onClick={() => { setActiveMenuCustomerId(null); handleDeleteCustomer(c.id, c.name); }}>
                              <Trash2 size={14} /> Delete Profile
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">GSTIN</span>
                    <span className="mobile-list-card-val" style={{ fontFamily: 'monospace' }}>{c.gstin || '—'}</span>
                  </div>

                  <div className="mobile-list-card-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <span className="mobile-list-card-label" style={{ flexShrink: 0 }}>Address</span>
                    <span className="mobile-list-card-val" style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%', textAlign: 'right' }} title={c.address ? `${c.address} (${c.state || 'Madhya Pradesh'})` : '—'}>
                      {c.address ? `${c.address} (${c.state || 'Madhya Pradesh'})` : '—'}
                    </span>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Outstanding Balance</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700, color: c.outstanding > 0 ? 'var(--color-warning-dark, #b45309)' : c.outstanding < 0 ? 'var(--color-success-dark)' : 'inherit' }}>
                      {formatINR(c.outstanding)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination-row">
                <span>
                  Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                  <strong>{Math.min(currentPage * itemsPerPage, filteredCustomers.length)}</strong> of{' '}
                  <strong>{filteredCustomers.length}</strong> profiles
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

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editCustomerData={isEditingCustomer}
      />
    </div>
  );
};
