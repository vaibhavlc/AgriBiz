import mongoose from 'mongoose';
import Payment from '../models/Payment.js';

class PaymentRepository {
  buildQuery(paymentId, companyId, isDeleted = false) {
    const $or = [{ paymentId }];
    if (mongoose.Types.ObjectId.isValid(paymentId)) {
      $or.push({ _id: paymentId });
    }
    return { companyId, isDeleted, $or };
  }

  async findById(paymentId, companyId, session) {
    const opts = session ? { session } : {};
    return Payment.findOne(this.buildQuery(paymentId, companyId, false), null, opts);
  }

  async findAll(companyId) {
    return Payment.find({ companyId, isDeleted: false }).sort({ createdAt: -1 });
  }

  async findByContactId(contactId, companyId) {
    return Payment.find({ contactId, companyId, isDeleted: false }).sort({ createdAt: -1 });
  }

  async create(paymentData, session) {
    const opts = session ? { session } : {};
    const [payment] = await Payment.create([paymentData], opts);
    return payment;
  }

  async update(paymentId, companyId, updateData, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Payment.findOneAndUpdate(this.buildQuery(paymentId, companyId, false), updateData, opts);
  }

  async softDelete(paymentId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Payment.findOneAndUpdate(
      this.buildQuery(paymentId, companyId, false),
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
    return Payment.countDocuments({ companyId, isDeleted: false });
  }
}

export default new PaymentRepository();
