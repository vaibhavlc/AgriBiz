import mongoose from 'mongoose';
import Customer from '../models/Customer.js';

class CustomerRepository {
  async findById(customerId, companyId, session) {
    const opts = session ? { session } : {};
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(customerId)) {
      query.$or = [{ customerId }, { _id: customerId }];
    } else {
      query.customerId = customerId;
    }
    return Customer.findOne(query, null, opts);
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
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(customerId)) {
      query.$or = [{ customerId }, { _id: customerId }];
    } else {
      query.customerId = customerId;
    }
    return Customer.findOneAndUpdate(query, updateData, opts);
  }

  async adjustOutstanding(customerId, companyId, deltaAmount, session) {
    const opts = session ? { session, new: true } : { new: true };
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(customerId)) {
      query.$or = [{ customerId }, { _id: customerId }];
    } else {
      query.customerId = customerId;
    }
    return Customer.findOneAndUpdate(
      query,
      { $inc: { outstanding: deltaAmount } },
      opts
    );
  }

  async softDelete(customerId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(customerId)) {
      query.$or = [{ customerId }, { _id: customerId }];
    } else {
      query.customerId = customerId;
    }
    return Customer.findOneAndUpdate(
      query,
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(customerId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    const query = { companyId, isDeleted: true };
    if (mongoose.Types.ObjectId.isValid(customerId)) {
      query.$or = [{ customerId }, { _id: customerId }];
    } else {
      query.customerId = customerId;
    }
    return Customer.findOneAndUpdate(
      query,
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Customer.countDocuments({ companyId, isDeleted: false });
  }
}

export default new CustomerRepository();
