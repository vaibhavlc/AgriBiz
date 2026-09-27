import recycleBinRepository from '../repositories/recycleBinRepository.js';
import productRepository from '../repositories/productRepository.js';
import customerRepository from '../repositories/customerRepository.js';
import supplierRepository from '../repositories/supplierRepository.js';
import invoiceRepository from '../repositories/invoiceRepository.js';
import quotationRepository from '../repositories/quotationRepository.js';
import purchaseRepository from '../repositories/purchaseRepository.js';
import paymentRepository from '../repositories/paymentRepository.js';
import expenseRepository from '../repositories/expenseRepository.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import Invoice from '../models/Invoice.js';
import Quotation from '../models/Quotation.js';
import Purchase from '../models/Purchase.js';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import { runInTransaction } from '../utils/transactionHelper.js';

class RecycleBinService {
  async getRecycleBin(companyId) {
    return recycleBinRepository.findAll(companyId);
  }

  async restoreRecord(recycleBinItemId, companyId) {
    return runInTransaction(async (session) => {
      const binItem = await recycleBinRepository.findById(recycleBinItemId, companyId, session);
      if (!binItem) {
        const err = new Error('Recycle bin item not found');
        err.statusCode = 404;
        throw err;
      }

      const { module, originalId } = binItem;

      if (module === 'Product') {
        await productRepository.restore(originalId, companyId, session);
      } else if (module === 'Customer') {
        await customerRepository.restore(originalId, companyId, session);
      } else if (module === 'Supplier') {
        await supplierRepository.restore(originalId, companyId, session);
      } else if (module === 'Invoice') {
        await invoiceRepository.restore(originalId, companyId, session);
      } else if (module === 'Quotation') {
        await quotationRepository.restore(originalId, companyId, session);
      } else if (module === 'Purchase') {
        await purchaseRepository.restore(originalId, companyId, session);
      } else if (module === 'Payment') {
        await paymentRepository.restore(originalId, companyId, session);
      } else if (module === 'Expense') {
        await expenseRepository.restore(originalId, companyId, session);
      }

      await recycleBinRepository.delete(recycleBinItemId, companyId, session);
      return binItem;
    });
  }

  async deletePermanently(recycleBinItemId, companyId) {
    return runInTransaction(async (session) => {
      const binItem = await recycleBinRepository.findById(recycleBinItemId, companyId, session);
      if (!binItem) {
        const err = new Error('Recycle bin item not found');
        err.statusCode = 404;
        throw err;
      }

      const { module, originalId } = binItem;
      const deleteOpts = session ? { session } : {};

      // Hard delete original record from DB matching either primary ID or Mongo _id
      const idOrObjId = [{ productId: originalId }, { customerId: originalId }, { supplierId: originalId }, { invoiceId: originalId }, { quotationId: originalId }, { purchaseId: originalId }, { paymentId: originalId }, { expenseId: originalId }];
      
      if (module === 'Product') {
        await Product.deleteOne({ $or: [{ productId: originalId }, { _id: originalId }] }, deleteOpts);
      } else if (module === 'Customer') {
        await Customer.deleteOne({ $or: [{ customerId: originalId }, { _id: originalId }] }, deleteOpts);
      } else if (module === 'Supplier') {
        await Supplier.deleteOne({ $or: [{ supplierId: originalId }, { _id: originalId }] }, deleteOpts);
      } else if (module === 'Invoice') {
        await Invoice.deleteOne({ $or: [{ invoiceId: originalId }, { _id: originalId }] }, deleteOpts);
      } else if (module === 'Quotation') {
        await Quotation.deleteOne({ $or: [{ quotationId: originalId }, { _id: originalId }] }, deleteOpts);
      } else if (module === 'Purchase') {
        await Purchase.deleteOne({ $or: [{ purchaseId: originalId }, { _id: originalId }] }, deleteOpts);
      } else if (module === 'Payment') {
        await Payment.deleteOne({ $or: [{ paymentId: originalId }, { _id: originalId }] }, deleteOpts);
      } else if (module === 'Expense') {
        await Expense.deleteOne({ $or: [{ expenseId: originalId }, { _id: originalId }] }, deleteOpts);
      }

      await recycleBinRepository.delete(recycleBinItemId, companyId, session);
      return binItem;
    });
  }
}

export default new RecycleBinService();
