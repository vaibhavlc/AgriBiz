import customerRepository from '../repositories/customerRepository.js';
import recycleBinRepository from '../repositories/recycleBinRepository.js';
import { runInTransaction } from '../utils/transactionHelper.js';

class CustomerService {
  async getCustomer(customerId, companyId) {
    return customerRepository.findById(customerId, companyId);
  }

  async getAllCustomers(companyId) {
    return customerRepository.findAll(companyId);
  }

  async createCustomer(customerData, companyId, createdBy) {
    const payload = {
      ...customerData,
      companyId,
      createdBy,
      updatedBy: createdBy,
    };
    return customerRepository.create(payload);
  }

  async updateCustomer(customerId, companyId, updateData, updatedBy) {
    const payload = {
      ...updateData,
      updatedBy,
    };
    return customerRepository.update(customerId, companyId, payload);
  }

  async deleteCustomer(customerId, companyId, deletedBy) {
    return runInTransaction(async (session) => {
      let customer = await customerRepository.findById(customerId, companyId, session);
      if (!customer) {
        customer = await customerRepository.findAny(customerId, companyId, session);
      }
      if (!customer) {
        customer = await customerRepository.findAny(customerId, null, session);
      }
      if (!customer) {
        const err = new Error('Customer not found');
        err.statusCode = 404;
        throw err;
      }
      if (customer.isDeleted) {
        return customer; // Idempotent: already soft deleted
      }

      try {
        const plainCustomer = customer.toObject ? customer.toObject() : JSON.parse(JSON.stringify(customer));
        const effectiveDeleter = deletedBy || 'System';
        const effectiveCompany = companyId || customer.companyId || 'DEFAULT_COMPANY';
        const recycleBinItemData = {
          recycleBinItemId: `REC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          companyId: effectiveCompany,
          originalId: customer.customerId || customer._id?.toString() || customerId,
          name: customer.name || customerId,
          module: 'Customer',
          deletedAt: new Date().toISOString(),
          deletedBy: effectiveDeleter,
          originalData: plainCustomer,
        };
        await recycleBinRepository.create(recycleBinItemData, session);
      } catch (rErr) {
        console.warn('Recycle bin record warning on customer delete:', rErr.message);
      }

      const effectiveDeleter = deletedBy || 'System';
      let res = await customerRepository.softDelete(customerId, companyId || customer.companyId, effectiveDeleter, session);
      if (!res && customer._id) {
        await customer.constructor.updateOne({ _id: customer._id }, { isDeleted: true, deletedAt: new Date(), updatedBy: effectiveDeleter }, { session });
        res = await customerRepository.findAny(customerId, null, session);
      }
      return res || customer;
    });
  }
}

export default new CustomerService();
