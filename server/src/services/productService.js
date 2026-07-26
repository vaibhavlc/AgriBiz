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
    const payload = {
      ...productData,
      companyId,
      createdBy,
      updatedBy: createdBy,
    };
    return productRepository.create(payload);
  }

  async updateProduct(productId, companyId, updateData, updatedBy) {
    const payload = {
      ...updateData,
      updatedBy,
    };
    return productRepository.update(productId, companyId, payload);
  }

  async deleteProduct(productId, companyId, deletedBy) {
    return runInTransaction(async (session) => {
      const product = await productRepository.findById(productId, companyId);
      if (!product) throw new Error('Product not found');

      const recycleBinItemData = {
        recycleBinItemId: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        companyId,
        originalId: product.productId,
        name: product.name,
        module: 'Product',
        deletedAt: new Date().toISOString(),
        deletedBy,
        originalData: product,
      };

      await recycleBinRepository.create(recycleBinItemData, session);
      await productRepository.softDelete(productId, companyId, deletedBy, session);
      return product;
    });
  }
}

export default new ProductService();
