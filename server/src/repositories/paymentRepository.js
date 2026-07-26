import Payment from '../models/Payment.js';

class PaymentRepository {
  async findById(paymentId, companyId) {
    return Payment.findOne({ paymentId, companyId, isDeleted: false });
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
    return Payment.findOneAndUpdate({ paymentId, companyId, isDeleted: false }, updateData, opts);
  }

  async softDelete(paymentId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Payment.findOneAndUpdate(
      { paymentId, companyId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(paymentId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Payment.findOneAndUpdate(
      { paymentId, companyId, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Payment.countDocuments({ companyId, isDeleted: false });
  }
}

export default new PaymentRepository();
