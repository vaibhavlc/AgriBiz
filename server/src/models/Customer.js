import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    state: { type: String, trim: true },
    gstin: { type: String, trim: true },
    outstanding: { type: Number, default: 0 },
    allowedStaffActions: { type: [String], default: [] },
    
    // Sync & Auditing
    version: { type: Number, default: 1 },
    deviceId: { type: String, default: 'server' },
    createdBy: { type: String },
    updatedBy: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
