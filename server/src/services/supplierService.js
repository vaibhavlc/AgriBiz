import supplierRepository from '../repositories/supplierRepository.js';
import recycleBinRepository from '../repositories/recycleBinRepository.js';
import { runInTransaction } from '../utils/transactionHelper.js';

class SupplierService {
  async getSupplier(supplierId, companyId) {
    return supplierRepository.findById(supplierId, companyId);
  }

  async getAllSuppliers(companyId) {
    return supplierRepository.findAll(companyId);
  }

  async createSupplier(supplierData, companyId, createdBy) {
    const payload = {
      ...supplierData,
      companyId,
      createdBy,
      updatedBy: createdBy,
    };
    return supplierRepository.create(payload);
  }

  async updateSupplier(supplierId, companyId, updateData, updatedBy) {
    const payload = {
      ...updateData,
      updatedBy,
    };
    return supplierRepository.update(supplierId, companyId, payload);
  }

  async deleteSupplier(supplierId, companyId, deletedBy) {
    return runInTransaction(async (session) => {
      const supplier = await supplierRepository.findById(supplierId, companyId);
      if (!supplier) throw new Error('Supplier not found');

      const recycleBinItemData = {
        recycleBinItemId: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        companyId,
        originalId: supplier.supplierId,
        name: supplier.name,
        module: 'Supplier',
        deletedAt: new Date().toISOString(),
        deletedBy,
        originalData: supplier,
      };

      await recycleBinRepository.create(recycleBinItemData, session);
      await supplierRepository.softDelete(supplierId, companyId, deletedBy, session);
      return supplier;
    });
  }
}

export default new SupplierService();
