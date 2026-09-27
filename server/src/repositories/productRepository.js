import mongoose from 'mongoose';
import Product from '../models/Product.js';

class ProductRepository {
  buildQuery(productId, companyId, isDeleted = false) {
    const cleanId = typeof productId === 'object' && productId !== null
      ? (productId.productId || productId._id?.toString() || String(productId))
      : String(productId || '');
    const $or = [{ productId: cleanId }, { sku: cleanId }];
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      $or.push({ _id: cleanId });
    }
    const query = { $or };
    if (companyId) {
      query.$and = [
        { $or: [{ companyId }, { companyId: { $exists: false } }, { companyId: null }, { companyId: '' }] }
      ];
    }
    if (isDeleted === false) {
      query.isDeleted = { $ne: true };
    } else if (isDeleted === true) {
      query.isDeleted = true;
    }
    return query;
  }

  async findById(productId, companyId, session) {
    const opts = session ? { session } : {};
    return Product.findOne(this.buildQuery(productId, companyId, false), null, opts);
  }

  async findAny(productId, companyId, session) {
    const opts = session ? { session } : {};
    return Product.findOne(this.buildQuery(productId, companyId, null), null, opts);
  }

  async findAll(companyId) {
    const query = companyId ? { $or: [{ companyId }, { companyId: { $exists: false } }], isDeleted: { $ne: true } } : { isDeleted: { $ne: true } };
    return Product.find(query).sort({ createdAt: -1 });
  }

  async findBySku(sku, companyId) {
    return Product.findOne(this.buildQuery(sku, companyId, false));
  }

  async create(productData, session) {
    const opts = session ? { session } : {};
    const [product] = await Product.create([productData], opts);
    return product;
  }

  async update(productId, companyId, updateData, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Product.findOneAndUpdate(this.buildQuery(productId, companyId, null), updateData, opts);
  }

  async incrementStock(productId, companyId, deltaQuantity, session) {
    const cleanId = typeof productId === 'object' && productId !== null
      ? (productId.productId || productId._id?.toString() || String(productId))
      : String(productId || '');
    if (!cleanId) return null;
    const qty = Number(deltaQuantity) || 0;
    const opts = session ? { session, new: true } : { new: true };
    return Product.findOneAndUpdate(
      this.buildQuery(cleanId, companyId, null),
      { $inc: { stock: qty } },
      opts
    );
  }

  async softDelete(productId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Product.findOneAndUpdate(
      this.buildQuery(productId, companyId, null),
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
    const query = companyId ? { $or: [{ companyId }, { companyId: { $exists: false } }], isDeleted: { $ne: true } } : { isDeleted: { $ne: true } };
    return Product.countDocuments(query);
  }
}

export default new ProductRepository();
