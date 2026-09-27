import mongoose from 'mongoose';
import Payment from '../models/Payment.js';

class PaymentRepository {
  async findById(paymentId, companyId, session) {
    const opts = session ? { session } : {};
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(paymentId)) {
      query.$or = [{ paymentId }, { _id: paymentId }];
    } else {
      query.paymentId = paymentId;
    }
    return Payment.findOne(query, null, opts);
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
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(paymentId)) {
      query.$or = [{ paymentId }, { _id: paymentId }];
    } else {
      query.paymentId = paymentId;
    }
    return Payment.findOneAndUpdate(query, updateData, opts);
  }

  async softDelete(paymentId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(paymentId)) {
      query.$or = [{ paymentId }, { _id: paymentId }];
    } else {
      query.paymentId = paymentId;
    }
    return Payment.findOneAndUpdate(
      query,
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(paymentId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    const query = { companyId, isDeleted: true };
    if (mongoose.Types.ObjectId.isValid(paymentId)) {
      query.$or = [{ paymentId }, { _id: paymentId }];
    } else {
      query.paymentId = paymentId;
    }
    return Payment.findOneAndUpdate(
      query,
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Payment.countDocuments({ companyId, isDeleted: false });
  }
}

export default new PaymentRepository();
