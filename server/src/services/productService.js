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
      const product = await productRepository.findById(productId, companyId);
      if (!product) throw new Error('Product not found');

      const plainProduct = product.toObject ? product.toObject() : product;
      const effectiveDeleter = deletedBy || 'System';
      const recycleBinItemData = {
        recycleBinItemId: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        companyId,
        originalId: product.productId || product._id?.toString() || productId,
        name: product.name || productId,
        module: 'Product',
        deletedAt: new Date().toISOString(),
        deletedBy: effectiveDeleter,
        originalData: plainProduct,
      };

      await recycleBinRepository.create(recycleBinItemData, session);
      await productRepository.softDelete(productId, companyId, effectiveDeleter, session);
      return product;
    });
  }
}

export default new ProductService();
