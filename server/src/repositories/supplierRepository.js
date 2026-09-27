import mongoose from 'mongoose';
import Supplier from '../models/Supplier.js';

class SupplierRepository {
  buildQuery(supplierId, companyId, isDeleted = false) {
    const cleanId = typeof supplierId === 'object' && supplierId !== null
      ? (supplierId.supplierId || supplierId._id?.toString() || String(supplierId))
      : String(supplierId || '');
    const $or = [{ supplierId: cleanId }, { phone: cleanId }];
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      $or.push({ _id: cleanId });
    }
    const query = { companyId, $or };
    if (isDeleted !== null && isDeleted !== undefined) {
      query.isDeleted = isDeleted;
    }
    return query;
  }

  async findById(supplierId, companyId, session) {
    const opts = session ? { session } : {};
    return Supplier.findOne(this.buildQuery(supplierId, companyId, false), null, opts);
  }

  async findAny(supplierId, companyId, session) {
    const opts = session ? { session } : {};
    return Supplier.findOne(this.buildQuery(supplierId, companyId, null), null, opts);
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
    const cleanId = typeof supplierId === 'object' && supplierId !== null
      ? (supplierId.supplierId || supplierId._id?.toString() || String(supplierId))
      : String(supplierId || '');
    if (!cleanId) return null;
    const amt = Number(deltaAmount) || 0;
    const opts = session ? { session, new: true } : { new: true };
    return Supplier.findOneAndUpdate(
      this.buildQuery(cleanId, companyId, false),
      { $inc: { outstanding: amt } },
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
