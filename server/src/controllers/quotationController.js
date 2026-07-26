import quotationService from '../services/quotationService.js';
import logger from '../config/logger.js';

class QuotationController {
  async getQuotation(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const quotation = await quotationService.getQuotation(req.params.id, companyId);
      if (!quotation) {
        return res.status(404).json({ success: false, message: 'Quotation not found' });
      }
      res.status(200).json({ success: true, quotation });
    } catch (error) {
      next(error);
    }
  }

  async getQuotations(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const quotations = await quotationService.getAllQuotations(companyId);
      res.status(200).json({ success: true, quotations });
    } catch (error) {
      next(error);
    }
  }

  async createQuotation(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const creatorName = req.user.name;
      logger.info('Creating quotation for company %s by %s', companyId, creatorName);
      const quotation = await quotationService.createQuotation(req.body, companyId, creatorName);
      res.status(201).json({ success: true, quotation });
    } catch (error) {
      next(error);
    }
  }

  async updateQuotation(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const updaterName = req.user.name;
      logger.info('Updating quotation %s for company %s by %s', req.params.id, companyId, updaterName);
      const quotation = await quotationService.updateQuotation(req.params.id, companyId, req.body, updaterName);
      if (!quotation) {
        return res.status(404).json({ success: false, message: 'Quotation not found' });
      }
      res.status(200).json({ success: true, quotation });
    } catch (error) {
      next(error);
    }
  }

  async deleteQuotation(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const deleterName = req.user.name;
      logger.info('Deleting quotation %s for company %s by %s', req.params.id, companyId, deleterName);
      await quotationService.deleteQuotation(req.params.id, companyId, deleterName);
      res.status(200).json({ success: true, message: 'Quotation soft-deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new QuotationController();
