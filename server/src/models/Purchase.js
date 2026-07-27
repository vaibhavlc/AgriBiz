import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  gstRate: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  subtotal: { type: Number, required: true },
  total: { type: Number, required: true },
  discount: { type: Number, default: 0 }
}, { _id: false });

const purchaseSchema = new mongoose.Schema(
  {
    purchaseId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    purchaseNumber: { type: String, required: true, index: true },
    date: { type: String, required: true },
    supplierId: { type: String, required: true },
    supplierName: { type: String, required: true },
    items: [purchaseItemSchema],
    subtotal: { type: Number, required: true },
    gstTotal: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    amountPaid: { type: Number, required: true },
    balanceDue: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['Paid', 'Partial', 'Unpaid'], required: true },
    paymentMethod: { type: String },
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

purchaseSchema.index({ companyId: 1, isDeleted: 1 });
purchaseSchema.index({ companyId: 1, updatedAt: -1 });

const Purchase = mongoose.model('Purchase', purchaseSchema);
export default Purchase;
