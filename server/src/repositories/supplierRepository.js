import mongoose from 'mongoose';
import Supplier from '../models/Supplier.js';

class SupplierRepository {
  buildQuery(supplierId, companyId, isDeleted = false) {
    const $or = [{ supplierId }, { phone: supplierId }];
    if (mongoose.Types.ObjectId.isValid(supplierId)) {
      $or.push({ _id: supplierId });
    }
    return { companyId, isDeleted, $or };
  }

  async findById(supplierId, companyId, session) {
    const opts = session ? { session } : {};
    return Supplier.findOne(this.buildQuery(supplierId, companyId, false), null, opts);
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
    return Supplier.findOneAndUpdate(this.buildQuery(supplierId, companyId, false), updateData, opts);
  }

  async adjustOutstanding(supplierId, companyId, deltaAmount, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Supplier.findOneAndUpdate(
      this.buildQuery(supplierId, companyId, false),
      { $inc: { outstanding: deltaAmount } },
      opts
    );
  }

  async softDelete(supplierId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Supplier.findOneAndUpdate(
      this.buildQuery(supplierId, companyId, false),
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(supplierId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Supplier.findOneAndUpdate(
      this.buildQuery(supplierId, companyId, true),
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Supplier.countDocuments({ companyId, isDeleted: false });
  }
}

export default new SupplierRepository();
