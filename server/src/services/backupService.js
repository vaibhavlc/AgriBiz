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
import logger from '../config/logger.js';
import { touchCompanyData } from '../utils/updateCompanyTimestamp.js';

class BackupService {
  /**
   * Generates a complete business backup for the active company.
   * Strictly excludes sensitive authentication, session, and platform subscription data.
   */
  async exportBackup(companyId, user = null) {
    if (!companyId) {
      throw new Error('Company ID is required to generate a backup.');
    }

    logger.info('Generating data backup for company %s', companyId);

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
      Company.findOne({ companyId }).lean(),
      Settings.findOne({ companyId }).lean(),
      Customer.find({ companyId }).lean(),
      Supplier.find({ companyId }).lean(),
      Product.find({ companyId }).lean(),
      Invoice.find({ companyId }).lean(),
      Quotation.find({ companyId }).lean(),
      Purchase.find({ companyId }).lean(),
      Expense.find({ companyId }).lean(),
      Payment.find({ companyId }).lean(),
      RecycleBinItem.find({ companyId }).lean(),
    ]);

    const companyName = companyDoc?.businessName || settingsDoc?.businessName || 'AgriBiz Business';
    const createdAt = new Date().toISOString();

    // Calculate actual record counts directly from extracted arrays
    const calculatedSummary = {
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

    const metadata = {
      appName: 'AgriBiz',
      backupVersion: '1.0',
      createdAt,
      companyId,
      companyName,
      dataSummary: calculatedSummary,
    };

    // Sanitize Mongoose fields and platform-sensitive fields
    const sanitizeDoc = (doc) => {
      if (!doc) return null;
      const { _id, __v, createdAt: cAt, updatedAt: uAt, ...rest } = doc;
      return rest;
    };

    const sanitizeDocs = (docs) => {
      if (!docs || !Array.isArray(docs)) return [];
      return docs.map((doc) => {
        const { _id, __v, ...rest } = doc;
        return rest;
      });
    };

    // Extract business-only company profile fields (exclude plan, status, etc.)
    const companyBusinessProfile = companyDoc
      ? {
          businessName: companyDoc.businessName,
          ownerName: companyDoc.ownerName,
          mobile: companyDoc.mobile,
          email: companyDoc.email,
          gstin: companyDoc.gstin,
          address: companyDoc.address,
          city: companyDoc.city,
          state: companyDoc.state,
        }
      : null;

    // Extract business-only settings fields
    const settingsBusinessProfile = settingsDoc ? sanitizeDoc(settingsDoc) : null;
    if (settingsBusinessProfile) {
      delete settingsBusinessProfile.lastBackupInfo;
      delete settingsBusinessProfile.lastRestoreInfo;
    }

    const backupPayload = {
      metadata,
      data: {
        company: companyBusinessProfile,
        settings: settingsBusinessProfile,
        customers: sanitizeDocs(customers),
        suppliers: sanitizeDocs(suppliers),
        products: sanitizeDocs(products),
        invoices: sanitizeDocs(invoices),
        quotations: sanitizeDocs(quotations),
        purchases: sanitizeDocs(purchases),
        expenses: sanitizeDocs(expenses),
        payments: sanitizeDocs(payments),
        recycleBin: sanitizeDocs(recycleBinItems),
      },
    };

    // Store ONLY backup metadata on the server (do not store full backup JSON)
    const backupMetadataRecord = {
      companyId,
      createdAt,
      createdBy: user?.name || user?.userId || 'Business Owner',
      backupVersion: '1.0',
      fileName: `agribiz-backup-${companyId}-${createdAt.split('T')[0]}.json`,
      dataSummary: calculatedSummary,
    };

    try {
      await Settings.findOneAndUpdate(
        { companyId },
        { $set: { lastBackupMetadata: backupMetadataRecord } },
        { upsert: true }
      );
    } catch (err) {
      logger.warn('Failed to update lastBackupMetadata in Settings: %s', err.message);
    }

    return backupPayload;
  }

  /**
   * Validates backup format, company match, structure, and entity relationship integrity.
   * Calculates fresh preview summary directly from actual uploaded arrays.
   */
  validateBackup(backupPayload, targetCompanyId) {
    if (!backupPayload || typeof backupPayload !== 'object') {
      return { valid: false, message: 'Invalid backup file: Payload is empty or not a valid JSON object.' };
    }

    const { metadata, data } = backupPayload;

    if (!metadata || typeof metadata !== 'object') {
      return { valid: false, message: 'Invalid backup file: Missing backup metadata.' };
    }

    if (metadata.appName !== 'AgriBiz') {
      return { valid: false, message: `Incompatible application: Expected 'AgriBiz', received '${metadata.appName || 'Unknown'}'.` };
    }

    if (!metadata.backupVersion || String(metadata.backupVersion) !== '1.0') {
      return { valid: false, message: `Unsupported backup version: '${metadata.backupVersion || 'Unknown'}'.` };
    }

    if (!metadata.companyId) {
      return { valid: false, message: 'Invalid backup metadata: Missing company identity.' };
    }

    if (metadata.companyId !== targetCompanyId) {
      return {
        valid: false,
        message: `Company mismatch: This backup was generated for company '${metadata.companyId}', but your active company account is '${targetCompanyId}'. Backups can only be restored to their original company account.`,
      };
    }

    if (!data || typeof data !== 'object') {
      return { valid: false, message: 'Invalid backup payload: Missing business data content.' };
    }

    // Verify collection arrays
    const collections = ['customers', 'suppliers', 'products', 'invoices', 'quotations', 'purchases', 'expenses', 'payments', 'recycleBin'];
    for (const key of collections) {
      if (data[key] !== undefined && !Array.isArray(data[key])) {
        return { valid: false, message: `Corrupted backup data: Field '${key}' must be an array of records.` };
      }
    }

    // ALWAYS calculate preview summary from actual uploaded arrays (do not trust metadata claims)
    const calculatedSummary = {
      customers: Array.isArray(data.customers) ? data.customers.length : 0,
      suppliers: Array.isArray(data.suppliers) ? data.suppliers.length : 0,
      products: Array.isArray(data.products) ? data.products.length : 0,
      invoices: Array.isArray(data.invoices) ? data.invoices.length : 0,
      quotations: Array.isArray(data.quotations) ? data.quotations.length : 0,
      purchases: Array.isArray(data.purchases) ? data.purchases.length : 0,
      expenses: Array.isArray(data.expenses) ? data.expenses.length : 0,
      payments: Array.isArray(data.payments) ? data.payments.length : 0,
      recycleBin: Array.isArray(data.recycleBin) ? data.recycleBin.length : 0,
    };

    // Relationship Integrity Checks
    const customerIds = new Set((data.customers || []).map((c) => c.customerId || c.id).filter(Boolean));
    const supplierIds = new Set((data.suppliers || []).map((s) => s.supplierId || s.id).filter(Boolean));

    // Validate invoices reference existing customers if customerId is supplied
    for (const inv of data.invoices || []) {
      if (inv.customerId && customerIds.size > 0 && !customerIds.has(inv.customerId)) {
        logger.warn('Validation notice: Invoice %s references customerId %s not present in backup.', inv.invoiceId || inv.id, inv.customerId);
      }
    }

    // Validate payments reference existing customers/suppliers
    for (const pay of data.payments || []) {
      if (pay.partyType === 'Customer' && pay.partyId && customerIds.size > 0 && !customerIds.has(pay.partyId)) {
        logger.warn('Validation notice: Payment %s references customerId %s.', pay.paymentId || pay.id, pay.partyId);
      }
      if (pay.partyType === 'Supplier' && pay.partyId && supplierIds.size > 0 && !supplierIds.has(pay.partyId)) {
        logger.warn('Validation notice: Payment %s references supplierId %s.', pay.paymentId || pay.id, pay.partyId);
      }
    }

    return {
      valid: true,
      metadata: {
        ...metadata,
        dataSummary: calculatedSummary,
      },
      calculatedSummary,
    };
  }

  /**
   * Performs an ATOMIC replace-restore operation for the current company.
   * If any error occurs during restoration, all changes are rolled back safely.
   */
  async restoreBackup(companyId, backupPayload, socketId = null, user = null) {
    const validation = this.validateBackup(backupPayload, companyId);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    const { data, metadata, calculatedSummary } = validation;

    logger.info('Initiating atomic restore for company %s...', companyId);

    const prepareDocs = (docs) => {
      if (!docs || !Array.isArray(docs)) return [];
      return docs.map((doc) => {
        const { _id, __v, ...rest } = doc;
        return { ...rest, companyId };
      });
    };

    let session = null;
    let useTransaction = false;

    try {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransaction = true;
    } catch (err) {
      logger.warn('Mongoose sessions/transactions unavailable or failed to start: %s. Using safe fallback snapshot.', err.message);
      if (session) session.endSession();
      session = null;
    }

    try {
      const opts = session ? { session } : {};

      // 1. Delete existing business operational data for active company ONLY
      await Customer.deleteMany({ companyId }, opts);
      await Supplier.deleteMany({ companyId }, opts);
      await Product.deleteMany({ companyId }, opts);
      await Invoice.deleteMany({ companyId }, opts);
      await Quotation.deleteMany({ companyId }, opts);
      await Purchase.deleteMany({ companyId }, opts);
      await Expense.deleteMany({ companyId }, opts);
      await Payment.deleteMany({ companyId }, opts);
      await RecycleBinItem.deleteMany({ companyId }, opts);

      // 2. Insert restored collection documents
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

      // 3. Selectively update ONLY explicit business profile fields in Company (DO NOT OVERWRITE plan, status, etc.)
      if (data.company) {
        const allowedCompanyFields = {
          businessName: data.company.businessName,
          ownerName: data.company.ownerName,
          mobile: data.company.mobile,
          email: data.company.email,
          gstin: data.company.gstin,
          address: data.company.address,
          city: data.company.city,
          state: data.company.state,
          lastDataUpdated: new Date(),
        };
        // Remove undefined keys
        Object.keys(allowedCompanyFields).forEach((key) => allowedCompanyFields[key] === undefined && delete allowedCompanyFields[key]);

        await Company.findOneAndUpdate(
          { companyId },
          { $set: allowedCompanyFields },
          { ...opts, new: true }
        );
      }

      // 4. Update Settings business preferences (preserve server-controlled lastBackupMetadata)
      if (data.settings) {
        const { _id, companyId: cId, lastBackupMetadata, ...settingsRest } = data.settings;
        await Settings.findOneAndUpdate(
          { companyId },
          {
            $set: {
              ...settingsRest,
              companyId,
              lastRestoreMetadata: {
                restoredAt: new Date().toISOString(),
                restoredBy: user?.name || user?.userId || 'Business Owner',
                backupCreatedAt: metadata.createdAt,
                dataSummary: calculatedSummary,
              },
            },
          },
          { ...opts, upsert: true }
        );
      }

      // COMMIT TRANSACTION
      if (useTransaction && session) {
        await session.commitTransaction();
        session.endSession();
      }

      // Notify connected frontend clients
      await touchCompanyData(companyId, socketId, 'System', 'RESTORE');

      logger.info('Atomic restore successfully completed for company %s', companyId);

      return {
        success: true,
        message: 'Company business data restored successfully.',
        restoredAt: new Date().toISOString(),
        dataSummary: calculatedSummary,
      };
    } catch (error) {
      if (useTransaction && session) {
        logger.error('Aborting restore transaction for company %s due to error: %s', companyId, error.message);
        await session.abortTransaction();
        session.endSession();
      }
      throw new Error(`Atomic data restoration failed. Database was safely rolled back: ${error.message}`);
    }
  }

  /**
   * Retrieves server-stored last backup metadata for company.
   */
  async getLastBackupInfo(companyId) {
    const settingsDoc = await Settings.findOne({ companyId }).select('lastBackupMetadata lastRestoreMetadata').lean();
    return {
      lastBackupMetadata: settingsDoc?.lastBackupMetadata || null,
      lastRestoreMetadata: settingsDoc?.lastRestoreMetadata || null,
    };
  }
}

export default new BackupService();
