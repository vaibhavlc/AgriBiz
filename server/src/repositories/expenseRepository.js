import mongoose from 'mongoose';
import Expense from '../models/Expense.js';

class ExpenseRepository {
  buildQuery(expenseId, companyId, isDeleted = false) {
    if (!companyId) {
      const err = new Error('Company ID is required for database query.');
      err.statusCode = 400;
      throw err;
    }
    const cleanId = typeof expenseId === 'object' && expenseId !== null
      ? (expenseId.expenseId || expenseId._id?.toString() || String(expenseId))
      : String(expenseId || '');
    const $or = [{ expenseId: cleanId }];
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      $or.push({ _id: cleanId });
    }
    const query = { companyId, $or };
    if (isDeleted === false) {
      query.isDeleted = { $ne: true };
    } else if (isDeleted === true) {
      query.isDeleted = true;
    }
    return query;
  }

  async findById(expenseId, companyId, session) {
    const opts = session ? { session } : {};
    return Expense.findOne(this.buildQuery(expenseId, companyId, false), null, opts);
  }

  async findAny(expenseId, companyId, session) {
    const opts = session ? { session } : {};
    return Expense.findOne(this.buildQuery(expenseId, companyId, null), null, opts);
  }

  async findAll(companyId) {
    if (!companyId) return [];
    return Expense.find({ companyId, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
  }

  async create(expenseData, session) {
    const opts = session ? { session } : {};
    const [expense] = await Expense.create([expenseData], opts);
    return expense;
  }

  async update(expenseId, companyId, updateData, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Expense.findOneAndUpdate(this.buildQuery(expenseId, companyId, null), updateData, opts);
  }

  async softDelete(expenseId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Expense.findOneAndUpdate(
      this.buildQuery(expenseId, companyId, null),
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
    if (!companyId) return 0;
    return Expense.countDocuments({ companyId, isDeleted: { $ne: true } });
  }
}

export default new ExpenseRepository();
