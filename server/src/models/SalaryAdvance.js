import mongoose from 'mongoose';

const salaryAdvanceSchema = new mongoose.Schema(
  {
    advanceId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    staffId: { type: String, required: true, index: true },
    staffName: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    amount: { type: Number, required: true },
    settledAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['Active', 'Settled'], default: 'Active', index: true },
    notes: { type: String },
    
    // Auditing
    createdBy: { type: String },
    updatedBy: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

salaryAdvanceSchema.index({ companyId: 1, staffId: 1 });
salaryAdvanceSchema.index({ companyId: 1, status: 1 });
salaryAdvanceSchema.index({ companyId: 1, isDeleted: 1, createdAt: -1 });

const SalaryAdvance = mongoose.model('SalaryAdvance', salaryAdvanceSchema);
export default SalaryAdvance;
