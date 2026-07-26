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

      // Deduct product stock levels
      for (const item of invoicePayload.items) {
        const product = await productRepository.findById(item.productId, companyId);
        if (!product) {
          throw new Error(`Product ${item.productName} (ID: ${item.productId}) not found`);
        }
        const newStock = Math.max(0, product.stock - item.quantity);
        await productRepository.update(item.productId, companyId, { stock: newStock }, session);
      }

      // Add balance due to customer outstanding balance
      const customer = await customerRepository.findById(invoicePayload.customerId, companyId);
      if (!customer) {
        throw new Error(`Customer with ID ${invoicePayload.customerId} not found`);
      }
      const newOutstanding = customer.outstanding + invoicePayload.balanceDue;
      await customerRepository.update(invoicePayload.customerId, companyId, { outstanding: newOutstanding }, session);

      // Create Payment log if invoice was paid instantly
      if (invoicePayload.amountPaid > 0) {
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
        await paymentRepository.create(paymentPayload, session);
      }

      // Create and save Invoice
      return invoiceRepository.create(invoicePayload, session);
    });
  }

  async updateInvoice(invoiceId, companyId, invoiceData, updatedBy) {
    return runInTransaction(async (session) => {
      const oldInvoice = await invoiceRepository.findById(invoiceId, companyId);
      if (!oldInvoice) throw new Error('Invoice not found');

      // Revert old product stock deductions
      for (const item of oldInvoice.items) {
        const product = await productRepository.findById(item.productId, companyId);
        if (product) {
          const revertedStock = product.stock + item.quantity;
          await productRepository.update(item.productId, companyId, { stock: revertedStock }, session);
        }
      }

      // Revert old customer outstanding adjustments
      const customer = await customerRepository.findById(oldInvoice.customerId, companyId);
      if (customer) {
        const revertedOutstanding = customer.outstanding - oldInvoice.balanceDue;
        await customerRepository.update(oldInvoice.customerId, companyId, { outstanding: revertedOutstanding }, session);
      }

      // Apply new product stock deductions
      for (const item of invoiceData.items) {
        const product = await productRepository.findById(item.productId, companyId);
        if (!product) throw new Error(`Product ${item.productName} not found`);
        const newStock = Math.max(0, product.stock - item.quantity);
        await productRepository.update(item.productId, companyId, { stock: newStock }, session);
      }

      // Apply new customer outstanding adjustments
      const currentCustomer = await customerRepository.findById(invoiceData.customerId, companyId);
      if (!currentCustomer) throw new Error('Customer not found');
      const newOutstanding = currentCustomer.outstanding + invoiceData.balanceDue;
      await customerRepository.update(invoiceData.customerId, companyId, { outstanding: newOutstanding }, session);

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

      // Revert product stocks
      for (const item of invoice.items) {
        const product = await productRepository.findById(item.productId, companyId);
        if (product) {
          const revertedStock = product.stock + item.quantity;
          await productRepository.update(item.productId, companyId, { stock: revertedStock }, session);
        }
      }

      // Revert customer outstanding balance
      const customer = await customerRepository.findById(invoice.customerId, companyId);
      if (customer) {
        const revertedOutstanding = Math.max(0, customer.outstanding - invoice.balanceDue);
        await customerRepository.update(invoice.customerId, companyId, { outstanding: revertedOutstanding }, session);
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
}

export default new InvoiceService();
