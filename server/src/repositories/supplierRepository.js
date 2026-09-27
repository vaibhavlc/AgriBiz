import mongoose from 'mongoose';
import Supplier from '../models/Supplier.js';

class SupplierRepository {
  buildQuery(supplierId, companyId, isDeleted = false) {
    if (!companyId) {
      const err = new Error('Company ID is required for database query.');
      err.statusCode = 400;
      throw err;
    }
    const cleanId = typeof supplierId === 'object' && supplierId !== null
      ? (supplierId.supplierId || supplierId._id?.toString() || String(supplierId))
      : String(supplierId || '');
    const $or = [{ supplierId: cleanId }, { phone: cleanId }];
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      $or.push({ _id: cleanId });
    }
    const query = { companyId, $or };
    if (isDeleted === false) {
      query.isDeleted = { $ne: true };
    } else if (isDeleted === true) {
      query.isDeleted = true;
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
    if (!companyId) return [];
    return Supplier.find({ companyId, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
  }

  async findByPhone(phone, companyId) {
    return Supplier.findOne(this.buildQuery(phone, companyId, false));
  }

  async create(supplierData, session) {
    const opts = session ? { session } : {};
    const [supplier] = await Supplier.create([supplierData], opts);
    return supplier;
  }

  async update(supplierId, companyId, updateData, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Supplier.findOneAndUpdate(this.buildQuery(supplierId, companyId, null), updateData, opts);
  }

  async adjustOutstanding(supplierId, companyId, deltaAmount, session) {
    const cleanId = typeof supplierId === 'object' && supplierId !== null
      ? (supplierId.supplierId || supplierId._id?.toString() || String(supplierId))
      : String(supplierId || '');
    if (!cleanId) return null;
    const amt = Number(deltaAmount) || 0;
    const opts = session ? { session, new: true } : { new: true };
    return Supplier.findOneAndUpdate(
      this.buildQuery(cleanId, companyId, null),
      { $inc: { outstanding: amt } },
      opts
    );
  }

  async softDelete(supplierId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Supplier.findOneAndUpdate(
      this.buildQuery(supplierId, companyId, null),
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
    if (!companyId) return 0;
    return Supplier.countDocuments({ companyId, isDeleted: { $ne: true } });
  }
}

export default new SupplierRepository();
