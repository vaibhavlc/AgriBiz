import Supplier from '../models/Supplier.js';

class SupplierRepository {
  async findById(supplierId, companyId, session) {
    const opts = session ? { session } : {};
    return Supplier.findOne({ supplierId, companyId, isDeleted: false }, null, opts);
  }

  async findAll(companyId) {
    return Supplier.find({ companyId, isDeleted: false });
  }

  async findByPhone(phone, companyId) {
    return Supplier.findOne({ phone, companyId, isDeleted: false });
  }

  async create(supplierData, session) {
    const opts = session ? { session } : {};
    const [supplier] = await Supplier.create([supplierData], opts);
    return supplier;
  }

  async update(supplierId, companyId, updateData, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Supplier.findOneAndUpdate({ supplierId, companyId, isDeleted: false }, updateData, opts);
  }

  async adjustOutstanding(supplierId, companyId, deltaAmount, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Supplier.findOneAndUpdate(
      { supplierId, companyId, isDeleted: false },
      { $inc: { outstanding: deltaAmount } },
      opts
    );
  }

  async softDelete(supplierId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Supplier.findOneAndUpdate(
      { supplierId, companyId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(supplierId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Supplier.findOneAndUpdate(
      { supplierId, companyId, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Supplier.countDocuments({ companyId, isDeleted: false });
  }
}

export default new SupplierRepository();
