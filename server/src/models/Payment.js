import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    type: { type: String, enum: ['CustomerReceipt', 'SupplierPayment'], required: true },
    contactId: { type: String, required: true, index: true },
    contactName: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['UPI', 'Cash', 'Bank Transfer', 'Cheque'], required: true },
    referenceNumber: { type: String },
    notes: { type: String },
    
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

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
