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
      const binItem = await recycleBinRepository.findById(recycleBinItemId, companyId);
      if (!binItem) throw new Error('Recycle bin item not found');

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
      const binItem = await recycleBinRepository.findById(recycleBinItemId, companyId);
      if (!binItem) throw new Error('Recycle bin item not found');

      const { module, originalId } = binItem;
      const deleteOpts = session ? { session } : {};

      // Hard delete original record from DB
      if (module === 'Product') {
        await Product.deleteOne({ productId: originalId, companyId }, deleteOpts);
      } else if (module === 'Customer') {
        await Customer.deleteOne({ customerId: originalId, companyId }, deleteOpts);
      } else if (module === 'Supplier') {
        await Supplier.deleteOne({ supplierId: originalId, companyId }, deleteOpts);
      } else if (module === 'Invoice') {
        await Invoice.deleteOne({ invoiceId: originalId, companyId }, deleteOpts);
      } else if (module === 'Quotation') {
        await Quotation.deleteOne({ quotationId: originalId, companyId }, deleteOpts);
      } else if (module === 'Purchase') {
        await Purchase.deleteOne({ purchaseId: originalId, companyId }, deleteOpts);
      } else if (module === 'Payment') {
        await Payment.deleteOne({ paymentId: originalId, companyId }, deleteOpts);
      } else if (module === 'Expense') {
        await Expense.deleteOne({ expenseId: originalId, companyId }, deleteOpts);
      }

      await recycleBinRepository.delete(recycleBinItemId, companyId, session);
      return binItem;
    });
  }
}

export default new RecycleBinService();
