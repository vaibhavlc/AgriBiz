import mongoose from 'mongoose';
import Invoice from '../models/Invoice.js';

class InvoiceRepository {
  buildQuery(invoiceId, companyId, isDeleted = false) {
    const cleanId = typeof invoiceId === 'object' && invoiceId !== null
      ? (invoiceId.invoiceId || invoiceId._id?.toString() || String(invoiceId))
      : String(invoiceId || '');
    const $or = [{ invoiceId: cleanId }, { invoiceNumber: cleanId }];
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      $or.push({ _id: cleanId });
    }
    const query = { companyId, $or };
    if (isDeleted !== null && isDeleted !== undefined) {
      query.isDeleted = isDeleted;
    }
    return query;
  }

  async findById(invoiceId, companyId, session) {
    const opts = session ? { session } : {};
    return Invoice.findOne(this.buildQuery(invoiceId, companyId, false), null, opts);
  }

  async findAny(invoiceId, companyId, session) {
    const opts = session ? { session } : {};
    return Invoice.findOne(this.buildQuery(invoiceId, companyId, null), null, opts);
  }

  async findAll(companyId) {
    return Invoice.find({ companyId, isDeleted: false }).sort({ createdAt: -1 });
  }

  async findByInvoiceNumber(invoiceNumber, companyId) {
    return Invoice.findOne({ invoiceNumber, companyId, isDeleted: false });
  }

  async create(invoiceData, session) {
    const opts = session ? { session } : {};
    const [invoice] = await Invoice.create([invoiceData], opts);
    return invoice;
  }

  async update(invoiceId, companyId, updateData, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Invoice.findOneAndUpdate(this.buildQuery(invoiceId, companyId, false), updateData, opts);
  }

  async softDelete(invoiceId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Invoice.findOneAndUpdate(
      this.buildQuery(invoiceId, companyId, false),
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(invoiceId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Invoice.findOneAndUpdate(
      this.buildQuery(invoiceId, companyId, true),
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Invoice.countDocuments({ companyId, isDeleted: false });
  }
}

export default new InvoiceRepository();
