import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Store,
  FileText,
  CheckCircle2,
  RefreshCw,
  Sun,
  Moon,
  Image as ImageIcon,
  CreditCard,
  Sliders,
  Eye,
  MapPin,
  Briefcase,
  Upload,
  Trash2,
} from 'lucide-react';
import { getFullAddress } from '../utils/dummyData';

export const Settings: React.FC = () => {
  const { settings, updateSettings, resetToDefault } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'branding' | 'billing'>('profile');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Business Information
  const [businessName, setBusinessName] = useState(settings.businessName || '');
  const [ownerName, setOwnerName] = useState(settings.ownerName || '');
  const [gstin, setGstin] = useState(settings.gstin || '');
  const [panNumber, setPanNumber] = useState(settings.panNumber || '');
  const [businessType, setBusinessType] = useState(settings.businessType || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [alternatePhone, setAlternatePhone] = useState(settings.alternatePhone || '');
  const [email, setEmail] = useState(settings.email || '');
  const [website, setWebsite] = useState(settings.website || '');

  // Business Address
  const [addressLine1, setAddressLine1] = useState(settings.addressLine1 || '');
  const [addressLine2, setAddressLine2] = useState(settings.addressLine2 || '');
  const [city, setCity] = useState(settings.city || '');
  const [taluka, setTaluka] = useState(settings.taluka || '');
  const [district, setDistrict] = useState(settings.district || '');
  const [state, setState] = useState(settings.state || '');
  const [pincode, setPincode] = useState(settings.pincode || '');

  // Branding
  const [logo, setLogo] = useState(settings.logo || '');
  const [watermarkLogo, setWatermarkLogo] = useState(settings.watermarkLogo || '');

  // Banking Details
  const [bankName, setBankName] = useState(settings.bankName || '');
  const [accountHolderName, setAccountHolderName] = useState(settings.accountHolderName || '');
  const [accountNumber, setAccountNumber] = useState(settings.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(settings.ifscCode || '');
  const [branchName, setBranchName] = useState(settings.branchName || '');
  const [upiId, setUpiId] = useState(settings.upiId || '');

  // Invoice Configuration
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix || '');
  const [purchasePrefix, setPurchasePrefix] = useState(settings.purchasePrefix || '');
  const [quotationPrefix, setQuotationPrefix] = useState(settings.quotationPrefix || '');
  const [financialYear, setFinancialYear] = useState(settings.financialYear || '');
  const [defaultTerms, setDefaultTerms] = useState(settings.defaultTerms || '');
  const [footerMessage, setFooterMessage] = useState(settings.footerMessage || '');

  // Print Preferences
  const [showLogo, setShowLogo] = useState(settings.showLogo ?? true);
  const [showGstin, setShowGstin] = useState(settings.showGstin ?? true);
  const [showAddress, setShowAddress] = useState(settings.showAddress ?? true);
  const [showContact, setShowContact] = useState(settings.showContact ?? true);
  const [showBankDetails, setShowBankDetails] = useState(settings.showBankDetails ?? true);
  const [showTerms, setShowTerms] = useState(settings.showTerms ?? true);

  // Application Preferences
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '₹');
  const [dateFormat, setDateFormat] = useState(settings.dateFormat || 'DD/MM/YYYY');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Dynamically derive standard legacy address
    const legacyAddress = getFullAddress({
      addressLine1,
      addressLine2,
      city,
      taluka,
      district,
      state,
      pincode
    });

    updateSettings({
      businessName,
      ownerName,
      gstin: gstin.toUpperCase(),
      panNumber: panNumber.toUpperCase(),
      businessType,
      phone,
      alternatePhone,
      email,
      website,
      addressLine1,
      addressLine2,
      city,
      taluka,
      district,
      state,
      pincode,
      logo,
      watermarkLogo,
      bankName,
      accountHolderName,
      accountNumber,
      ifscCode: ifscCode.toUpperCase(),
      branchName,
      upiId,
      invoicePrefix,
      purchasePrefix,
      quotationPrefix,
      financialYear,
      defaultTerms,
      footerMessage,
      showLogo,
      showGstin,
      showAddress,
      showContact,
      showBankDetails,
      showTerms,
      currencySymbol,
      dateFormat,
      theme: settings.theme,
      address: legacyAddress,
    });

    setSavedSuccess(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      alert('Selected logo size exceeds 1.5MB limit. Please upload a smaller compressed image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogo('');
  };

  const handleWatermarkLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      alert('Selected watermark logo size exceeds 1.5MB limit. Please upload a smaller compressed image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setWatermarkLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveWatermarkLogo = () => {
    setWatermarkLogo('');
  };

  const handleReset = () => {
    if (confirm('WARNING: Wiping database will delete all sales invoices, purchases, payments, and custom customer profiles. This resets AgriBiz to original sample data. Proceed?')) {
      resetToDefault();
      alert('AgriBiz database reset to initial mock states successfully.');
      window.location.reload();
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
            marginBottom: '20px'
          }}
        >
          <div className="alert-content">
            <CheckCircle2 size={20} />
            <span>Success! Business preferences and global branding updated successfully.</span>
          </div>
        </div>
      )}

      {/* Modern Inner Navigation Tabs */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px', 
          borderBottom: '1px solid var(--border-color)', 
          paddingBottom: '8px',
          overflowX: 'auto'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`btn btn-sm ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: activeTab === 'profile' ? 'none' : '1px solid var(--border-color)' }}
        >
          <Store size={15} /> Business Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`btn btn-sm ${activeTab === 'branding' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: activeTab === 'branding' ? 'none' : '1px solid var(--border-color)' }}
        >
          <ImageIcon size={15} /> Branding & Display
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('billing')}
          className={`btn btn-sm ${activeTab === 'billing' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: activeTab === 'billing' ? 'none' : '1px solid var(--border-color)' }}
        >
          <CreditCard size={15} /> Billing & Banking
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="settings-grid-layout">
          {/* Left side: Settings forms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* TAB 1: Business Profile */}
            {activeTab === 'profile' && (
              <>
                {/* Business Info */}
                <div className="card">
                  <div className="card-title" style={{ gap: '8px', justifyContent: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <Briefcase size={20} style={{ color: 'var(--primary)' }} />
                    <span>Business Information</span>
                  </div>

                  <div className="form-grid-2" style={{ marginTop: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Firm / Business Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Owner Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label className="form-label">GST Number (GSTIN) *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value)}
                        maxLength={15}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">PAN Number *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={panNumber}
                        onChange={(e) => setPanNumber(e.target.value)}
                        maxLength={10}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Business Type</label>
                      <input
                        type="text"
                        placeholder="e.g. Proprietorship, Partnership"
                        className="form-control"
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Primary Phone *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Alternate Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        value={alternatePhone}
                        onChange={(e) => setAlternatePhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Email Address *</label>
                      <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Website</label>
                      <input
                        type="text"
                        placeholder="e.g. www.agribizstore.com"
                        className="form-control"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Business Address */}
                <div className="card">
                  <div className="card-title" style={{ gap: '8px', justifyContent: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <MapPin size={20} style={{ color: 'var(--primary)' }} />
                    <span>Business Address</span>
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label className="form-label">Address Line 1 *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Address Line 2</label>
                    <input
                      type="text"
                      className="form-control"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                    />
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label className="form-label">Village / City *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Taluka</label>
                      <input
                        type="text"
                        className="form-control"
                        value={taluka}
                        onChange={(e) => setTaluka(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">District *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">State *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Pincode *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: Branding & Display */}
            {activeTab === 'branding' && (
              <>
                {/* Branding Card */}
                <div className="card">
                  <div className="card-title" style={{ gap: '8px', justifyContent: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <ImageIcon size={20} style={{ color: 'var(--primary)' }} />
                    <span>Company Logo Branding</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', marginTop: '20px' }}>
                    {logo ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <div style={{ border: '2px dashed var(--border-color)', padding: '10px', borderRadius: '12px', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)' }}>
                          <img src={logo} alt="Branding Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                            <Upload size={14} /> Change Logo
                            <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                          </label>
                          <button type="button" onClick={handleRemoveLogo} className="btn btn-danger btn-sm" style={{ color: 'var(--color-danger)' }}>
                            <Trash2 size={14} /> Remove Logo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ border: '2px dashed var(--border-color)', padding: '30px', borderRadius: '16px', textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <ImageIcon size={40} style={{ color: 'var(--text-muted)' }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Upload Business Logo</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>PNG, JPG, or SVG format up to 1.5MB</div>
                        </div>
                        <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                          <Upload size={14} /> Choose Image File
                          <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Watermark Logo Branding Card */}
                <div className="card">
                  <div className="card-title" style={{ gap: '8px', justifyContent: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <ImageIcon size={20} style={{ color: 'var(--primary)' }} />
                    <span>Dedicated Bill Watermark Logo</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', marginTop: '20px' }}>
                    {watermarkLogo ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <div style={{ border: '2px dashed var(--border-color)', padding: '10px', borderRadius: '12px', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)' }}>
                          <img src={watermarkLogo} alt="Watermark Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                            <Upload size={14} /> Change Watermark
                            <input type="file" accept="image/*" onChange={handleWatermarkLogoUpload} style={{ display: 'none' }} />
                          </label>
                          <button type="button" onClick={handleRemoveWatermarkLogo} className="btn btn-danger btn-sm" style={{ color: 'var(--color-danger)' }}>
                            <Trash2 size={14} /> Remove Watermark
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ border: '2px dashed var(--border-color)', padding: '30px', borderRadius: '16px', textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <ImageIcon size={40} style={{ color: 'var(--text-muted)' }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Upload Bill Watermark Logo</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>PNG, JPG, or SVG format up to 1.5MB (Defaults to Company Logo if empty)</div>
                        </div>
                        <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                          <Upload size={14} /> Choose Image File
                          <input type="file" accept="image/*" onChange={handleWatermarkLogoUpload} style={{ display: 'none' }} />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Print Preferences */}
                <div className="card">
                  <div className="card-title" style={{ gap: '8px', justifyContent: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <Eye size={20} style={{ color: 'var(--primary)' }} />
                    <span>Print preferences (Invoice & Slip Templates)</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Show Company Logo</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Displays branding logo on A5 invoice & print templates</div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={showGstin} onChange={(e) => setShowGstin(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Show GSTIN (GST Number)</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prints your GSTIN number on document receipts</div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={showAddress} onChange={(e) => setShowAddress(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Show Business Address</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prints physical address details under headers</div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={showContact} onChange={(e) => setShowContact(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Show Contact Information</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prints phone numbers, emails, and website fields</div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={showBankDetails} onChange={(e) => setShowBankDetails(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Show Banking Details</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prints Bank Name, Account, IFSC, and UPI details</div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={showTerms} onChange={(e) => setShowTerms(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Show Terms & Conditions</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Prints default terms on invoice footer segments</div>
                      </div>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* TAB 3: Billing & Banking */}
            {activeTab === 'billing' && (
              <>
                {/* Banking details */}
                <div className="card">
                  <div className="card-title" style={{ gap: '8px', justifyContent: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <CreditCard size={20} style={{ color: 'var(--primary)' }} />
                    <span>Banking & Settlement Details</span>
                  </div>

                  <div className="form-grid-2" style={{ marginTop: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Bank Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Account Holder Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={accountHolderName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="form-group">
                      <label className="form-label">Account Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">IFSC Code</label>
                      <input
                        type="text"
                        className="form-control"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value)}
                        maxLength={11}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Branch Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">UPI ID (for quick payments)</label>
                    <input
                      type="text"
                      placeholder="e.g. storename@ybl"
                      className="form-control"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>
                </div>

                {/* Accounting & Invoice Configurations */}
                <div className="card">
                  <div className="card-title" style={{ gap: '8px', justifyContent: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <FileText size={20} style={{ color: 'var(--primary)' }} />
                    <span>Voucher & Document Prefixes</span>
                  </div>

                  <div className="form-grid-3" style={{ marginTop: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Invoice Prefix *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={invoicePrefix}
                        onChange={(e) => setInvoicePrefix(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Purchase Prefix *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={purchasePrefix}
                        onChange={(e) => setPurchasePrefix(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Quotation Prefix *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={quotationPrefix}
                        onChange={(e) => setQuotationPrefix(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ margin: 0 }}>
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

                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label className="form-label">Default Terms & Conditions</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={defaultTerms}
                      onChange={(e) => setDefaultTerms(e.target.value)}
                      placeholder="Add terms line by line..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Invoice Footer Message</label>
                    <input
                      type="text"
                      className="form-control"
                      value={footerMessage}
                      onChange={(e) => setFooterMessage(e.target.value)}
                      placeholder="Thank you for your business!"
                    />
                  </div>
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: 700 }}>
                Save Dynamic Settings
              </button>
            </div>

          </div>

          {/* Right side options: Theme, Formatters, Wipe database */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Color Palette */}
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

            {/* Formatting & System Defaults */}
            <div className="card">
              <div className="card-title" style={{ gap: '8px', justifyContent: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <Sliders size={18} style={{ color: 'var(--primary)' }} />
                <span>Format Preferences</span>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="form-label">Local Currency Symbol</label>
                <select 
                  className="form-control" 
                  value={currencySymbol} 
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                >
                  <option value="₹">₹ (INR Rupee)</option>
                  <option value="$">$ (USD Dollar)</option>
                  <option value="€">€ (Euro)</option>
                  <option value="£">£ (Pound)</option>
                  <option value="¥">¥ (Yen)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">System Date Format</label>
                <select 
                  className="form-control" 
                  value={dateFormat} 
                  onChange={(e) => setDateFormat(e.target.value)}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Standard)</option>
                  <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                </select>
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
      </form>
    </div>
  );
};
