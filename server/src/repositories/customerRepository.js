import mongoose from 'mongoose';
import Customer from '../models/Customer.js';

class CustomerRepository {
  buildQuery(customerId, companyId, isDeleted = false) {
    const cleanId = typeof customerId === 'object' && customerId !== null
      ? (customerId.customerId || customerId._id?.toString() || String(customerId))
      : String(customerId || '');
    const $or = [{ customerId: cleanId }, { phone: cleanId }];
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      $or.push({ _id: cleanId });
    }
    const query = { companyId, $or };
    if (isDeleted !== null && isDeleted !== undefined) {
      query.isDeleted = isDeleted;
    }
    return query;
  }

  async findById(customerId, companyId, session) {
    const opts = session ? { session } : {};
    return Customer.findOne(this.buildQuery(customerId, companyId, false), null, opts);
  }

  async findAny(customerId, companyId, session) {
    const opts = session ? { session } : {};
    return Customer.findOne(this.buildQuery(customerId, companyId, null), null, opts);
  }

  async findAll(companyId) {
    return Customer.find({ companyId, isDeleted: false });
  }

  async findByPhone(phone, companyId) {
    return Customer.findOne({ phone, companyId, isDeleted: false });
  }

  async create(customerData, session) {
    const opts = session ? { session } : {};
    const [customer] = await Customer.create([customerData], opts);
    return customer;
  }

  async update(customerId, companyId, updateData, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Customer.findOneAndUpdate(this.buildQuery(customerId, companyId, false), updateData, opts);
  }

  async adjustOutstanding(customerId, companyId, deltaAmount, session) {
    const cleanId = typeof customerId === 'object' && customerId !== null
      ? (customerId.customerId || customerId._id?.toString() || String(customerId))
      : String(customerId || '');
    if (!cleanId) return null;
    const amt = Number(deltaAmount) || 0;
    const opts = session ? { session, new: true } : { new: true };
    return Customer.findOneAndUpdate(
      this.buildQuery(cleanId, companyId, false),
      { $inc: { outstanding: amt } },
      opts
    );
  }

  async softDelete(customerId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Customer.findOneAndUpdate(
      this.buildQuery(customerId, companyId, false),
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(customerId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Customer.findOneAndUpdate(
      this.buildQuery(customerId, companyId, true),
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Customer.countDocuments({ companyId, isDeleted: false });
  }
}

export default new CustomerRepository();
