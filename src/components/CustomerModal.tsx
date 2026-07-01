import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useApp } from '../context/AppContext';
import type { Customer } from '../types';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Other Union Territory'
];

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCallback?: (customer: Customer) => void;
  editCustomerData?: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSaveCallback,
  editCustomerData = null,
}) => {
  const { addCustomer, editCustomer } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [state, setState] = useState('Madhya Pradesh');
  const [outstanding, setOutstanding] = useState(0);

  useEffect(() => {
    if (editCustomerData) {
      setName(editCustomerData.name);
      setPhone(editCustomerData.phone);
      setEmail(editCustomerData.email);
      setAddress(editCustomerData.address);
      setGstin(editCustomerData.gstin || '');
      setState(editCustomerData.state || 'Madhya Pradesh');
      setOutstanding(editCustomerData.outstanding);
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setGstin('');
      setState('Madhya Pradesh');
      setOutstanding(0);
    }
  }, [editCustomerData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editCustomerData) {
      const updated: Customer = {
        ...editCustomerData,
        name,
        phone,
        email,
        address,
        state,
        gstin: gstin.toUpperCase(),
        outstanding,
      };
      editCustomer(updated);
      if (onSaveCallback) onSaveCallback(updated);
    } else {
      const saved = addCustomer({
        name,
        phone,
        email,
        address,
        state,
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
      title={editCustomerData ? 'Edit Customer Info' : 'Add New Customer'}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Customer Full Name *</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Ramesh Kumar"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input
              type="tel"
              className="form-control"
              placeholder="e.g. 9876543210"
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
              placeholder="e.g. ramesh@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">GST Number (GSTIN)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 23AABCR1234F1Z5"
              maxLength={15}
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Billing State *</label>
            <select
              className="form-control"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            >
              <option value="">-- Choose State --</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Village / Billing Address</label>
          <textarea
            className="form-control"
            placeholder="e.g. Ward No. 4, Pipariya Village, MP"
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {!editCustomerData && (
          <div className="form-group">
            <label className="form-label">Opening Outstanding Balance (₹)</label>
            <input
              type="number"
              className="form-control"
              placeholder="e.g. 5000 (Use negative for advance credit)"
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
            {editCustomerData ? 'Update Customer' : 'Add Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
