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
          <select
            className="filter-select"
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

          {/* Stock Status Filter */}
          <select
            className="filter-select"
            value={stockStatusFilter}
            onChange={(e) => {
              setStockStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="All">All Stock Levels</option>
            <option value="In Stock">In Stock (Good)</option>
            <option value="Low Stock">Low Stock Alert</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
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
