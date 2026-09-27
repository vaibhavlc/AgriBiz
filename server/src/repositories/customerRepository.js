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
    const query = { $or };
    if (companyId) {
      query.$and = [
        { $or: [{ companyId }, { companyId: { $exists: false } }, { companyId: null }, { companyId: '' }] }
      ];
    }
    if (isDeleted === false) {
      query.isDeleted = { $ne: true };
    } else if (isDeleted === true) {
      query.isDeleted = true;
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
    const query = companyId ? { $or: [{ companyId }, { companyId: { $exists: false } }], isDeleted: { $ne: true } } : { isDeleted: { $ne: true } };
    return Customer.find(query).sort({ createdAt: -1 });
  }

  async findByPhone(phone, companyId) {
    return Customer.findOne(this.buildQuery(phone, companyId, false));
  }

  async create(customerData, session) {
    const opts = session ? { session } : {};
    const [customer] = await Customer.create([customerData], opts);
    return customer;
  }

  async update(customerId, companyId, updateData, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Customer.findOneAndUpdate(this.buildQuery(customerId, companyId, null), updateData, opts);
  }

  async adjustOutstanding(customerId, companyId, deltaAmount, session) {
    const cleanId = typeof customerId === 'object' && customerId !== null
      ? (customerId.customerId || customerId._id?.toString() || String(customerId))
      : String(customerId || '');
    if (!cleanId) return null;
    const amt = Number(deltaAmount) || 0;
    const opts = session ? { session, new: true } : { new: true };
    return Customer.findOneAndUpdate(
      this.buildQuery(cleanId, companyId, null),
      { $inc: { outstanding: amt } },
      opts
    );
  }

  async softDelete(customerId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Customer.findOneAndUpdate(
      this.buildQuery(customerId, companyId, null),
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
    const query = companyId ? { $or: [{ companyId }, { companyId: { $exists: false } }], isDeleted: { $ne: true } } : { isDeleted: { $ne: true } };
    return Customer.countDocuments(query);
  }
}

export default new CustomerRepository();
