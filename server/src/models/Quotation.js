import mongoose from 'mongoose';

const quotationItemSchema = new mongoose.Schema({
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

const quotationSchema = new mongoose.Schema(
  {
    quotationId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    quotationNumber: { type: String, required: true, index: true },
    date: { type: String, required: true },
    validUntil: { type: String, required: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    items: [quotationItemSchema],
    subtotal: { type: Number, required: true },
    discountTotal: { type: Number, required: true },
    gstTotal: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    status: { type: String, enum: ['Draft', 'Sent', 'Approved', 'Declined', 'Converted'], required: true },
    convertedInvoiceId: { type: String },
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

const Quotation = mongoose.model('Quotation', quotationSchema);
export default Quotation;
