import purchaseService from '../services/purchaseService.js';
import logger from '../config/logger.js';
import { touchCompanyData } from '../utils/updateCompanyTimestamp.js';

class PurchaseController {
  async getPurchase(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const purchase = await purchaseService.getPurchase(req.params.id, companyId);
      if (!purchase) {
        return res.status(404).json({ success: false, message: 'Purchase not found' });
      }
      res.status(200).json({ success: true, purchase });
    } catch (error) {
      next(error);
    }
  }

  async getPurchases(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const purchases = await purchaseService.getAllPurchases(companyId);
      res.status(200).json({ success: true, purchases });
    } catch (error) {
      next(error);
    }
  }

  async createPurchase(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const creatorName = req.user.name || req.user.role || req.user.userId || 'System';
      logger.info('Creating purchase for company %s by %s', companyId, creatorName);
      const purchase = await purchaseService.createPurchase(req.body, companyId, creatorName);
      await touchCompanyData(companyId, req.headers['x-socket-id'], 'Purchases', 'CREATE', purchase._id || purchase.purchaseId, purchase);
      res.status(201).json({ success: true, purchase });
    } catch (error) {
      next(error);
    }
  }

  async updatePurchase(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const updaterName = req.user.name || req.user.role || req.user.userId || 'System';
      logger.info('Updating purchase %s for company %s by %s', req.params.id, companyId, updaterName);
      const purchase = await purchaseService.updatePurchase(req.params.id, companyId, req.body, updaterName);
      if (!purchase) {
        return res.status(404).json({ success: false, message: 'Purchase not found' });
      }
      await touchCompanyData(companyId, req.headers['x-socket-id'], 'Purchases', 'UPDATE', req.params.id, purchase);
      res.status(200).json({ success: true, purchase });
    } catch (error) {
      next(error);
    }
  }

  async deletePurchase(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const deleterName = req.user.name || req.user.role || req.user.userId || 'System';
      logger.info('Deleting purchase %s for company %s by %s', req.params.id, companyId, deleterName);
      await purchaseService.deletePurchase(req.params.id, companyId, deleterName);
      try {
        await touchCompanyData(companyId, req.headers['x-socket-id'], 'Purchases', 'DELETE', req.params.id);
      } catch (tErr) {
        logger.warn('touchCompanyData notice on purchase delete: %s', tErr.message);
      }
      res.status(200).json({ success: true, message: 'Purchase soft-deleted successfully' });
    } catch (error) {
      logger.error('deletePurchase error for %s: %s\n%s', req.params.id, error.message, error.stack);
      next(error);
    }
  }
}

export default new PurchaseController();
