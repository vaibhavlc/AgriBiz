import Purchase from '../models/Purchase.js';

class PurchaseRepository {
  async findById(purchaseId, companyId) {
    return Purchase.findOne({ purchaseId, companyId, isDeleted: false });
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
    return Purchase.findOneAndUpdate({ purchaseId, companyId, isDeleted: false }, updateData, opts);
  }

  async softDelete(purchaseId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Purchase.findOneAndUpdate(
      { purchaseId, companyId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(purchaseId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Purchase.findOneAndUpdate(
      { purchaseId, companyId, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Purchase.countDocuments({ companyId, isDeleted: false });
  }
}

export default new PurchaseRepository();
