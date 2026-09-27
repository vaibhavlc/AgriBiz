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
    if (!companyId) {
      const err = new Error('Company ID is required for tenant operations.');
      err.statusCode = 400;
      throw err;
    }
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
    if (!companyId) {
      const err = new Error('Company ID is required for deletion.');
      err.statusCode = 400;
      throw err;
    }
    if (!deletedBy) {
      const err = new Error('Authenticated user identity is required for deletion.');
      err.statusCode = 400;
      throw err;
    }

    return runInTransaction(async (session) => {
      let product = await productRepository.findById(productId, companyId, session);
      if (!product) {
        product = await productRepository.findAny(productId, companyId, session);
      }
      if (!product) {
        const err = new Error('Product not found');
        err.statusCode = 404;
        throw err;
      }
      if (product.isDeleted) {
        return product; // Idempotent: already soft deleted
      }

      const plainProduct = product.toObject ? product.toObject() : JSON.parse(JSON.stringify(product));
      const recycleBinItemData = {
        recycleBinItemId: `REC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        companyId,
        originalId: product.productId || product._id?.toString() || productId,
        name: product.name || productId,
        module: 'Product',
        deletedAt: new Date().toISOString(),
        deletedBy,
        originalData: plainProduct,
      };
      await recycleBinRepository.create(recycleBinItemData, session);

      const softDeleted = await productRepository.softDelete(productId, companyId, deletedBy, session);
      return softDeleted || product;
    });
  }
}

export default new ProductService();
