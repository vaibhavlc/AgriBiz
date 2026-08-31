import mongoose from 'mongoose';
import Company from '../models/Company.js';
import Settings from '../models/Settings.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import Product from '../models/Product.js';
import Invoice from '../models/Invoice.js';
import Quotation from '../models/Quotation.js';
import Purchase from '../models/Purchase.js';
import Expense from '../models/Expense.js';
import Payment from '../models/Payment.js';
import RecycleBinItem from '../models/RecycleBinItem.js';
import TemporaryEraseSnapshot from '../models/TemporaryEraseSnapshot.js';
import backupService from './backupService.js';
import logger from '../config/logger.js';
import { touchCompanyData } from '../utils/updateCompanyTimestamp.js';

class EraseService {
  /**
   * Returns live record summary and active temporary erase status for company.
   */
  async getEraseSummary(companyId) {
    const [
      companyDoc,
      customerCount,
      supplierCount,
      productCount,
      invoiceCount,
      quotationCount,
      purchaseCount,
      expenseCount,
      paymentCount,
      recycleBinCount,
      activeSnapshot,
    ] = await Promise.all([
      Company.findOne({ companyId }).select('businessName').lean(),
      Customer.countDocuments({ companyId }),
      Supplier.countDocuments({ companyId }),
      Product.countDocuments({ companyId }),
      Invoice.countDocuments({ companyId }),
      Quotation.countDocuments({ companyId }),
      Purchase.countDocuments({ companyId }),
      Expense.countDocuments({ companyId }),
      Payment.countDocuments({ companyId }),
      RecycleBinItem.countDocuments({ companyId }),
      TemporaryEraseSnapshot.findOne({ companyId, status: 'ACTIVE' }).lean(),
    ]);

    const summary = {
      customers: customerCount,
      suppliers: supplierCount,
      products: productCount,
      invoices: invoiceCount,
      quotations: quotationCount,
      purchases: purchaseCount,
      expenses: expenseCount,
      payments: paymentCount,
      recycleBin: recycleBinCount,
    };

    return {
      companyName: companyDoc?.businessName || 'Active Business',
      summary,
      activeTemporaryErase: activeSnapshot
        ? {
            eraseId: activeSnapshot.eraseId,
            erasedAt: activeSnapshot.erasedAt,
            erasedBy: activeSnapshot.erasedBy,
            dataSummary: activeSnapshot.dataSummary,
          }
        : null,
    };
  }

