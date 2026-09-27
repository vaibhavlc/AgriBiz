import customerRepository from '../repositories/customerRepository.js';
import recycleBinRepository from '../repositories/recycleBinRepository.js';
import { runInTransaction } from '../utils/transactionHelper.js';
import { normalizeRecycleBinData } from '../utils/normalizeRecycleBinData.js';

class CustomerService {
  async getCustomer(customerId, companyId) {
    return customerRepository.findById(customerId, companyId);
  }

  async getAllCustomers(companyId) {
    return customerRepository.findAll(companyId);
  }

  async createCustomer(customerData, companyId, createdBy) {
    if (!companyId) {
      const err = new Error('Company ID is required for tenant operations.');
      err.statusCode = 400;
      throw err;
    }
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
      let customer = await customerRepository.findById(customerId, companyId, session);
      if (!customer) {
        customer = await customerRepository.findAny(customerId, companyId, session);
      }
      if (!customer) {
        const err = new Error('Customer not found');
        err.statusCode = 404;
        throw err;
      }
      if (customer.isDeleted) {
        return customer; // Idempotent: already soft deleted
      }

      const plainCustomer = normalizeRecycleBinData(customer);
      const recycleBinItemData = {
        recycleBinItemId: `REC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        companyId,
        originalId: customer.customerId || customer._id?.toString() || customerId,
        name: customer.name || customerId,
        module: 'Customer',
        deletedAt: new Date().toISOString(),
        deletedBy,
        originalData: plainCustomer,
      };
      await recycleBinRepository.create(recycleBinItemData, session);

      const softDeleted = await customerRepository.softDelete(customerId, companyId, deletedBy, session);
      return softDeleted || customer;
    });
  }
}

export default new CustomerService();
