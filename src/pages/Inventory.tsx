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

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? This will remove it from the catalog.`)) {
      deleteProduct(id);
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

    const transactions = [...productSales, ...productPurchases].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Calculate margins
    const profitMargin = selectedProduct.sellingPrice - selectedProduct.purchasePrice;
    const marginPercent = selectedProduct.sellingPrice > 0 
      ? ((profitMargin / selectedProduct.sellingPrice) * 100).toFixed(1) 
      : '0.0';

    return (
      <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
        {/* Back and Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setViewProductId(null)}
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                {selectedProduct.name}
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                SKU: <code style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedProduct.sku}</code> | Category: <strong>{selectedProduct.category}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleEditClick(selectedProduct)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Edit2 size={15} /> Edit Product
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                handleDeleteProduct(selectedProduct.id, selectedProduct.name);
                setViewProductId(null);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-danger)' }}
            >
              <Trash2 size={15} /> Delete Product
            </button>
          </div>
        </div>

        {/* 3 Grid Summary Cards */}
        <div className="form-grid-3" style={{ marginBottom: '28px' }}>
          {/* Card 1: Stock Status */}
          <div className="card" style={{ padding: '20px 24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Stock status</span>
              {getStockStatusBadge(selectedProduct)}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <strong style={{ fontSize: '28px', color: 'var(--text-primary)', fontWeight: 800 }}>{selectedProduct.stock}</strong>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>units on hand</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '4px' }}>
              Low Stock Alert Limit: <strong>{selectedProduct.minStock} units</strong>
            </div>
          </div>

          {/* Card 2: Pricing Details */}
          <div className="card" style={{ padding: '20px 24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Pricing & Tax</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Cost Price</div>
                <strong style={{ fontSize: '18px', color: 'var(--text-primary)' }}>{formatINR(selectedProduct.purchasePrice)}</strong>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Retail Rate</div>
                <strong style={{ fontSize: '18px', color: 'var(--primary-dark)' }}>{formatINR(selectedProduct.sellingPrice)}</strong>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '4px' }}>
              GST Rate Bracket: <strong>{selectedProduct.gstRate}% GST</strong>
            </div>
          </div>

          {/* Card 3: Margin & Profit */}
          <div className="card" style={{ padding: '20px 24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Profit Margin Estimation</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <strong style={{ fontSize: '28px', color: 'var(--color-success-dark)', fontWeight: 800 }}>{formatINR(profitMargin)}</strong>
              <span style={{ fontSize: '14px', color: 'var(--color-success-dark)', fontWeight: 700 }}>({marginPercent}%)</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '4px' }}>
              Gross Profit markup per unit sale
            </div>
          </div>
        </div>

        {/* Recent Transactions Ledger Card */}
        <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff'
            }}>
              <TrendingUp size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Product Ledger Activity</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Historical sales and purchase records for this item</div>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileText size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <div style={{ fontSize: '14px', fontWeight: 500 }}>No Transaction Records</div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>This item has not been included in any sales invoice or purchase bill yet.</div>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="desktop-only-table">
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Ref No.</th>
                        <th>Party/Contact</th>
                        <th style={{ textAlign: 'right' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Rate (₹)</th>
                        <th style={{ textAlign: 'right' }}>Total Value (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, idx) => (
                        <tr key={idx}>
                          <td className="text-nowrap">{new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td>
                            <span className={`badge ${tx.type === 'Sales' ? 'badge-success' : 'badge-info'}`}>
                              {tx.type}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{tx.number}</td>
                          <td>{tx.contactName}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{tx.quantity}</td>
                          <td style={{ textAlign: 'right' }}>{formatINR(tx.price).replace('₹', '')}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatINR(tx.total).replace('₹', '')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View */}
              <div className="mobile-card-list">
                {transactions.map((tx, idx) => (
                  <div key={idx} className="mobile-list-card">
                    <div className="mobile-list-card-header">
                      <div>
                        <span className={`badge ${tx.type === 'Sales' ? 'badge-success' : 'badge-info'}`}>
                          {tx.type}
                        </span>
                        <h4 className="mobile-list-card-title" style={{ marginTop: '4px' }}>{tx.number}</h4>
                      </div>
                      <span className="mobile-list-card-subtitle">{new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
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
                      <span className="mobile-list-card-val" style={{ fontWeight: 700 }}>{formatINR(tx.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
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
        </div>
      </div>

      {/* Top Filter Bar */}
      <div className="filters-row-unified">
        <div className="filters-group-one">
          <div className="search-input-wrapper">
            <Search size={16} className="search-input-icon" />
            <input
              type="text"
              placeholder="Search product name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Segmented Filter Control */}
          <div className="segmented-control-inventory" style={{ display: 'flex', backgroundColor: 'var(--bg-app)', padding: '3px', borderRadius: '10px', border: '1.5px solid var(--border-color)', gap: '2px', flexShrink: 1, minWidth: 0 }}>
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
        </div>

        <div className="filters-group-two">
          {/* Category Filter */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
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
