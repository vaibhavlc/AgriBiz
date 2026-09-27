import mongoose from 'mongoose';
import Supplier from '../models/Supplier.js';

class SupplierRepository {
  async findById(supplierId, companyId, session) {
    const opts = session ? { session } : {};
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(supplierId)) {
      query.$or = [{ supplierId }, { _id: supplierId }];
    } else {
      query.supplierId = supplierId;
    }
    return Supplier.findOne(query, null, opts);
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
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(supplierId)) {
      query.$or = [{ supplierId }, { _id: supplierId }];
    } else {
      query.supplierId = supplierId;
    }
    return Supplier.findOneAndUpdate(query, updateData, opts);
  }

  async adjustOutstanding(supplierId, companyId, deltaAmount, session) {
    const opts = session ? { session, new: true } : { new: true };
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(supplierId)) {
      query.$or = [{ supplierId }, { _id: supplierId }];
    } else {
      query.supplierId = supplierId;
    }
    return Supplier.findOneAndUpdate(
      query,
      { $inc: { outstanding: deltaAmount } },
      opts
    );
  }

  async softDelete(supplierId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(supplierId)) {
      query.$or = [{ supplierId }, { _id: supplierId }];
    } else {
      query.supplierId = supplierId;
    }
    return Supplier.findOneAndUpdate(
      query,
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(supplierId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    const query = { companyId, isDeleted: true };
    if (mongoose.Types.ObjectId.isValid(supplierId)) {
      query.$or = [{ supplierId }, { _id: supplierId }];
    } else {
      query.supplierId = supplierId;
    }
    return Supplier.findOneAndUpdate(
      query,
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Supplier.countDocuments({ companyId, isDeleted: false });
  }
}

export default new SupplierRepository();
