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
   * Performs Temporary Erase: Creates snapshot & clears operational data inside a single transaction.
   */
  async temporaryErase(companyId, user, socketId = null) {
    backupService.acquireCompanyLock(companyId, 'Temporary Erase');
    try {
      logger.info('User %s initiated TEMPORARY ERASE for company %s', user.userId, companyId);

      let session = null;
      let useTransaction = false;

      try {
        session = await mongoose.startSession();
        session.startTransaction();
        useTransaction = true;
      } catch (err) {
        logger.warn('Mongoose session transaction unavailable: %s. Using fallback mode.', err.message);
        if (session) session.endSession();
        session = null;
      }

      const opts = session ? { session } : {};

      try {
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

        const sanitizeDocs = (docs) => {
          if (!docs || !Array.isArray(docs)) return [];
          return docs.map((doc) => {
            const { _id, __v, ...rest } = doc;
            return rest;
          });
        };

        const snapshotPayload = {
          company: companyDoc ? { businessName: companyDoc.businessName, ownerName: companyDoc.ownerName, mobile: companyDoc.mobile, email: companyDoc.email, gstin: companyDoc.gstin, address: companyDoc.address, city: companyDoc.city, state: companyDoc.state } : null,
          settings: settingsDoc ? (() => { const { _id, __v, ...rest } = settingsDoc; return rest; })() : null,
          customers: sanitizeDocs(customers),
          suppliers: sanitizeDocs(suppliers),
          products: sanitizeDocs(products),
          invoices: sanitizeDocs(invoices),
          quotations: sanitizeDocs(quotations),
          purchases: sanitizeDocs(purchases),
          expenses: sanitizeDocs(expenses),
          payments: sanitizeDocs(payments),
          recycleBin: sanitizeDocs(recycleBinItems),
        };

        // Check snapshot size safety (12MB BSON safety threshold)
        const estimatedSize = Buffer.byteLength(JSON.stringify(snapshotPayload));
        const maxAllowedSize = 12 * 1024 * 1024; // 12 MB
        if (estimatedSize > maxAllowedSize) {
          throw new Error(`Business dataset size (${(estimatedSize / (1024 * 1024)).toFixed(2)} MB) exceeds temporary snapshot memory limit (12 MB). Please perform a Permanent Erase or download a manual Backup file.`);
        }

        // 2. Mark existing ACTIVE snapshots for this company as SUPERSEDED
        await TemporaryEraseSnapshot.updateMany(
          { companyId, status: 'ACTIVE' },
          { $set: { status: 'SUPERSEDED' } },
          opts
        );

        // 3. Save new ACTIVE snapshot inside transaction
        const eraseId = `ERS-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
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

        if (useTransaction && session) {
          await session.commitTransaction();
          session.endSession();
        }

        // Notify connected clients
        await touchCompanyData(companyId, socketId, 'System', 'ERASE_TEMPORARY');

        logger.info('TEMPORARY ERASE completed for company %s. Snapshot ID: %s', companyId, eraseId);

        return {
          success: true,
          message: 'Business data temporarily erased. Your Company account and login access remain intact.',
          eraseId,
          dataSummary,
        };
      } catch (error) {
        if (useTransaction && session) {
          logger.error('Aborting TEMPORARY ERASE transaction for company %s: %s', companyId, error.message);
          await session.abortTransaction();
          session.endSession();
        }
        throw error;
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

    let session = null;
    let useTransaction = false;

    try {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransaction = true;
    } catch (err) {
      logger.warn('Mongoose session transaction unavailable: %s', err.message);
      if (session) session.endSession();
      session = null;
    }

    const opts = session ? { session } : {};

    try {
      // Atomic concurrency lock: acquire ACTIVE snapshot and lock status
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

      if (useTransaction && session) {
        await session.commitTransaction();
        session.endSession();
      }

      await touchCompanyData(companyId, socketId, 'System', 'UNDO_ERASE');

      logger.info('UNDO LAST ERASE completed successfully for company %s (Snapshot ID: %s)', companyId, eraseId);

      return {
        success: true,
        message: 'Previous business data restored successfully.',
        eraseId,
        dataSummary,
      };
    } catch (error) {
      if (useTransaction && session) {
        logger.error('Aborting UNDO LAST ERASE transaction for company %s: %s', companyId, error.message);
        await session.abortTransaction();
        session.endSession();
      }
      throw error;
    }
  }

  /**
   * Performs Permanent Erase: Deletes operational data and expires temporary snapshots atomically.
   */
  async permanentErase(companyId, user, socketId = null) {
    logger.info('User %s initiated PERMANENT ERASE for company %s', user.userId, companyId);

    let session = null;
    let useTransaction = false;

    try {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransaction = true;
    } catch (err) {
      logger.warn('Mongoose session transaction unavailable: %s', err.message);
      if (session) session.endSession();
      session = null;
    }

    const opts = session ? { session } : {};

    try {
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

      // 2. Expire all temporary erase snapshots for this company inside the transaction
      await TemporaryEraseSnapshot.updateMany(
        { companyId, status: { $in: ['ACTIVE', 'SUPERSEDED', 'RESTORING'] } },
        { $set: { status: 'EXPIRED' } },
        opts
      );

      if (useTransaction && session) {
        await session.commitTransaction();
        session.endSession();
      }

      await touchCompanyData(companyId, socketId, 'System', 'ERASE_PERMANENT');

      logger.info('PERMANENT ERASE completed for company %s', companyId);

      return {
        success: true,
        message: 'Business data permanently erased. Your Company account and login access remain intact.',
      };
    } catch (error) {
      if (useTransaction && session) {
        logger.error('Aborting PERMANENT ERASE transaction for company %s: %s', companyId, error.message);
        await session.abortTransaction();
        session.endSession();
      }
      throw error;
    }
  }
}

export default new EraseService();
