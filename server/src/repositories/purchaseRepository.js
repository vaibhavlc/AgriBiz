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

  async findById(purchaseId, companyId, session) {
    const opts = session ? { session } : {};
    return Purchase.findOne(this.buildQuery(purchaseId, companyId, false), null, opts);
  }

  async findAny(purchaseId, companyId, session) {
    const opts = session ? { session } : {};
    return Purchase.findOne(this.buildQuery(purchaseId, companyId, null), null, opts);
  }

  async findAll(companyId) {
    const query = companyId ? { $or: [{ companyId }, { companyId: { $exists: false } }], isDeleted: { $ne: true } } : { isDeleted: { $ne: true } };
    return Purchase.find(query).sort({ createdAt: -1 });
  }

  async findByPurchaseNumber(purchaseNumber, companyId) {
    return Purchase.findOne(this.buildQuery(purchaseNumber, companyId, false));
  }

  async create(purchaseData, session) {
    const opts = session ? { session } : {};
    const [purchase] = await Purchase.create([purchaseData], opts);
    return purchase;
  }

  async update(purchaseId, companyId, updateData, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Purchase.findOneAndUpdate(this.buildQuery(purchaseId, companyId, null), updateData, opts);
  }

  async softDelete(purchaseId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Purchase.findOneAndUpdate(
      this.buildQuery(purchaseId, companyId, null),
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
    const query = companyId ? { $or: [{ companyId }, { companyId: { $exists: false } }], isDeleted: { $ne: true } } : { isDeleted: { $ne: true } };
    return Purchase.countDocuments(query);
  }
}

export default new PurchaseRepository();
