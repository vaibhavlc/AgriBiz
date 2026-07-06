import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Store,
  FileText,
  CheckCircle2,
  RefreshCw,
  Sun,
  Moon,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings, updateSettings, resetToDefault } = useApp();

  // Local form states
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [gstin, setGstin] = useState(settings.gstin);
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix);
  const [financialYear, setFinancialYear] = useState(settings.financialYear);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      businessName,
      address,
      phone,
      email,
      gstin: gstin.toUpperCase(),
      invoicePrefix,
      financialYear,
      theme: settings.theme,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    if (confirm('WARNING: Wiping database will delete all sales invoices, purchases, payments, and custom customer profiles. This resets AgriBiz to original sample data. Proceed?')) {
      resetToDefault();
      alert('AgriBiz database reset to initial mock states successfully.');
      // Refresh state fields
      setBusinessName(settings.businessName);
      setAddress(settings.address);
      setPhone(settings.phone);
      setEmail(settings.email);
      setGstin(settings.gstin);
      setInvoicePrefix(settings.invoicePrefix);
      setFinancialYear(settings.financialYear);
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark') => {
    updateSettings({
      ...settings,
      theme,
    });
  };

  return (
    <div style={{ animation: 'fadeIn 0.2s ease-out' }} className="no-print">
      {/* Saved Toast Alert */}
      {savedSuccess && (
        <div
          className="alert-banner"
          style={{
            backgroundColor: 'var(--color-success-bg)',
            borderColor: 'rgba(16,185,129,0.3)',
            color: 'var(--color-success-dark)',
          }}
        >
          <div className="alert-content">
            <CheckCircle2 size={20} />
            <span>Success! Business preferences updated and saved.</span>
          </div>
        </div>
      )}

      <div className="settings-grid-layout">
        {/* Left side: settings form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Store details */}
            <div className="card">
              <div className="card-title" style={{ gap: '8px', justifyContent: 'flex-start' }}>
                <Store size={20} style={{ color: 'var(--primary)' }} />
                <span>Business & Shop Profile Details</span>
              </div>

              <div className="form-group">
                <label className="form-label">Dealer Store Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Business Office Address *</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone/Mobile Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Business Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Shop GST Number (GSTIN) *</label>
                <input
                  type="text"
                  className="form-control"
                  maxLength={15}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Document variables */}
            <div className="card">
              <div className="card-title" style={{ gap: '8px', justifyContent: 'flex-start' }}>
                <FileText size={20} style={{ color: 'var(--primary)' }} />
                <span>Invoice & Accounting Configurations</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Sales Invoice Prefix *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    Suffix will auto-increment (e.g. AB-2026-001, AB-2026-002)
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">Financial Year (F.Y.) *</label>
                  <select
                    className="form-control"
                    value={financialYear}
                    onChange={(e) => setFinancialYear(e.target.value)}
                  >
                    <option value="2025-2026">2025 - 2026</option>
                    <option value="2026-2027">2026 - 2027</option>
                    <option value="2027-2028">2027 - 2028</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">
                Save System Settings
              </button>
            </div>
          </div>
        </form>

        {/* Right side options: Theme, Wipe database */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Theme card */}
          <div className="card">
            <h4 className="card-title">Color Palette</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className={`btn ${settings.theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={() => handleThemeChange('light')}
              >
                <Sun size={18} />
                <span>Light Theme Mode</span>
              </button>
              <button
                type="button"
                className={`btn ${settings.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={() => handleThemeChange('dark')}
              >
                <Moon size={18} />
                <span>Dark Theme Mode</span>
              </button>
            </div>
          </div>

          {/* Database maintenance */}
          <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
            <h4 className="card-title" style={{ color: 'var(--color-danger)' }}>Database Maintenance</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Wipe out all local operational modifications (new invoices, custom stock rates) and restore to initial database seeding.
            </p>
            <button
              type="button"
              className="btn btn-danger"
              style={{ width: '100%' }}
              onClick={handleReset}
            >
              <RefreshCw size={16} />
              <span>Reset Store Database</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
