import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useApp, useUnsavedChanges } from '../context/AppContext';
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

const CUSTOMER_STAFF_PERMISSIONS = [
  { id: 'sales', label: 'Sales Invoices & Billing', description: 'Allow staff to generate sales bills for this customer' },
  { id: 'receipts', label: 'Payment Receipts', description: 'Allow staff to record cash/UPI/bank receipts' },
  { id: 'ledger', label: 'View Account Ledger', description: 'Allow staff to view ledger history & statement' },
  { id: 'edit', label: 'Edit Customer Details', description: 'Allow staff to update phone, GSTIN, and address' },
  { id: 'delete', label: 'Delete Account', description: 'Allow staff to remove or delete this customer' },
];

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSaveCallback,
  editCustomerData = null,
}) => {
  const { addCustomer, editCustomer, requestNavigation } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [state, setState] = useState('Madhya Pradesh');
  const [outstanding, setOutstanding] = useState(0);
  const [allowedStaffActions, setAllowedStaffActions] = useState<string[]>(['sales', 'receipts', 'ledger', 'edit']);

  const currentValues = {
    name,
    phone,
    email,
    address,
    state,
    gstin,
    outstanding,
    allowedStaffActions,
  };

  const initialValues = {
    name: editCustomerData?.name || '',
    phone: editCustomerData?.phone || '',
    email: editCustomerData?.email || '',
    address: editCustomerData?.address || '',
    state: editCustomerData?.state || 'Madhya Pradesh',
    gstin: editCustomerData?.gstin || '',
    outstanding: editCustomerData?.outstanding || 0,
    allowedStaffActions: editCustomerData?.allowedStaffActions || ['sales', 'receipts', 'ledger', 'edit'],
  };

  useUnsavedChanges('customer-modal-form', currentValues, initialValues, isOpen);

  const handleCloseClick = () => {
    requestNavigation(onClose);
  };

  useEffect(() => {
    if (editCustomerData) {
      setName(editCustomerData.name);
      setPhone(editCustomerData.phone);
      setEmail(editCustomerData.email);
      setAddress(editCustomerData.address);
      setGstin(editCustomerData.gstin || '');
      setState(editCustomerData.state || 'Madhya Pradesh');
      setOutstanding(editCustomerData.outstanding);
      setAllowedStaffActions(editCustomerData.allowedStaffActions || ['sales', 'receipts', 'ledger', 'edit']);
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setGstin('');
      setState('Madhya Pradesh');
      setOutstanding(0);
      setAllowedStaffActions(['sales', 'receipts', 'ledger', 'edit']);
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
        allowedStaffActions,
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
        allowedStaffActions,
      });
      if (onSaveCallback) onSaveCallback(saved);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseClick}
      title={editCustomerData ? 'Edit Customer Info' : 'Add New Customer'}
    >
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          
          {/* Full Name */}
          <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
            <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Customer Full Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Contact Row: Phone & Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
            <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Phone Number *</label>
              <input
                type="tel"
                className="form-control"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Email ID</label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. ramesh@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Tax/Location Row: GSTIN & State */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
            <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>GST Number (GSTIN)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 23AABCR1234F1Z5"
                maxLength={15}
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', textTransform: 'uppercase' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Billing State *</label>
              <select
                className="form-control"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <option value="">-- Choose State --</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Address */}
          <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
            <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Village / Billing Address</label>
            <textarea
              className="form-control"
              placeholder="e.g. Ward No. 4, Pipariya Village, MP"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          {/* Opening Outstanding */}
          {!editCustomerData && (
            <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Opening Outstanding Balance (₹)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 5000 (Use negative for advance credit)"
                value={outstanding || ''}
                onChange={(e) => setOutstanding(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {/* Staff Page & Action Permissions for this Customer */}
          <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', width: '100%', boxSizing: 'border-box', marginTop: '4px' }}>
            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🛡️ Staff Access & Page Permissions
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
              Select which customer sub-pages and features staff members are allowed to access for this account:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
              {CUSTOMER_STAFF_PERMISSIONS.map((perm) => {
                const isChecked = allowedStaffActions.includes(perm.id);
                return (
                  <label
                    key={perm.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.08)' : 'var(--card-bg)',
                      border: isChecked ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: isChecked ? 700 : 500
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAllowedStaffActions((prev) => [...prev, perm.id]);
                        } else {
                          setAllowedStaffActions((prev) => prev.filter((p) => p !== perm.id));
                        }
                      }}
                      style={{ accentColor: 'var(--primary)', width: '15px', height: '15px', cursor: 'pointer' }}
                    />
                    <span>{perm.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', width: '100%', boxSizing: 'border-box' }}>
            <button type="button" className="btn btn-secondary" onClick={handleCloseClick} style={{ minWidth: '90px' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ minWidth: '110px' }}>
              {editCustomerData ? 'Update Customer' : 'Add Customer'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
