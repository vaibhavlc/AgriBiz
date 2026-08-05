import customerService from '../services/customerService.js';
import logger from '../config/logger.js';
import { socketEmitter } from '../realtime/socketEmitter.js';

class CustomerController {
  async getCustomer(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const customer = await customerService.getCustomer(req.params.id, companyId);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }
      res.status(200).json({ success: true, customer });
    } catch (error) {
      next(error);
    }
  }

  async getCustomers(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const customers = await customerService.getAllCustomers(companyId);
      res.status(200).json({ success: true, customers });
    } catch (error) {
      next(error);
    }
  }

  async createCustomer(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const creatorName = req.user.name;
      logger.info('Creating customer for company %s by %s', companyId, creatorName);
      const customer = await customerService.createCustomer(req.body, companyId, creatorName);

      socketEmitter.publishSyncEvent({
        companyId,
        module: 'Customer',
        action: 'CREATE',
        recordId: customer.customerId || customer._id || customer.id,
        updatedAt: customer.updatedAt || new Date().toISOString(),
        senderUserId: req.user.userId,
        senderDeviceId: req.body.deviceId || req.headers['x-device-id'] || null,
        senderSocketId: req.headers['x-socket-id'] || null
      });

      res.status(201).json({ success: true, customer });
    } catch (error) {
      next(error);
    }
  }

  async updateCustomer(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const updaterName = req.user.name;
      logger.info('Updating customer %s for company %s by %s', req.params.id, companyId, updaterName);
      const customer = await customerService.updateCustomer(req.params.id, companyId, req.body, updaterName);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      socketEmitter.publishSyncEvent({
        companyId,
        module: 'Customer',
        action: 'UPDATE',
        recordId: customer.customerId || req.params.id,
        updatedAt: customer.updatedAt || new Date().toISOString(),
        senderUserId: req.user.userId,
        senderDeviceId: req.body.deviceId || req.headers['x-device-id'] || null,
        senderSocketId: req.headers['x-socket-id'] || null
      });

      res.status(200).json({ success: true, customer });
    } catch (error) {
      next(error);
    }
  }

  async deleteCustomer(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const deleterName = req.user.name;
      logger.info('Deleting customer %s for company %s by %s', req.params.id, companyId, deleterName);
      await customerService.deleteCustomer(req.params.id, companyId, deleterName);

      socketEmitter.publishSyncEvent({
        companyId,
        module: 'Customer',
        action: 'DELETE',
        recordId: req.params.id,
        updatedAt: new Date().toISOString(),
        senderUserId: req.user.userId,
        senderDeviceId: req.headers['x-device-id'] || null,
        senderSocketId: req.headers['x-socket-id'] || null
      });

      res.status(200).json({ success: true, message: 'Customer soft-deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new CustomerController();
