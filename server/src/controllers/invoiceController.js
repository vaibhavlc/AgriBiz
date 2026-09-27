import invoiceService from '../services/invoiceService.js';
import logger from '../config/logger.js';
import { touchCompanyData } from '../utils/updateCompanyTimestamp.js';

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
      const creatorName = req.user.userId || req.user.email || req.user.name;
      logger.info('Creating invoice for company %s by %s', companyId, creatorName);
      const invoice = await invoiceService.createInvoice(req.body, companyId, creatorName);
      await touchCompanyData(companyId, req.headers['x-socket-id'], 'Invoices', 'CREATE', invoice._id || invoice.invoiceId, invoice);
      res.status(201).json({ success: true, invoice });
    } catch (error) {
      next(error);
    }
  }

  async updateInvoice(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const updaterName = req.user.userId || req.user.email || req.user.name;
      logger.info('Updating invoice %s for company %s by %s', req.params.id, companyId, updaterName);
      const invoice = await invoiceService.updateInvoice(req.params.id, companyId, req.body, updaterName);
      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }
      await touchCompanyData(companyId, req.headers['x-socket-id'], 'Invoices', 'UPDATE', req.params.id, invoice);
      res.status(200).json({ success: true, invoice });
    } catch (error) {
      next(error);
    }
  }

  async deleteInvoice(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const deleterName = req.user.userId || req.user.email || req.user.name;
      if (!companyId || !deleterName) {
        return res.status(400).json({ success: false, message: 'Company ID and user identity are required for deletion.' });
      }
      logger.info('Deleting invoice %s for company %s by %s', req.params.id, companyId, deleterName);
      await invoiceService.deleteInvoice(req.params.id, companyId, deleterName);
      try {
        await touchCompanyData(companyId, req.headers['x-socket-id'], 'Invoices', 'DELETE', req.params.id);
      } catch (tErr) {
        logger.warn('touchCompanyData notice on invoice delete: %s', tErr.message);
      }
      res.status(200).json({ success: true, message: 'Invoice soft-deleted successfully' });
    } catch (error) {
      logger.error('deleteInvoice error for %s: %s\n%s', req.params.id, error.message, error.stack);
      next(error);
    }
  }
}

export default new InvoiceController();
