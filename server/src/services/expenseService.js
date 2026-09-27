import expenseRepository from '../repositories/expenseRepository.js';
import recycleBinRepository from '../repositories/recycleBinRepository.js';
import { runInTransaction } from '../utils/transactionHelper.js';

class ExpenseService {
  async getExpense(expenseId, companyId) {
    return expenseRepository.findById(expenseId, companyId);
  }

  async getAllExpenses(companyId) {
    return expenseRepository.findAll(companyId);
  }

  async createExpense(expenseData, companyId, createdBy) {
    const payload = {
      ...expenseData,
      companyId,
      createdBy,
      updatedBy: createdBy,
    };
    return expenseRepository.create(payload);
  }

  async updateExpense(expenseId, companyId, updateData, updatedBy) {
    const payload = {
      ...updateData,
      updatedBy,
    };
    return expenseRepository.update(expenseId, companyId, payload);
  }

  async deleteExpense(expenseId, companyId, deletedBy) {
    return runInTransaction(async (session) => {
      let expense = await expenseRepository.findById(expenseId, companyId, session);
      if (!expense) {
        expense = await expenseRepository.findAny(expenseId, companyId, session);
      }
      if (!expense) {
        expense = await expenseRepository.findAny(expenseId, null, session);
      }
      if (!expense) {
        const err = new Error('Expense not found');
        err.statusCode = 404;
        throw err;
      }
      if (expense.isDeleted) {
        return expense; // Idempotent: already soft deleted
      }

      try {
        const plainExpense = expense.toObject ? expense.toObject() : JSON.parse(JSON.stringify(expense));
        const effectiveDeleter = deletedBy || 'System';
        const effectiveCompany = companyId || expense.companyId || 'DEFAULT_COMPANY';
        const recycleBinItemData = {
          recycleBinItemId: `REC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          companyId: effectiveCompany,
          originalId: expense.expenseId || expense._id?.toString() || expenseId,
          name: `${expense.category}: ₹${expense.amount}`,
          module: 'Expense',
          deletedAt: new Date().toISOString(),
          deletedBy: effectiveDeleter,
          originalData: plainExpense,
        };
        await recycleBinRepository.create(recycleBinItemData, session);
      } catch (rErr) {
        console.warn('Recycle bin record warning on expense delete:', rErr.message);
      }

      const effectiveDeleter = deletedBy || 'System';
      let res = await expenseRepository.softDelete(expenseId, companyId || expense.companyId, effectiveDeleter, session);
      if (!res && expense._id) {
        await expense.constructor.updateOne({ _id: expense._id }, { isDeleted: true, deletedAt: new Date(), updatedBy: effectiveDeleter }, { session });
        res = await expenseRepository.findAny(expenseId, null, session);
      }
      return res || expense;
    });
  }
}

export default new ExpenseService();
