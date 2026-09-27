import invoiceRepository from '../repositories/invoiceRepository.js';
import productRepository from '../repositories/productRepository.js';
import customerRepository from '../repositories/customerRepository.js';
import paymentRepository from '../repositories/paymentRepository.js';
import recycleBinRepository from '../repositories/recycleBinRepository.js';
import { runInTransaction } from '../utils/transactionHelper.js';

class InvoiceService {
  async getInvoice(invoiceId, companyId) {
    return invoiceRepository.findById(invoiceId, companyId);
  }

  async getAllInvoices(companyId) {
    return invoiceRepository.findAll(companyId);
  }

  async createInvoice(invoiceData, companyId, createdBy) {
    return runInTransaction(async (session) => {
      const invoicePayload = {
        ...invoiceData,
        companyId,
        createdBy,
        updatedBy: createdBy,
      };

      const updateTasks = [];

      // Deduct product stock levels
      if (invoicePayload.items && Array.isArray(invoicePayload.items)) {
        for (const item of invoicePayload.items) {
          if (item && item.productId && item.quantity) {
            updateTasks.push(
              productRepository.incrementStock(item.productId, companyId, -item.quantity, session)
            );
          }
        }
      }

      // Add balance due to customer outstanding balance
      if (invoicePayload.customerId && invoicePayload.balanceDue) {
        updateTasks.push(
          customerRepository.adjustOutstanding(invoicePayload.customerId, companyId, invoicePayload.balanceDue, session)
        );
      }

      // Create Payment log if invoice was paid instantly
      if (invoicePayload.amountPaid > 0 && invoicePayload.customerId) {
        const paymentPayload = {
          paymentId: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          companyId,
          date: invoicePayload.date,
          type: 'CustomerReceipt',
          contactId: invoicePayload.customerId,
          contactName: invoicePayload.customerName,
          amount: invoicePayload.amountPaid,
          paymentMethod: invoicePayload.paymentMethod || 'UPI',
          referenceNumber: invoicePayload.referenceNumber,
          notes: `Against invoice ${invoicePayload.invoiceNumber}`,
          createdBy,
          updatedBy: createdBy,
        };
        updateTasks.push(paymentRepository.create(paymentPayload, session));
      }

      const [invoice] = await Promise.all([
        invoiceRepository.create(invoicePayload, session),
        ...updateTasks,
      ]);

      return invoice;
    });
  }

  async updateInvoice(invoiceId, companyId, invoiceData, updatedBy) {
    return runInTransaction(async (session) => {
      const oldInvoice = await invoiceRepository.findById(invoiceId, companyId, session);
      if (!oldInvoice) {
        const err = new Error('Invoice not found');
        err.statusCode = 404;
        throw err;
      }

      // Revert old product stock deductions
      if (oldInvoice.items && Array.isArray(oldInvoice.items)) {
        for (const item of oldInvoice.items) {
          if (item && item.productId && item.quantity) {
            await productRepository.incrementStock(item.productId, companyId, item.quantity, session);
          }
        }
      }

      // Revert old customer outstanding adjustments
      if (oldInvoice.customerId && oldInvoice.balanceDue) {
        await customerRepository.adjustOutstanding(oldInvoice.customerId, companyId, -oldInvoice.balanceDue, session);
      }

      // Apply new product stock deductions
      if (invoiceData.items && Array.isArray(invoiceData.items)) {
        for (const item of invoiceData.items) {
          if (item && item.productId && item.quantity) {
            await productRepository.incrementStock(item.productId, companyId, -item.quantity, session);
          }
        }
      }

      // Apply new customer outstanding adjustments
      if (invoiceData.customerId && invoiceData.balanceDue) {
        await customerRepository.adjustOutstanding(invoiceData.customerId, companyId, invoiceData.balanceDue, session);
      }

      const invoicePayload = {
        ...invoiceData,
        updatedBy,
      };
      return invoiceRepository.update(invoiceId, companyId, invoicePayload, session);
    });
  }

  async deleteInvoice(invoiceId, companyId, deletedBy) {
    return runInTransaction(async (session) => {
      const invoice = await invoiceRepository.findById(invoiceId, companyId, session);
      if (!invoice) {
        const existing = await invoiceRepository.findAny(invoiceId, companyId, session);
        if (existing && existing.isDeleted) {
          return existing; // Idempotent: already soft deleted
        }
        const err = new Error('Invoice not found');
        err.statusCode = 404;
        throw err;
      }

      // Revert product stocks (add back item quantities)
      if (invoice.items && Array.isArray(invoice.items)) {
        for (const item of invoice.items) {
          if (item && item.productId && item.quantity) {
            try {
              await productRepository.incrementStock(item.productId, companyId, item.quantity, session);
            } catch (pErr) {}
          }
        }
      }

      // Revert customer outstanding balance
      if (invoice.customerId && invoice.balanceDue) {
        try {
          await customerRepository.adjustOutstanding(invoice.customerId, companyId, -invoice.balanceDue, session);
        } catch (cErr) {}
      }

      // Record to Recycle Bin
      try {
        const plainInvoice = invoice.toObject ? invoice.toObject() : JSON.parse(JSON.stringify(invoice));
        const effectiveDeleter = deletedBy || 'System';
        const recycleBinItemData = {
          recycleBinItemId: `REC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          companyId,
          originalId: invoice.invoiceId || invoice._id?.toString() || invoiceId,
          name: invoice.invoiceNumber || invoiceId,
          module: 'Invoice',
          deletedAt: new Date().toISOString(),
          deletedBy: effectiveDeleter,
          originalData: plainInvoice,
        };
        await recycleBinRepository.create(recycleBinItemData, session);
      } catch (rErr) {
        console.warn('Recycle bin record warning:', rErr.message);
      }

      // Perform soft delete
      const effectiveDeleter = deletedBy || 'System';
      return invoiceRepository.softDelete(invoiceId, companyId, effectiveDeleter, session);
    });
  }

  async returnInvoice(invoiceId, companyId, returnData, createdBy) {
    return runInTransaction(async (session) => {
      const invoice = await invoiceRepository.findById(invoiceId, companyId, session);
      if (!invoice) {
        const err = new Error('Invoice not found');
        err.statusCode = 404;
        throw err;
      }

      // Add returned quantity back to product stock (Stock IN)
      if (returnData.items && Array.isArray(returnData.items)) {
        for (const item of returnData.items) {
          if (item && item.productId && item.quantity) {
            await productRepository.incrementStock(item.productId, companyId, item.quantity, session);
          }
        }
      }

      // Adjust customer outstanding balance if applicable
      if (invoice.customerId && returnData.returnAmount) {
        await customerRepository.adjustOutstanding(invoice.customerId, companyId, -returnData.returnAmount, session);
      }

      const updatedItems = (invoice.items || []).map((iItem) => {
        const retItem = (returnData.items || []).find((r) => r.productId === iItem.productId);
        if (retItem) {
          return {
            ...iItem,
            returnedQuantity: (iItem.returnedQuantity || 0) + retItem.quantity,
          };
        }
        return iItem;
      });

      return invoiceRepository.update(
        invoiceId,
        companyId,
        {
          items: updatedItems,
          status: 'Returned',
          returnNotes: returnData.notes || 'Sales Return processed',
          updatedBy: createdBy,
        },
        session
      );
    });
  }
}

export default new InvoiceService();
