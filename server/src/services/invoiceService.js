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
          updateTasks.push(
            productRepository.incrementStock(item.productId, companyId, -item.quantity, session)
          );
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
      const oldInvoice = await invoiceRepository.findById(invoiceId, companyId);
      if (!oldInvoice) throw new Error('Invoice not found');

      // Revert old product stock deductions (add back old item quantities)
      for (const item of oldInvoice.items) {
        await productRepository.incrementStock(item.productId, companyId, item.quantity, session);
      }

      // Revert old customer outstanding adjustments
      if (oldInvoice.customerId && oldInvoice.balanceDue) {
        await customerRepository.adjustOutstanding(oldInvoice.customerId, companyId, -oldInvoice.balanceDue, session);
      }

      // Apply new product stock deductions (deduct new item quantities)
      for (const item of invoiceData.items) {
        await productRepository.incrementStock(item.productId, companyId, -item.quantity, session);
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
      const invoice = await invoiceRepository.findById(invoiceId, companyId);
      if (!invoice) throw new Error('Invoice not found');

      // Revert product stocks (add back item quantities)
      for (const item of invoice.items) {
        await productRepository.incrementStock(item.productId, companyId, item.quantity, session);
      }

      // Revert customer outstanding balance
      if (invoice.customerId && invoice.balanceDue) {
        await customerRepository.adjustOutstanding(invoice.customerId, companyId, -invoice.balanceDue, session);
      }

      // Record to Recycle Bin
      const recycleBinItemData = {
        recycleBinItemId: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        companyId,
        originalId: invoice.invoiceId,
        name: invoice.invoiceNumber,
        module: 'Invoice',
        deletedAt: new Date().toISOString(),
        deletedBy,
        originalData: invoice,
      };
      await recycleBinRepository.create(recycleBinItemData, session);

      // Perform soft delete
      return invoiceRepository.softDelete(invoiceId, companyId, deletedBy, session);
    });
  }

  async returnInvoice(invoiceId, companyId, returnData, createdBy) {
    return runInTransaction(async (session) => {
      const invoice = await invoiceRepository.findById(invoiceId, companyId);
      if (!invoice) throw new Error('Invoice not found');

      // Add returned quantity back to product stock (Stock IN)
      if (returnData.items && Array.isArray(returnData.items)) {
        for (const item of returnData.items) {
          await productRepository.incrementStock(item.productId, companyId, item.quantity, session);
        }
      }

      // Adjust customer outstanding balance if applicable
      if (invoice.customerId && returnData.returnAmount) {
        await customerRepository.adjustOutstanding(invoice.customerId, companyId, -returnData.returnAmount, session);
      }

      const updatedItems = invoice.items.map((iItem) => {
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
