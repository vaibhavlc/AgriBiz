import mongoose from 'mongoose';
import Expense from '../models/Expense.js';

class ExpenseRepository {
  buildQuery(expenseId, companyId, isDeleted = false) {
    const $or = [{ expenseId }];
    if (mongoose.Types.ObjectId.isValid(expenseId)) {
      $or.push({ _id: expenseId });
    }
    return { companyId, isDeleted, $or };
  }

  async findById(expenseId, companyId, session) {
    const opts = session ? { session } : {};
    return Expense.findOne(this.buildQuery(expenseId, companyId, false), null, opts);
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
    return Expense.findOneAndUpdate(this.buildQuery(expenseId, companyId, false), updateData, opts);
  }

  async softDelete(expenseId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Expense.findOneAndUpdate(
      this.buildQuery(expenseId, companyId, false),
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(expenseId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Expense.findOneAndUpdate(
      this.buildQuery(expenseId, companyId, true),
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Expense.countDocuments({ companyId, isDeleted: false });
  }
}

export default new ExpenseRepository();
