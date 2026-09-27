import mongoose from 'mongoose';
import Product from '../models/Product.js';

class ProductRepository {
  async findById(productId, companyId, session) {
    const opts = session ? { session } : {};
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(productId)) {
      query.$or = [{ productId }, { _id: productId }];
    } else {
      query.productId = productId;
    }
    return Product.findOne(query, null, opts);
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
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(productId)) {
      query.$or = [{ productId }, { _id: productId }];
    } else {
      query.productId = productId;
    }
    return Product.findOneAndUpdate(query, updateData, opts);
  }

  async incrementStock(productId, companyId, deltaQuantity, session) {
    const opts = session ? { session, new: true } : { new: true };
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(productId)) {
      query.$or = [{ productId }, { _id: productId }];
    } else {
      query.productId = productId;
    }
    return Product.findOneAndUpdate(
      query,
      { $inc: { stock: deltaQuantity } },
      opts
    );
  }

  async softDelete(productId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(productId)) {
      query.$or = [{ productId }, { _id: productId }];
    } else {
      query.productId = productId;
    }
    return Product.findOneAndUpdate(
      query,
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(productId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    const query = { companyId, isDeleted: true };
    if (mongoose.Types.ObjectId.isValid(productId)) {
      query.$or = [{ productId }, { _id: productId }];
    } else {
      query.productId = productId;
    }
    return Product.findOneAndUpdate(
      query,
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Product.countDocuments({ companyId, isDeleted: false });
  }
}

export default new ProductRepository();
