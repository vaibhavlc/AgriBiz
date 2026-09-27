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
    if (!companyId) {
      const err = new Error('Company ID is required for tenant operations.');
      err.statusCode = 400;
      throw err;
    }
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
      let supplier = await supplierRepository.findById(supplierId, companyId, session);
      if (!supplier) {
        supplier = await supplierRepository.findAny(supplierId, companyId, session);
      }
      if (!supplier) {
        const err = new Error('Supplier not found');
        err.statusCode = 404;
        throw err;
      }
      if (supplier.isDeleted) {
        return supplier; // Idempotent: already soft deleted
      }

      const plainSupplier = supplier.toObject ? supplier.toObject() : JSON.parse(JSON.stringify(supplier));
      const recycleBinItemData = {
        recycleBinItemId: `REC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        companyId,
        originalId: supplier.supplierId || supplier._id?.toString() || supplierId,
        name: supplier.name || supplierId,
        module: 'Supplier',
        deletedAt: new Date().toISOString(),
        deletedBy,
        originalData: plainSupplier,
      };
      await recycleBinRepository.create(recycleBinItemData, session);

      const softDeleted = await supplierRepository.softDelete(supplierId, companyId, deletedBy, session);
      return softDeleted || supplier;
    });
  }
}

export default new SupplierService();