  /**
   * Performs Temporary Erase: Creates snapshot & clears operational data.
   * Uses multi-document transaction when available, with automatic non-transactional fallback for standalone MongoDB instances.
   */
  async temporaryErase(companyId, user, socketId = null) {
    backupService.acquireCompanyLock(companyId, 'Temporary Erase');
    try {
      logger.info('User %s initiated TEMPORARY ERASE for company %s', user.userId, companyId);

      const executeEraseLogic = async (opts = {}) => {
        // 1. Extract current operational business records
        const [
          companyDoc,
          settingsDoc,
          customers,
          suppliers,
          products,
          invoices,
          quotations,
          purchases,
          expenses,
          payments,
          recycleBinItems,
        ] = await Promise.all([
          Company.findOne({ companyId }, null, opts).lean(),
          Settings.findOne({ companyId }, null, opts).lean(),
          Customer.find({ companyId }, null, opts).lean(),
          Supplier.find({ companyId }, null, opts).lean(),
          Product.find({ companyId }, null, opts).lean(),
          Invoice.find({ companyId }, null, opts).lean(),
          Quotation.find({ companyId }, null, opts).lean(),
          Purchase.find({ companyId }, null, opts).lean(),
          Expense.find({ companyId }, null, opts).lean(),
          Payment.find({ companyId }, null, opts).lean(),
          RecycleBinItem.find({ companyId }, null, opts).lean(),
        ]);

        const dataSummary = {
          customers: customers.length,
          suppliers: suppliers.length,
          products: products.length,
          invoices: invoices.length,
          quotations: quotations.length,
          purchases: purchases.length,
          expenses: expenses.length,
          payments: payments.length,
          recycleBin: recycleBinItems.length,
        };

        const companyName = companyDoc?.businessName || settingsDoc?.businessName || `Company-${companyId}`;
        const eraseId = `ERASE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const snapshotPayload = {
          metadata: {
            appName: 'AgriBiz',
            backupVersion: '1.0',
            createdAt: new Date().toISOString(),
            companyId,
            companyName,
            dataSummary,
            erasedBy: user.name || user.userId || 'Business Owner',
          },
          company: companyDoc,
          settings: settingsDoc,
          customers,
          suppliers,
          products,
          invoices,
          quotations,
          purchases,
          expenses,
          payments,
          recycleBin: recycleBinItems,
        };

        // 2. Expire prior ACTIVE snapshots for this companyId ONLY
        await TemporaryEraseSnapshot.updateMany(
          { companyId, status: 'ACTIVE' },
          { $set: { status: 'SUPERSEDED' } },
          opts
        );

        // 3. Create new TemporaryEraseSnapshot
        await TemporaryEraseSnapshot.create(
          [
            {
              eraseId,
              companyId,
              erasedBy: user.name || user.userId || 'Business Owner',
              erasedAt: new Date(),
              dataSummary,
              data: snapshotPayload,
              status: 'ACTIVE',
            },
          ],
          opts
        );

        // 4. Delete operational documents for companyId ONLY
        await Promise.all([
          Customer.deleteMany({ companyId }, opts),
          Supplier.deleteMany({ companyId }, opts),
          Product.deleteMany({ companyId }, opts),
          Invoice.deleteMany({ companyId }, opts),
          Quotation.deleteMany({ companyId }, opts),
          Purchase.deleteMany({ companyId }, opts),
          Expense.deleteMany({ companyId }, opts),
          Payment.deleteMany({ companyId }, opts),
          RecycleBinItem.deleteMany({ companyId }, opts),
        ]);

        return { eraseId, dataSummary };
      };

      let session = null;
      try {
        session = await mongoose.startSession();
        session.startTransaction();
        const res = await executeEraseLogic({ session });
        await session.commitTransaction();
        session.endSession();

        await touchCompanyData(companyId, socketId, 'System', 'ERASE_TEMPORARY');
        logger.info('TEMPORARY ERASE completed for company %s. Snapshot ID: %s', companyId, res.eraseId);
        return {
          success: true,
          message: 'Business data temporarily erased. Your Company account and login access remain intact.',
          ...res,
        };
      } catch (txnError) {
        if (session) {
          try { await session.abortTransaction(); } catch (e) { /* ignore */ }
          session.endSession();
        }

        const isTxnNotSupported =
          txnError.message?.includes('in-progress transactions') ||
          txnError.message?.includes('Transaction numbers are only allowed') ||
          txnError.message?.includes('replica set') ||
          txnError.message?.includes('standalone') ||
          txnError.message?.includes('Transaction is not supported');

        if (isTxnNotSupported) {
          logger.info('MongoDB environment does not support transactions (likely running standalone). Falling back to non-transactional execution.');
          const res = await executeEraseLogic({});
          await touchCompanyData(companyId, socketId, 'System', 'ERASE_TEMPORARY');
          logger.info('TEMPORARY ERASE completed for company %s in fallback mode. Snapshot ID: %s', companyId, res.eraseId);
          return {
            success: true,
            message: 'Business data temporarily erased. Your Company account and login access remain intact.',
            ...res,
          };
        }

        throw txnError;
      }
    } finally {
      backupService.releaseCompanyLock(companyId);
    }
  }

  /**
   * Restores the most recent ACTIVE temporary erase snapshot atomically.
   */
  async undoLastErase(companyId, user, socketId = null) {
    logger.info('User %s requested UNDO LAST ERASE for company %s', user.userId, companyId);

    const executeUndoLogic = async (opts = {}) => {
      const snapshot = await TemporaryEraseSnapshot.findOneAndUpdate(
        { companyId, status: 'ACTIVE' },
        { $set: { status: 'RESTORING' } },
        { ...opts, new: true }
      );

      if (!snapshot) {
        throw new Error('No active temporary erase snapshot available to undo for this company.');
      }

      const data = snapshot.data || {};
      const { eraseId, dataSummary } = snapshot;

      const prepareDocs = (docs) => {
        if (!docs || !Array.isArray(docs)) return [];
        return docs.map((doc) => {
          const { _id, __v, ...rest } = doc;
          return { ...rest, companyId };
        });
      };

      // 1. Clear current operational data
      await Promise.all([
        Customer.deleteMany({ companyId }, opts),
        Supplier.deleteMany({ companyId }, opts),
        Product.deleteMany({ companyId }, opts),
        Invoice.deleteMany({ companyId }, opts),
        Quotation.deleteMany({ companyId }, opts),
        Purchase.deleteMany({ companyId }, opts),
        Expense.deleteMany({ companyId }, opts),
        Payment.deleteMany({ companyId }, opts),
        RecycleBinItem.deleteMany({ companyId }, opts),
      ]);

      // 2. Re-insert restored records from snapshot
      const restoredCustomers = prepareDocs(data.customers);
      const restoredSuppliers = prepareDocs(data.suppliers);
      const restoredProducts = prepareDocs(data.products);
      const restoredInvoices = prepareDocs(data.invoices);
      const restoredQuotations = prepareDocs(data.quotations);
      const restoredPurchases = prepareDocs(data.purchases);
      const restoredExpenses = prepareDocs(data.expenses);
      const restoredPayments = prepareDocs(data.payments);
      const restoredRecycleBin = prepareDocs(data.recycleBin);

      if (restoredCustomers.length > 0) await Customer.insertMany(restoredCustomers, { ...opts, ordered: true });
      if (restoredSuppliers.length > 0) await Supplier.insertMany(restoredSuppliers, { ...opts, ordered: true });
      if (restoredProducts.length > 0) await Product.insertMany(restoredProducts, { ...opts, ordered: true });
      if (restoredInvoices.length > 0) await Invoice.insertMany(restoredInvoices, { ...opts, ordered: true });
      if (restoredQuotations.length > 0) await Quotation.insertMany(restoredQuotations, { ...opts, ordered: true });
      if (restoredPurchases.length > 0) await Purchase.insertMany(restoredPurchases, { ...opts, ordered: true });
      if (restoredExpenses.length > 0) await Expense.insertMany(restoredExpenses, { ...opts, ordered: true });
      if (restoredPayments.length > 0) await Payment.insertMany(restoredPayments, { ...opts, ordered: true });
      if (restoredRecycleBin.length > 0) await RecycleBinItem.insertMany(restoredRecycleBin, { ...opts, ordered: true });

      // 3. Mark snapshot as UNDONE
      await TemporaryEraseSnapshot.updateOne(
        { eraseId },
        { $set: { status: 'UNDONE' } },
        opts
      );

      return { eraseId, dataSummary };
    };

    let session = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      const res = await executeUndoLogic({ session });
      await session.commitTransaction();
      session.endSession();

      await touchCompanyData(companyId, socketId, 'System', 'UNDO_ERASE');
      logger.info('UNDO LAST ERASE completed successfully for company %s (Snapshot ID: %s)', companyId, res.eraseId);
      return {
        success: true,
        message: 'Previous business data restored successfully.',
        ...res,
      };
    } catch (txnError) {
      if (session) {
        try { await session.abortTransaction(); } catch (e) { /* ignore */ }
        session.endSession();
      }

      const isTxnNotSupported =
        txnError.message?.includes('in-progress transactions') ||
        txnError.message?.includes('Transaction numbers are only allowed') ||
        txnError.message?.includes('replica set') ||
        txnError.message?.includes('standalone') ||
        txnError.message?.includes('Transaction is not supported');

      if (isTxnNotSupported) {
        logger.info('MongoDB environment does not support transactions (likely running standalone). Falling back to non-transactional execution.');
        const res = await executeUndoLogic({});
        await touchCompanyData(companyId, socketId, 'System', 'UNDO_ERASE');
        logger.info('UNDO LAST ERASE completed for company %s in fallback mode (Snapshot ID: %s)', companyId, res.eraseId);
        return {
          success: true,
          message: 'Previous business data restored successfully.',
          ...res,
        };
      }

      throw txnError;
    }
  }

  /**
   * Performs Permanent Erase: Deletes operational data and expires temporary snapshots atomically.
   */
  async permanentErase(companyId, user, socketId = null) {
    logger.info('User %s initiated PERMANENT ERASE for company %s', user.userId, companyId);

    const executePermanentLogic = async (opts = {}) => {
      // 1. Permanently delete operational business records for companyId
      await Promise.all([
        Customer.deleteMany({ companyId }, opts),
        Supplier.deleteMany({ companyId }, opts),
        Product.deleteMany({ companyId }, opts),
        Invoice.deleteMany({ companyId }, opts),
        Quotation.deleteMany({ companyId }, opts),
        Purchase.deleteMany({ companyId }, opts),
        Expense.deleteMany({ companyId }, opts),
        Payment.deleteMany({ companyId }, opts),
        RecycleBinItem.deleteMany({ companyId }, opts),
      ]);

      // 2. Expire all temporary erase snapshots for this company
      await TemporaryEraseSnapshot.updateMany(
        { companyId, status: { $in: ['ACTIVE', 'SUPERSEDED', 'RESTORING'] } },
        { $set: { status: 'EXPIRED' } },
        opts
      );
    };

    let session = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      await executePermanentLogic({ session });
      await session.commitTransaction();
      session.endSession();

      await touchCompanyData(companyId, socketId, 'System', 'ERASE_PERMANENT');
      logger.info('PERMANENT ERASE completed for company %s', companyId);
      return {
        success: true,
        message: 'Business data permanently erased. Your Company account and login access remain intact.',
      };
    } catch (txnError) {
      if (session) {
        try { await session.abortTransaction(); } catch (e) { /* ignore */ }
        session.endSession();
      }

      const isTxnNotSupported =
        txnError.message?.includes('in-progress transactions') ||
        txnError.message?.includes('Transaction numbers are only allowed') ||
        txnError.message?.includes('replica set') ||
        txnError.message?.includes('standalone') ||
        txnError.message?.includes('Transaction is not supported');

      if (isTxnNotSupported) {
        logger.info('MongoDB environment does not support transactions (likely running standalone). Falling back to non-transactional execution.');
        await executePermanentLogic({});
        await touchCompanyData(companyId, socketId, 'System', 'ERASE_PERMANENT');
        logger.info('PERMANENT ERASE completed for company %s in fallback mode', companyId);
        return {
          success: true,
          message: 'Business data permanently erased. Your Company account and login access remain intact.',
        };
      }

      throw txnError;
    }
  }
}

export default new EraseService();
