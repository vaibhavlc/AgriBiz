import productService from '../services/productService.js';
import logger from '../config/logger.js';
import { socketEmitter } from '../realtime/socketEmitter.js';

class ProductController {
  async getProduct(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const product = await productService.getProduct(req.params.id, companyId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      res.status(200).json({ success: true, product });
    } catch (error) {
      next(error);
    }
  }

  async getProducts(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const products = await productService.getAllProducts(companyId);
      res.status(200).json({ success: true, products });
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const creatorName = req.user.name;
      logger.info('Creating product for company %s by %s', companyId, creatorName);
      const product = await productService.createProduct(req.body, companyId, creatorName);

      socketEmitter.publishSyncEvent({
        companyId,
        module: 'Product',
        action: 'CREATE',
        recordId: product.productId || product._id || product.id,
        updatedAt: product.updatedAt || new Date().toISOString(),
        senderUserId: req.user.userId,
        senderDeviceId: req.body.deviceId || req.headers['x-device-id'] || null,
        senderSocketId: req.headers['x-socket-id'] || null
      });

      res.status(201).json({ success: true, product });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const updaterName = req.user.name;
      logger.info('Updating product %s for company %s by %s', req.params.id, companyId, updaterName);
      const product = await productService.updateProduct(req.params.id, companyId, req.body, updaterName);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      socketEmitter.publishSyncEvent({
        companyId,
        module: 'Product',
        action: 'UPDATE',
        recordId: product.productId || req.params.id,
        updatedAt: product.updatedAt || new Date().toISOString(),
        senderUserId: req.user.userId,
        senderDeviceId: req.body.deviceId || req.headers['x-device-id'] || null,
        senderSocketId: req.headers['x-socket-id'] || null
      });

      res.status(200).json({ success: true, product });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const deleterName = req.user.name;
      logger.info('Deleting product %s for company %s by %s', req.params.id, companyId, deleterName);
      await productService.deleteProduct(req.params.id, companyId, deleterName);

      socketEmitter.publishSyncEvent({
        companyId,
        module: 'Product',
        action: 'DELETE',
        recordId: req.params.id,
        updatedAt: new Date().toISOString(),
        senderUserId: req.user.userId,
        senderDeviceId: req.headers['x-device-id'] || null,
        senderSocketId: req.headers['x-socket-id'] || null
      });

      res.status(200).json({ success: true, message: 'Product soft-deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();
