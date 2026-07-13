import React, { useState, useRef } from 'react';
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
import { getFullAddress, initialSettings } from '../utils/dummyData';

export const Settings: React.FC = () => {
  const { settings, updateSettings, resetToDefault } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'banking' | 'branding' | 'prefixes' | 'system'>('profile');
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
  const [savedSignature, setSavedSignature] = useState(settings.signature || '');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
  const [defaultTerms, _setDefaultTerms] = useState(settings.defaultTerms || '');
  const [invoiceTerms, setInvoiceTerms] = useState(settings.invoiceTerms || initialSettings.invoiceTerms || '');
  const [quotationTerms, setQuotationTerms] = useState(settings.quotationTerms || initialSettings.quotationTerms || '');
  const [purchaseTerms, setPurchaseTerms] = useState(settings.purchaseTerms || initialSettings.purchaseTerms || '');
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
  const [showLowStockAlert, setShowLowStockAlert] = useState(settings.showLowStockAlert !== false);
  const [showOutOfStockAlert, setShowOutOfStockAlert] = useState(settings.showOutOfStockAlert !== false);

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
      invoiceTerms,
      quotationTerms,
      purchaseTerms,
      footerMessage,
      showLogo,
      showGstin,
      showAddress,
      showContact,
      showBankDetails,
      showTerms,
      currencySymbol,
      dateFormat,
      showLowStockAlert,
      showOutOfStockAlert,
      theme: settings.theme,
      address: legacyAddress,
      signature: savedSignature,
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

  const getEventCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: (e.touches[0].clientX - rect.left) * (canvas.width / rect.width),
        y: (e.touches[0].clientY - rect.top) * (canvas.height / rect.height),
      };
    } else {
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    const coords = getEventCoords(e, canvas);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1E3A8A'; // Professional dark blue ink
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getEventCoords(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignaturePad = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const trimCanvas = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let found = false;

    // Scan all pixels to find the bounding box of non-transparent pixels (alpha > 0)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 0) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }

    if (!found) {
      return canvas;
    }

    // Add 5px padding around the cropped signature area
    const padding = 5;
    const cropX = Math.max(0, minX - padding);
    const cropY = Math.max(0, minY - padding);
    const cropWidth = Math.min(width - cropX, (maxX - minX) + (padding * 2));
    const cropHeight = Math.min(height - cropY, (maxY - minY) + (padding * 2));

    const trimmedCanvas = document.createElement('canvas');
    trimmedCanvas.width = cropWidth;
    trimmedCanvas.height = cropHeight;
    const trimmedCtx = trimmedCanvas.getContext('2d');
    if (!trimmedCtx) return canvas;

    trimmedCtx.drawImage(
      canvas,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );

    return trimmedCanvas;
  };

  const handleSaveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Automatically crop transparent boundaries
    const trimmedCanvas = trimCanvas(canvas);
    const base64Data = trimmedCanvas.toDataURL('image/png');
    setSavedSignature(base64Data);
    updateSettings({
      ...settings,
      signature: base64Data
    });
  };

  const handleRemoveSignature = () => {
    setSavedSignature('');
    updateSettings({
      ...settings,
      signature: undefined
    });
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
      {/* Modern Inner Navigation Tabs */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px', 
          borderBottom: '1px solid var(--border-color)', 
          paddingBottom: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
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
          onClick={() => setActiveTab('banking')}
          className={`btn btn-sm ${activeTab === 'banking' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: activeTab === 'banking' ? 'none' : '1px solid var(--border-color)' }}
        >
          <CreditCard size={15} /> Bank Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`btn btn-sm ${activeTab === 'branding' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: activeTab === 'branding' ? 'none' : '1px solid var(--border-color)' }}
        >
          <ImageIcon size={15} /> Logos & Signature
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('prefixes')}
          className={`btn btn-sm ${activeTab === 'prefixes' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: activeTab === 'prefixes' ? 'none' : '1px solid var(--border-color)' }}
        >
          <FileText size={15} /> Vouchers & Terms
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`btn btn-sm ${activeTab === 'system' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ border: activeTab === 'system' ? 'none' : '1px solid var(--border-color)' }}
        >
          <Sliders size={15} /> Print & System
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* TAB 1: Business Profile & Address */}
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

          {/* TAB 2: Bank Details */}
          {activeTab === 'banking' && (
            <div className="card animate-fade-in">
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
          )}

          {/* TAB 3: Logos & Signature Branding */}
          {activeTab === 'branding' && (
            <>
              {/* Company Logo Card */}
              <div className="card animate-fade-in">
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
              <div className="card animate-fade-in">
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

              {/* E-Signature Drawing Card */}
              <div className="card animate-fade-in">
                <div className="card-title" style={{ gap: '8px', justifyContent: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <FileText size={20} style={{ color: 'var(--primary)' }} />
                  <span>Authorized Signatory E-Signature</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                  {savedSignature ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{ border: '2px dashed var(--border-color)', padding: '10px', borderRadius: '12px', width: '240px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
                        <img src={savedSignature} alt="E-Signature Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                      </div>
                      <button type="button" onClick={handleRemoveSignature} className="btn btn-danger btn-sm" style={{ color: 'var(--color-danger)' }}>
                        <Trash2 size={14} /> Remove Signature
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Draw your signature inside the box below in blue ink (automatically cropped to boundaries on save):
                      </div>
                      <div style={{ position: 'relative', border: '2px dashed var(--border-color)', borderRadius: '12px', backgroundColor: '#fff', overflow: 'hidden', height: '120px' }}>
                        <canvas
                          ref={canvasRef}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block', touchAction: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={clearSignaturePad} className="btn btn-secondary btn-sm">
                          Clear Pad
                        </button>
                        <button type="button" onClick={handleSaveSignature} className="btn btn-primary btn-sm">
                          Save Signature
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* TAB 4: Vouchers & Terms */}
          {activeTab === 'prefixes' && (
            <>
              {/* Accounting & Invoice Configurations */}
              <div className="card animate-fade-in">
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

              {/* Bill-Type Specific Terms & Conditions */}
              <div className="card animate-fade-in">
                <div className="card-title" style={{ gap: '8px', justifyContent: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <FileText size={20} style={{ color: 'var(--primary)' }} />
                  <span>Terms & Conditions (per Bill Type)</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>📄 Sales Invoice Terms</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={invoiceTerms}
                      onChange={(e) => setInvoiceTerms(e.target.value)}
                      placeholder="e.g. Goods once sold will not be taken back. Warranty as per manufacturer terms."
                      style={{ fontSize: '13px' }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>📋 Quotation / Estimate Terms</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={quotationTerms}
                      onChange={(e) => setQuotationTerms(e.target.value)}
                      placeholder="e.g. This quotation is valid for 15 days. Prices are subject to change without notice."
                      style={{ fontSize: '13px' }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>🧾 Purchase Bill Terms</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={purchaseTerms}
                      onChange={(e) => setPurchaseTerms(e.target.value)}
                      placeholder="e.g. Payment due within 30 days. Goods received in good condition."
                      style={{ fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px' }}>
                  These terms will automatically appear on their respective bill printouts.
                </div>
              </div>
            </>
          )}

          {/* TAB 5: Print Preferences & System Defaults */}
          {activeTab === 'system' && (
            <>
              {/* Color Palette (Theme Selection) */}
              <div className="card animate-fade-in">
                <div className="card-title" style={{ gap: '8px', justifyContent: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <Sun size={20} style={{ color: 'var(--primary)' }} />
                  <span>Color Palette Selection</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '20px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={`btn ${settings.theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, minWidth: '150px', justifyContent: 'center' }}
                    onClick={() => handleThemeChange('light')}
                  >
                    <Sun size={18} />
                    <span>Light Theme Mode</span>
                  </button>
                  <button
                    type="button"
                    className={`btn ${settings.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, minWidth: '150px', justifyContent: 'center' }}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <Moon size={18} />
                    <span>Dark Theme Mode</span>
                  </button>
                </div>
              </div>

              {/* Print Preferences */}
              <div className="card animate-fade-in">
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

              {/* Warning & Alert Preferences */}
              <div className="card animate-fade-in">
                <div className="card-title" style={{ gap: '8px', justifyContent: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <Eye size={20} style={{ color: 'var(--primary)' }} />
                  <span>Dashboard Alert Settings</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={showLowStockAlert} 
                      onChange={(e) => setShowLowStockAlert(e.target.checked)} 
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Below Safety Limit Warning</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Displays an alert when products fall below their minimum safety stock level</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={showOutOfStockAlert} 
                      onChange={(e) => setShowOutOfStockAlert(e.target.checked)} 
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }} 
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Completely Out of Stock Warning</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Displays an alert when products reach a stock count of zero</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Formatting & System Defaults */}
              <div className="card animate-fade-in">
                <div className="card-title" style={{ gap: '8px', justifyContent: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <Sliders size={20} style={{ color: 'var(--primary)' }} />
                  <span>Format Preferences</span>
                </div>

                <div className="form-grid-2" style={{ marginTop: '16px' }}>
                  <div className="form-group">
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
              </div>

              {/* Database Maintenance */}
              <div className="card animate-fade-in" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                <div className="card-title" style={{ gap: '8px', justifyContent: 'flex-start', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', paddingBottom: '12px' }}>
                  <RefreshCw size={20} style={{ color: 'var(--color-danger)' }} />
                  <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>Database Maintenance</span>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Wipe out all local operational modifications (new invoices, custom stock rates) and restore to initial database seeding.
                  </p>
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ width: 'auto', padding: '10px 20px' }}
                    onClick={handleReset}
                  >
                    <RefreshCw size={16} />
                    <span>Reset Store Database</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Persistent Action Footer with Inline Success Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginTop: '24px',
            padding: '16px 24px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
            <div style={{ flex: 1 }}>
              {savedSuccess && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#065f46',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  animation: 'fadeIn 0.2s ease-out'
                }}>
                  <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                  <span>Preferences saved successfully!</span>
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 28px', fontWeight: 700 }}>
              Save Settings
            </button>
          </div>

        </div>
      </form>
    </div>
  );

};
