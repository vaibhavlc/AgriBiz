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
    if (!companyId) {
      const err = new Error('Company ID is required for tenant operations.');
      err.statusCode = 400;
      throw err;
    }
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
    if (!companyId) {
      const err = new Error('Company ID is required.');
      err.statusCode = 400;
      throw err;
    }
    return runInTransaction(async (session) => {
      const oldPayment = await paymentRepository.findById(paymentId, companyId, session) || await paymentRepository.findAny(paymentId, companyId, session);
      if (!oldPayment) throw new Error('Payment record not found');

      // Revert old payment impact
      if (oldPayment.type === 'CustomerReceipt') {
        const customer = await customerRepository.findById(oldPayment.contactId, companyId, session);
        if (customer) {
          const outstanding = customer.outstanding + oldPayment.amount;
          await customerRepository.update(oldPayment.contactId, companyId, { outstanding }, session);
        }
      } else {
        const supplier = await supplierRepository.findById(oldPayment.contactId, companyId, session);
        if (supplier) {
          const outstanding = supplier.outstanding + oldPayment.amount;
          await supplierRepository.update(oldPayment.contactId, companyId, { outstanding }, session);
        }
      }

      // Apply new payment impact
      if (paymentData.type === 'CustomerReceipt') {
        const customer = await customerRepository.findById(paymentData.contactId, companyId, session);
        if (!customer) throw new Error('Customer not found');
        const outstanding = customer.outstanding - paymentData.amount;
        await customerRepository.update(paymentData.contactId, companyId, { outstanding }, session);
      } else {
        const supplier = await supplierRepository.findById(paymentData.contactId, companyId, session);
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
    if (!companyId) {
      const err = new Error('Company ID is required for deletion.');
      err.statusCode = 400;
      throw err;
    }
    if (!deletedBy) {
      const err = new Error('Authenticated user identity is required for deletion.');
      err.statusCode = 400;
      throw err;
    }

    return runInTransaction(async (session) => {
      let payment = await paymentRepository.findById(paymentId, companyId, session);
      if (!payment) {
        payment = await paymentRepository.findAny(paymentId, companyId, session);
      }
      if (!payment) {
        const err = new Error('Payment record not found');
        err.statusCode = 404;
        throw err;
      }
      if (payment.isDeleted) {
        return payment; // Idempotent: already soft deleted
      }

      // Revert payment impact (restore outstanding balance)
      if (payment.type === 'CustomerReceipt') {
        const customer = await customerRepository.findById(payment.contactId, companyId, session) || await customerRepository.findAny(payment.contactId, companyId, session);
        if (customer) {
          await customerRepository.adjustOutstanding(payment.contactId, companyId, payment.amount, session);
        }
      } else {
        const supplier = await supplierRepository.findById(payment.contactId, companyId, session) || await supplierRepository.findAny(payment.contactId, companyId, session);
        if (supplier) {
          await supplierRepository.adjustOutstanding(payment.contactId, companyId, payment.amount, session);
        }
      }

      // Atomic Recycle Bin record creation
      const plainPayment = payment.toObject ? payment.toObject() : JSON.parse(JSON.stringify(payment));
      const recycleBinItemData = {
        recycleBinItemId: `REC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        companyId,
        originalId: payment.paymentId || payment._id?.toString() || paymentId,
        name: `Payment: ₹${payment.amount} to ${payment.contactName}`,
        module: 'Payment',
        deletedAt: new Date().toISOString(),
        deletedBy,
        originalData: plainPayment,
      };
      await recycleBinRepository.create(recycleBinItemData, session);

      // Perform soft delete strictly scoped to companyId and session
      const softDeleted = await paymentRepository.softDelete(paymentId, companyId, deletedBy, session);
      return softDeleted || payment;
    });
  }
}

export default new PaymentService();
