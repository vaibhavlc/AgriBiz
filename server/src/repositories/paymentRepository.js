import mongoose from 'mongoose';
import Payment from '../models/Payment.js';

class PaymentRepository {
  buildQuery(paymentId, companyId, isDeleted = false) {
    const cleanId = typeof paymentId === 'object' && paymentId !== null
      ? (paymentId.paymentId || paymentId._id?.toString() || String(paymentId))
      : String(paymentId || '');
    const $or = [{ paymentId: cleanId }];
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

  async findById(paymentId, companyId, session) {
    const opts = session ? { session } : {};
    return Payment.findOne(this.buildQuery(paymentId, companyId, false), null, opts);
  }

  async findAny(paymentId, companyId, session) {
    const opts = session ? { session } : {};
    return Payment.findOne(this.buildQuery(paymentId, companyId, null), null, opts);
  }

  async findAll(companyId) {
    const query = companyId ? { $or: [{ companyId }, { companyId: { $exists: false } }], isDeleted: { $ne: true } } : { isDeleted: { $ne: true } };
    return Payment.find(query).sort({ createdAt: -1 });
  }

  async findByContactId(contactId, companyId) {
    const query = companyId ? { contactId, $or: [{ companyId }, { companyId: { $exists: false } }], isDeleted: { $ne: true } } : { contactId, isDeleted: { $ne: true } };
    return Payment.find(query).sort({ createdAt: -1 });
  }

  async create(paymentData, session) {
    const opts = session ? { session } : {};
    const [payment] = await Payment.create([paymentData], opts);
    return payment;
  }

  async update(paymentId, companyId, updateData, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Payment.findOneAndUpdate(this.buildQuery(paymentId, companyId, null), updateData, opts);
  }

  async softDelete(paymentId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Payment.findOneAndUpdate(
      this.buildQuery(paymentId, companyId, null),
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(paymentId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Payment.findOneAndUpdate(
      this.buildQuery(paymentId, companyId, true),
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    const query = companyId ? { $or: [{ companyId }, { companyId: { $exists: false } }], isDeleted: { $ne: true } } : { isDeleted: { $ne: true } };
    return Payment.countDocuments(query);
  }
}

export default new PaymentRepository();
