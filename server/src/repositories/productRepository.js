import mongoose from 'mongoose';
import Product from '../models/Product.js';

class ProductRepository {
  buildQuery(productId, companyId, isDeleted = false) {
    const $or = [{ productId }, { sku: productId }];
    if (mongoose.Types.ObjectId.isValid(productId)) {
      $or.push({ _id: productId });
    }
    return { companyId, isDeleted, $or };
  }

  async findById(productId, companyId, session) {
    const opts = session ? { session } : {};
    return Product.findOne(this.buildQuery(productId, companyId, false), null, opts);
  }

  async findAll(companyId) {
    return Product.find({ companyId, isDeleted: false });
  }

  async findBySku(sku, companyId) {
    return Product.findOne({ sku, companyId, isDeleted: false });
  }

  async create(productData, session) {
    const opts = session ? { session } : {};
    const [product] = await Product.create([productData], opts);
    return product;
  }

  async update(productId, companyId, updateData, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Product.findOneAndUpdate(this.buildQuery(productId, companyId, false), updateData, opts);
  }

  async incrementStock(productId, companyId, deltaQuantity, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Product.findOneAndUpdate(
      this.buildQuery(productId, companyId, false),
      { $inc: { stock: deltaQuantity } },
      opts
    );
  }

  async softDelete(productId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Product.findOneAndUpdate(
      this.buildQuery(productId, companyId, false),
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(productId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Product.findOneAndUpdate(
      this.buildQuery(productId, companyId, true),
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Product.countDocuments({ companyId, isDeleted: false });
  }
}

export default new ProductRepository();
