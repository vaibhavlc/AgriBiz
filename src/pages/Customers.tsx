import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate } from '../utils/dummyData';
import { CustomerModal } from '../components/CustomerModal';
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
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [outstandingFilter, setOutstandingFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
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

  // --- Filtering & Sorting ---
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedCustomer = customers.find((c) => c.id === currentCustomerId);

  // --- Profile Ledger View ---
  if (selectedCustomer) {
    // Collect all transactions (Invoices as debits [+outstanding], Payments as credits [-outstanding])
    const customerInvoices = invoices.filter((inv) => inv.customerId === selectedCustomer.id);
    const customerPayments = payments.filter((pay) => pay.contactId === selectedCustomer.id && pay.type === 'CustomerReceipt');

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
        refType: 'Invoice',
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
        refType: 'Receipt',
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBal = 0;
    const ledgerWithBalance = ledgerEntries.map((entry) => {
      runningBal = runningBal + entry.debit - entry.credit;
      return {
        ...entry,
        balance: runningBal,
      };
    });

    return (
      <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
        {/* Profile Header Buttons */}
        <div className="filters-row no-print" style={{ marginBottom: '24px' }}>
          <button className="btn btn-secondary" onClick={() => setViewCustomer(null)}>
            <ArrowLeft size={16} /> Back to Directory
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={() => handleEditClick(selectedCustomer)}>
              <Edit2 size={16} /> Edit Info
            </button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              <FileText size={16} /> Print Ledger
            </button>
          </div>
        </div>

        {/* Profile details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
          {/* Card left: Info */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary-dark)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '28px',
                  marginBottom: '12px',
                }}
              >
                {selectedCustomer.name.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 700 }}>{selectedCustomer.name}</h3>
              <span className="badge badge-info" style={{ marginTop: '6px' }}>
                ID: {selectedCustomer.id}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={16} style={{ color: 'var(--text-muted)' }} />
                <span>{selectedCustomer.phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={16} style={{ color: 'var(--text-muted)' }} />
                <span>{selectedCustomer.email || 'No email registered'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <MapPin size={16} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
                <span>
                  {selectedCustomer.address || 'No address registered'}
                  {selectedCustomer.state && ` (${selectedCustomer.state})`}
                </span>
              </div>
              {selectedCustomer.gstin && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    GST Identification No (GSTIN)
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px', color: 'var(--text-primary)' }}>
                    {selectedCustomer.gstin}
                  </div>
                </div>
              )}
            </div>

            {/* Outstanding summary */}
            <div className="profile-outstanding-box" style={{ margin: 0, marginTop: '10px' }}>
              <div>
                <span className="form-label" style={{ margin: 0 }}>Outstanding Balance</span>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Accumulated dues</p>
              </div>
              <span
                className={`profile-outstanding-val ${
                  selectedCustomer.outstanding > 0 ? 'debt' : 'credit'
                }`}
              >
                {formatINR(selectedCustomer.outstanding)}
              </span>
            </div>
          </div>

          {/* Card right: Ledger Book */}
          <div className="card">
            <h3 className="card-title">Customer Ledger Account</h3>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-nowrap">Date</th>
                    <th className="text-nowrap">Document No</th>
                    <th>Description</th>
                    <th className="text-nowrap">Debit (+)</th>
                    <th className="text-nowrap">Credit (-)</th>
                    <th className="text-nowrap">Balance (₹)</th>
                    <th className="no-print" style={{ textAlign: 'center' }}>Link</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerWithBalance.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                        No transactions recorded for this ledger account.
                      </td>
                    </tr>
                  ) : (
                    ledgerWithBalance.map((entry, idx) => (
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
                        <td
                          style={{
                            fontWeight: 600,
                            color: entry.balance > 0 ? 'var(--color-danger)' : entry.balance < 0 ? 'var(--color-success-dark)' : 'inherit',
                          }}
                        >
                          {formatINR(entry.balance).replace('₹', '')}
                        </td>
                        <td className="no-print" style={{ textAlign: 'center' }}>
                          {entry.type === 'Invoice' ? (
                            <button
                              className="btn-icon"
                              onClick={() => {
                                setViewInvoice(entry.refId);
                                setCurrentTab('sales');
                              }}
                              title="Go to Invoice Bill"
                            >
                              <Eye size={14} />
                            </button>
                          ) : (
                            <button
                              className="btn-icon"
                              onClick={() => setCurrentTab('payments')}
                              title="Go to Payments"
                            >
                              <ArrowDownLeft size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Directory Directory List View ---
  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* Directory filters */}
      <div className="filters-row">
        <div className="filters-left">
          <div className="search-input-wrapper">
            <Search size={16} className="search-input-icon" />
            <input
              type="text"
              placeholder="Search customer name, phone, or GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Segmented Filter Control */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-app)', padding: '3px', borderRadius: '10px', border: '1.5px solid var(--border-color)', gap: '2px' }}>
            {[
              { value: 'All', label: 'All Dues' },
              { value: 'Owed', label: 'Pending Dues' },
              { value: 'Credit', label: 'Advance Paid' },
              { value: 'Zero', label: 'Fully Settled' }
            ].map((opt) => {
              const isActive = outstandingFilter === opt.value;
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
                    setOutstandingFilter(opt.value);
                    setCurrentPage(1);
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleAddNewClick}>
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {/* Main card list */}
      <div className="card">
        {filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <Users size={48} className="empty-state-icon" />
            <h4 className="empty-state-title">No Customers Registered</h4>
            <p className="empty-state-desc">
              No customer entries found matching your query or selected outstanding balance filter.
            </p>
            <button className="btn btn-primary" onClick={handleAddNewClick}>
              Add First Customer
            </button>
          </div>
        ) : (
          <>
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
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td className="text-nowrap">{c.phone}</td>
                      <td style={{ fontSize: '13px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.address ? `${c.address} (${c.state || 'Madhya Pradesh'})` : '—'}
                      </td>
                      <td className="text-nowrap" style={{ fontFamily: 'monospace' }}>{c.gstin || '—'}</td>
                      <td
                        className="text-nowrap"
                        style={{
                          fontWeight: 700,
                          color: c.outstanding > 0 ? 'var(--color-danger)' : c.outstanding < 0 ? 'var(--color-success-dark)' : 'inherit',
                        }}
                      >
                        {formatINR(c.outstanding)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            className="btn-icon"
                            onClick={() => setViewCustomer(c.id)}
                            title="View Customer Profile Ledger"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleEditClick(c)}
                            title="Edit Customer Profile"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-icon danger"
                            onClick={() => handleDeleteCustomer(c.id, c.name)}
                            title="Delete Customer File"
                          >
                            <Trash2 size={16} />
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
                  {filteredCustomers.length} profiles listed)
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

      {/* Customer quick add/edit form modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editCustomerData={isEditingCustomer}
      />
    </div>
  );
};
