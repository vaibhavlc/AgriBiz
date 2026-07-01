import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate } from '../utils/dummyData';
import { SupplierModal } from '../components/SupplierModal';
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
} from 'lucide-react';
import type { Supplier } from '../types';

export const Suppliers: React.FC = () => {
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
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [outstandingFilter, setOutstandingFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleEditClick = (s: Supplier) => {
    setIsEditingSupplier(s);
    setIsModalOpen(true);
  };

  const handleAddNewClick = () => {
    setIsEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleDeleteSupplier = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete supplier ${name}? All billing history and credit ledgers will be deleted.`)) {
      deleteSupplier(id);
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

    // Debits and Credits for suppliers:
    // A Purchase bill INCREASES what we owe (debit to outstanding balance)
    // A Payment outflow DECREASES what we owe (credit to outstanding balance)
    const ledgerEntries = [
      ...supplierPurchases.map((pur) => ({
        id: pur.id,
        date: pur.date,
        docNo: pur.purchaseNumber,
        type: 'Purchase',
        desc: `Purchase Receipt - ${pur.items.map((i) => i.productName).slice(0, 2).join(', ')}`,
        debit: pur.grandTotal,
        credit: 0,
        refId: pur.id,
      })),
      ...supplierPayments.map((pay) => ({
        id: pay.id,
        date: pay.date,
        docNo: pay.referenceNumber || 'N/A',
        type: 'Payment',
        desc: `Payment Issued - ${pay.paymentMethod}${pay.notes ? ` (${pay.notes})` : ''}`,
        debit: 0,
        credit: pay.amount,
        refId: pay.id,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
        {/* Detail view header bar */}
        <div className="filters-row no-print" style={{ marginBottom: '24px' }}>
          <button className="btn btn-secondary" onClick={() => setViewSupplier(null)}>
            <ArrowLeft size={16} /> Back to Directory
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={() => handleEditClick(selectedSupplier)}>
              <Edit2 size={16} /> Edit Info
            </button>
            <button className="btn className-print btn-primary" onClick={() => window.print()}>
              <FileText size={16} /> Print Ledger
            </button>
          </div>
        </div>

        {/* Profile layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
          {/* Left card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-info-bg)',
                  color: 'var(--color-info-dark)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '28px',
                  marginBottom: '12px',
                }}
              >
                {selectedSupplier.name.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{selectedSupplier.name}</h3>
              <span className="badge badge-info" style={{ marginTop: '6px' }}>
                Supplier ID: {selectedSupplier.id}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={16} style={{ color: 'var(--text-muted)' }} />
                <span>{selectedSupplier.phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={16} style={{ color: 'var(--text-muted)' }} />
                <span>{selectedSupplier.email || 'No email registered'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <MapPin size={16} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
                <span>{selectedSupplier.address || 'No office address'}</span>
              </div>
              {selectedSupplier.gstin && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Supplier GSTIN
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px', color: 'var(--text-primary)' }}>
                    {selectedSupplier.gstin}
                  </div>
                </div>
              )}
            </div>

            {/* Outstanding Summary */}
            <div className="profile-outstanding-box" style={{ margin: 0, marginTop: '10px' }}>
              <div>
                <span className="form-label" style={{ margin: 0 }}>Balance We Owe</span>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Unsettled bills</p>
              </div>
              <span
                className={`profile-outstanding-val ${
                  selectedSupplier.outstanding > 0 ? 'debt' : ''
                }`}
                style={{ color: selectedSupplier.outstanding > 0 ? 'var(--color-danger)' : 'inherit' }}
              >
                {formatINR(selectedSupplier.outstanding)}
              </span>
            </div>
          </div>

          {/* Right card ledger account */}
          <div className="card">
            <h3 className="card-title">Supplier Account Ledger Book</h3>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="text-nowrap">Date</th>
                    <th className="text-nowrap">Document Bill</th>
                    <th>Description</th>
                    <th className="text-nowrap">Debit (Invoice [+])</th>
                    <th className="text-nowrap">Credit (Paid [-])</th>
                    <th className="text-nowrap">Outstanding Balance (₹)</th>
                    <th className="no-print" style={{ textAlign: 'center' }}>Link</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerWithBalance.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px' }}>
                        No supplier transactions registered in ledger database.
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
                            color: entry.balance > 0 ? 'var(--color-danger)' : 'inherit',
                          }}
                        >
                          {formatINR(entry.balance).replace('₹', '')}
                        </td>
                        <td className="no-print" style={{ textAlign: 'center' }}>
                          {entry.type === 'Purchase' ? (
                            <button
                              className="btn-icon"
                              onClick={() => {
                                setViewPurchase(entry.refId);
                                setCurrentTab('purchases');
                              }}
                              title="Go to Purchase Bill"
                            >
                              <Eye size={14} />
                            </button>
                          ) : (
                            <button
                              className="btn-icon"
                              onClick={() => setCurrentTab('payments')}
                              title="Go to Payments"
                            >
                              <ArrowUpRight size={14} />
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

  // --- Directory list view ---
  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* Search and filters */}
      <div className="filters-row">
        <div className="filters-left">
          <div className="search-input-wrapper">
            <Search size={16} className="search-input-icon" />
            <input
              type="text"
              placeholder="Search supplier name, phone, or GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={outstandingFilter}
            onChange={(e) => {
              setOutstandingFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">All Suppliers</option>
            <option value="Owed">Outstanding Bills Only</option>
            <option value="Zero">Fully Paid (0)</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleAddNewClick}>
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      {/* Directory Grid */}
      <div className="card">
        {filteredSuppliers.length === 0 ? (
          <div className="empty-state">
            <Truck size={48} className="empty-state-icon" />
            <h4 className="empty-state-title">No Suppliers Registered</h4>
            <p className="empty-state-desc">
              No supplier directory entries found matching query filter options.
            </p>
            <button className="btn btn-primary" onClick={handleAddNewClick}>
              Add First Supplier
            </button>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Supplier Company / Name</th>
                    <th className="text-nowrap">Phone / Contact</th>
                    <th>Billing Address</th>
                    <th className="text-nowrap">GSTIN Identification</th>
                    <th className="text-nowrap">We Owe Dues (₹)</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSuppliers.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
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
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            className="btn-icon"
                            onClick={() => setViewSupplier(s.id)}
                            title="View Supplier Profile Ledger"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleEditClick(s)}
                            title="Edit Supplier Details"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-icon danger"
                            onClick={() => handleDeleteSupplier(s.id, s.name)}
                            title="Delete Supplier Profile"
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
                  {filteredSuppliers.length} suppliers listed)
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

      {/* Supplier Modal */}
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editSupplierData={isEditingSupplier}
      />
    </div>
  );
};
