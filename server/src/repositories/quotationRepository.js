import mongoose from 'mongoose';
import Quotation from '../models/Quotation.js';

class QuotationRepository {
  buildQuery(quotationId, companyId, isDeleted = false) {
    if (!companyId) {
      const err = new Error('Company ID is required for database query.');
      err.statusCode = 400;
      throw err;
    }
    const cleanId = typeof quotationId === 'object' && quotationId !== null
      ? (quotationId.quotationId || quotationId._id?.toString() || String(quotationId))
      : String(quotationId || '');
    const $or = [{ quotationId: cleanId }, { quotationNumber: cleanId }];
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      $or.push({ _id: cleanId });
    }
    const query = { companyId, $or };
    if (isDeleted === false) {
      query.isDeleted = { $ne: true };
    } else if (isDeleted === true) {
      query.isDeleted = true;
    }
    return query;
  }

  async findById(quotationId, companyId, session) {
    const opts = session ? { session } : {};
    return Quotation.findOne(this.buildQuery(quotationId, companyId, false), null, opts);
  }

  async findAny(quotationId, companyId, session) {
    const opts = session ? { session } : {};
    return Quotation.findOne(this.buildQuery(quotationId, companyId, null), null, opts);
  }

  async findAll(companyId) {
    if (!companyId) return [];
    return Quotation.find({ companyId, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
  }

  async findByQuotationNumber(quotationNumber, companyId) {
    return Quotation.findOne(this.buildQuery(quotationNumber, companyId, false));
  }

  async create(quotationData, session) {
    const opts = session ? { session } : {};
    const [quotation] = await Quotation.create([quotationData], opts);
    return quotation;
  }

  async update(quotationId, companyId, updateData, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Quotation.findOneAndUpdate(this.buildQuery(quotationId, companyId, null), updateData, opts);
  }

  async softDelete(quotationId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Quotation.findOneAndUpdate(
      this.buildQuery(quotationId, companyId, null),
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
    if (!companyId) return 0;
    return Quotation.countDocuments({ companyId, isDeleted: { $ne: true } });
  }
}

export default new QuotationRepository();
