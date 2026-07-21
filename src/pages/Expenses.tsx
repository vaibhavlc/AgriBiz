import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR, formatDate, getFullAddress } from '../utils/dummyData';
import { Modal } from '../components/Modal';
import { KpiCard } from '../components/KpiCard';
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
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Receipt,
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
    settings,
  } = useApp();

  // Search/Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState<'All' | 'Custom'>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activeMenuExpId, setActiveMenuExpId] = useState<string | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [category, setCategory] = useState('Shop Rent');
  const [customCategory, setCustomCategory] = useState('');
  const [payee, setPayee] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque'>('UPI');
  const [status, setStatus] = useState<'Paid' | 'Due'>('Paid');
  const [dueDate, setDueDate] = useState('');
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

  const totalDueAmt = useMemo(() => {
    return expenses.filter((e) => e.status === 'Due').reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const totalDueCount = useMemo(() => {
    return expenses.filter((e) => e.status === 'Due').length;
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

      // Status Filter
      const matchesStatus = statusFilter === 'All' || e.status === statusFilter;

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
        (e.payee && e.payee.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.referenceNumber && e.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        e.id.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesMethod && matchesStatus && matchesDate && matchesSearch;
    });
  }, [expenses, categoryFilter, methodFilter, statusFilter, dateRange, startDate, endDate, searchQuery]);

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
        payee: payee.trim() || 'General',
        amount: finalAmount,
        paymentMethod,
        status,
        dueDate: status === 'Due' ? dueDate : undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      showToast('Expense record updated successfully!');
    } else {
      addExpense({
        date,
        category: finalCategory,
        payee: payee.trim() || 'General',
        amount: finalAmount,
        paymentMethod,
        status,
        dueDate: status === 'Due' ? dueDate : undefined,
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
    setPayee('');
    setDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setPaymentMethod('UPI');
    setStatus('Paid');
    setDueDate('');
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
    setPayee(exp.payee || '');
    setStatus(exp.status || 'Paid');
    setDueDate(exp.dueDate || '');
    setIsFormOpen(true);
  };

  const handleMarkAsPaid = (exp: Expense) => {
    editExpense({
      ...exp,
      status: 'Paid',
    });
    showToast(`Expense for ${exp.category} marked as Paid!`);
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
    csvRows.push(`Filters: Category: ${categoryFilter}, Method: ${methodFilter}, Status: ${statusFilter}, Date Range: ${startDate || 'Start'} to ${endDate || 'End'}`);
    csvRows.push('');
    csvRows.push(['Expense ID', 'Date', 'Category', 'Payee / Paid To', 'Amount (INR)', 'Payment Method', 'Status', 'Due Date', 'Ref No.', 'Notes'].join(','));

    filteredExpenses.forEach((exp) => {
      csvRows.push([
        `"${exp.id}"`,
        `"${exp.date}"`,
        `"${exp.category.replace(/"/g, '""')}"`,
        `"${(exp.payee || '').replace(/"/g, '""')}"`,
        exp.amount.toFixed(2),
        `"${exp.paymentMethod}"`,
        `"${exp.status || 'Paid'}"`,
        `"${exp.dueDate || ''}"`,
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
      <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
        <KpiCard
          label="Total Historical Expenses"
          value={formatINR(totalExpenseAmt)}
          subtext="Cumulative operational spends"
          icon={<TrendingDown size={22} />}
          variant="danger"
        />

        <KpiCard
          label="Expenses (Current Month)"
          value={formatINR(thisMonthExpenseAmt)}
          subtext="Active calendar month spending"
          icon={<Calendar size={22} />}
          variant="danger"
        />

        <KpiCard
          label="Top Expense Category"
          value={topCategory.name}
          subtext={`Total: ${formatINR(topCategory.amount)}`}
          icon={<Tag size={22} />}
          variant="warning"
        />

        <KpiCard
          label="Pending / Due Amount"
          value={formatINR(totalDueAmt)}
          subtext={`${totalDueCount} due ${totalDueCount === 1 ? 'entry' : 'entries'} pending`}
          icon={<AlertCircle size={22} />}
          variant="warning"
        />
      </div>

      <style>{`
        .expense-filter-card {
          padding: 16px 20px;
          margin-bottom: 20px;
        }
        .expense-filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
        }
        .expense-filter-inputs {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          flex: 1 1 500px;
          min-width: 0;
        }
        .expense-filter-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
          flex: 0 1 auto;
        }
        .expense-custom-dates-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed var(--border-color);
          animation: fadeIn 0.2s ease-out;
        }
        .expense-custom-dates-label {
          font-size: 13px;
          color: var(--text-secondary);
          font-weight: 600;
        }
        .expense-custom-dates-inputs {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .expense-custom-dates-inputs input {
          padding: 6px 8px;
          font-size: 13px;
          width: 140px;
        }
        .expense-custom-dates-separator {
          font-size: 12px;
          color: var(--text-muted);
        }
        .expense-custom-dates-clear {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.15);
          color: var(--color-danger);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          padding: 5px 14px;
          border-radius: 999px;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: 8px;
          text-decoration: none;
        }
        .expense-custom-dates-clear:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
          text-decoration: none;
        }
        @media (max-width: 768px) {
          .expense-filter-card {
            padding: 12px 14px;
          }
          .expense-filter-row {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .expense-filter-inputs {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            width: 100%;
            flex: none;
          }
          .expense-filter-inputs .search-input-wrapper {
            grid-column: span 2;
            width: 100%;
          }
          .expense-filter-inputs select {
            width: 100% !important;
            min-width: 0 !important;
            height: 38px;
          }
          .expense-filter-inputs select.category-select {
            grid-column: span 1;
          }
          .expense-filter-inputs select.method-select {
            grid-column: span 1;
          }
          .expense-filter-inputs select.status-select {
            grid-column: span 1;
          }
          .expense-filter-inputs select.date-range-select {
            grid-column: span 1;
          }
          .expense-filter-actions {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            width: 100%;
            flex: none;
          }
          .expense-filter-actions button,
          .expense-filter-actions .btn {
            width: 100% !important;
            margin: 0 !important;
            justify-content: center;
            height: 40px;
            font-size: 13px;
            font-weight: 600;
          }
          .expense-filter-actions .btn-log-expense {
            grid-column: span 2;
            order: -1;
            height: 44px;
            font-size: 14px;
            font-weight: 700;
            border-radius: 10px;
          }
          .expense-filter-actions .btn-export {
            grid-column: span 1;
          }
          .expense-filter-actions .btn-pdf {
            grid-column: span 1;
          }
          .expense-custom-dates-row {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            width: 100%;
          }
          .expense-custom-dates-label {
            font-size: 12px;
            margin-bottom: 2px;
            text-align: center;
          }
          .expense-custom-dates-inputs {
            display: flex;
            width: 100%;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
          }
          .expense-custom-dates-inputs input {
            flex: 1;
            width: 100% !important;
            height: 38px;
          }
          .expense-custom-dates-clear {
            display: inline-flex;
            text-align: center;
            font-size: 11px;
            font-weight: 600;
            margin: 6px auto 0 auto;
            width: fit-content;
            padding: 5px 14px;
            background: rgba(239, 68, 68, 0.08);
            border: 1px solid rgba(239, 68, 68, 0.15);
            border-radius: 999px;
            color: var(--color-danger);
            justify-content: center;
            align-items: center;
            transition: all 0.2s ease;
          }
          .expense-custom-dates-clear:hover {
            background: rgba(239, 68, 68, 0.15);
            border-color: rgba(239, 68, 68, 0.3);
            text-decoration: none;
          }
        }
      `}</style>

      {/* Filters Card */}
      <div className="card expense-filter-card">
        <div className="expense-filter-row">
          {/* Group 1: Filter inputs */}
          <div className="expense-filter-inputs">
            {/* Search */}
            <div className="search-input-wrapper">
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
              className="filter-select category-select"
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

            <select
              style={{ minWidth: '130px', flex: '1 1 100px' }}
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select method-select"
            >
              <option value="All">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>

            {/* Status Dropdown */}
            <select
              style={{ minWidth: '130px', flex: '1 1 100px' }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select status-select"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Due">Due</option>
            </select>

            {/* Date Selector */}
            <select
              className="filter-select date-range-select"
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
          <div className="expense-filter-actions">
            <button className="btn btn-secondary btn-export" onClick={handleExportCSV} title="Export current sheet as CSV">
              <Download size={16} /> Export CSV
            </button>
            <button className="btn btn-secondary btn-pdf" onClick={handleDownloadPDF} title="Download current report as PDF">
              <FileText size={16} /> Save PDF
            </button>
            <button className="btn btn-primary btn-log-expense" onClick={() => setIsFormOpen(true)}>
              <Plus size={16} /> Log Expense
            </button>
          </div>
        </div>

        {/* Conditional Custom Dates Row (Vertical expansion, preserves horizontal layout positions) */}
        {dateRange === 'Custom' && (
          <div className="expense-custom-dates-row">
            <span className="expense-custom-dates-label">Date Range:</span>
            <div className="expense-custom-dates-inputs">
              <input
                type="date"
                className="filter-select"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <span className="expense-custom-dates-separator">to</span>
              <input
                type="date"
                className="filter-select"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                className="expense-custom-dates-clear"
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
                <table className="data-table expense-table-fit">
                  <thead>
                    <tr>
                      <th style={{ width: '10%' }}>Expense Date</th>
                      <th style={{ width: '9%' }}>Voucher ID</th>
                      <th style={{ width: '12%' }}>Category</th>
                      <th style={{ width: '13%' }}>Payee (Paid To)</th>
                      <th style={{ width: '11%', textAlign: 'right' }}>Amount (₹)</th>
                      <th style={{ width: '8%' }}>Status</th>
                      <th style={{ width: '9%' }}>Payment Method</th>
                      <th style={{ width: '11%' }}>Reference Number</th>
                      <th style={{ width: '12%' }}>Notes / Remarks</th>
                      <th style={{ width: '5%', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedExpenses.map((exp) => (
                      <tr key={exp.id}>
                        <td className="text-nowrap">{formatDate(exp.date)}</td>
                        <td className="text-nowrap" style={{ fontWeight: 600, fontFamily: 'monospace' }}>{exp.id}</td>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: exp.status === 'Due' ? '#D97706' : 'var(--color-danger)' }}></span>
                            {exp.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{exp.payee || 'General'}</td>
                        <td className="text-nowrap" style={{ textAlign: 'right', fontWeight: 800, color: exp.status === 'Due' ? '#D97706' : 'var(--color-danger-dark)' }}>
                          {formatINR(exp.amount)}
                        </td>
                        <td className="text-nowrap">
                          {exp.status === 'Due' ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span className="badge" style={{ display: 'inline-block', width: 'fit-content', padding: '2px 6px', fontSize: '11px', borderRadius: '4px', fontWeight: 700, backgroundColor: 'rgba(217, 119, 6, 0.1)', color: '#D97706', border: '1px solid rgba(217, 119, 6, 0.2)' }}>Due</span>
                              {exp.dueDate && (
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  By: {formatDate(exp.dueDate)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="badge" style={{ display: 'inline-block', width: 'fit-content', padding: '2px 6px', fontSize: '11px', borderRadius: '4px', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>Paid</span>
                          )}
                        </td>
                        <td className="text-nowrap">
                          {exp.status === 'Due' ? '—' : <span className="badge badge-info">{exp.paymentMethod}</span>}
                        </td>
                        <td className="text-nowrap" style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                          {exp.status === 'Due' ? '—' : (exp.referenceNumber || '—')}
                        </td>
                        <td style={{ fontStyle: 'italic', fontSize: '13px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {exp.notes || '—'}
                        </td>
                        <td className="no-print" style={{ position: 'relative', textAlign: 'center', overflow: 'visible' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuExpId(activeMenuExpId === exp.id ? null : exp.id);
                            }}
                            title="Actions"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {activeMenuExpId === exp.id && (
                            <>
                              {/* Overlay to close the menu on clicking outside */}
                              <div 
                                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
                                onClick={() => setActiveMenuExpId(null)}
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
                                {exp.status === 'Due' && (
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
                                      color: 'var(--primary)',
                                      fontWeight: 600,
                                    }}
                                    onClick={() => {
                                      setActiveMenuExpId(null);
                                      handleMarkAsPaid(exp);
                                    }}
                                  >
                                    <CheckCircle2 size={14} /> Mark as Paid
                                  </button>
                                )}
                                
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
                                    setActiveMenuExpId(null);
                                    handleEditClick(exp);
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
                                    setActiveMenuExpId(null);
                                    handleDeleteExpense(exp.id, exp.category, exp.amount);
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

            {/* Mobile Cards List View */}
            <div className="mobile-card-list">
              {paginatedExpenses.map((exp) => (
                <div key={exp.id} className="mobile-list-card" style={{
                  borderLeft: 'none',
                  padding: 0,
                  overflow: 'hidden',
                  borderRadius: '14px',
                  border: '1px solid var(--border-color)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>

                  {/* Card Header — neutral with colored border */}
                  <div style={{
                    background: 'var(--card-bg, #ffffff)',
                    borderBottom: `2px solid ${exp.status === 'Due' ? '#F59E0B' : 'var(--color-danger)'}`,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Category chip */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '8px',
                          background: exp.status === 'Due' ? 'rgba(217,119,6,0.15)' : 'rgba(239,68,68,0.12)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <Receipt size={14} style={{ color: exp.status === 'Due' ? '#D97706' : 'var(--color-danger)' }} />
                        </div>
                        <span style={{
                          fontSize: '15px', fontWeight: 700,
                          color: 'var(--text-primary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>{exp.category}</span>
                      </div>
                      {/* Payee + date subtitle */}
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>
                        {exp.payee && <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{exp.payee}</strong>}
                        {exp.payee && ' · '}{formatDate(exp.date)}
                      </span>
                    </div>

                    {/* Right: amount + ⋮ menu */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '20px', fontWeight: 800, lineHeight: 1.1,
                          color: exp.status === 'Due' ? '#B45309' : 'var(--color-danger-dark)'
                        }}>{formatINR(exp.amount)}</div>
                        {exp.status === 'Due' ? (
                          <span style={{
                            display: 'inline-block', marginTop: '3px',
                            fontSize: '10px', fontWeight: 700, padding: '2px 7px',
                            borderRadius: '20px', letterSpacing: '0.04em',
                            background: 'rgba(217,119,6,0.15)', color: '#B45309',
                            border: '1px solid rgba(217,119,6,0.3)'
                          }}>DUE</span>
                        ) : (
                          <span style={{
                            display: 'inline-block', marginTop: '3px',
                            fontSize: '10px', fontWeight: 700, padding: '2px 7px',
                            borderRadius: '20px', letterSpacing: '0.04em',
                            background: 'rgba(16,185,129,0.12)', color: 'var(--primary)',
                            border: '1px solid rgba(16,185,129,0.25)'
                          }}>PAID</span>
                        )}
                      </div>
                      {/* ⋮ Dropdown */}
                      <div style={{ position: 'relative' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={(e) => { e.stopPropagation(); setActiveMenuExpId(activeMenuExpId === exp.id ? null : exp.id); }}
                        >
                          <MoreVertical size={15} />
                        </button>
                        {activeMenuExpId === exp.id && (
                          <>
                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} onClick={() => setActiveMenuExpId(null)} />
                            <div className="card" style={{
                              position: 'absolute', right: 0, top: '100%', marginTop: '4px', zIndex: 999,
                              minWidth: '150px', padding: '6px 0', display: 'flex', flexDirection: 'column', gap: '2px',
                              backgroundColor: 'var(--card-bg, #fff)', border: '1px solid var(--border-color)',
                              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)'
                            }}>
                              <button className="dropdown-item"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 14px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}
                                onClick={() => { handleEditClick(exp); setActiveMenuExpId(null); }}>
                                <Edit2 size={14} /> Edit
                              </button>
                              {exp.status === 'Due' && (
                                <button className="dropdown-item"
                                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 14px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--color-success-dark)' }}
                                  onClick={() => { handleMarkAsPaid(exp); setActiveMenuExpId(null); }}>
                                  <CheckCircle2 size={14} /> Mark Paid
                                </button>
                              )}
                              <button className="dropdown-item danger"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 14px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                                onClick={() => { handleDeleteExpense(exp.id, exp.category, exp.amount); setActiveMenuExpId(null); }}>
                                <Trash size={14} /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Body — detail rows */}
                  <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>

                    {/* 2-column detail grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div style={{ background: 'var(--bg-app)', borderRadius: '8px', padding: '7px 10px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Voucher ID</div>
                        <div style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>{exp.id}</div>
                      </div>
                      <div style={{ background: 'var(--bg-app)', borderRadius: '8px', padding: '7px 10px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Payment</div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: exp.status === 'Due' ? '#D97706' : 'var(--text-primary)' }}>
                          {exp.status === 'Due' ? `Due ${exp.dueDate ? formatDate(exp.dueDate) : ''}` : exp.paymentMethod}
                        </div>
                      </div>
                    </div>

                    {/* Reference number if exists */}
                    {exp.status !== 'Due' && exp.referenceNumber && (
                      <div style={{ background: 'var(--bg-app)', borderRadius: '8px', padding: '7px 10px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Ref Number</div>
                        <div style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>{exp.referenceNumber}</div>
                      </div>
                    )}

                    {/* Notes if exists */}
                    {exp.notes && (
                      <div style={{ background: 'var(--bg-app)', borderRadius: '8px', padding: '7px 10px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>Remarks</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{exp.notes}</div>
                      </div>
                    )}

                    {/* Mark as paid CTA */}
                    {exp.status === 'Due' && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ width: '100%', height: '40px', justifyContent: 'center', fontWeight: 700, borderRadius: '10px', gap: '6px', marginTop: '2px',
                          background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', fontSize: '13px' }}
                        onClick={() => handleMarkAsPaid(exp)}
                      >
                        <CheckCircle2 size={15} /> Mark as Paid
                      </button>
                    )}
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
                placeholder="Enter custom category name"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Paid To / Payee Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Mandi Board Complex, Madan Tea Stall, Staff Name"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              required
            />
          </div>

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
              <label className="form-label">Amount (₹) *</label>
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
              <label className="form-label">Payment Status *</label>
              <select
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Paid' | 'Due')}
                required
              >
                <option value="Paid">Paid (Expense Settled)</option>
                <option value="Due">Due (Pay Later / Dues)</option>
              </select>
            </div>

            {status === 'Due' ? (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Payment Due Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            ) : (
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
            )}
          </div>

          {status === 'Paid' && (
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Reference Number (optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Transaction ID, UPI reference, Cheque number"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
          )}

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {settings.showLogo && settings.logo && (
              <img src={settings.logo} alt="Logo" style={{ maxHeight: '90px', objectFit: 'contain', borderRadius: '4px', margin: 0, padding: 0 }} />
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#2F3E33' }}>{settings.businessName}</h1>
              {settings.showAddress && <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#555555' }}>{getFullAddress(settings)}</p>}
              {settings.showGstin && settings.gstin && <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#555555', fontWeight: 600 }}>GSTIN: {settings.gstin}</p>}
            </div>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', padding: '12px', border: '1px solid #C8D3C5', borderRadius: '4px', marginBottom: '20px', backgroundColor: '#F9FAF9', fontSize: '11px' }}>
          <div><strong>Total Spends:</strong> {formatINR(filteredExpenses.reduce((sum, e) => sum + e.amount, 0))}</div>
          <div><strong>Paid Spends:</strong> {formatINR(filteredExpenses.filter(e => e.status !== 'Due').reduce((sum, e) => sum + e.amount, 0))}</div>
          <div><strong>Due Dues:</strong> {formatINR(filteredExpenses.filter(e => e.status === 'Due').reduce((sum, e) => sum + e.amount, 0))}</div>
          <div><strong>Entries Count:</strong> {filteredExpenses.length}</div>
          <div><strong>Category Filter:</strong> {categoryFilter}</div>
        </div>

        {/* Audit Data Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#2F3E33', color: '#ffffff' }}>
              <th style={{ padding: '6px 8px', border: '1px solid #2F3E33', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '6px 8px', border: '1px solid #2F3E33', textAlign: 'left' }}>Voucher ID</th>
              <th style={{ padding: '6px 8px', border: '1px solid #2F3E33', textAlign: 'left' }}>Category</th>
              <th style={{ padding: '6px 8px', border: '1px solid #2F3E33', textAlign: 'left' }}>Payee (Paid To)</th>
              <th style={{ padding: '6px 8px', border: '1px solid #2F3E33', textAlign: 'right' }}>Amount (₹)</th>
              <th style={{ padding: '6px 8px', border: '1px solid #2F3E33', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '6px 8px', border: '1px solid #2F3E33', textAlign: 'left' }}>Method</th>
              <th style={{ padding: '6px 8px', border: '1px solid #2F3E33', textAlign: 'left' }}>Reference ID</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((exp, idx) => (
              <tr key={exp.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#F9FAF9' }}>
                <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{formatDate(exp.date)}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{exp.id}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontWeight: 'bold' }}>{exp.category}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{exp.payee || 'General'}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'right', fontWeight: 'bold' }}>{formatINR(exp.amount).replace('₹', '')}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', textAlign: 'center', fontWeight: 'bold', color: exp.status === 'Due' ? '#D97706' : 'var(--primary)' }}>{exp.status || 'Paid'}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0' }}>{exp.status === 'Due' ? '—' : exp.paymentMethod}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #E2E9E0', fontFamily: 'monospace' }}>{exp.status === 'Due' ? '—' : (exp.referenceNumber || '—')}</td>
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
