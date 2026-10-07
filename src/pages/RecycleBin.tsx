import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import type { RecycleBinItem } from '../types';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import {
  Trash2,
  RotateCcw,
  Search,
  Calendar,
  Eye,
  Info,
  RefreshCw,
  X,
  CheckSquare,
  Square,
  ArrowUpDown,
} from 'lucide-react';

export const RecycleBin: React.FC = () => {
  const { t } = useTranslation();
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
    if (!data) return <p>{t('recycleBin.noDetailsAvailable', 'No details available.')}</p>;

    switch (item.module) {
      case 'Customer':
      case 'Supplier':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            <div><strong>{t('common.phone', 'Phone')}:</strong> {data.phone || 'N/A'}</div>
            <div><strong>{t('common.email', 'Email')}:</strong> {data.email || 'N/A'}</div>
            <div><strong>{t('common.address', 'Address')}:</strong> {data.address || 'N/A'}</div>
            {data.gstin && <div><strong>{t('common.gstin', 'GSTIN')}:</strong> {data.gstin}</div>}
            {data.state && <div><strong>{t('common.state', 'State')}:</strong> {data.state}</div>}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px' }}>
              <strong>{t('common.outstanding', 'Outstanding')}:</strong> <span style={{ color: data.outstanding > 0 ? 'var(--color-danger)' : 'var(--color-success-dark)', fontWeight: 'bold' }}>₹{data.outstanding}</span>
            </div>
          </div>
        );
      case 'Product':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            <div><strong>{t('inventory.sku', 'SKU')}:</strong> {data.sku || 'N/A'}</div>
            <div><strong>{t('inventory.category', 'Category')}:</strong> {data.category || 'N/A'}</div>
            {data.hsn && <div><strong>{t('inventory.hsn', 'HSN Code')}:</strong> {data.hsn}</div>}
            <div><strong>{t('inventory.availableStock', 'Available Stock')}:</strong> {data.stock} units</div>
            <div><strong>{t('inventory.minStockThreshold', 'Min Stock Threshold')}:</strong> {data.minStock} units</div>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div><strong>{t('inventory.purchasePrice', 'Purchase Price')}:</strong> ₹{data.purchasePrice}</div>
              <div><strong>{t('inventory.sellingPrice', 'Selling Price')}:</strong> ₹{data.sellingPrice}</div>
            </div>
            <div><strong>{t('inventory.gstRate', 'GST Rate')}:</strong> {data.gstRate}%</div>
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
              <div><strong>{t('common.date', 'Date')}:</strong> {new Date(data.date).toLocaleDateString()}</div>
              <div><strong>{numLabel}:</strong> {numVal}</div>
            </div>
            <div><strong>{contactLabel}:</strong> {contactName}</div>
            {data.validUntil && <div><strong>{t('sales.validUntil', 'Valid Until')}:</strong> {new Date(data.validUntil).toLocaleDateString()}</div>}
            
            <div style={{ marginTop: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
              <strong style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{t('recycleBin.itemsList', 'Items List')}</strong>
              <div style={{ maxHeight: '120px', overflowY: 'auto', marginTop: '4px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: 'var(--bg-app)', position: 'sticky', top: 0 }}>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '4px 6px', textAlign: 'left' }}>{t('sales.item', 'Item')}</th>
                      <th style={{ padding: '4px 6px', textAlign: 'center' }}>{t('sales.qty', 'Qty')}</th>
                      <th style={{ padding: '4px 6px', textAlign: 'right' }}>{t('sales.total', 'Total')}</th>
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
              {data.subtotal !== undefined && <div>{t('sales.subtotal', 'Subtotal')}: ₹{data.subtotal}</div>}
              {data.gstTotal !== undefined && <div>{t('sales.gstTax', 'GST Tax')}: ₹{data.gstTotal}</div>}
              {data.discountTotal !== undefined && <div>{t('sales.discount', 'Discount')}: ₹{data.discountTotal}</div>}
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--primary-dark)', marginTop: '2px' }}>{t('sales.grandTotal', 'Grand Total')}: ₹{data.grandTotal}</div>
            </div>
          </div>
        );
      case 'Expense':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            <div><strong>{t('inventory.category', 'Category')}:</strong> {data.category}</div>
            <div><strong>{t('expenses.payee', 'Payee')}:</strong> {data.payee}</div>
            <div><strong>{t('common.date', 'Date')}:</strong> {new Date(data.date).toLocaleDateString()}</div>
            <div><strong>{t('expenses.paymentMethod', 'Payment Method')}:</strong> {data.paymentMethod}</div>
            <div><strong>{t('common.status', 'Status')}:</strong> {data.status}</div>
            {data.referenceNumber && <div><strong>{t('common.reference', 'Reference')}:</strong> {data.referenceNumber}</div>}
            {data.notes && <div><strong>{t('common.notes', 'Notes')}:</strong> {data.notes}</div>}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px', fontSize: '14px', fontWeight: 'bold', color: 'var(--color-danger)' }}>
              Amount: ₹{data.amount}
            </div>
          </div>
        );
      case 'Payment':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            <div><strong>{t('payments.type', 'Type')}:</strong> {data.type === 'CustomerReceipt' ? 'Customer Receipt' : 'Supplier Payment'}</div>
            <div><strong>{t('payments.contact', 'Contact')}:</strong> {data.contactName}</div>
            <div><strong>{t('common.date', 'Date')}:</strong> {new Date(data.date).toLocaleDateString()}</div>
            <div><strong>{t('expenses.paymentMethod', 'Payment Method')}:</strong> {data.paymentMethod}</div>
            {data.referenceNumber && <div><strong>{t('common.reference', 'Reference')}:</strong> {data.referenceNumber}</div>}
            {data.notes && <div><strong>{t('common.notes', 'Notes')}:</strong> {data.notes}</div>}
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
      showToast(t('recycleBin.reloaded', 'Recycle bin reloaded'), 'info');
    }, 800);
  };

  // Helper to extract valid RecycleBin ID
  const getRecId = (r: RecycleBinItem | any): string => {
    if (!r) return '';
    if (typeof r === 'string') return r;
    return r.recycleBinItemId || r.id || r._id || '';
  };

  // Selection handlers
  const toggleSelectAll = (filteredRecords: RecycleBinItem[]) => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map(r => getRecId(r)));
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
    const targetId = getRecId(id);
    restoreRecord(targetId);
    setSelectedIds(selectedIds.filter(selectedId => selectedId !== targetId));
    setActionConfirm(null);
  };

  const handlePermanentDelete = (id: string) => {
    const targetId = getRecId(id);
    deletePermanently(targetId);
    setSelectedIds(selectedIds.filter(selectedId => selectedId !== targetId));
    setActionConfirm(null);
  };

  const handleBulkRestore = () => {
    restoreRecords(selectedIds);
    setSelectedIds([]);
    setActionConfirm(null);
    showToast(t('recycleBin.bulkRestoreSuccess', 'Selected records restored successfully'), 'success');
  };

  const handleBulkPermanentDelete = () => {
    deleteRecordsPermanently(selectedIds);
    setSelectedIds([]);
    setActionConfirm(null);
    showToast(t('recycleBin.bulkDeleteSuccess', 'Selected records permanently deleted'), 'error');
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
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: 0 }}>{t('recycleBin.title', 'Recycle Bin')}</h2>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: '4px 0 0 0' }}>
            {t('recycleBin.subtitle', 'View, search, and restore records deleted from customers, suppliers, inventory, sales, or reports.')}
          </p>
        </div>
        <button 
          className="btn btn-secondary btn-icon" 
          onClick={handleReload}
          title={t('recycleBin.refreshLogs', 'Refresh deleted logs')}
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
                placeholder={t('recycleBin.searchPlaceholder', 'Search...')}
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
                <option value="All">{t('recycleBin.allModules', 'All Modules')}</option>
                <option value="Customer">{t('customer.customers', 'Customers')}</option>
                <option value="Supplier">{t('supplier.suppliers', 'Suppliers')}</option>
                <option value="Product">{t('inventory.products', 'Products')}</option>
                <option value="Invoice">{t('sales.invoices', 'Invoices')}</option>
                <option value="Quotation">{t('sales.quotations', 'Quotations')}</option>
                <option value="Purchase">{t('purchases.purchases', 'Purchases')}</option>
                <option value="Expense">{t('expenses.expenses', 'Expenses')}</option>
                <option value="Payment">{t('payments.payments', 'Payments')}</option>
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
                <option value="All">{t('recycleBin.allDates', 'All Dates')}</option>
                <option value="today">{t('recycleBin.today', 'Today')}</option>
                <option value="yesterday">{t('recycleBin.yesterday', 'Yesterday')}</option>
                <option value="week">{t('recycleBin.last7Days', 'Last 7 Days')}</option>
                <option value="month">{t('recycleBin.last30Days', 'Last 30 Days')}</option>
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
                <option value="newest">{t('recycleBin.newestDeleted', 'Newest Deleted')}</option>
                <option value="oldest">{t('recycleBin.oldestDeleted', 'Oldest Deleted')}</option>
                <option value="name-asc">{t('recycleBin.nameAsc', 'Name (A-Z)')}</option>
                <option value="name-desc">{t('recycleBin.nameDesc', 'Name (Z-A)')}</option>
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
              {selectedIds.length === 1 ? t('recycleBin.recordSelected', '1 record selected') : t('recycleBin.recordsSelected', '{{count}} records selected', { count: selectedIds.length })}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActionConfirm({ type: 'bulk-restore' })}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={13} /> {t('recycleBin.restoreSelected', 'Restore Selected')}
            </button>
            <button 
              className="btn btn-primary btn-sm btn-danger"
              onClick={() => setActionConfirm({ type: 'bulk-delete' })}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
            >
              <Trash2 size={13} /> {t('recycleBin.deleteSelected', 'Delete Selected')}
            </button>
          </div>
        </div>
      )}

      {/* Main List / Table */}
      {isLoading ? (
        <div className="card" style={{ padding: '80px 20px', textAlign: 'center', borderRadius: '12px' }}>
          <RefreshCw size={36} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '12px' }} />
          <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>{t('recycleBin.loadingLogs', 'Loading deleted logs...')}</h4>
        </div>
      ) : recycleBin.length === 0 ? (
        /* Empty State */
        <div className="empty-state card" style={{ padding: '60px 20px', borderRadius: '12px', textAlign: 'center' }}>
          <Trash2 size={48} className="empty-state-icon" style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '16px' }} />
          <h4 className="empty-state-title" style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{t('recycleBin.binIsEmpty', 'Recycle Bin is Empty')}</h4>
          <p className="empty-state-text" style={{ maxWidth: '360px', margin: '8px auto 0 auto', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {t('recycleBin.binEmptyDesc', 'There are no deleted records recorded in your database. Deleted items from any module will instantly appear here.')}
          </p>
        </div>
      ) : sortedRecords.length === 0 ? (
        /* No Results State */
        <div className="card" style={{ padding: '60px 20px', borderRadius: '12px', textAlign: 'center' }}>
          <Search size={36} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '16px' }} />
          <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>{t('recycleBin.noMatchFound', 'No Matching Records Found')}</h4>
          <p style={{ maxWidth: '320px', margin: '6px auto 0 auto', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {t('recycleBin.noMatchDesc', 'Try modifying your search query or filters to find the deleted records.')}
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
            {t('common.clearFilters', 'Clear Filters')}
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
                    <th>{t('recycleBin.recordName', 'Record Name')}</th>
                    <th>{t('recycleBin.module', 'Module')}</th>
                    <th>{t('recycleBin.originalId', 'Original ID')}</th>
                    <th>{t('recycleBin.deletedDateTime', 'Deleted Date & Time')}</th>
                    <th>{t('recycleBin.deletedBy', 'Deleted By')}</th>
                    <th style={{ textAlign: 'center' }}>{t('common.status', 'Status')}</th>
                    <th className="no-print" style={{ textAlign: 'center', width: '120px' }}>{t('common.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRecords.map((rec) => {
                    const recId = getRecId(rec);
                    const isSelected = selectedIds.includes(recId);
                    return (
                      <tr key={recId} className={isSelected ? 'selected-row' : ''} style={{ backgroundColor: isSelected ? 'var(--bg-app)' : 'transparent' }}>
                        <td className="no-print" style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => toggleSelect(recId)}
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
                          <span className="badge badge-danger">{t('recycleBin.deleted', 'Deleted')}</span>
                        </td>
                        <td className="no-print">
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button
                              className="btn btn-secondary btn-icon"
                              style={{ padding: '6px' }}
                              onClick={() => setSelectedRecord(rec)}
                              title={t('common.view', 'View')}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              className="btn btn-secondary btn-icon"
                              style={{ padding: '6px' }}
                              onClick={() => setActionConfirm({ type: 'restore', targetId: recId })}
                              title={t('common.restore', 'Restore')}
                            >
                              <RotateCcw size={14} />
                            </button>
                            <button
                              className="btn btn-secondary btn-icon danger"
                              style={{ padding: '6px' }}
                              onClick={() => setActionConfirm({ type: 'delete', targetId: recId })}
                              title={t('common.delete', 'Delete')}
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
                {t('recycleBin.showingDeletedItems', 'Showing {{count}} deleted items', { count: sortedRecords.length })}
              </span>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => toggleSelectAll(sortedRecords)}
                style={{ fontSize: '11px', padding: '4px 8px' }}
              >
                {selectedIds.length === sortedRecords.length ? t('recycleBin.deselectAll', 'Deselect All') : t('recycleBin.selectAll', 'Select All')}
              </button>
            </div>
            
            {sortedRecords.map((rec) => {
              const recId = getRecId(rec);
              const isSelected = selectedIds.includes(recId);
              return (
                <div 
                  key={recId} 
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
                        onClick={() => toggleSelect(recId)}
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
                    <span className="badge badge-danger">{t('recycleBin.deleted', 'Deleted')}</span>
                  </div>

                  <div style={{ fontSize: '12px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{t('recycleBin.deletedOnLabel', 'Deleted On:')}</span>
                      <span style={{ fontWeight: 500 }}>{new Date(rec.deletedAt).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{t('recycleBin.deletedByLabel', 'Deleted By:')}</span>
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
                      <Eye size={13} /> {t('common.view', 'View')}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
                      onClick={() => setActionConfirm({ type: 'restore', targetId: recId })}
                    >
                      <RotateCcw size={13} /> {t('common.restore', 'Restore')}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm danger"
                      style={{ fontSize: '11px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
                      onClick={() => setActionConfirm({ type: 'delete', targetId: recId })}
                    >
                      <Trash2 size={13} /> {t('common.delete', 'Delete')}
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
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{t('recycleBin.deletedRecordDetails', 'Deleted Record Details')}</h3>
              <button className="btn-icon" onClick={() => setSelectedRecord(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{t('recycleBin.recordName', 'Record Name')}</span>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary-dark)', marginTop: '2px' }}>{selectedRecord.name}</div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{t('recycleBin.module', 'Module')}</span>
                    <div style={{ marginTop: '2px' }}>
                      <span className="badge badge-secondary">{selectedRecord.module}</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{t('recycleBin.originalRecordId', 'Original Record ID')}</span>
                    <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', marginTop: '4px' }}>{selectedRecord.originalId}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{t('recycleBin.deletedOn', 'Deleted On')}</span>
                    <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '2px' }}>{new Date(selectedRecord.deletedAt).toLocaleString()}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{t('recycleBin.deletedBy', 'Deleted By')}</span>
                    <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '2px' }}>{selectedRecord.deletedBy}</div>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{t('recycleBin.recordDetails', 'Record Details')}</span>
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
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedRecord(null)}>{t('common.close', 'Close')}</button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setActionConfirm({ type: 'restore', targetId: getRecId(selectedRecord) });
                  setSelectedRecord(null);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RotateCcw size={12} /> {t('common.restore', 'Restore')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!actionConfirm}
        onClose={() => setActionConfirm(null)}
        onConfirm={() => {
          if (!actionConfirm) return;
          if (actionConfirm.type === 'restore') {
            handleRestore(actionConfirm.targetId!);
          } else if (actionConfirm.type === 'delete') {
            handlePermanentDelete(actionConfirm.targetId!);
          } else if (actionConfirm.type === 'bulk-restore') {
            handleBulkRestore();
          } else if (actionConfirm.type === 'bulk-delete') {
            handleBulkPermanentDelete();
          }
        }}
        title={
          actionConfirm?.type === 'restore'
            ? t('recycleBin.restoreRecordTitle', 'Restore Record')
            : actionConfirm?.type === 'bulk-restore'
            ? t('recycleBin.restoreSelectedRecordsTitle', 'Restore Selected Records')
            : actionConfirm?.type === 'bulk-delete'
            ? t('recycleBin.deleteSelectedRecordsTitle', 'Delete Selected Records Permanently')
            : t('recycleBin.deleteRecordTitle', 'Delete Record Permanently')
        }
        description={
          actionConfirm?.type === 'restore' ? (
            t('recycleBin.restoreSingleDesc', 'Are you sure you want to restore this deleted record to its original directory?')
          ) : actionConfirm?.type === 'delete' ? (
            t('recycleBin.deleteSingleDesc', 'WARNING: This will permanently delete the record. This action CANNOT be undone and will delete it from history.')
          ) : actionConfirm?.type === 'bulk-restore' ? (
            t('recycleBin.restoreBulkDesc', 'Are you sure you want to restore all {{count}} selected records?', { count: selectedIds.length })
          ) : actionConfirm?.type === 'bulk-delete' ? (
            t('recycleBin.deleteBulkDesc', 'WARNING: This will permanently delete all {{count}} selected records. This action CANNOT be undone.', { count: selectedIds.length })
          ) : ''
        }
        confirmText={
          actionConfirm?.type === 'restore'
            ? t('common.restoreRecord', 'Restore Record')
            : actionConfirm?.type === 'bulk-restore'
            ? t('recycleBin.restoreAllSelected', 'Restore All Selected')
            : actionConfirm?.type === 'bulk-delete'
            ? t('recycleBin.deleteAllSelected', 'Delete All Selected')
            : t('recycleBin.deletePermanently', 'Delete Permanently')
        }
        variant={actionConfirm?.type.includes('delete') ? 'danger' : 'primary'}
        icon={actionConfirm?.type.includes('restore') ? <RotateCcw size={24} /> : undefined}
      />
    </div>
  );
};
