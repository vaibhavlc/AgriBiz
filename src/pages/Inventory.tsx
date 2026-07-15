import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatINR } from '../utils/dummyData';
import { ProductModal } from '../components/ProductModal';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  Tag,
  ArrowLeft,
  Eye,
  MoreVertical,
  TrendingUp,
  FileText,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import type { Product } from '../types';

export const Inventory: React.FC = () => {
  const {
    products,
    deleteProduct,
    searchQuery,
    setSearchQuery,
    isEditingProduct,
    setIsEditingProduct,
    invoices,
    purchases,
    showToast,
    setCurrentTab,
    setViewInvoice,
    setViewPurchase,
  } = useApp();

  const totalProducts = products.length;
  const totalStockValue = products.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0);
  const lowStockAlerts = products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState('All');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [viewProductId, setViewProductId] = useState<string | null>(null);
  const [activeMenuProductId, setActiveMenuProductId] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Date filters for Product Ledger Activity
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<'All' | 'Sales' | 'Purchase'>('All');

  // Clear date & type filters when navigating away or switching items
  React.useEffect(() => {
    setLedgerStartDate('');
    setLedgerEndDate('');
    setLedgerTypeFilter('All');
  }, [viewProductId]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleEditClick = (p: Product) => {
    setIsEditingProduct(p);
    setIsProductModalOpen(true);
  };

  const handleAddNewClick = () => {
    setIsEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = (id: string, _name: string) => {
    const productObj = products.find((p) => p.id === id);
    if (productObj) {
      setDeletingProduct(productObj);
    }
  };

  // --- Filtering & Sorting ---
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;

    let matchesStock = true;
    if (stockStatusFilter === 'Low Stock') {
      matchesStock = p.stock <= p.minStock && p.stock > 0;
    } else if (stockStatusFilter === 'Out of Stock') {
      matchesStock = p.stock === 0;
    } else if (stockStatusFilter === 'In Stock') {
      matchesStock = p.stock > p.minStock;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Categories list
  const categories = ['Machinery', 'Irrigation', 'Implements', 'Equipment', 'Spares'];

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStockStatusBadge = (p: Product) => {
    if (p.stock === 0) {
      return (
        <span className="badge badge-danger" style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
          <XCircle size={12} /> Out of Stock
        </span>
      );
    }
    if (p.stock <= p.minStock) {
      return (
        <span className="badge badge-warning" style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
          <AlertTriangle size={12} /> Low Stock
        </span>
      );
    }
    return (
      <span className="badge badge-success" style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
        <CheckCircle2 size={12} /> In Stock
      </span>
    );
  };

  const selectedProduct = products.find((p) => p.id === viewProductId);

  if (selectedProduct) {
    // 1. Gather all sales & purchases containing this product
    const productSales = invoices.filter(inv => 
      inv.items.some(item => item.productId === selectedProduct.id)
    ).map(inv => {
      const item = inv.items.find(item => item.productId === selectedProduct.id)!;
      return {
        id: inv.id,
        date: inv.date,
        type: 'Sales',
        number: inv.invoiceNumber,
        contactName: inv.customerName,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      };
    });

    const productPurchases = purchases.filter(pur => 
      pur.items.some(item => item.productId === selectedProduct.id)
    ).map(pur => {
      const item = pur.items.find(item => item.productId === selectedProduct.id)!;
      return {
        id: pur.id,
        date: pur.date,
        type: 'Purchase',
        number: pur.purchaseNumber,
        contactName: pur.supplierName,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      };
    });

    const allTransactions = [...productSales, ...productPurchases].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const transactions = allTransactions.filter(tx => {
      if (ledgerStartDate && tx.date < ledgerStartDate) return false;
      if (ledgerEndDate && tx.date > ledgerEndDate) return false;
      if (ledgerTypeFilter !== 'All') {
        if (ledgerTypeFilter === 'Sales' && tx.type !== 'Sales') return false;
        if (ledgerTypeFilter === 'Purchase' && tx.type !== 'Purchase') return false;
      }
      return true;
    });

    // Compute lifetime statistics
    const totalSalesValue = productSales.reduce((sum, s) => sum + s.total, 0);
    const totalSalesQty = productSales.reduce((sum, s) => sum + s.quantity, 0);
    const totalPurchasesValue = productPurchases.reduce((sum, p) => sum + p.total, 0);
    const totalPurchasesQty = productPurchases.reduce((sum, p) => sum + p.quantity, 0);

    // Calculate margins
    const profitMargin = selectedProduct.sellingPrice - selectedProduct.purchasePrice;
    const marginPercent = selectedProduct.sellingPrice > 0 
      ? ((profitMargin / selectedProduct.sellingPrice) * 100).toFixed(1) 
      : '0.0';

    const handleTransactionClick = (tx: { type: string; id: string }) => {
      if (tx.type === 'Sales') {
        setCurrentTab('sales');
        setViewInvoice(tx.id);
      } else {
        setCurrentTab('purchases');
        setViewPurchase(tx.id);
      }
    };

    // Stock health percentage for progress bar
    const stockHealthPct = selectedProduct.minStock > 0
      ? Math.min(100, Math.round((selectedProduct.stock / (selectedProduct.minStock * 3)) * 100))
      : selectedProduct.stock > 0 ? 100 : 0;
    const stockBarColor = selectedProduct.stock === 0
      ? '#ef4444'
      : selectedProduct.stock <= selectedProduct.minStock
        ? '#f59e0b'
        : '#22c55e';

    return (
      <div style={{ animation: 'fadeIn 0.25s ease-out' }}>

        {/* ── HERO CARD ───────────────────────────────────────── */}
        <div style={{
          borderRadius: '20px',
          overflow: 'hidden',
          marginBottom: '20px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }}>
          {/* Green gradient banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1a5c2a 0%, #2d8a45 50%, #3da85a 100%)',
            padding: '18px 20px 56px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* BG decorations */}
            <div style={{ position:'absolute', top:'-40px', right:'-40px', width:'160px', height:'160px', borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
            <div style={{ position:'absolute', bottom:'-30px', left:'20%', width:'100px', height:'100px', borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
            <div style={{ position:'absolute', top:'10px', left:'45%', width:'60px', height:'60px', borderRadius:'50%', background:'rgba(255,255,255,0.03)' }} />

            {/* Action Row — Back left, Edit+Delete right */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', position:'relative', zIndex:2, flexWrap:'wrap', gap:'10px' }}>
              <button
                onClick={() => setViewProductId(null)}
                style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', color:'#fff', borderRadius:'10px', padding:'7px 14px', fontSize:'13px', fontWeight:600, cursor:'pointer', backdropFilter:'blur(8px)' }}
              >
                <ArrowLeft size={14} /> Back
              </button>
              <div style={{ display:'flex', gap:'8px' }}>
                <button
                  onClick={() => handleEditClick(selectedProduct)}
                  style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', color:'#fff', borderRadius:'10px', padding:'7px 14px', fontSize:'13px', fontWeight:600, cursor:'pointer', backdropFilter:'blur(8px)' }}
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={() => setDeletingProduct(selectedProduct)}
                  style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(220,38,38,0.3)', border:'1px solid rgba(220,38,38,0.5)', color:'#fff', borderRadius:'10px', padding:'7px 14px', fontSize:'13px', fontWeight:600, cursor:'pointer', backdropFilter:'blur(8px)' }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          </div>

          {/* Product identity — lifts over the banner */}
          <div style={{ background:'var(--card-bg, #fff)', padding:'0 20px 20px' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:'16px', marginTop:'-36px', position:'relative', zIndex:2 }}>
              {/* Avatar */}
              <div style={{
                width:'72px', height:'72px', borderRadius:'18px', flexShrink:0,
                background:'linear-gradient(135deg, #1a5c2a 0%, #3da85a 100%)',
                border:'3px solid var(--card-bg, #fff)',
                boxShadow:'0 4px 20px rgba(0,0,0,0.15)',
                display:'flex', alignItems:'center', justifyContent:'center', color:'#fff',
              }}>
                <Package size={30} />
              </div>

              <div style={{ flex:1, paddingTop:'40px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
                  <h2 style={{ fontSize:'20px', fontWeight:800, color:'var(--text-primary)', margin:0 }}>
                    {selectedProduct.name}
                  </h2>
                  {getStockStatusBadge(selectedProduct)}
                </div>
                <div style={{ display:'flex', gap:'16px', marginTop:'5px', fontSize:'12px', color:'var(--text-secondary)', flexWrap:'wrap', alignItems:'center' }}>
                  <span>SKU: <code style={{ fontFamily:'monospace', fontWeight:700, background:'var(--bg-app)', padding:'1px 6px', borderRadius:'4px', fontSize:'11px' }}>{selectedProduct.sku}</code></span>
                  <span style={{ color:'var(--border-color)' }}>|</span>
                  <span>Category: <strong style={{ color:'var(--primary-dark)' }}>{selectedProduct.category}</strong></span>
                  {selectedProduct.hsn && (
                    <>
                      <span style={{ color:'var(--border-color)' }}>|</span>
                      <span>HSN: <strong>{selectedProduct.hsn}</strong></span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4 STAT TILES ────────────────────────────────────── */}
        <div className="inv-profile-stat-grid">
          {/* Stock on hand */}
          <div style={{ background:'var(--card-bg,#fff)', borderRadius:'16px', padding:'16px 18px', border:'1px solid var(--border-color)', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
              <span style={{ fontSize:'10px', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Stock On Hand</span>
              <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'rgba(34,197,94,0.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'#16a34a' }}>
                <Package size={14} />
              </div>
            </div>
            <div className="stat-value" style={{ fontSize:'22px', fontWeight:800, color:'var(--text-primary)', lineHeight:1 }}>{selectedProduct.stock}</div>
            <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'4px' }}>units available</div>
            {/* Progress bar */}
            <div style={{ marginTop:'10px', height:'4px', background:'var(--bg-app)', borderRadius:'9999px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${stockHealthPct}%`, background:stockBarColor, borderRadius:'9999px', transition:'width 0.5s ease' }} />
            </div>
            <div style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'4px' }}>Min threshold: {selectedProduct.minStock}</div>
          </div>

          {/* Cost price - click to go to Purchases */}
          <div
            onClick={() => setCurrentTab('purchases')}
            style={{ background:'var(--card-bg,#fff)', borderRadius:'16px', padding:'16px 18px', border:'1px solid var(--border-color)', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', cursor:'pointer', transition:'box-shadow 0.2s, transform 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow='0 6px 20px rgba(99,102,241,0.15)'; (e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLDivElement).style.transform=''; }}
          >
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
              <span style={{ fontSize:'10px', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Cost Price</span>
              <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'rgba(99,102,241,0.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'#6366f1' }}>
                <Tag size={14} />
              </div>
            </div>
            <div className="stat-value" style={{ fontSize:'22px', fontWeight:800, color:'var(--text-primary)', lineHeight:1 }}>{formatINR(selectedProduct.purchasePrice)}</div>
            <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'4px' }}>per unit (purchase)</div>
          </div>

          {/* Selling price - click to go to Sales */}
          <div
            onClick={() => setCurrentTab('sales')}
            style={{ background:'var(--card-bg,#fff)', borderRadius:'16px', padding:'16px 18px', border:'1px solid var(--border-color)', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', cursor:'pointer', transition:'box-shadow 0.2s, transform 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow='0 6px 20px rgba(16,185,129,0.15)'; (e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLDivElement).style.transform=''; }}
          >
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
              <span style={{ fontSize:'10px', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Selling Price</span>
              <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'rgba(16,185,129,0.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'#059669' }}>
                <TrendingUp size={14} />
              </div>
            </div>
            <div className="stat-value" style={{ fontSize:'22px', fontWeight:800, color:'var(--primary-dark)', lineHeight:1 }}>{formatINR(selectedProduct.sellingPrice)}</div>
            <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'4px' }}>per unit (retail)</div>
          </div>

          {/* Profit margin - click to go to Sales */}
          <div
            onClick={() => setCurrentTab('sales')}
            style={{ background:'var(--card-bg,#fff)', borderRadius:'16px', padding:'16px 18px', border:'1px solid var(--border-color)', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', cursor:'pointer', transition:'box-shadow 0.2s, transform 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow='0 6px 20px rgba(245,158,11,0.15)'; (e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLDivElement).style.transform=''; }}
          >
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
              <span style={{ fontSize:'10px', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Profit Margin</span>
              <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:'rgba(245,158,11,0.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'#d97706' }}>
                <CheckCircle2 size={14} />
              </div>
            </div>
            <div className="stat-value" style={{ display:'flex', alignItems:'baseline', gap:'6px', flexWrap:'wrap' }}>
              <span style={{ fontSize:'22px', fontWeight:800, color: profitMargin >= 0 ? '#16a34a' : '#dc2626', lineHeight:1 }}>{formatINR(profitMargin)}</span>
              <span style={{ fontSize:'12px', fontWeight:700, color: profitMargin >= 0 ? '#16a34a' : '#dc2626' }}>({marginPercent}%)</span>
            </div>
            <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'4px' }}>gross per unit sold</div>
          </div>
        </div>

        {/* ── DETAILS + TAX ROW ───────────────────────────────── */}
        <div className="inv-profile-detail-grid">
          {/* Pricing detail breakdown */}
          <div style={{ background:'var(--card-bg,#fff)', borderRadius:'16px', padding:'20px', border:'1px solid var(--border-color)', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <h4 style={{ fontSize:'12px', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 14px' }}>Price Breakdown</h4>
            {[
              { label:'Purchase Price (excl. GST)', value: formatINR(selectedProduct.purchasePrice) },
              { label:'Selling Price (excl. GST)', value: formatINR(selectedProduct.sellingPrice) },
              { label:'GST Rate', value: `${selectedProduct.gstRate}%` },
              { label:'GST on Selling Price', value: formatINR(selectedProduct.sellingPrice * selectedProduct.gstRate / 100) },
              { label:'MRP (incl. GST)', value: formatINR(selectedProduct.sellingPrice * (1 + selectedProduct.gstRate / 100)), highlight: true },
            ].map((row, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom: i < 4 ? '1px dashed var(--border-color)' : 'none' }}>
                <span style={{ fontSize:'12px', color:'var(--text-secondary)' }}>{row.label}</span>
                <span style={{ fontSize:'13px', fontWeight: row.highlight ? 800 : 600, color: row.highlight ? 'var(--primary-dark)' : 'var(--text-primary)' }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Stock info card */}
          <div style={{ background:'var(--card-bg,#fff)', borderRadius:'16px', padding:'20px', border:'1px solid var(--border-color)', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <h4 style={{ fontSize:'12px', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 14px' }}>Stock Details</h4>
            {[
              { label:'Current Stock', value:`${selectedProduct.stock} units` },
              { label:'Minimum Stock Limit', value:`${selectedProduct.minStock} units` },
              { label:'Stock Value (at cost)', value: formatINR(selectedProduct.stock * selectedProduct.purchasePrice) },
              { label:'Stock Value (at MRP)', value: formatINR(selectedProduct.stock * selectedProduct.sellingPrice) },
              { label:'Potential Profit', value: formatINR(selectedProduct.stock * profitMargin), highlight: true },
            ].map((row, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom: i < 4 ? '1px dashed var(--border-color)' : 'none' }}>
                <span style={{ fontSize:'12px', color:'var(--text-secondary)' }}>{row.label}</span>
                <span style={{ fontSize:'13px', fontWeight: row.highlight ? 800 : 600, color: row.highlight ? '#16a34a' : 'var(--text-primary)' }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Lifetime statistics card */}
          <div style={{ background:'var(--card-bg,#fff)', borderRadius:'16px', padding:'20px', border:'1px solid var(--border-color)', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <h4 style={{ fontSize:'12px', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 14px' }}>Lifetime Activity</h4>
            {[
              { label:'Total Quantity Sold', value:`${totalSalesQty} units` },
              { label:'Total Revenue Generated', value: formatINR(totalSalesValue) },
              { label:'Total Quantity Purchased', value:`${totalPurchasesQty} units` },
              { label:'Total Procurement Cost', value: formatINR(totalPurchasesValue) },
              { label:'Net Ledger Balance', value: formatINR(totalSalesValue - totalPurchasesValue), highlight: true, highlightColor: (totalSalesValue - totalPurchasesValue) >= 0 ? '#16a34a' : '#dc2626' },
            ].map((row, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom: i < 4 ? '1px dashed var(--border-color)' : 'none' }}>
                <span style={{ fontSize:'12px', color:'var(--text-secondary)' }}>{row.label}</span>
                <span style={{ fontSize:'13px', fontWeight: row.highlight ? 800 : 600, color: row.highlight ? (row.highlightColor || 'var(--primary-dark)') : 'var(--text-primary)' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── TRANSACTION LEDGER ──────────────────────────────── */}
        <div style={{ background:'var(--card-bg,#fff)', borderRadius:'16px', border:'1px solid var(--border-color)', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
          {/* Ledger header */}
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border-color)', display:'flex', alignItems:'center', gap:'10px', background:'var(--bg-app)', flexWrap:'wrap' }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'linear-gradient(135deg,#1a5c2a,#3da85a)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
              <TrendingUp size={15} />
            </div>
            <div>
              <h3 style={{ fontSize:'14px', fontWeight:700, margin:0, color:'var(--text-primary)' }}>Product Ledger Activity</h3>
              <div style={{ fontSize:'11px', color:'var(--text-muted)' }}>All sales and purchase transactions for this item</div>
            </div>
            <div style={{ marginLeft:'auto', background:'var(--card-bg,#fff)', border:'1px solid var(--border-color)', borderRadius:'8px', padding:'4px 10px', fontSize:'12px', fontWeight:700, color:'var(--text-secondary)' }}>
              {transactions.length === allTransactions.length ? (
                `${transactions.length} records`
              ) : (
                `Showing ${transactions.length} of ${allTransactions.length} records`
              )}
            </div>
          </div>

          {/* Date & Type Filter Bar */}
          <div className="ledger-filter-container">
            <div className="ledger-dates-row">
              <div className="ledger-filter-group">
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>From Date</span>
                <div className="ledger-input-wrapper">
                  <Calendar size={14} />
                  <input 
                    type="date" 
                    value={ledgerStartDate}
                    onChange={(e) => setLedgerStartDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="ledger-filter-group">
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>To Date</span>
                <div className="ledger-input-wrapper">
                  <Calendar size={14} />
                  <input 
                    type="date" 
                    value={ledgerEndDate}
                    onChange={(e) => setLedgerEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="ledger-actions-row">
              <div className="ledger-filter-group">
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Transaction Type</span>
                <div className="ledger-select-wrapper">
                  <select
                    value={ledgerTypeFilter}
                    onChange={(e) => setLedgerTypeFilter(e.target.value as 'All' | 'Sales' | 'Purchase')}
                  >
                    <option value="All">All Transactions</option>
                    <option value="Sales">Sales Only</option>
                    <option value="Purchase">Purchases Only</option>
                  </select>
                </div>
              </div>

              {(ledgerStartDate || ledgerEndDate || ledgerTypeFilter !== 'All') && (
                <button 
                  onClick={() => {
                    setLedgerStartDate('');
                    setLedgerEndDate('');
                    setLedgerTypeFilter('All');
                  }}
                  className="btn btn-secondary ledger-clear-btn"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {allTransactions.length === 0 ? (
            <div style={{ padding:'48px 0', textAlign:'center', color:'var(--text-muted)' }}>
              <FileText size={40} style={{ opacity:0.25, marginBottom:'12px' }} />
              <div style={{ fontSize:'14px', fontWeight:600 }}>No Transaction Records Yet</div>
              <div style={{ fontSize:'12px', opacity:0.7, marginTop:'4px' }}>This item hasn't appeared in any invoice or purchase bill.</div>
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ padding:'48px 0', textAlign:'center', color:'var(--text-muted)' }}>
              <FileText size={40} style={{ opacity:0.25, marginBottom:'12px' }} />
              <div style={{ fontSize:'14px', fontWeight:600 }}>No Transactions Match Filters</div>
              <div style={{ fontSize:'12px', opacity:0.7, marginTop:'4px', marginBottom:'16px' }}>Adjust your start date, end date, or transaction type filters.</div>
              <button 
                onClick={() => {
                  setLedgerStartDate('');
                  setLedgerEndDate('');
                  setLedgerTypeFilter('All');
                }}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', borderRadius: '10px' }}
              >
                Reset Date Filters
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="desktop-only-table">
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Ref No.</th>
                        <th>Party / Contact</th>
                        <th style={{ textAlign:'right' }}>Qty</th>
                        <th style={{ textAlign:'right' }}>Rate (₹)</th>
                        <th style={{ textAlign:'right' }}>Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, idx) => (
                        <tr 
                          key={idx} 
                          onClick={() => handleTransactionClick(tx)}
                          style={{ cursor: 'pointer' }}
                          title="Click to view transaction details"
                        >
                          <td className="text-nowrap">{new Date(tx.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</td>
                          <td><span className={`badge ${tx.type === 'Sales' ? 'badge-success' : 'badge-info'}`}>{tx.type}</span></td>
                          <td style={{ fontWeight:600 }}>{tx.number}</td>
                          <td>{tx.contactName}</td>
                          <td style={{ textAlign:'right', fontWeight:600 }}>{tx.quantity}</td>
                          <td style={{ textAlign:'right' }}>{formatINR(tx.price).replace('₹','')}</td>
                          <td style={{ textAlign:'right', fontWeight:700 }}>{formatINR(tx.total).replace('₹','')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="mobile-card-list" style={{ padding:'12px' }}>
                {transactions.map((tx, idx) => (
                  <div 
                    key={idx} 
                    className="mobile-list-card"
                    onClick={() => handleTransactionClick(tx)}
                    style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
                  >
                    <div className="mobile-list-card-header">
                      <div>
                        <span className={`badge ${tx.type === 'Sales' ? 'badge-success' : 'badge-info'}`}>{tx.type}</span>
                        <h4 className="mobile-list-card-title" style={{ marginTop:'4px' }}>{tx.number}</h4>
                      </div>
                      <span className="mobile-list-card-subtitle">{new Date(tx.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Party</span>
                      <span className="mobile-list-card-val">{tx.contactName}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Qty</span>
                      <span className="mobile-list-card-val">{tx.quantity}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Rate</span>
                      <span className="mobile-list-card-val">{formatINR(tx.price)}</span>
                    </div>
                    <div className="mobile-list-card-row">
                      <span className="mobile-list-card-label">Total Value</span>
                      <span className="mobile-list-card-val" style={{ fontWeight:700 }}>{formatINR(tx.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Product Modal */}
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          editProductData={isEditingProduct}
        />

        {/* Delete Confirmation Modal */}
        {deletingProduct && (
          <div className="modal-overlay" style={{ zIndex:1000 }}>
            <div className="card modal-content" style={{ maxWidth:'400px', padding:'28px', animation:'scaleUp 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:'16px' }}>
                <div style={{ padding:'14px', borderRadius:'50%', background:'#fee2e2', color:'#dc2626' }}>
                  <AlertTriangle size={28} />
                </div>
                <h3 style={{ fontSize:'18px', fontWeight:700, color:'var(--text-primary)', margin:0 }}>Delete Product</h3>
                <p style={{ fontSize:'14px', color:'var(--text-secondary)', lineHeight:1.6, margin:0 }}>
                  Are you sure you want to delete <strong>{deletingProduct.name}</strong>? This action cannot be undone and will remove it from the catalog permanently.
                </p>
                <div style={{ display:'flex', gap:'12px', width:'100%' }}>
                  <button className="btn btn-secondary" style={{ flex:1 }} onClick={() => setDeletingProduct(null)}>Cancel</button>
                  <button
                    className="btn btn-primary"
                    style={{ flex:1, background:'linear-gradient(135deg,#dc2626,#991b1b)' }}
                    onClick={() => {
                      const id = deletingProduct.id;
                      const name = deletingProduct.name;
                      setDeletingProduct(null);
                      deleteProduct(id);
                      showToast(`"${name}" deleted from catalog.`, 'info');
                      setViewProductId(null);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* Inventory KPI Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
        <div className="kpi-card" style={{ cursor: 'default' }}>
          <div className="kpi-info" style={{ gap: '2px' }}>
            <span className="kpi-label" style={{ fontSize: '11px' }}>Total Products</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800 }}>
              {totalProducts} Items
            </span>
            <span className="kpi-subtext" style={{ fontSize: '10px' }}>
              Unique catalog skus
            </span>
          </div>
          <div className="kpi-icon-container blue"><Package size={20} /></div>
        </div>
        <div className="kpi-card" style={{ cursor: 'default' }}>
          <div className="kpi-info" style={{ gap: '2px' }}>
            <span className="kpi-label" style={{ fontSize: '11px' }}>Stock Valuation</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800 }}>
              {formatINR(totalStockValue)}
            </span>
            <span className="kpi-subtext" style={{ fontSize: '10px' }}>
              Valued at purchase rate
            </span>
          </div>
          <div className="kpi-icon-container emerald"><TrendingUp size={20} /></div>
        </div>
        <div className="kpi-card" style={{ cursor: 'default' }}>
          <div className="kpi-info" style={{ gap: '2px' }}>
            <span className="kpi-label" style={{ fontSize: '11px' }}>Low Stock Alert</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-warning-dark)' }}>
              {lowStockAlerts} items
            </span>
            <span className="kpi-subtext" style={{ fontSize: '10px' }}>
              Under minimum limit
            </span>
          </div>
          <div className="kpi-icon-container amber"><AlertTriangle size={20} /></div>
        </div>
        <div className="kpi-card" style={{ cursor: 'default' }}>
          <div className="kpi-info" style={{ gap: '2px' }}>
            <span className="kpi-label" style={{ fontSize: '11px' }}>Out of Stock</span>
            <span className="kpi-value" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-danger-dark)' }}>
              {outOfStockCount} items
            </span>
            <span className="kpi-subtext" style={{ fontSize: '10px' }}>
              Zero stock quantity
            </span>
          </div>
          <div className="kpi-icon-container rose"><XCircle size={20} /></div>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div className="filters-row-unified">
        <div className="filters-group-one">
          <div className="search-input-wrapper sales-search-wrapper">
            <Search size={16} className="search-input-icon" />
            <input
              type="text"
              placeholder="Search product name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Desktop Segmented Filter Control */}
          <div className="desktop-status-filters segmented-control-inventory" style={{ display: 'flex', backgroundColor: 'var(--bg-app)', padding: '3px', borderRadius: '10px', border: '1.5px solid var(--border-color)', gap: '2px', flexShrink: 1, minWidth: 0 }}>
            {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map((status) => {
              const isActive = stockStatusFilter === status;
              return (
                <button
                  key={status}
                  className="btn-sm segmented-btn-inventory"
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
                    whiteSpace: 'normal',
                    textAlign: 'center',
                    lineHeight: '1.1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '55px',
                  }}
                  onClick={() => {
                    setStockStatusFilter(status);
                    setCurrentPage(1);
                  }}
                >
                  {status === 'All' ? 'All Levels' : status}
                </button>
              );
            })}
          </div>

          {/* Mobile Status Select Dropdown */}
          <div className="mobile-status-select-wrapper">
            <select
              className="filter-select status-select-field"
              value={stockStatusFilter}
              onChange={(e) => {
                setStockStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map((status) => (
                <option key={status} value={status}>
                  {status === 'All' ? 'All Levels' : status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filters-group-two">
          {/* Category Filter */}
          <div className="sales-sort-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '14px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <Tag size={13} />
            </span>
            <select
              className="filter-select"
              style={{ paddingLeft: '36px' }}
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: '14px', pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </div>

          <button className="btn btn-primary" onClick={handleAddNewClick}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Grid List */}
      <div className="card">
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <Package size={48} className="empty-state-icon" />
            <h4 className="empty-state-title">No Products Found</h4>
            <p className="empty-state-desc">
              Your inventory filter configuration didn't match any items in the store warehouse catalog.
            </p>
            <button className="btn btn-primary" onClick={handleAddNewClick}>
              Create First Product
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
                      <th className="text-nowrap">SKU Code</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th className="text-nowrap">Stock Qty</th>
                      <th className="text-nowrap">Min Stock</th>
                      <th className="text-nowrap">Cost Price (₹)</th>
                      <th className="text-nowrap">Retail Rate (₹)</th>
                      <th className="text-nowrap">GST Rate</th>
                      <th className="text-nowrap">Status</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((p) => (
                      <tr key={p.id}>
                        <td className="text-nowrap" style={{ fontWeight: 600, fontFamily: 'monospace' }}>{p.sku}</td>
                        <td>
                          <button
                            type="button"
                            className="table-link-btn supplier-link"
                            onClick={() => setViewProductId(p.id)}
                            title={`View details for ${p.name}`}
                          >
                            {p.name}
                          </button>
                        </td>
                        <td>{p.category}</td>
                        <td
                          className="text-nowrap"
                          style={{
                            fontWeight: 700,
                            color: p.stock === 0 ? 'var(--color-danger)' : p.stock <= p.minStock ? 'var(--color-warning-dark)' : 'inherit',
                          }}
                        >
                          {p.stock}
                        </td>
                        <td className="text-nowrap" style={{ color: 'var(--text-secondary)' }}>
                          {p.minStock}
                        </td>
                        <td className="text-nowrap">{formatINR(p.purchasePrice).replace('₹', '')}</td>
                        <td className="text-nowrap" style={{ fontWeight: 600 }}>{formatINR(p.sellingPrice).replace('₹', '')}</td>
                        <td className="text-nowrap">{p.gstRate}%</td>
                        <td className="text-nowrap">{getStockStatusBadge(p)}</td>
                        <td className="no-print" style={{ position: 'relative', textAlign: 'center', overflow: 'visible' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuProductId(activeMenuProductId === p.id ? null : p.id);
                            }}
                            title="Actions"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {activeMenuProductId === p.id && (
                            <>
                              {/* Overlay to close the menu on clicking outside */}
                              <div 
                                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
                                onClick={() => setActiveMenuProductId(null)}
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
                                    padding: '8px 12px',
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: 'var(--text-primary)',
                                  }}
                                  onClick={() => {
                                    setViewProductId(p.id);
                                    setActiveMenuProductId(null);
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-app)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                  <Eye size={14} /> View Info
                                </button>
                                <button 
                                  className="dropdown-item" 
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '8px 12px',
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: 'var(--text-primary)',
                                  }}
                                  onClick={() => {
                                    handleEditClick(p);
                                    setActiveMenuProductId(null);
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-app)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                  <Edit2 size={14} /> Edit Product
                                </button>
                                <button 
                                  className="dropdown-item danger" 
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '8px 12px',
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: 'var(--color-danger)',
                                  }}
                                  onClick={() => {
                                    handleDeleteProduct(p.id, p.name);
                                    setActiveMenuProductId(null);
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-danger-light, #fef2f2)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                  <Trash2 size={14} /> Delete Product
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
              {paginatedProducts.map((p) => (
                <div key={p.id} className="mobile-list-card">
                  <div className="mobile-list-card-header">
                    <div>
                      <h4 className="mobile-list-card-title">
                        <button
                          type="button"
                          className="table-link-btn supplier-link"
                          onClick={() => setViewProductId(p.id)}
                        >
                          {p.name}
                        </button>
                      </h4>
                      <span className="mobile-list-card-subtitle">SKU: {p.sku} • {p.category}</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={(e) => { e.stopPropagation(); setActiveMenuProductId(activeMenuProductId === p.id ? null : p.id); }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {activeMenuProductId === p.id && (
                        <>
                          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} onClick={() => setActiveMenuProductId(null)} />
                          <div className="card" style={{
                            position: 'absolute', right: '0', top: '100%', marginTop: '4px',
                            zIndex: 999, minWidth: '150px', padding: '6px 0',
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                            display: 'flex', flexDirection: 'column', gap: '2px',
                            backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color)',
                          }}>
                            <button className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                              onClick={() => { setViewProductId(p.id); setActiveMenuProductId(null); }}>
                              <Eye size={14} /> View Info
                            </button>
                            <button className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}
                              onClick={() => { handleEditClick(p); setActiveMenuProductId(null); }}>
                              <Edit2 size={14} /> Edit Details
                            </button>
                            <button className="dropdown-item danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--color-danger)' }}
                              onClick={() => { handleDeleteProduct(p.id, p.name); setActiveMenuProductId(null); }}>
                              <Trash2 size={14} /> Delete Product
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Stock Status</span>
                    <span className="mobile-list-card-val">{getStockStatusBadge(p)}</span>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Stock Quantity</span>
                    <span className="mobile-list-card-val" style={{ fontWeight: 700, color: p.stock === 0 ? 'var(--color-danger)' : p.stock <= p.minStock ? 'var(--color-warning-dark)' : 'inherit' }}>
                      {p.stock} units (Min: {p.minStock})
                    </span>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Cost / Selling</span>
                    <span className="mobile-list-card-val">
                      {formatINR(p.purchasePrice)} / <strong style={{ color: 'var(--primary-dark)' }}>{formatINR(p.sellingPrice)}</strong>
                    </span>
                  </div>

                  <div className="mobile-list-card-row">
                    <span className="mobile-list-card-label">Tax Rate</span>
                    <span className="mobile-list-card-val">{p.gstRate}% GST</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-row">
                <span>
                  Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                  <strong>{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</strong> of{' '}
                  <strong>{filteredProducts.length}</strong> items
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

      {/* Reusable Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        editProductData={isEditingProduct}
      />
    </div>
  );
};
