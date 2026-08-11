import Customer from '../models/Customer.js';

class CustomerRepository {
  async findById(customerId, companyId, session) {
    const opts = session ? { session } : {};
    return Customer.findOne({ customerId, companyId, isDeleted: false }, null, opts);
  }

  async findAll(companyId) {
    return Customer.find({ companyId, isDeleted: false });
  }

  async findByPhone(phone, companyId) {
    return Customer.findOne({ phone, companyId, isDeleted: false });
  }

  async create(customerData, session) {
    const opts = session ? { session } : {};
    const [customer] = await Customer.create([customerData], opts);
    return customer;
  }

  async update(customerId, companyId, updateData, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Customer.findOneAndUpdate({ customerId, companyId, isDeleted: false }, updateData, opts);
  }

  async adjustOutstanding(customerId, companyId, deltaAmount, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Customer.findOneAndUpdate(
      { customerId, companyId, isDeleted: false },
      { $inc: { outstanding: deltaAmount } },
      opts
    );
  }

  async softDelete(customerId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Customer.findOneAndUpdate(
      { customerId, companyId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(customerId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Customer.findOneAndUpdate(
      { customerId, companyId, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Customer.countDocuments({ companyId, isDeleted: false });
  }
}

export default new CustomerRepository();
