import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    settingsId: { type: String, default: 'business', index: true },
    companyId: { type: String, required: true, unique: true, index: true },
    businessName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    gstin: { type: String, trim: true },
    panNumber: { type: String, trim: true },
    businessType: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    alternatePhone: { type: String, trim: true },
    email: { type: String, trim: true },
    website: { type: String, trim: true },
    
    // Address
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, trim: true },
    taluka: { type: String, trim: true },
    district: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    address: { type: String, trim: true }, // Legacy fallback
    
    // Branding
    logo: { type: String },
    watermarkLogo: { type: String },
    signature: { type: String },
    
    // Bank Details
    bankName: { type: String, trim: true },
    accountHolderName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    ifscCode: { type: String, trim: true },
    branchName: { type: String, trim: true },
    upiId: { type: String, trim: true },
    
    // Prefixes & Config
    invoicePrefix: { type: String, default: 'INV-' },
    purchasePrefix: { type: String, default: 'PUR-' },
    quotationPrefix: { type: String, default: 'QT-' },
    financialYear: { type: String },
    defaultTerms: { type: String },
    invoiceTerms: { type: String },
    quotationTerms: { type: String },
    purchaseTerms: { type: String },
    footerMessage: { type: String },
    
    // Print Preferences
    showLogo: { type: Boolean, default: true },
    showGstin: { type: Boolean, default: true },
    showAddress: { type: Boolean, default: true },
    showContact: { type: Boolean, default: true },
    showBankDetails: { type: Boolean, default: true },
    showTerms: { type: Boolean, default: true },
    
    // App Preferences
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    currencySymbol: { type: String, default: '₹' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    
    // Stock Alerts
    showLowStockAlert: { type: Boolean, default: true },
    showOutOfStockAlert: { type: Boolean, default: true },
    
    // Sync & Auditing
    version: { type: Number, default: 1 },
    deviceId: { type: String, default: 'server' },
    createdBy: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

settingsSchema.index({ companyId: 1, updatedAt: -1 });

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
