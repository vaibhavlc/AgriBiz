import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { useApp, useUnsavedChanges } from '../context/AppContext';
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
  const { t } = useTranslation();
  const { addSupplier, editSupplier, requestNavigation, clearAllDirtyForms } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [outstanding, setOutstanding] = useState(0);

  const currentValues = {
    name,
    phone,
    email,
    address,
    gstin,
    outstanding,
  };

  const initialValues = {
    name: editSupplierData?.name || '',
    phone: editSupplierData?.phone || '',
    email: editSupplierData?.email || '',
    address: editSupplierData?.address || '',
    gstin: editSupplierData?.gstin || '',
    outstanding: editSupplierData?.outstanding || 0,
  };

  useUnsavedChanges('supplier-modal-form', currentValues, initialValues, isOpen);

  const handleCloseClick = () => {
    requestNavigation(onClose);
  };

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
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
        await editSupplier(updated);
        if (onSaveCallback) onSaveCallback(updated);
      } else {
        const saved = await addSupplier({
          name,
          phone,
          email,
          address,
          gstin: gstin.toUpperCase() || undefined,
          outstanding,
        });
        if (saved && onSaveCallback) onSaveCallback(saved);
      }
      clearAllDirtyForms();
      onClose();
    } catch (err) {
      console.error('Failed to submit supplier:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseClick}
      title={editSupplierData ? t('suppliers.editSupplier', 'Edit Supplier Info') : t('suppliers.addSupplier', 'Add New Supplier')}
    >
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          
          {/* Supplier Name */}
          <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
            <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('suppliers.supplierName', 'Supplier Company/Name')} *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Mahindra Agri Implements Ltd"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Contact Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
            <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('suppliers.phone', 'Phone/Contact Number')} *</label>
              <input
                type="tel"
                className="form-control"
                placeholder="e.g. 0161456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('auth.email', 'Email ID')}</label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. billing@supplier.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* GSTIN */}
          <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
            <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('suppliers.gstin', 'GST Number (GSTIN)')}</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 03AAACF4321F1ZX"
              maxLength={15}
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', textTransform: 'uppercase' }}
            />
          </div>

          {/* Address */}
          <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
            <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('auth.address', 'Office Address')}</label>
            <textarea
              className="form-control"
              placeholder="e.g. Phase VII, Focal Point, Ludhiana, Punjab"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          {/* Opening Outstanding */}
          {!editSupplierData && (
            <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('suppliers.payable', 'Opening Outstanding Balance (₹)')}</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 15000 (Amount we owe this supplier)"
                value={outstanding || ''}
                onChange={(e) => setOutstanding(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', width: '100%', boxSizing: 'border-box' }}>
            <button type="button" className="btn btn-secondary" onClick={handleCloseClick} style={{ minWidth: '90px' }}>
              {t('common.cancel', 'Cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ minWidth: '110px' }}>
              {isSubmitting ? t('common.saving', 'Saving...') : editSupplierData ? t('common.save', 'Update Supplier') : t('suppliers.addSupplier', 'Add Supplier')}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
