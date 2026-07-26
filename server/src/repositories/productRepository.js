import Product from '../models/Product.js';

class ProductRepository {
  async findById(productId, companyId) {
    return Product.findOne({ productId, companyId, isDeleted: false });
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
    return Product.findOneAndUpdate({ productId, companyId, isDeleted: false }, updateData, opts);
  }

  async softDelete(productId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Product.findOneAndUpdate(
      { productId, companyId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(productId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Product.findOneAndUpdate(
      { productId, companyId, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Product.countDocuments({ companyId, isDeleted: false });
  }
}

export default new ProductRepository();
