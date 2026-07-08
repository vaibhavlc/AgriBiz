import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate } from '../utils/dummyData';
import { Modal } from '../components/Modal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Plus,
  Search,
  Trash,
  Edit2,
  Download,
  Calendar,
  Tag,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  FileText,
} from 'lucide-react';
import type { Expense } from '../types';

export const Expenses: React.FC = () => {
  const {
    expenses,
    addExpense,
    editExpense,
    deleteExpense,
    searchQuery,
    setSearchQuery,
    showToast,
  } = useApp();

  // Search/Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [dateRange, setDateRange] = useState<'All' | 'Custom'>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [category, setCategory] = useState('Shop Rent');
  const [customCategory, setCustomCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque'>('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Categories list
  const categoriesList = [
    'Shop Rent',
    'Light Bill',
    'Tea Bills',
    'Transportation',
    'Maintenance',
    'Staff Salary',
    'Marketing',
    'Other'
  ];


  // Calculations for stats
  const totalExpenseAmt = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const thisMonthExpenseAmt = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const topCategory = useMemo(() => {
    const totals: { [cat: string]: number } = {};
    expenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });

    let topCatName = 'None';
    let maxVal = 0;
    Object.entries(totals).forEach(([cat, val]) => {
      if (val > maxVal) {
        maxVal = val;
        topCatName = cat;
      }
    });
    return { name: topCatName, amount: maxVal };
  }, [expenses]);



  // Filtering & Pagination
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // Category Filter
      let matchesCategory = true;
      if (categoryFilter !== 'All') {
        if (categoryFilter === 'Other') {
          const standardCats = categoriesList.filter(c => c !== 'Other');
          matchesCategory = !standardCats.includes(e.category);
        } else {
          matchesCategory = e.category === categoryFilter;
        }
      }

      // Method Filter
      const matchesMethod = methodFilter === 'All' || e.paymentMethod === methodFilter;

      // Date range filter
      let matchesDate = true;
      if (dateRange === 'Custom') {
        if (startDate) {
          matchesDate = matchesDate && e.date >= startDate;
        }
        if (endDate) {
          matchesDate = matchesDate && e.date <= endDate;
        }
      }

      // Search query
      const matchesSearch =
        e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.referenceNumber && e.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        e.id.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesMethod && matchesDate && matchesSearch;
    });
  }, [expenses, categoryFilter, methodFilter, dateRange, startDate, endDate, searchQuery]);

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = useMemo(() => {
    return filteredExpenses.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredExpenses, currentPage]);

  // Save handler
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = category === 'Other' ? (customCategory.trim() || 'Other') : category;
    const finalAmount = parseFloat(amount);

    if (!finalCategory) {
      showToast('Please specify a category.', 'error');
      return;
    }
    if (isNaN(finalAmount) || finalAmount <= 0) {
      showToast('Please enter a valid amount greater than zero.', 'error');
      return;
    }

    if (editingExpenseId) {
      editExpense({
        id: editingExpenseId,
        date,
        category: finalCategory,
        amount: finalAmount,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      showToast('Expense record updated successfully!');
    } else {
      addExpense({
        date,
        category: finalCategory,
        amount: finalAmount,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      showToast('New expense recorded successfully!');
    }

    // Reset fields & close
    setIsFormOpen(false);
    setEditingExpenseId(null);
    setCategory('Shop Rent');
    setCustomCategory('');
    setDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setPaymentMethod('UPI');
    setReferenceNumber('');
    setNotes('');
  };

  const handleEditClick = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    if (categoriesList.includes(exp.category)) {
      setCategory(exp.category);
      setCustomCategory('');
    } else {
      setCategory('Other');
      setCustomCategory(exp.category);
    }
    setDate(exp.date);
    setAmount(exp.amount.toString());
    setPaymentMethod(exp.paymentMethod);
    setReferenceNumber(exp.referenceNumber || '');
    setNotes(exp.notes || '');
    setIsFormOpen(true);
  };

  const handleDeleteExpense = (id: string, cat: string, amt: number) => {
    if (confirm(`Are you sure you want to delete the expense of ${formatINR(amt)} for ${cat}?`)) {
      deleteExpense(id);
      showToast('Expense record deleted successfully.', 'info');
    }
  };

  // CSV Exporter
  const handleExportCSV = () => {
    const csvRows: string[] = [];
    csvRows.push('EXPENSES TRANSACTION RECORD');
    csvRows.push(`Exported Date: ${new Date().toLocaleDateString('en-IN')}`);
    csvRows.push(`Filters: Category: ${categoryFilter}, Method: ${methodFilter}, Date Range: ${startDate || 'Start'} to ${endDate || 'End'}`);
    csvRows.push('');
    csvRows.push(['Expense ID', 'Date', 'Category', 'Amount (INR)', 'Payment Method', 'Ref No.', 'Notes'].join(','));

    filteredExpenses.forEach((exp) => {
      csvRows.push([
        `"${exp.id}"`,
        `"${exp.date}"`,
        `"${exp.category.replace(/"/g, '""')}"`,
        exp.amount.toFixed(2),
        `"${exp.paymentMethod}"`,
        `"${exp.referenceNumber || ''}"`,
        `"${(exp.notes || '').replace(/"/g, '""')}"`
      ].join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Expenses CSV exported successfully!');
  };

  // PDF Exporter
  const handleDownloadPDF = async () => {
    const wrapper = document.getElementById('expenses-print-area');
    if (!wrapper) {
      showToast('Could not locate printable layout.', 'error');
      return;
    }

    showToast('Generating expenses PDF...', 'info');

    // Reveal wrapper
    wrapper.style.display = 'block';

    try {
      const canvas = await html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Hide wrapper again
      wrapper.style.display = 'none';

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      const imgW = 210; // A4 portrait width
      const imgH = (canvas.height * imgW) / canvas.width;
      let heightLeft = imgH;
      let posY = 0;

      pdf.addImage(imgData, 'JPEG', 0, posY, imgW, imgH);
      heightLeft -= 297;

      while (heightLeft > 0) {
        posY -= 297;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, posY, imgW, imgH);
        heightLeft -= 297;
      }

      pdf.save(`expenses_report_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('PDF statement downloaded successfully!');
    } catch (err) {
      wrapper.style.display = 'none';
      console.error(err);
      showToast('Error exporting PDF statement.', 'error');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* KPI Stats Widgets Row */}
      <div className="grid-cols-3" style={{ marginBottom: '24px' }}>
        <div className="kpi-card" style={{ cursor: 'default' }}>
          <div className="kpi-info">
            <span className="kpi-label">Total Historical Expenses</span>
            <span className="kpi-value" style={{ color: 'var(--color-danger)' }}>
              {formatINR(totalExpenseAmt)}
            </span>
            <span className="kpi-subtext">Cumulative operational spends</span>
          </div>
          <div className="kpi-icon-container rose">
            <TrendingDown size={22} />
          </div>
        </div>

        <div className="kpi-card" style={{ cursor: 'default' }}>
          <div className="kpi-info">
            <span className="kpi-label">Expenses (Current Month)</span>
            <span className="kpi-value" style={{ color: '#E53E3E' }}>
              {formatINR(thisMonthExpenseAmt)}
            </span>
            <span className="kpi-subtext">Active calendar month spending</span>
          </div>
          <div className="kpi-icon-container rose">
            <Calendar size={22} />
          </div>
        </div>

        <div className="kpi-card" style={{ cursor: 'default' }}>
          <div className="kpi-info">
            <span className="kpi-label">Top Expense Category</span>
            <span className="kpi-value" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>
              {topCategory.name}
            </span>
            <span className="kpi-subtext">Total: {formatINR(topCategory.amount)}</span>
          </div>
          <div className="kpi-icon-container amber">
            <Tag size={22} />
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Group 1: Filter inputs */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            flex: '1 1 500px',
            minWidth: 0
          }}>
            {/* Search */}
            <div className="search-input-wrapper" style={{ flex: '1 1 200px', minWidth: '150px' }}>
              <Search size={16} className="search-input-icon" />
              <input
                type="text"
                placeholder="Search notes, reference, ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ width: '100%' }}
              />
            </div>

            {/* Category Dropdown */}
            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{ minWidth: '150px', flex: '1 1 120px' }}
            >
              <option value="All">All Categories</option>
              {categoriesList.filter(c => c !== 'Other').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="Other">Other Custom</option>
            </select>

            {/* Payment Method Dropdown */}
            <select
              className="filter-select"
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{ minWidth: '130px', flex: '1 1 100px' }}
            >
              <option value="All">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>

            {/* Date Selector */}
            <select
              className="filter-select"
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value as any);
                setCurrentPage(1);
              }}
              style={{ minWidth: '130px', flex: '1 1 100px' }}
            >
              <option value="All">All Historical</option>
              <option value="Custom">Custom Dates</option>
            </select>
          </div>

          {/* Group 2: Actions */}
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            flex: '0 1 auto'
          }}>
            <button className="btn btn-secondary" onClick={handleExportCSV} title="Export current sheet as CSV">
              <Download size={16} /> Export CSV
            </button>
            <button className="btn btn-secondary" onClick={handleDownloadPDF} title="Download current report as PDF">
              <FileText size={16} /> Save PDF
            </button>
            <button className="btn btn-primary" onClick={() => setIsFormOpen(true)}>
              <Plus size={16} /> Log Expense
            </button>
          </div>
        </div>

        {/* Conditional Custom Dates Row (Vertical expansion, preserves horizontal layout positions) */}
        {dateRange === 'Custom' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px dashed var(--border-color)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Date Range:</span>
            <input
              type="date"
              className="filter-select"
              style={{ padding: '6px 8px', fontSize: '13px', width: '140px' }}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
            <input
              type="date"
              className="filter-select"
              style={{ padding: '6px 8px', fontSize: '13px', width: '140px' }}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
            />
            {(startDate || endDate) && (
              <button
                type="button"
                className="table-link-btn"
                style={{ fontSize: '12px', marginLeft: '8px', color: 'var(--color-danger)' }}
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setCurrentPage(1);
                }}
              >
                Clear Dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Expenses List Container */}
      <div className="card">
        {filteredExpenses.length === 0 ? (
          <div className="empty-state">
            <TrendingDown size={48} className="empty-state-icon" style={{ color: 'var(--text-muted)' }} />
            <h4 className="empty-state-title">No Expenses Logged</h4>
            <p className="empty-state-desc">
              No matching expense receipts or transaction records were found for the selected filter configuration.
            </p>
            <button className="btn btn-primary" onClick={() => setIsFormOpen(true)}>
              Record First Expense
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="desktop-only-table">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="text-nowrap">Expense Date</th>
                      <th className="text-nowrap">Voucher ID</th>
                      <th>Category</th>
                      <th className="text-nowrap" style={{ textAlign: 'right' }}>Amount Paid (₹)</th>
                      <th className="text-nowrap">Payment Method</th>
                      <th className="text-nowrap">Reference Number</th>
                      <th>Notes / Remarks</th>
                      <th className="text-nowrap" style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedExpenses.map((exp) => (
                      <tr key={exp.id}>
                        <td className="text-nowrap">{formatDate(exp.date)}</td>
                        <td className="text-nowrap" style={{ fontWeight: 600, fontFamily: 'monospace' }}>{exp.id}</td>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-danger)' }}></span>
                            {exp.category}
                          </span>
                        </td>
                        <td className="text-nowrap" style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-danger-dark)' }}>
                          {formatINR(exp.amount)}
                        </td>
                        <td className="text-nowrap">
                          <span className="badge badge-info">{exp.paymentMethod}</span>
                        </td>
                        <td className="text-nowrap" style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                          {exp.referenceNumber || '—'}
                        </td>
                        <td style={{ fontStyle: 'italic', fontSize: '13px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {exp.notes || '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '6px' }}
                              onClick={() => handleEditClick(exp)}
                              title="Edit record details"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm danger"
                              style={{ padding: '6px' }}
                              onClick={() => handleDeleteExpense(exp.id, exp.category, exp.amount)}
                              title="Delete record"
                            >
                              <Trash size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards List View */}
            <div className="mobile-card-list">
              {paginatedExpenses.map((exp) => (
                <div key={exp.id} className="mobile-list-card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
                  <div className="mobile-list-card-header">
                    <div>
                      <h4 className="mobile-list-card-title">{exp.category}</h4>
                      <span className="mobile-list-card-subtitle">{formatDate(exp.date)} • <span className="badge badge-info">{exp.paymentMethod}</span></span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => handleEditClick(exp)}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm danger"
                        style={{ padding: '6px', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => handleDeleteExpense(exp.id, exp.category, exp.amount)}
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Voucher ID</span>
                    <span className="mobile-list-card-val" style={{ fontFamily: 'monospace' }}>{exp.id}</span>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Ref Number</span>
                    <span className="mobile-list-card-val" style={{ fontFamily: 'monospace' }}>{exp.referenceNumber || '—'}</span>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Amount Paid</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 800, color: 'var(--color-danger-dark)' }}>
                      {formatINR(exp.amount)}
                    </span>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Remarks</span>
                    <span className="mobile-list-card-val" style={{ fontStyle: 'italic', fontSize: '12px' }}>{exp.notes || '—'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-row">
                <span>
                  Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                  <strong>{Math.min(currentPage * itemsPerPage, filteredExpenses.length)}</strong> of{' '}
                  <strong>{filteredExpenses.length}</strong> records
                </span>
                <div className="pagination-btn-group">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Expense Modal Form */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingExpenseId(null);
        }}
        title={editingExpenseId ? "Edit Expense Entry" : "Record New Expense Entry"}
      >
        <form onSubmit={handleSaveExpense}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Expense Category *</label>
            <select
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {category === 'Other' && (
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Specify Custom Category *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter custom category name (e.g. Staff Salary)"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                required
              />
            </div>
          )}

          <div className="grid-cols-2" style={{ gap: '16px', marginBottom: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Expense Date *</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Amount Paid (₹) *</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                placeholder="e.g. 1500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid-cols-2" style={{ gap: '16px', marginBottom: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Payment Method *</label>
              <select
                className="form-control"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                required
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer / NetBanking</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Reference Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="Transaction/UPI ID (optional)"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Notes / Remarks</label>
            <textarea
              className="form-control"
              placeholder="Provide context or explanation for this expense..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsFormOpen(false);
                setEditingExpenseId(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingExpenseId ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Hidden Print Layout Wrapper (Temporarily displayed for PDF capture) */}
      <div id="expenses-print-area" style={{
        display: 'none',
        position: 'fixed',
        left: '-9999px',
        top: 0,
        width: '794px', // A4 Portrait width
        backgroundColor: '#ffffff',
        fontFamily: 'sans-serif',
        color: '#000000',
        padding: '20mm',
        boxSizing: 'border-box',
        zIndex: -1
      }}>
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #2F3E33', paddingBottom: '12px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#2F3E33' }}>AgriBiz Seed & Implements Store</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#555555' }}>Krishi Mandi Complex, Pipariya, Madhya Pradesh - 461775</p>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#555555', fontWeight: 600 }}>GSTIN: 23AAACA9876C1Z9</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#555555', textTransform: 'uppercase' }}>
              Expenses Transaction Audit Statement
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#555555' }}>
              Date Range: {startDate || 'Historical'} to {endDate || 'Present'}
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#555555' }}>
              Generated On: {new Date().toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        {/* Quick summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', padding: '12px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '20px', backgroundColor: '#F9FAF9', fontSize: '12px' }}>
          <div><strong>Total Spends:</strong> {formatINR(filteredExpenses.reduce((sum, e) => sum + e.amount, 0))}</div>
          <div><strong>Total Records count:</strong> {filteredExpenses.length} entries</div>
          <div><strong>Active Category Filter:</strong> {categoryFilter}</div>
        </div>

        {/* Audit Data Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
              <th style={{ padding: '6px 8px', border: '1px solid #2F3E33', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '6px 8px', border: '1px solid #2F3E33', textAlign: 'left' }}>Voucher ID</th>
              <th style={{ padding: '6px 8px', border: '1px solid #2F3E33', textAlign: 'left' }}>Category</th>
              <th style={{ padding: '6px 8px', border: '1px solid #2F3E33', textAlign: 'right' }}>Amount Paid (₹)</th>
              <th style={{ padding: '6px 8px', border: '1px solid #2F3E33', textAlign: 'left' }}>Method</th>
              <th style={{ padding: '6px 8px', border: '1px solid #2F3E33', textAlign: 'left' }}>Reference ID</th>
              <th style={{ padding: '6px 8px', border: '1px solid #2F3E33', textAlign: 'left' }}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((exp, idx) => (
              <tr key={exp.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F9FAF9' }}>
                <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{formatDate(exp.date)}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{exp.id}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontWeight: 'bold' }}>{exp.category}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold' }}>{formatINR(exp.amount).replace('₹', '')}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{exp.paymentMethod}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{exp.referenceNumber || '—'}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontStyle: 'italic' }}>{exp.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', fontSize: '11px', color: '#555555' }}>
          <div>Prepared By: ___________________________</div>
          <div>Verified By: ___________________________</div>
        </div>
      </div>
    </div>
  );
};
