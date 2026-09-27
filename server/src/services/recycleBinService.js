import mongoose from 'mongoose';
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
  buildTargetQuery(idField, originalId, companyId) {
    let cleanId = '';
    if (typeof originalId === 'object' && originalId !== null) {
      cleanId = originalId[idField] || originalId.id || originalId._id?.toString() || String(originalId);
    } else {
      cleanId = String(originalId || '');
    }
    if (cleanId === '[object Object]') {
      cleanId = '';
    }
    const $or = [];
    if (cleanId) {
      $or.push({ [idField]: cleanId });
      if (mongoose.Types.ObjectId.isValid(cleanId)) {
        $or.push({ _id: cleanId });
      }
    }
    return $or.length > 0 ? { companyId, $or } : { companyId };
  }

  async getRecycleBin(companyId) {
    if (!companyId) return [];
    return recycleBinRepository.findAll(companyId);
  }

  async restoreRecord(recycleBinItemId, companyId) {
    if (!companyId) {
      const err = new Error('Company ID is required for restore.');
      err.statusCode = 400;
      throw err;
    }

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
    if (!companyId) {
      const err = new Error('Company ID is required for permanent deletion.');
      err.statusCode = 400;
      throw err;
    }

    return runInTransaction(async (session) => {
      const binItem = await recycleBinRepository.findById(recycleBinItemId, companyId, session);
      if (!binItem) {
        const err = new Error('Recycle bin item not found');
        err.statusCode = 404;
        throw err;
      }

      const { module, originalId } = binItem;
      const deleteOpts = session ? { session } : {};

      // Hard delete original record from DB matching either primary ID or Mongo _id STRICTLY scoped to companyId
      if (module === 'Product') {
        await Product.deleteOne(this.buildTargetQuery('productId', originalId, companyId), deleteOpts);
      } else if (module === 'Customer') {
        await Customer.deleteOne(this.buildTargetQuery('customerId', originalId, companyId), deleteOpts);
      } else if (module === 'Supplier') {
        await Supplier.deleteOne(this.buildTargetQuery('supplierId', originalId, companyId), deleteOpts);
      } else if (module === 'Invoice') {
        await Invoice.deleteOne(this.buildTargetQuery('invoiceId', originalId, companyId), deleteOpts);
      } else if (module === 'Quotation') {
        await Quotation.deleteOne(this.buildTargetQuery('quotationId', originalId, companyId), deleteOpts);
      } else if (module === 'Purchase') {
        await Purchase.deleteOne(this.buildTargetQuery('purchaseId', originalId, companyId), deleteOpts);
      } else if (module === 'Payment') {
        await Payment.deleteOne(this.buildTargetQuery('paymentId', originalId, companyId), deleteOpts);
      } else if (module === 'Expense') {
        await Expense.deleteOne(this.buildTargetQuery('expenseId', originalId, companyId), deleteOpts);
      }

      await recycleBinRepository.delete(recycleBinItemId, companyId, session);
      return binItem;
    });
  }
}

export default new RecycleBinService();
