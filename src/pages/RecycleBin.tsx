import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { RecycleBinItem } from '../types';
import {
  Trash2,
  RotateCcw,
  Search,
  Calendar,
  Eye,
  Info,
  AlertTriangle,
  RefreshCw,
  X,
  CheckSquare,
  Square,
  ArrowUpDown,
} from 'lucide-react';

export const RecycleBin: React.FC = () => {
  const {
    recycleBin,
    restoreRecord,
    deletePermanently,
    restoreRecords,
    deleteRecordsPermanently,
    showToast,
  } = useApp();

  const renderDetailContent = (item: RecycleBinItem) => {
    const data = item.originalData;
    if (!data) return <p>No details available.</p>;

    switch (item.module) {
      case 'Customer':
      case 'Supplier':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            <div><strong>Phone:</strong> {data.phone || 'N/A'}</div>
            <div><strong>Email:</strong> {data.email || 'N/A'}</div>
            <div><strong>Address:</strong> {data.address || 'N/A'}</div>
            {data.gstin && <div><strong>GSTIN:</strong> {data.gstin}</div>}
            {data.state && <div><strong>State:</strong> {data.state}</div>}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px' }}>
              <strong>Outstanding:</strong> <span style={{ color: data.outstanding > 0 ? 'var(--color-danger)' : 'var(--color-success-dark)', fontWeight: 'bold' }}>₹{data.outstanding}</span>
            </div>
          </div>
        );
      case 'Product':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            <div><strong>SKU:</strong> {data.sku || 'N/A'}</div>
            <div><strong>Category:</strong> {data.category || 'N/A'}</div>
            {data.hsn && <div><strong>HSN Code:</strong> {data.hsn}</div>}
            <div><strong>Available Stock:</strong> {data.stock} units</div>
            <div><strong>Min Stock Threshold:</strong> {data.minStock} units</div>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div><strong>Purchase Price:</strong> ₹{data.purchasePrice}</div>
              <div><strong>Selling Price:</strong> ₹{data.sellingPrice}</div>
            </div>
            <div><strong>GST Rate:</strong> {data.gstRate}%</div>
          </div>
        );
      case 'Invoice':
      case 'Quotation':
      case 'Purchase':
        const contactLabel = item.module === 'Purchase' ? 'Supplier' : 'Customer';
        const contactName = item.module === 'Purchase' ? data.supplierName : data.customerName;
        const numLabel = item.module === 'Invoice' ? 'Invoice No' : item.module === 'Quotation' ? 'Quotation No' : 'Purchase No';
        const numVal = item.module === 'Invoice' ? data.invoiceNumber : item.module === 'Quotation' ? data.quotationNumber : data.purchaseNumber;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div><strong>Date:</strong> {new Date(data.date).toLocaleDateString()}</div>
              <div><strong>{numLabel}:</strong> {numVal}</div>
            </div>
            <div><strong>{contactLabel}:</strong> {contactName}</div>
            {data.validUntil && <div><strong>Valid Until:</strong> {new Date(data.validUntil).toLocaleDateString()}</div>}
            
            <div style={{ marginTop: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
              <strong style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Items List</strong>
              <div style={{ maxHeight: '120px', overflowY: 'auto', marginTop: '4px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: 'var(--bg-app)', position: 'sticky', top: 0 }}>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '4px 6px', textAlign: 'left' }}>Item</th>
                      <th style={{ padding: '4px 6px', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '4px 6px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items?.map((it: any, index: number) => (
                      <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '4px 6px' }}>{it.productName}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'center' }}>{it.quantity}</td>
                        <td style={{ padding: '4px 6px', textAlign: 'right' }}>₹{it.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end', fontSize: '12px' }}>
              {data.subtotal !== undefined && <div>Subtotal: ₹{data.subtotal}</div>}
              {data.gstTotal !== undefined && <div>GST Tax: ₹{data.gstTotal}</div>}
              {data.discountTotal !== undefined && <div>Discount: ₹{data.discountTotal}</div>}
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--primary-dark)', marginTop: '2px' }}>Grand Total: ₹{data.grandTotal}</div>
            </div>
          </div>
        );
      case 'Expense':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            <div><strong>Category:</strong> {data.category}</div>
            <div><strong>Payee:</strong> {data.payee}</div>
            <div><strong>Date:</strong> {new Date(data.date).toLocaleDateString()}</div>
            <div><strong>Payment Method:</strong> {data.paymentMethod}</div>
            <div><strong>Status:</strong> {data.status}</div>
            {data.referenceNumber && <div><strong>Reference:</strong> {data.referenceNumber}</div>}
            {data.notes && <div><strong>Notes:</strong> {data.notes}</div>}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px', fontSize: '14px', fontWeight: 'bold', color: 'var(--color-danger)' }}>
              Amount: ₹{data.amount}
            </div>
          </div>
        );
      case 'Payment':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            <div><strong>Type:</strong> {data.type === 'CustomerReceipt' ? 'Customer Receipt' : 'Supplier Payment'}</div>
            <div><strong>Contact:</strong> {data.contactName}</div>
            <div><strong>Date:</strong> {new Date(data.date).toLocaleDateString()}</div>
            <div><strong>Payment Method:</strong> {data.paymentMethod}</div>
            {data.referenceNumber && <div><strong>Reference:</strong> {data.referenceNumber}</div>}
            {data.notes && <div><strong>Notes:</strong> {data.notes}</div>}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px', fontSize: '14px', fontWeight: 'bold', color: 'var(--primary-dark)' }}>
              Amount: ₹{data.amount}
            </div>
          </div>
        );
      default:
        return (
          <pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        );
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RecycleBinItem | null>(null);
  const [actionConfirm, setActionConfirm] = useState<{ type: 'restore' | 'delete' | 'bulk-restore' | 'bulk-delete'; targetId?: string } | null>(null);

  // Trigger loading spinner simulation on refresh
  const handleReload = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showToast('Recycle bin reloaded', 'info');
    }, 800);
  };

  // Selection handlers
  const toggleSelectAll = (filteredRecords: RecycleBinItem[]) => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map(r => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // State actions
  const handleRestore = (id: string) => {
    restoreRecord(id);
    setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    setActionConfirm(null);
    showToast('Record restored successfully', 'success');
  };

  const handlePermanentDelete = (id: string) => {
    deletePermanently(id);
    setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    setActionConfirm(null);
    showToast('Record permanently deleted', 'error');
  };

  const handleBulkRestore = () => {
    restoreRecords(selectedIds);
    setSelectedIds([]);
    setActionConfirm(null);
    showToast('Selected records restored successfully', 'success');
  };

  const handleBulkPermanentDelete = () => {
    deleteRecordsPermanently(selectedIds);
    setSelectedIds([]);
    setActionConfirm(null);
    showToast('Selected records permanently deleted', 'error');
  };

  // Filtering and Sorting logic
  const filteredRecords = recycleBin.filter((rec) => {
    // Search match
    const searchLower = searchQuery.toLowerCase();
    
    // Safely check metadata details
    const detailsStr = typeof rec.originalData === 'object' ? JSON.stringify(rec.originalData).toLowerCase() : '';
    
    const matchesSearch = 
      rec.name.toLowerCase().includes(searchLower) ||
      rec.originalId.toLowerCase().includes(searchLower) ||
      rec.deletedBy.toLowerCase().includes(searchLower) ||
      detailsStr.includes(searchLower);

    // Module filter match
    const matchesModule = moduleFilter === 'All' || rec.module === moduleFilter;

    // Date filter match
    let matchesDate = true;
    if (dateFilter !== 'All') {
      const recordDate = new Date(rec.deletedAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (dateFilter === 'today') {
        matchesDate = recordDate >= today;
      } else if (dateFilter === 'yesterday') {
        matchesDate = recordDate >= yesterday && recordDate < today;
      } else if (dateFilter === 'week') {
        matchesDate = recordDate >= sevenDaysAgo;
      } else if (dateFilter === 'month') {
        matchesDate = recordDate >= thirtyDaysAgo;
      }
    }

    return matchesSearch && matchesModule && matchesDate;
  });

  // Sorting
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.deletedAt).getTime() - new Date(b.deletedAt).getTime();
    }
    if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'name-desc') {
      return b.name.localeCompare(a.name);
    }
    return 0;
  });

  return (
    <div className="recycle-bin-page" style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* Header Panel */}
      <div className="creator-banner-header no-print" style={{ marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: 0 }}>Recycle Bin</h2>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: '4px 0 0 0' }}>
            View, search, and restore records deleted from customers, suppliers, inventory, sales, or reports.
          </p>
        </div>
        <button 
          className="btn btn-secondary btn-icon" 
          onClick={handleReload}
          title="Refresh deleted logs"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.25)', color: '#ffffff' }}
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="card no-print" style={{ padding: '16px', marginBottom: '20px', borderRadius: '12px' }}>
        <div className="recycle-bin-filters-grid">
          {/* Item 1: Search */}
          <div className="recycle-bin-filter-item">
            <div className="search-input-wrapper" style={{ width: '100%', margin: 0 }}>
              <Search size={16} className="search-input-icon" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                style={{ width: '100%' }}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Item 2: Module */}
          <div className="recycle-bin-filter-item">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
              <select 
                className="filter-select"
                style={{ width: '100%' }}
                value={moduleFilter} 
                onChange={(e) => setModuleFilter(e.target.value)}
              >
                <option value="All">All Modules</option>
                <option value="Customer">Customers</option>
                <option value="Supplier">Suppliers</option>
                <option value="Product">Products</option>
                <option value="Invoice">Invoices</option>
                <option value="Quotation">Quotations</option>
                <option value="Purchase">Purchases</option>
                <option value="Expense">Expenses</option>
                <option value="Payment">Payments</option>
              </select>
            </div>
          </div>

          {/* Item 3: Date */}
          <div className="recycle-bin-filter-item">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
              <span style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none', display: 'flex' }}>
                <Calendar size={13} />
              </span>
              <select
                className="filter-select"
                style={{ paddingLeft: '32px', width: '100%' }}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="All">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Item 4: Sort */}
          <div className="recycle-bin-filter-item">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
              <span style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none', display: 'flex' }}>
                <ArrowUpDown size={13} />
              </span>
              <select
                className="filter-select"
                style={{ paddingLeft: '32px', width: '100%' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest Deleted</option>
                <option value="oldest">Oldest Deleted</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div 
          className="card alert-warning no-print" 
          style={{ 
            padding: '12px 16px', 
            marginBottom: '20px', 
            borderRadius: '10px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            backgroundColor: 'var(--color-danger-bg)',
            borderColor: 'rgba(239, 68, 68, 0.2)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger-dark)' }}>
            <Info size={16} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              {selectedIds.length} {selectedIds.length === 1 ? 'record' : 'records'} selected
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActionConfirm({ type: 'bulk-restore' })}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={13} /> Restore Selected
            </button>
            <button 
              className="btn btn-primary btn-sm btn-danger"
              onClick={() => setActionConfirm({ type: 'bulk-delete' })}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
            >
              <Trash2 size={13} /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Main List / Table */}
      {isLoading ? (
        <div className="card" style={{ padding: '80px 20px', textAlign: 'center', borderRadius: '12px' }}>
          <RefreshCw size={36} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '12px' }} />
          <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Loading deleted logs...</h4>
        </div>
      ) : recycleBin.length === 0 ? (
        /* Empty State */
        <div className="empty-state card" style={{ padding: '60px 20px', borderRadius: '12px', textAlign: 'center' }}>
          <Trash2 size={48} className="empty-state-icon" style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '16px' }} />
          <h4 className="empty-state-title" style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Recycle Bin is Empty</h4>
          <p className="empty-state-text" style={{ maxWidth: '360px', margin: '8px auto 0 auto', fontSize: '13px', color: 'var(--text-secondary)' }}>
            There are no deleted records recorded in your database. Deleted items from any module will instantly appear here.
          </p>
        </div>
      ) : sortedRecords.length === 0 ? (
        /* No Results State */
        <div className="card" style={{ padding: '60px 20px', borderRadius: '12px', textAlign: 'center' }}>
          <Search size={36} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '16px' }} />
          <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>No Matching Records Found</h4>
          <p style={{ maxWidth: '320px', margin: '6px auto 0 auto', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Try modifying your search query or filters to find the deleted records.
          </p>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ marginTop: '16px' }}
            onClick={() => {
              setSearchQuery('');
              setModuleFilter('All');
              setDateFilter('All');
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="desktop-only-table">
            <div className="table-wrapper" style={{ overflow: 'visible' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }} className="no-print">
                      <button 
                        type="button"
                        onClick={() => toggleSelectAll(sortedRecords)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--primary)' }}
                      >
                        {selectedIds.length === sortedRecords.length ? (
                          <CheckSquare size={16} />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </th>
                    <th>Record Name</th>
                    <th>Module</th>
                    <th>Original ID</th>
                    <th>Deleted Date & Time</th>
                    <th>Deleted By</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th className="no-print" style={{ textAlign: 'center', width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRecords.map((rec) => {
                    const isSelected = selectedIds.includes(rec.id);
                    return (
                      <tr key={rec.id} className={isSelected ? 'selected-row' : ''} style={{ backgroundColor: isSelected ? 'var(--bg-app)' : 'transparent' }}>
                        <td className="no-print" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => toggleSelect(rec.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}
                          >
                            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{rec.name}</td>
                        <td>
                          <span className={`badge badge-secondary`} style={{ textTransform: 'capitalize' }}>
                            {rec.module}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{rec.originalId}</td>
                        <td>{new Date(rec.deletedAt).toLocaleString()}</td>
                        <td>{rec.deletedBy}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-danger">Deleted</span>
                        </td>
                        <td className="no-print">
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button
                              className="btn btn-secondary btn-icon"
                              style={{ padding: '6px' }}
                              onClick={() => setSelectedRecord(rec)}
                              title="View details"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              className="btn btn-secondary btn-icon"
                              style={{ padding: '6px' }}
                              onClick={() => setActionConfirm({ type: 'restore', targetId: rec.id })}
                              title="Restore record"
                            >
                              <RotateCcw size={14} />
                            </button>
                            <button
                              className="btn btn-secondary btn-icon danger"
                              style={{ padding: '6px' }}
                              onClick={() => setActionConfirm({ type: 'delete', targetId: rec.id })}
                              title="Delete permanently"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View */}
          <div className="mobile-card-list">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }} className="no-print">
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Showing {sortedRecords.length} deleted items
              </span>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => toggleSelectAll(sortedRecords)}
                style={{ fontSize: '11px', padding: '4px 8px' }}
              >
                {selectedIds.length === sortedRecords.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            {sortedRecords.map((rec) => {
              const isSelected = selectedIds.includes(rec.id);
              return (
                <div 
                  key={rec.id} 
                  className={`mobile-list-card ${isSelected ? 'selected-card' : ''}`}
                  style={{ 
                    borderLeft: isSelected ? '4px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: isSelected ? 'var(--bg-app)' : 'var(--bg-card)'
                  }}
                >
                  <div className="mobile-list-card-header">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => toggleSelect(rec.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '2px', color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}
                      >
                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                      <div>
                        <h4 className="mobile-list-card-title" style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>
                          {rec.name}
                        </h4>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
                          <span className="badge badge-secondary" style={{ fontSize: '10px', padding: '2px 6px' }}>{rec.module}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {rec.originalId}</span>
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-danger">Deleted</span>
                  </div>

                  <div style={{ fontSize: '12px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Deleted On:</span>
                      <span style={{ fontWeight: 500 }}>{new Date(rec.deletedAt).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Deleted By:</span>
                      <span style={{ fontWeight: 500 }}>{rec.deletedBy}</span>
                    </div>
                  </div>

                  {/* Actions Grid on Mobile */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
                      onClick={() => setSelectedRecord(rec)}
                    >
                      <Eye size={13} /> View
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
                      onClick={() => setActionConfirm({ type: 'restore', targetId: rec.id })}
                    >
                      <RotateCcw size={13} /> Restore
                    </button>
                    <button
                      className="btn btn-secondary btn-sm danger"
                      style={{ fontSize: '11px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
                      onClick={() => setActionConfirm({ type: 'delete', targetId: rec.id })}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* View Details Modal */}
      {selectedRecord && (
        <div className="modal-overlay no-print" onClick={() => setSelectedRecord(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Deleted Record Details</h3>
              <button className="btn-icon" onClick={() => setSelectedRecord(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Record Name</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-dark)', marginTop: '2px' }}>{selectedRecord.name}</div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Module</span>
                    <div style={{ marginTop: '2px' }}>
                      <span className="badge badge-secondary">{selectedRecord.module}</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Original Record ID</span>
                    <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', marginTop: '4px' }}>{selectedRecord.originalId}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Deleted On</span>
                    <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '2px' }}>{new Date(selectedRecord.deletedAt).toLocaleString()}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Deleted By</span>
                    <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '2px' }}>{selectedRecord.deletedBy}</div>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Record Details</span>
                  <div style={{ 
                    fontSize: '13px', 
                    padding: '12px', 
                    backgroundColor: 'var(--bg-app)', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)', 
                    marginTop: '4px',
                    lineHeight: 1.5
                  }}>
                    {renderDetailContent(selectedRecord)}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedRecord(null)}>Close</button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setActionConfirm({ type: 'restore', targetId: selectedRecord.id });
                  setSelectedRecord(null);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RotateCcw size={12} /> Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {actionConfirm && (
        <div className="modal-overlay no-print" onClick={() => setActionConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} style={{ color: actionConfirm.type.includes('delete') ? 'var(--color-danger)' : 'var(--primary)' }} />
                <span>Confirm Action</span>
              </h3>
              <button className="btn-icon" onClick={() => setActionConfirm(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: '14px', margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {actionConfirm.type === 'restore' && 'Are you sure you want to restore this deleted record to its original directory?'}
                {actionConfirm.type === 'delete' && 'WARNING: This will permanently delete the record. This action CANNOT be undone and will delete it from history.'}
                {actionConfirm.type === 'bulk-restore' && `Are you sure you want to restore all ${selectedIds.length} selected records?`}
                {actionConfirm.type === 'bulk-delete' && `WARNING: This will permanently delete all ${selectedIds.length} selected records. This action CANNOT be undone.`}
              </p>
            </div>
            <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setActionConfirm(null)}>Cancel</button>
              
              {actionConfirm.type === 'restore' && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => handleRestore(actionConfirm.targetId!)}
                >
                  Confirm Restore
                </button>
              )}
              
              {actionConfirm.type === 'delete' && (
                <button 
                  className="btn btn-primary btn-sm btn-danger"
                  style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                  onClick={() => handlePermanentDelete(actionConfirm.targetId!)}
                >
                  Delete Permanently
                </button>
              )}

              {actionConfirm.type === 'bulk-restore' && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={handleBulkRestore}
                >
                  Restore All Selected
                </button>
              )}

              {actionConfirm.type === 'bulk-delete' && (
                <button 
                  className="btn btn-primary btn-sm btn-danger"
                  style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                  onClick={handleBulkPermanentDelete}
                >
                  Delete All Selected
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
