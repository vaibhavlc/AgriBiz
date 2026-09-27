import productRepository from '../repositories/productRepository.js';
import recycleBinRepository from '../repositories/recycleBinRepository.js';
import { runInTransaction } from '../utils/transactionHelper.js';

class ProductService {
  async getProduct(productId, companyId) {
    return productRepository.findById(productId, companyId);
  }

  async getAllProducts(companyId) {
    return productRepository.findAll(companyId);
  }

  async createProduct(productData, companyId, createdBy) {
    const initialStock = Math.max(0, parseInt(productData.openingStock ?? productData.stock ?? 0) || 0);
    const payload = {
      ...productData,
      stock: initialStock,
      companyId,
      createdBy,
      updatedBy: createdBy,
    };
    delete payload.openingStock;
    return productRepository.create(payload);
  }

  async updateProduct(productId, companyId, updateData, updatedBy) {
    const payload = {
      ...updateData,
      updatedBy,
    };
    // CRITICAL STOCK RULE: Product Editing must NEVER modify, overwrite, or reset stock
    delete payload.stock;
    delete payload.openingStock;
    return productRepository.update(productId, companyId, payload);
  }

  async deleteProduct(productId, companyId, deletedBy) {
    return runInTransaction(async (session) => {
      let product = await productRepository.findById(productId, companyId, session);
      if (!product) {
        product = await productRepository.findAny(productId, companyId, session);
      }
      if (!product) {
        product = await productRepository.findAny(productId, null, session);
      }
      if (!product) {
        const err = new Error('Product not found');
        err.statusCode = 404;
        throw err;
      }
      if (product.isDeleted) {
        return product; // Idempotent: already soft deleted
      }

      try {
        const plainProduct = product.toObject ? product.toObject() : JSON.parse(JSON.stringify(product));
        const effectiveDeleter = deletedBy || 'System';
        const effectiveCompany = companyId || product.companyId || 'DEFAULT_COMPANY';
        const recycleBinItemData = {
          recycleBinItemId: `REC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          companyId: effectiveCompany,
          originalId: product.productId || product._id?.toString() || productId,
          name: product.name || productId,
          module: 'Product',
          deletedAt: new Date().toISOString(),
          deletedBy: effectiveDeleter,
          originalData: plainProduct,
        };
        await recycleBinRepository.create(recycleBinItemData, session);
      } catch (rErr) {
        console.warn('Recycle bin record warning on product delete:', rErr.message);
      }

      const effectiveDeleter = deletedBy || 'System';
      let res = await productRepository.softDelete(productId, companyId || product.companyId, effectiveDeleter, session);
      if (!res && product._id) {
        await product.constructor.updateOne({ _id: product._id }, { isDeleted: true, deletedAt: new Date(), updatedBy: effectiveDeleter }, { session });
        res = await productRepository.findAny(productId, null, session);
      }
      return res || product;
    });
  }
}

export default new ProductService();
