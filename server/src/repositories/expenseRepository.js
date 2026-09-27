import mongoose from 'mongoose';
import Expense from '../models/Expense.js';

class ExpenseRepository {
  async findById(expenseId, companyId, session) {
    const opts = session ? { session } : {};
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(expenseId)) {
      query.$or = [{ expenseId }, { _id: expenseId }];
    } else {
      query.expenseId = expenseId;
    }
    return Expense.findOne(query, null, opts);
  }

  async findAll(companyId) {
    return Expense.find({ companyId, isDeleted: false }).sort({ createdAt: -1 });
  }

  async create(expenseData, session) {
    const opts = session ? { session } : {};
    const [expense] = await Expense.create([expenseData], opts);
    return expense;
  }

  async update(expenseId, companyId, updateData, session) {
    const opts = session ? { session, new: true } : { new: true };
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(expenseId)) {
      query.$or = [{ expenseId }, { _id: expenseId }];
    } else {
      query.expenseId = expenseId;
    }
    return Expense.findOneAndUpdate(query, updateData, opts);
  }

  async softDelete(expenseId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    const query = { companyId, isDeleted: false };
    if (mongoose.Types.ObjectId.isValid(expenseId)) {
      query.$or = [{ expenseId }, { _id: expenseId }];
    } else {
      query.expenseId = expenseId;
    }
    return Expense.findOneAndUpdate(
      query,
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(expenseId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    const query = { companyId, isDeleted: true };
    if (mongoose.Types.ObjectId.isValid(expenseId)) {
      query.$or = [{ expenseId }, { _id: expenseId }];
    } else {
      query.expenseId = expenseId;
    }
    return Expense.findOneAndUpdate(
      query,
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Expense.countDocuments({ companyId, isDeleted: false });
  }
}

export default new ExpenseRepository();
