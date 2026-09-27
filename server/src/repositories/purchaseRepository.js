import mongoose from 'mongoose';
import Purchase from '../models/Purchase.js';

class PurchaseRepository {
  buildQuery(purchaseId, companyId, isDeleted = false) {
    const cleanId = typeof purchaseId === 'object' && purchaseId !== null
      ? (purchaseId.purchaseId || purchaseId._id?.toString() || String(purchaseId))
      : String(purchaseId || '');
    const $or = [{ purchaseId: cleanId }, { purchaseNumber: cleanId }];
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      $or.push({ _id: cleanId });
    }
    const query = { companyId, $or };
    if (isDeleted !== null && isDeleted !== undefined) {
      query.isDeleted = isDeleted;
    }
    return query;
  }

  async findById(purchaseId, companyId, session) {
    const opts = session ? { session } : {};
    return Purchase.findOne(this.buildQuery(purchaseId, companyId, false), null, opts);
  }

  async findAny(purchaseId, companyId, session) {
    const opts = session ? { session } : {};
    return Purchase.findOne(this.buildQuery(purchaseId, companyId, null), null, opts);
  }

  async findAll(companyId) {
    return Purchase.find({ companyId, isDeleted: false }).sort({ createdAt: -1 });
  }

  async findByPurchaseNumber(purchaseNumber, companyId) {
    return Purchase.findOne({ purchaseNumber, companyId, isDeleted: false });
  }

  async create(purchaseData, session) {
    const opts = session ? { session } : {};
    const [purchase] = await Purchase.create([purchaseData], opts);
    return purchase;
  }

  async update(purchaseId, companyId, updateData, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Purchase.findOneAndUpdate(this.buildQuery(purchaseId, companyId, false), updateData, opts);
  }

  async softDelete(purchaseId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Purchase.findOneAndUpdate(
      this.buildQuery(purchaseId, companyId, false),
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(purchaseId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Purchase.findOneAndUpdate(
      this.buildQuery(purchaseId, companyId, true),
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Purchase.countDocuments({ companyId, isDeleted: false });
  }
}

export default new PurchaseRepository();
