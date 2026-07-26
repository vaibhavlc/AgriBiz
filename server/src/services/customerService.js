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
      const customer = await customerRepository.findById(customerId, companyId);
      if (!customer) throw new Error('Customer not found');

      const recycleBinItemData = {
        recycleBinItemId: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        companyId,
        originalId: customer.customerId,
        name: customer.name,
        module: 'Customer',
        deletedAt: new Date().toISOString(),
        deletedBy,
        originalData: customer,
      };

      await recycleBinRepository.create(recycleBinItemData, session);
      await customerRepository.softDelete(customerId, companyId, deletedBy, session);
      return customer;
    });
  }
}

export default new CustomerService();
