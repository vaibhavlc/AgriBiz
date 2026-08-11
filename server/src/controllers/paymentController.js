import paymentService from '../services/paymentService.js';
import logger from '../config/logger.js';
import { touchCompanyData } from '../utils/updateCompanyTimestamp.js';

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
      await touchCompanyData(companyId, req.headers['x-socket-id'], 'Payments', 'CREATE', payment._id || payment.paymentId, payment);
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
      await touchCompanyData(companyId, req.headers['x-socket-id'], 'Payments', 'UPDATE', req.params.id, payment);
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
      await touchCompanyData(companyId, req.headers['x-socket-id'], 'Payments', 'DELETE', req.params.id);
      res.status(200).json({ success: true, message: 'Payment record soft-deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentController();
