import paymentRepository from '../repositories/paymentRepository.js';
import customerRepository from '../repositories/customerRepository.js';
import supplierRepository from '../repositories/supplierRepository.js';
import recycleBinRepository from '../repositories/recycleBinRepository.js';
import { runInTransaction } from '../utils/transactionHelper.js';

class PaymentService {
  async getPayment(paymentId, companyId) {
    return paymentRepository.findById(paymentId, companyId);
  }

  async getAllPayments(companyId) {
    return paymentRepository.findAll(companyId);
  }

  async getPaymentsByContact(contactId, companyId) {
    return paymentRepository.findByContactId(contactId, companyId);
  }

  async createPayment(paymentData, companyId, createdBy) {
    return runInTransaction(async (session) => {
      const paymentPayload = {
        ...paymentData,
        companyId,
        createdBy,
        updatedBy: createdBy,
      };

      const updateTasks = [];

      if (paymentPayload.type === 'CustomerReceipt') {
        updateTasks.push(
          customerRepository.adjustOutstanding(paymentPayload.contactId, companyId, -paymentPayload.amount, session)
        );
      } else {
        updateTasks.push(
          supplierRepository.adjustOutstanding(paymentPayload.contactId, companyId, -paymentPayload.amount, session)
        );
      }

      const [payment] = await Promise.all([
        paymentRepository.create(paymentPayload, session),
        ...updateTasks,
      ]);

      return payment;
    });
  }

  async updatePayment(paymentId, companyId, paymentData, updatedBy) {
    return runInTransaction(async (session) => {
      const oldPayment = await paymentRepository.findById(paymentId, companyId);
      if (!oldPayment) throw new Error('Payment record not found');

      // Revert old payment impact
      if (oldPayment.type === 'CustomerReceipt') {
        const customer = await customerRepository.findById(oldPayment.contactId, companyId);
        if (customer) {
          const outstanding = customer.outstanding + oldPayment.amount;
          await customerRepository.update(oldPayment.contactId, companyId, { outstanding }, session);
        }
      } else {
        const supplier = await supplierRepository.findById(oldPayment.contactId, companyId);
        if (supplier) {
          const outstanding = supplier.outstanding + oldPayment.amount;
          await supplierRepository.update(oldPayment.contactId, companyId, { outstanding }, session);
        }
      }

      // Apply new payment impact
      if (paymentData.type === 'CustomerReceipt') {
        const customer = await customerRepository.findById(paymentData.contactId, companyId);
        if (!customer) throw new Error('Customer not found');
        const outstanding = customer.outstanding - paymentData.amount;
        await customerRepository.update(paymentData.contactId, companyId, { outstanding }, session);
      } else {
        const supplier = await supplierRepository.findById(paymentData.contactId, companyId);
        if (!supplier) throw new Error('Supplier not found');
        const outstanding = supplier.outstanding - paymentData.amount;
        await supplierRepository.update(paymentData.contactId, companyId, { outstanding }, session);
      }

      const paymentPayload = {
        ...paymentData,
        updatedBy,
      };
      return paymentRepository.update(paymentId, companyId, paymentPayload, session);
    });
  }

  async deletePayment(paymentId, companyId, deletedBy) {
    return runInTransaction(async (session) => {
      const payment = await paymentRepository.findById(paymentId, companyId);
      if (!payment) throw new Error('Payment record not found');

      // Revert payment impact
      if (payment.type === 'CustomerReceipt') {
        const customer = await customerRepository.findById(payment.contactId, companyId);
        if (customer) {
          const outstanding = customer.outstanding + payment.amount;
          await customerRepository.update(payment.contactId, companyId, { outstanding }, session);
        }
      } else {
        const supplier = await supplierRepository.findById(payment.contactId, companyId);
        if (supplier) {
          const outstanding = supplier.outstanding + payment.amount;
          await supplierRepository.update(payment.contactId, companyId, { outstanding }, session);
        }
      }

      // Write to Recycle Bin
      const recycleBinItemData = {
        recycleBinItemId: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        companyId,
        originalId: payment.paymentId,
        name: `Payment: ₹${payment.amount} to ${payment.contactName}`,
        module: 'Payment',
        deletedAt: new Date().toISOString(),
        deletedBy,
        originalData: payment,
      };
      await recycleBinRepository.create(recycleBinItemData, session);

      // Perform soft delete
      return paymentRepository.softDelete(paymentId, companyId, deletedBy, session);
    });
  }
}

export default new PaymentService();
