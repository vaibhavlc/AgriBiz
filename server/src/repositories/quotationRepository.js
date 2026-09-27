import mongoose from 'mongoose';
import Quotation from '../models/Quotation.js';

class QuotationRepository {
  buildQuery(quotationId, companyId, isDeleted = false) {
    const $or = [{ quotationId }, { quotationNumber: quotationId }];
    if (mongoose.Types.ObjectId.isValid(quotationId)) {
      $or.push({ _id: quotationId });
    }
    return { companyId, isDeleted, $or };
  }

  async findById(quotationId, companyId, session) {
    const opts = session ? { session } : {};
    return Quotation.findOne(this.buildQuery(quotationId, companyId, false), null, opts);
  }

  async findAll(companyId) {
    return Quotation.find({ companyId, isDeleted: false }).sort({ createdAt: -1 });
  }

  async findByQuotationNumber(quotationNumber, companyId) {
    return Quotation.findOne({ quotationNumber, companyId, isDeleted: false });
  }

  async create(quotationData, session) {
    const opts = session ? { session } : {};
    const [quotation] = await Quotation.create([quotationData], opts);
    return quotation;
  }

  async update(quotationId, companyId, updateData, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Quotation.findOneAndUpdate(this.buildQuery(quotationId, companyId, false), updateData, opts);
  }

  async softDelete(quotationId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Quotation.findOneAndUpdate(
      this.buildQuery(quotationId, companyId, false),
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(quotationId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Quotation.findOneAndUpdate(
      this.buildQuery(quotationId, companyId, true),
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Quotation.countDocuments({ companyId, isDeleted: false });
  }
}

export default new QuotationRepository();
