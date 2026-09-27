import mongoose from 'mongoose';
import Quotation from '../models/Quotation.js';

class QuotationRepository {
  async findById(quotationId, companyId, session) {
    const opts = session ? { session } : {};
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(quotationId)) {
      query.$or = [{ quotationId }, { _id: quotationId }];
    } else {
      query.quotationId = quotationId;
    }
    return Quotation.findOne(query, null, opts);
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
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(quotationId)) {
      query.$or = [{ quotationId }, { _id: quotationId }];
    } else {
      query.quotationId = quotationId;
    }
    return Quotation.findOneAndUpdate(query, updateData, opts);
  }

  async softDelete(quotationId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(quotationId)) {
      query.$or = [{ quotationId }, { _id: quotationId }];
    } else {
      query.quotationId = quotationId;
    }
    return Quotation.findOneAndUpdate(
      query,
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(quotationId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    const query = { companyId, isDeleted: true };
    if (mongoose.Types.ObjectId.isValid(quotationId)) {
      query.$or = [{ quotationId }, { _id: quotationId }];
    } else {
      query.quotationId = quotationId;
    }
    return Quotation.findOneAndUpdate(
      query,
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Quotation.countDocuments({ companyId, isDeleted: false });
  }
}

export default new QuotationRepository();
