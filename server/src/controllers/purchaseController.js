import purchaseService from '../services/purchaseService.js';
import logger from '../config/logger.js';

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
      const creatorName = req.user.name;
      logger.info('Creating purchase for company %s by %s', companyId, creatorName);
      const purchase = await purchaseService.createPurchase(req.body, companyId, creatorName);
      res.status(201).json({ success: true, purchase });
    } catch (error) {
      next(error);
    }
  }

  async updatePurchase(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const updaterName = req.user.name;
      logger.info('Updating purchase %s for company %s by %s', req.params.id, companyId, updaterName);
      const purchase = await purchaseService.updatePurchase(req.params.id, companyId, req.body, updaterName);
      if (!purchase) {
        return res.status(404).json({ success: false, message: 'Purchase not found' });
      }
      res.status(200).json({ success: true, purchase });
    } catch (error) {
      next(error);
    }
  }

  async deletePurchase(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const deleterName = req.user.name;
      logger.info('Deleting purchase %s for company %s by %s', req.params.id, companyId, deleterName);
      await purchaseService.deletePurchase(req.params.id, companyId, deleterName);
      res.status(200).json({ success: true, message: 'Purchase soft-deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new PurchaseController();
