import paymentService from '../services/paymentService.js';
import logger from '../config/logger.js';
import { socketEmitter } from '../realtime/socketEmitter.js';

class PaymentController {
  async getPayment(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const payment = await paymentService.getPayment(req.params.id, companyId);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }
      res.status(200).json({ success: true, payment });
    } catch (error) {
      next(error);
    }
  }

  async getPayments(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const payments = await paymentService.getAllPayments(companyId);
      res.status(200).json({ success: true, payments });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentsByContact(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const payments = await paymentService.getPaymentsByContact(req.params.contactId, companyId);
      res.status(200).json({ success: true, payments });
    } catch (error) {
      next(error);
    }
  }

  async createPayment(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const creatorName = req.user.name;
      logger.info('Creating payment record for company %s by %s', companyId, creatorName);
      const payment = await paymentService.createPayment(req.body, companyId, creatorName);

      socketEmitter.publishSyncEvent({
        companyId,
        module: 'Payment',
        action: 'CREATE',
        recordId: payment.paymentId || payment._id || payment.id,
        updatedAt: payment.updatedAt || new Date().toISOString(),
        senderUserId: req.user.userId,
        senderDeviceId: req.body.deviceId || req.headers['x-device-id'] || null,
        senderSocketId: req.headers['x-socket-id'] || null
      });

      res.status(201).json({ success: true, payment });
    } catch (error) {
      next(error);
    }
  }

  async updatePayment(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const updaterName = req.user.name;
      logger.info('Updating payment record %s for company %s by %s', req.params.id, companyId, updaterName);
      const payment = await paymentService.updatePayment(req.params.id, companyId, req.body, updaterName);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }

      socketEmitter.publishSyncEvent({
        companyId,
        module: 'Payment',
        action: 'UPDATE',
        recordId: payment.paymentId || req.params.id,
        updatedAt: payment.updatedAt || new Date().toISOString(),
        senderUserId: req.user.userId,
        senderDeviceId: req.body.deviceId || req.headers['x-device-id'] || null,
        senderSocketId: req.headers['x-socket-id'] || null
      });

      res.status(200).json({ success: true, payment });
    } catch (error) {
      next(error);
    }
  }

  async deletePayment(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const deleterName = req.user.name;
      logger.info('Deleting payment record %s for company %s by %s', req.params.id, companyId, deleterName);
      await paymentService.deletePayment(req.params.id, companyId, deleterName);

      socketEmitter.publishSyncEvent({
        companyId,
        module: 'Payment',
        action: 'DELETE',
        recordId: req.params.id,
        updatedAt: new Date().toISOString(),
        senderUserId: req.user.userId,
        senderDeviceId: req.headers['x-device-id'] || null,
        senderSocketId: req.headers['x-socket-id'] || null
      });

      res.status(200).json({ success: true, message: 'Payment record soft-deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentController();
