import mongoose from 'mongoose';

const salaryRecordSchema = new mongoose.Schema(
  {
    salaryId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    staffId: { type: String, required: true, index: true },
    staffName: { type: String, required: true, trim: true },
    period: { type: String, required: true, index: true }, // e.g. "2026-08"
    date: { type: String, required: true },
    
    baseSalary: { type: Number, required: true, default: 0 },
    bonus: { type: Number, default: 0 },
    additionalEarnings: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    advancesDeducted: { type: Number, default: 0 },
    
    netSalaryPayable: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, required: true, default: 0 },
    balanceDue: { type: Number, required: true, default: 0 },
    
    status: { type: String, enum: ['Paid', 'Partial', 'Pending'], required: true, default: 'Pending' },
    paymentMethod: { type: String, enum: ['UPI', 'Cash', 'Bank Transfer', 'Cheque'] },
    paymentDate: { type: String },
    notes: { type: String },
    
    // Auditing
    createdBy: { type: String },
    updatedBy: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

salaryRecordSchema.index({ companyId: 1, staffId: 1 });
salaryRecordSchema.index({ companyId: 1, period: 1 });
salaryRecordSchema.index({ companyId: 1, status: 1 });
salaryRecordSchema.index({ companyId: 1, isDeleted: 1, createdAt: -1 });

const SalaryRecord = mongoose.model('SalaryRecord', salaryRecordSchema);
export default SalaryRecord;
