import mongoose from 'mongoose';

const recycleBinItemSchema = new mongoose.Schema(
  {
    recycleBinItemId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    originalId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    module: {
      type: String,
      enum: ['Product', 'Customer', 'Supplier', 'Invoice', 'Quotation', 'Purchase', 'Payment', 'Expense'],
      required: true,
    },
    deletedAt: { type: String, required: true },
    deletedBy: { type: String, required: true },
    originalData: { type: mongoose.Schema.Types.Mixed, required: true },
    
    // Sync & Auditing
    version: { type: Number, default: 1 },
    deviceId: { type: String, default: 'server' },
  },
  { timestamps: true }
);

const RecycleBinItem = mongoose.model('RecycleBinItem', recycleBinItemSchema);
export default RecycleBinItem;
