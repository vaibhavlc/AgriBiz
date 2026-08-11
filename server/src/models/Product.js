import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    stock: { type: Number, default: 0 },
    minStock: { type: Number, default: 0 },
    purchasePrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    gstRate: { type: Number, default: 0 },
    hsn: { type: String, trim: true },
    
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

productSchema.index({ companyId: 1, isDeleted: 1 });
productSchema.index({ companyId: 1, productId: 1, isDeleted: 1 });
productSchema.index({ companyId: 1, updatedAt: -1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
