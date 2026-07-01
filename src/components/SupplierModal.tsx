import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useApp } from '../context/AppContext';
import type { Supplier } from '../types';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCallback?: (supplier: Supplier) => void;
  editSupplierData?: Supplier | null;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSaveCallback,
  editSupplierData = null,
}) => {
  const { addSupplier, editSupplier } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [outstanding, setOutstanding] = useState(0);

  useEffect(() => {
    if (editSupplierData) {
      setName(editSupplierData.name);
      setPhone(editSupplierData.phone);
      setEmail(editSupplierData.email);
      setAddress(editSupplierData.address);
      setGstin(editSupplierData.gstin || '');
      setOutstanding(editSupplierData.outstanding);
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setGstin('');
      setOutstanding(0);
    }
  }, [editSupplierData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editSupplierData) {
      const updated: Supplier = {
        ...editSupplierData,
        name,
        phone,
        email,
        address,
        gstin: gstin.toUpperCase(),
        outstanding,
      };
      editSupplier(updated);
      if (onSaveCallback) onSaveCallback(updated);
    } else {
      const saved = addSupplier({
        name,
        phone,
        email,
        address,
        gstin: gstin.toUpperCase() || undefined,
        outstanding,
      });
      if (onSaveCallback) onSaveCallback(saved);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editSupplierData ? 'Edit Supplier Info' : 'Add New Supplier'}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Supplier Company/Name *</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Mahindra Agri Implements Ltd"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Phone/Contact Number *</label>
            <input
              type="tel"
              className="form-control"
              placeholder="e.g. 0161456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email ID</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. billing@supplier.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">GST Number (GSTIN)</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. 03AAACF4321F1ZX"
            maxLength={15}
            value={gstin}
            onChange={(e) => setGstin(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Office Address</label>
          <textarea
            className="form-control"
            placeholder="e.g. Phase VII, Focal Point, Ludhiana, Punjab"
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {!editSupplierData && (
          <div className="form-group">
            <label className="form-label">Opening Outstanding Balance (₹)</label>
            <input
              type="number"
              className="form-control"
              placeholder="e.g. 15000 (Amount we owe this supplier)"
              value={outstanding || ''}
              onChange={(e) => setOutstanding(parseFloat(e.target.value) || 0)}
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {editSupplierData ? 'Update Supplier' : 'Add Supplier'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
