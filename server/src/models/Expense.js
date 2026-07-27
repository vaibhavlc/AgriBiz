import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    expenseId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    payee: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['UPI', 'Cash', 'Bank Transfer', 'Cheque'], required: true },
    status: { type: String, enum: ['Paid', 'Due'], required: true },
    dueDate: { type: String },
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

expenseSchema.index({ companyId: 1, isDeleted: 1 });
expenseSchema.index({ companyId: 1, updatedAt: -1 });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
