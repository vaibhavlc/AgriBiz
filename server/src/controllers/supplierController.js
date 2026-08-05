import supplierService from '../services/supplierService.js';
import logger from '../config/logger.js';
import { socketEmitter } from '../realtime/socketEmitter.js';

class SupplierController {
  async getSupplier(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const supplier = await supplierService.getSupplier(req.params.id, companyId);
      if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }
      res.status(200).json({ success: true, supplier });
    } catch (error) {
      next(error);
    }
  }

  async getSuppliers(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const suppliers = await supplierService.getAllSuppliers(companyId);
      res.status(200).json({ success: true, suppliers });
    } catch (error) {
      next(error);
    }
  }

  async createSupplier(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const creatorName = req.user.name;
      logger.info('Creating supplier for company %s by %s', companyId, creatorName);
      const supplier = await supplierService.createSupplier(req.body, companyId, creatorName);

      socketEmitter.publishSyncEvent({
        companyId,
        module: 'Supplier',
        action: 'CREATE',
        recordId: supplier.supplierId || supplier._id || supplier.id,
        updatedAt: supplier.updatedAt || new Date().toISOString(),
        senderUserId: req.user.userId,
        senderDeviceId: req.body.deviceId || req.headers['x-device-id'] || null,
        senderSocketId: req.headers['x-socket-id'] || null
      });

      res.status(201).json({ success: true, supplier });
    } catch (error) {
      next(error);
    }
  }

  async updateSupplier(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const updaterName = req.user.name;
      logger.info('Updating supplier %s for company %s by %s', req.params.id, companyId, updaterName);
      const supplier = await supplierService.updateSupplier(req.params.id, companyId, req.body, updaterName);
      if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier not found' });
      }

      socketEmitter.publishSyncEvent({
        companyId,
        module: 'Supplier',
        action: 'UPDATE',
        recordId: supplier.supplierId || req.params.id,
        updatedAt: supplier.updatedAt || new Date().toISOString(),
        senderUserId: req.user.userId,
        senderDeviceId: req.body.deviceId || req.headers['x-device-id'] || null,
        senderSocketId: req.headers['x-socket-id'] || null
      });

      res.status(200).json({ success: true, supplier });
    } catch (error) {
      next(error);
    }
  }

  async deleteSupplier(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const deleterName = req.user.name;
      logger.info('Deleting supplier %s for company %s by %s', req.params.id, companyId, deleterName);
      await supplierService.deleteSupplier(req.params.id, companyId, deleterName);

      socketEmitter.publishSyncEvent({
        companyId,
        module: 'Supplier',
        action: 'DELETE',
        recordId: req.params.id,
        updatedAt: new Date().toISOString(),
        senderUserId: req.user.userId,
        senderDeviceId: req.headers['x-device-id'] || null,
        senderSocketId: req.headers['x-socket-id'] || null
      });

      res.status(200).json({ success: true, message: 'Supplier soft-deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new SupplierController();
