import Invoice from '../models/Invoice.js';

class InvoiceRepository {
  async findById(invoiceId, companyId) {
    return Invoice.findOne({ invoiceId, companyId, isDeleted: false });
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
    return Invoice.findOneAndUpdate({ invoiceId, companyId, isDeleted: false }, updateData, opts);
  }

  async softDelete(invoiceId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Invoice.findOneAndUpdate(
      { invoiceId, companyId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(invoiceId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Invoice.findOneAndUpdate(
      { invoiceId, companyId, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Invoice.countDocuments({ companyId, isDeleted: false });
  }
}

export default new InvoiceRepository();
