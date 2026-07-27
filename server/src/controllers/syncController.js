import productService from '../services/productService.js';
import customerService from '../services/customerService.js';
import supplierService from '../services/supplierService.js';
import invoiceService from '../services/invoiceService.js';
import quotationService from '../services/quotationService.js';
import purchaseService from '../services/purchaseService.js';
import paymentService from '../services/paymentService.js';
import expenseService from '../services/expenseService.js';
import settingsService from '../services/settingsService.js';

import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Supplier from '../models/Supplier.js';
import Invoice from '../models/Invoice.js';
import Quotation from '../models/Quotation.js';
import Purchase from '../models/Purchase.js';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import Settings from '../models/Settings.js';
import User from '../models/User.js';

import logger from '../config/logger.js';
import { socketEmitter } from '../realtime/socketEmitter.js';

class SyncController {
  async processSyncBatch(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const userName = req.user.name;
      const { operations } = req.body;

      if (!operations || !Array.isArray(operations)) {
        return res.status(400).json({ success: false, message: 'Invalid payload: operations array is required.' });
      }

      logger.info(`Starting batch sync of ${operations.length} operations for company ${companyId}`);

      const results = [];

      for (const op of operations) {
        const { action, module, recordId, payload } = op;
        let success = false;
        let message = '';
        let data = null;

        try {
          if (payload) {
            payload.companyId = companyId;
          }

          if (module === 'Product') {
            const exists = await Product.findOne({ productId: recordId, companyId });
            if (action === 'CREATE') {
              if (exists) {
                if (exists.isDeleted) {
                  await productService.updateProduct(recordId, companyId, { ...payload, isDeleted: false, deletedAt: null }, userName);
                } else {
                  await productService.updateProduct(recordId, companyId, payload, userName);
                }
                message = 'Product already exists. Updated instead.';
              } else {
                data = await productService.createProduct(payload, companyId, userName);
                message = 'Product created successfully.';
              }
              success = true;
            } else if (action === 'UPDATE') {
              if (exists) {
                data = await productService.updateProduct(recordId, companyId, payload, userName);
                message = 'Product updated successfully.';
              } else {
                data = await productService.createProduct(payload, companyId, userName);
                message = 'Product did not exist. Created instead.';
              }
              success = true;
            } else if (action === 'DELETE') {
              if (exists && !exists.isDeleted) {
                data = await productService.deleteProduct(recordId, companyId, userName);
                message = 'Product soft-deleted successfully.';
              } else {
                message = 'Product already deleted or does not exist.';
              }
              success = true;
            }
          }

          else if (module === 'Customer') {
            const exists = await Customer.findOne({ customerId: recordId, companyId });
            if (action === 'CREATE') {
              if (exists) {
                if (exists.isDeleted) {
                  await customerService.updateCustomer(recordId, companyId, { ...payload, isDeleted: false, deletedAt: null }, userName);
                } else {
                  await customerService.updateCustomer(recordId, companyId, payload, userName);
                }
                message = 'Customer already exists. Updated instead.';
              } else {
                data = await customerService.createCustomer(payload, companyId, userName);
                message = 'Customer created successfully.';
              }
              success = true;
            } else if (action === 'UPDATE') {
              if (exists) {
                data = await customerService.updateCustomer(recordId, companyId, payload, userName);
                message = 'Customer updated successfully.';
              } else {
                data = await customerService.createCustomer(payload, companyId, userName);
                message = 'Customer did not exist. Created instead.';
              }
              success = true;
            } else if (action === 'DELETE') {
              if (exists && !exists.isDeleted) {
                data = await customerService.deleteCustomer(recordId, companyId, userName);
                message = 'Customer soft-deleted successfully.';
              } else {
                message = 'Customer already deleted or does not exist.';
              }
              success = true;
            }
          }

          else if (module === 'Supplier') {
            const exists = await Supplier.findOne({ supplierId: recordId, companyId });
            if (action === 'CREATE') {
              if (exists) {
                if (exists.isDeleted) {
                  await supplierService.updateSupplier(recordId, companyId, { ...payload, isDeleted: false, deletedAt: null }, userName);
                } else {
                  await supplierService.updateSupplier(recordId, companyId, payload, userName);
                }
                message = 'Supplier already exists. Updated instead.';
              } else {
                data = await supplierService.createSupplier(payload, companyId, userName);
                message = 'Supplier created successfully.';
              }
              success = true;
            } else if (action === 'UPDATE') {
              if (exists) {
                data = await supplierService.updateSupplier(recordId, companyId, payload, userName);
                message = 'Supplier updated successfully.';
              } else {
                data = await supplierService.createSupplier(payload, companyId, userName);
                message = 'Supplier did not exist. Created instead.';
              }
              success = true;
            } else if (action === 'DELETE') {
              if (exists && !exists.isDeleted) {
                data = await supplierService.deleteSupplier(recordId, companyId, userName);
                message = 'Supplier soft-deleted successfully.';
              } else {
                message = 'Supplier already deleted or does not exist.';
              }
              success = true;
            }
          }

          else if (module === 'Invoice') {
            const exists = await Invoice.findOne({ invoiceId: recordId, companyId });
            if (action === 'CREATE') {
              if (exists) {
                message = 'Invoice already exists. Skipped to prevent duplicate stock/dues changes.';
              } else {
                data = await invoiceService.createInvoice(payload, companyId, userName);
                message = 'Invoice logged successfully.';
              }
              success = true;
            } else if (action === 'UPDATE') {
              if (exists) {
                data = await invoiceService.updateInvoice(recordId, companyId, payload, userName);
                message = 'Invoice updated successfully.';
              } else {
                data = await invoiceService.createInvoice(payload, companyId, userName);
                message = 'Invoice did not exist. Created instead.';
              }
              success = true;
            } else if (action === 'DELETE') {
              if (exists && !exists.isDeleted) {
                data = await invoiceService.deleteInvoice(recordId, companyId, userName);
                message = 'Invoice soft-deleted successfully.';
              } else {
                message = 'Invoice already deleted or does not exist.';
              }
              success = true;
            }
          }

          else if (module === 'Quotation') {
            const exists = await Quotation.findOne({ quotationId: recordId, companyId });
            if (action === 'CREATE') {
              if (exists) {
                await quotationService.updateQuotation(recordId, companyId, payload, userName);
                message = 'Quotation already exists. Updated instead.';
              } else {
                data = await quotationService.createQuotation(payload, companyId, userName);
                message = 'Quotation created successfully.';
              }
              success = true;
            } else if (action === 'UPDATE') {
              if (exists) {
                data = await quotationService.updateQuotation(recordId, companyId, payload, userName);
                message = 'Quotation updated successfully.';
              } else {
                data = await quotationService.createQuotation(payload, companyId, userName);
                message = 'Quotation did not exist. Created instead.';
              }
              success = true;
            } else if (action === 'DELETE') {
              if (exists && !exists.isDeleted) {
                data = await quotationService.deleteQuotation(recordId, companyId, userName);
                message = 'Quotation soft-deleted successfully.';
              } else {
                message = 'Quotation already deleted or does not exist.';
              }
              success = true;
            }
          }

          else if (module === 'Purchase') {
            const exists = await Purchase.findOne({ purchaseId: recordId, companyId });
            if (action === 'CREATE') {
              if (exists) {
                message = 'Purchase already exists. Skipped to prevent duplicate stock/dues changes.';
              } else {
                data = await purchaseService.createPurchase(payload, companyId, userName);
                message = 'Purchase logged successfully.';
              }
              success = true;
            } else if (action === 'UPDATE') {
              if (exists) {
                data = await purchaseService.updatePurchase(recordId, companyId, payload, userName);
                message = 'Purchase updated successfully.';
              } else {
                data = await purchaseService.createPurchase(payload, companyId, userName);
                message = 'Purchase did not exist. Created instead.';
              }
              success = true;
            } else if (action === 'DELETE') {
              if (exists && !exists.isDeleted) {
                data = await purchaseService.deletePurchase(recordId, companyId, userName);
                message = 'Purchase soft-deleted successfully.';
              } else {
                message = 'Purchase already deleted or does not exist.';
              }
              success = true;
            }
          }

          else if (module === 'Payment') {
            const exists = await Payment.findOne({ paymentId: recordId, companyId });
            if (action === 'CREATE') {
              if (exists) {
                message = 'Payment already exists. Skipped to prevent duplicate outstanding balance adjustments.';
              } else {
                data = await paymentService.createPayment(payload, companyId, userName);
                message = 'Payment logged successfully.';
              }
              success = true;
            } else if (action === 'UPDATE') {
              if (exists) {
                data = await paymentService.updatePayment(recordId, companyId, payload, userName);
                message = 'Payment updated successfully.';
              } else {
                data = await paymentService.createPayment(payload, companyId, userName);
                message = 'Payment did not exist. Created instead.';
              }
              success = true;
            } else if (action === 'DELETE') {
              if (exists && !exists.isDeleted) {
                data = await paymentService.deletePayment(recordId, companyId, userName);
                message = 'Payment soft-deleted successfully.';
              } else {
                message = 'Payment already deleted or does not exist.';
              }
              success = true;
            }
          }

          else if (module === 'Expense') {
            const exists = await Expense.findOne({ expenseId: recordId, companyId });
            if (action === 'CREATE') {
              if (exists) {
                await expenseService.updateExpense(recordId, companyId, payload, userName);
                message = 'Expense already exists. Updated instead.';
              } else {
                data = await expenseService.createExpense(payload, companyId, userName);
                message = 'Expense logged successfully.';
              }
              success = true;
            } else if (action === 'UPDATE') {
              if (exists) {
                data = await expenseService.updateExpense(recordId, companyId, payload, userName);
                message = 'Expense updated successfully.';
              } else {
                data = await expenseService.createExpense(payload, companyId, userName);
                message = 'Expense did not exist. Created instead.';
              }
              success = true;
            } else if (action === 'DELETE') {
              if (exists && !exists.isDeleted) {
                data = await expenseService.deleteExpense(recordId, companyId, userName);
                message = 'Expense soft-deleted successfully.';
              } else {
                message = 'Expense already deleted or does not exist.';
              }
              success = true;
            }
          }

          else if (module === 'Settings') {
            data = await settingsService.updateSettings(companyId, payload);
            message = 'Settings synchronized successfully.';
            success = true;
          }

          else {
            message = `Unsupported module: ${module}`;
          }

        } catch (opError) {
          logger.error(`Error syncing operation: ${action} on ${module} (${recordId}): %s`, opError.message);
          message = opError.message || 'Operation failed.';
        }

        results.push({
          recordId,
          module,
          action,
          success,
          message,
          data
        });
      }

      logger.info(`Batch sync completed for company ${companyId}. Successful: ${results.filter(r => r.success).length}/${results.length}`);

      // Broadcast changes to other sockets in the same company
      for (const res of results) {
        if (res.success) {
          const op = operations.find(o => o.recordId === res.recordId && o.module === res.module);
          const senderDeviceId = op?.payload?.deviceId || op?.deviceId || null;
          
          socketEmitter.publishSyncEvent({
            companyId,
            module: res.module,
            action: res.action,
            recordId: res.recordId,
            updatedAt: res.data?.updatedAt || new Date().toISOString(),
            senderUserId: req.user.userId,
            senderDeviceId,
            senderSocketId: req.headers['x-socket-id'] || null
          });
        }
      }

      res.status(200).json({ success: true, results });
    } catch (error) {
      next(error);
    }
  }

  async pullUpdates(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const { lastSyncTimestamp, deviceId } = req.query;

      const since = lastSyncTimestamp ? new Date(lastSyncTimestamp) : new Date(0);
      logger.info(`Pulling updates since ${since.toISOString()} for company ${companyId} from device ${deviceId || 'unknown'}`);

      // Query all collections for updates after lastSyncTimestamp
      const [
        products,
        customers,
        suppliers,
        invoices,
        purchases,
        quotations,
        payments,
        expenses,
        settings,
        users
      ] = await Promise.all([
        Product.find({ companyId, updatedAt: { $gt: since } }).lean(),
        Customer.find({ companyId, updatedAt: { $gt: since } }).lean(),
        Supplier.find({ companyId, updatedAt: { $gt: since } }).lean(),
        Invoice.find({ companyId, updatedAt: { $gt: since } }).lean(),
        Purchase.find({ companyId, updatedAt: { $gt: since } }).lean(),
        Quotation.find({ companyId, updatedAt: { $gt: since } }).lean(),
        Payment.find({ companyId, updatedAt: { $gt: since } }).lean(),
        Expense.find({ companyId, updatedAt: { $gt: since } }).lean(),
        Settings.find({ companyId, updatedAt: { $gt: since } }).lean(),
        User.find({ companyId, updatedAt: { $gt: since } }).select('-password').lean()
      ]);

      const serverTimestamp = new Date().toISOString();

      res.status(200).json({
        success: true,
        serverTimestamp,
        updates: {
          Product: products.map(p => ({ ...p, id: p.productId })),
          Customer: customers.map(c => ({ ...c, id: c.customerId })),
          Supplier: suppliers.map(s => ({ ...s, id: s.supplierId })),
          Invoice: invoices.map(i => ({ ...i, id: i.invoiceId })),
          Purchase: purchases.map(p => ({ ...p, id: p.purchaseId })),
          Quotation: quotations.map(q => ({ ...q, id: q.quotationId })),
          Payment: payments.map(p => ({ ...p, id: p.paymentId })),
          Expense: expenses.map(e => ({ ...e, id: e.expenseId })),
          Settings: settings.map(s => ({ ...s, id: s.id || 'business' })),
          User: users.map(u => ({ ...u, id: u.userId }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SyncController();
