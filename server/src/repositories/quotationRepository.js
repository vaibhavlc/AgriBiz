import Quotation from '../models/Quotation.js';

class QuotationRepository {
  async findById(quotationId, companyId) {
    return Quotation.findOne({ quotationId, companyId, isDeleted: false });
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
    return Quotation.findOneAndUpdate({ quotationId, companyId, isDeleted: false }, updateData, opts);
  }

  async softDelete(quotationId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Quotation.findOneAndUpdate(
      { quotationId, companyId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(quotationId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Quotation.findOneAndUpdate(
      { quotationId, companyId, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Quotation.countDocuments({ companyId, isDeleted: false });
  }
}

export default new QuotationRepository();
