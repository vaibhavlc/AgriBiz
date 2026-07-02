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
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState('All');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

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

  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
      {/* Top Filter Bar */}
      <div className="filters-row">
        <div className="filters-left">
          <div className="search-input-wrapper">
            <Search size={16} className="search-input-icon" />
            <input
              type="text"
              placeholder="Search product name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

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

          {/* Segmented Filter Control */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-app)', padding: '3px', borderRadius: '10px', border: '1.5px solid var(--border-color)', gap: '2px' }}>
            {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map((status) => {
              const isActive = stockStatusFilter === status;
              return (
                <button
                  key={status}
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

        <button className="btn btn-primary" onClick={handleAddNewClick}>
          <Plus size={16} /> Add Product
        </button>
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
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
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
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            className="btn-icon"
                            onClick={() => handleEditClick(p)}
                            title="Edit Product Info"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-icon danger"
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            title="Delete Product"
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
                  {filteredProducts.length} items cataloged)
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

      {/* Reusable Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        editProductData={isEditingProduct}
      />
    </div>
  );
};
