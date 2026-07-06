import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useApp } from '../context/AppContext';
import type { Product } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editProductData?: Product | null;
  onSaveCallback?: (product: Product) => void;
}

const CATEGORIES = ['Machinery', 'Irrigation', 'Implements', 'Equipment', 'Spares'];
const GST_RATES = [0, 5, 12, 18, 28];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  editProductData = null,
  onSaveCallback,
}) => {
  const { addProduct, editProduct } = useApp();
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [stock, setStock] = useState<number | ''>(0);
  const [minStock, setMinStock] = useState<number | ''>(5);
  const [purchasePrice, setPurchasePrice] = useState<number | ''>(0);
  const [sellingPrice, setSellingPrice] = useState<number | ''>(0);
  const [gstRate, setGstRate] = useState(18);

  useEffect(() => {
    if (editProductData) {
      setName(editProductData.name);
      setSku(editProductData.sku);
      setCategory(editProductData.category);
      setStock(editProductData.stock);
      setMinStock(editProductData.minStock);
      setPurchasePrice(editProductData.purchasePrice);
      setSellingPrice(editProductData.sellingPrice);
      setGstRate(editProductData.gstRate);
    } else {
      setName('');
      setSku('');
      setCategory(CATEGORIES[0]);
      setStock(0);
      setMinStock(5);
      setPurchasePrice(0);
      setSellingPrice(0);
      setGstRate(18);
    }
  }, [editProductData, isOpen]);

  // Handle auto SKU generation if empty
  const handleGenerateSKU = () => {
    if (name) {
      const initials = name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 3);
      const random = Math.floor(100 + Math.random() * 900);
      setSku(`${initials}-${random}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalSku = sku.trim() || `SKU-${Date.now().toString().slice(-4)}`;
    const finalStock = stock === '' ? 0 : stock;
    const finalMinStock = minStock === '' ? 0 : minStock;
    const finalPurchasePrice = purchasePrice === '' ? 0 : purchasePrice;
    const finalSellingPrice = sellingPrice === '' ? 0 : sellingPrice;

    if (editProductData) {
      editProduct({
        ...editProductData,
        name,
        sku: finalSku,
        category,
        stock: finalStock,
        minStock: finalMinStock,
        purchasePrice: finalPurchasePrice,
        sellingPrice: finalSellingPrice,
        gstRate,
      });
    } else {
      const newProd = addProduct({
        name,
        sku: finalSku,
        category,
        stock: finalStock,
        minStock: finalMinStock,
        purchasePrice: finalPurchasePrice,
        sellingPrice: finalSellingPrice,
        gstRate,
      });
      if (onSaveCallback) {
        onSaveCallback(newProd);
      }
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editProductData ? 'Edit Product Details' : 'Add New Agricultural Product'}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Product Name *</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Varuna Submersible Pump 5HP"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">SKU / Item Code</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Auto-generated if blank"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleGenerateSKU}
                disabled={!name}
                title="Generate SKU from product name initials"
              >
                Gen
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              className="form-control"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row-three">
          <div className="form-group">
            <label className="form-label">Stock Qty *</label>
            <input
              type="number"
              className="form-control"
              placeholder="0"
              value={stock}
              onChange={(e) => {
                const val = e.target.value;
                setStock(val === '' ? '' : Math.max(0, parseInt(val) || 0));
              }}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Low Stock limit *</label>
            <input
              type="number"
              className="form-control"
              placeholder="5"
              value={minStock}
              onChange={(e) => {
                const val = e.target.value;
                setMinStock(val === '' ? '' : Math.max(0, parseInt(val) || 0));
              }}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">GST Bracket (%) *</label>
            <select
              className="form-control"
              value={gstRate}
              onChange={(e) => setGstRate(parseInt(e.target.value) || 0)}
            >
              {GST_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}% GST
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Purchase Price (₹) *</label>
            <input
              type="number"
              className="form-control"
              placeholder="Base cost"
              value={purchasePrice}
              onChange={(e) => {
                const val = e.target.value;
                setPurchasePrice(val === '' ? '' : Math.max(0, parseFloat(val) || 0));
              }}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Selling Price (₹) *</label>
            <input
              type="number"
              className="form-control"
              placeholder="Retail rate"
              value={sellingPrice}
              onChange={(e) => {
                const val = e.target.value;
                setSellingPrice(val === '' ? '' : Math.max(0, parseFloat(val) || 0));
              }}
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {editProductData ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
