import Expense from '../models/Expense.js';

class ExpenseRepository {
  async findById(expenseId, companyId) {
    return Expense.findOne({ expenseId, companyId, isDeleted: false });
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
    return Expense.findOneAndUpdate({ expenseId, companyId, isDeleted: false }, updateData, opts);
  }

  async softDelete(expenseId, companyId, updatedBy, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Expense.findOneAndUpdate(
      { expenseId, companyId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date(), updatedBy },
      opts
    );
  }

  async restore(expenseId, companyId, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Expense.findOneAndUpdate(
      { expenseId, companyId, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      opts
    );
  }

  async count(companyId) {
    return Expense.countDocuments({ companyId, isDeleted: false });
  }
}

export default new ExpenseRepository();
