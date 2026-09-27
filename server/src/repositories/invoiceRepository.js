import mongoose from 'mongoose';
import Invoice from '../models/Invoice.js';

class InvoiceRepository {
  async findById(invoiceId, companyId, session) {
    const opts = session ? { session } : {};
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(invoiceId)) {
      query.$or = [{ invoiceId }, { _id: invoiceId }];
    } else {
      query.invoiceId = invoiceId;
    }
    return Invoice.findOne(query, null, opts);
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
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(invoiceId)) {
      query.$or = [{ invoiceId }, { _id: invoiceId }];
    } else {
      query.invoiceId = invoiceId;
    }
    return Invoice.findOneAndUpdate(query, updateData, opts);
  }

  async softDelete(invoiceId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(invoiceId)) {
      query.$or = [{ invoiceId }, { _id: invoiceId }];
    } else {
      query.invoiceId = invoiceId;
    }
    return Invoice.findOneAndUpdate(
      query,
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(invoiceId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    const query = { companyId, isDeleted: true };
    if (mongoose.Types.ObjectId.isValid(invoiceId)) {
      query.$or = [{ invoiceId }, { _id: invoiceId }];
    } else {
      query.invoiceId = invoiceId;
    }
    return Invoice.findOneAndUpdate(
      query,
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Invoice.countDocuments({ companyId, isDeleted: false });
  }
}

export default new InvoiceRepository();
