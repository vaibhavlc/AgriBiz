import invoiceService from '../services/invoiceService.js';
import logger from '../config/logger.js';

class InvoiceController {
  async getInvoice(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const invoice = await invoiceService.getInvoice(req.params.id, companyId);
      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }
      res.status(200).json({ success: true, invoice });
    } catch (error) {
      next(error);
    }
  }

  async getInvoices(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const invoices = await invoiceService.getAllInvoices(companyId);
      res.status(200).json({ success: true, invoices });
    } catch (error) {
      next(error);
    }
  }

  async createInvoice(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const creatorName = req.user.name;
      logger.info('Creating invoice for company %s by %s', companyId, creatorName);
      const invoice = await invoiceService.createInvoice(req.body, companyId, creatorName);
      res.status(201).json({ success: true, invoice });
    } catch (error) {
      next(error);
    }
  }

  async updateInvoice(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const updaterName = req.user.name;
      logger.info('Updating invoice %s for company %s by %s', req.params.id, companyId, updaterName);
      const invoice = await invoiceService.updateInvoice(req.params.id, companyId, req.body, updaterName);
      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }
      res.status(200).json({ success: true, invoice });
    } catch (error) {
      next(error);
    }
  }

  async deleteInvoice(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const deleterName = req.user.name;
      logger.info('Deleting invoice %s for company %s by %s', req.params.id, companyId, deleterName);
      await invoiceService.deleteInvoice(req.params.id, companyId, deleterName);
      res.status(200).json({ success: true, message: 'Invoice soft-deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new InvoiceController();
