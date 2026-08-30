import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  gstRate: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  subtotal: { type: Number, required: true },
  total: { type: Number, required: true }
}, { _id: false });

const invoiceSchema = new mongoose.Schema(
  {
    invoiceId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    invoiceNumber: { type: String, required: true, index: true },
    date: { type: String, required: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    items: [invoiceItemSchema],
    subtotal: { type: Number, required: true },
    discountTotal: { type: Number, required: true },
    gstTotal: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    amountPaid: { type: Number, required: true },
    balanceDue: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['Paid', 'Partial', 'Unpaid'], required: true },
    paymentMethod: { type: String },
    referenceNumber: { type: String },
    dueDate: { type: String },
    notes: { type: String },
    showSignature: { type: Boolean, default: false },
    
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

invoiceSchema.index({ companyId: 1, isDeleted: 1 });
invoiceSchema.index({ companyId: 1, isDeleted: 1, createdAt: -1 });
invoiceSchema.index({ companyId: 1, updatedAt: -1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
