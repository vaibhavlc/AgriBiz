import mongoose from 'mongoose';
import Purchase from '../models/Purchase.js';

class PurchaseRepository {
  async findById(purchaseId, companyId, session) {
    const opts = session ? { session } : {};
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(purchaseId)) {
      query.$or = [{ purchaseId }, { _id: purchaseId }];
    } else {
      query.purchaseId = purchaseId;
    }
    return Purchase.findOne(query, null, opts);
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
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(purchaseId)) {
      query.$or = [{ purchaseId }, { _id: purchaseId }];
    } else {
      query.purchaseId = purchaseId;
    }
    return Purchase.findOneAndUpdate(query, updateData, opts);
  }

  async softDelete(purchaseId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(purchaseId)) {
      query.$or = [{ purchaseId }, { _id: purchaseId }];
    } else {
      query.purchaseId = purchaseId;
    }
    return Purchase.findOneAndUpdate(
      query,
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(purchaseId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    const query = { companyId, isDeleted: true };
    if (mongoose.Types.ObjectId.isValid(purchaseId)) {
      query.$or = [{ purchaseId }, { _id: purchaseId }];
    } else {
      query.purchaseId = purchaseId;
    }
    return Purchase.findOneAndUpdate(
      query,
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Purchase.countDocuments({ companyId, isDeleted: false });
  }
}

export default new PurchaseRepository();
