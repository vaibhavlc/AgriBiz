import mongoose from 'mongoose';
import Quotation from '../models/Quotation.js';

class QuotationRepository {
  buildQuery(quotationId, companyId, isDeleted = false) {
    const cleanId = typeof quotationId === 'object' && quotationId !== null
      ? (quotationId.quotationId || quotationId._id?.toString() || String(quotationId))
      : String(quotationId || '');
    const $or = [{ quotationId: cleanId }, { quotationNumber: cleanId }];
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

  async findById(quotationId, companyId, session) {
    const opts = session ? { session } : {};
    return Quotation.findOne(this.buildQuery(quotationId, companyId, false), null, opts);
  }

  async findAny(quotationId, companyId, session) {
    const opts = session ? { session } : {};
    return Quotation.findOne(this.buildQuery(quotationId, companyId, null), null, opts);
  }

  async findAll(companyId) {
    const query = companyId ? { $or: [{ companyId }, { companyId: { $exists: false } }], isDeleted: { $ne: true } } : { isDeleted: { $ne: true } };
    return Quotation.find(query).sort({ createdAt: -1 });
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
    const query = companyId ? { $or: [{ companyId }, { companyId: { $exists: false } }], isDeleted: { $ne: true } } : { isDeleted: { $ne: true } };
    return Quotation.countDocuments(query);
  }
}

export default new QuotationRepository();
