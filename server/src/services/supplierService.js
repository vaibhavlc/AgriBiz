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
      let supplier = await supplierRepository.findById(supplierId, companyId, session);
      if (!supplier) {
        supplier = await supplierRepository.findAny(supplierId, companyId, session);
      }
      if (!supplier) {
        supplier = await supplierRepository.findAny(supplierId, null, session);
      }
      if (!supplier) {
        const err = new Error('Supplier not found');
        err.statusCode = 404;
        throw err;
      }
      if (supplier.isDeleted) {
        return supplier; // Idempotent: already soft deleted
      }

      try {
        const plainSupplier = supplier.toObject ? supplier.toObject() : JSON.parse(JSON.stringify(supplier));
        const effectiveDeleter = deletedBy || 'System';
        const effectiveCompany = companyId || supplier.companyId || 'DEFAULT_COMPANY';
        const recycleBinItemData = {
          recycleBinItemId: `REC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          companyId: effectiveCompany,
          originalId: supplier.supplierId || supplier._id?.toString() || supplierId,
          name: supplier.name || supplierId,
          module: 'Supplier',
          deletedAt: new Date().toISOString(),
          deletedBy: effectiveDeleter,
          originalData: plainSupplier,
        };
        await recycleBinRepository.create(recycleBinItemData, session);
      } catch (rErr) {
        console.warn('Recycle bin record warning on supplier delete:', rErr.message);
      }

      const effectiveDeleter = deletedBy || 'System';
      let res = await supplierRepository.softDelete(supplierId, companyId || supplier.companyId, effectiveDeleter, session);
      if (!res && supplier._id) {
        await supplier.constructor.updateOne({ _id: supplier._id }, { isDeleted: true, deletedAt: new Date(), updatedBy: effectiveDeleter }, { session });
        res = await supplierRepository.findAny(supplierId, null, session);
      }
      return res || supplier;
    });
  }
}

export default new SupplierService();
