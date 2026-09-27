import expenseRepository from '../repositories/expenseRepository.js';
import recycleBinRepository from '../repositories/recycleBinRepository.js';
import { runInTransaction } from '../utils/transactionHelper.js';
import { normalizeRecycleBinData } from '../utils/normalizeRecycleBinData.js';

class ExpenseService {
  async getExpense(expenseId, companyId) {
    return expenseRepository.findById(expenseId, companyId);
  }

  async getAllExpenses(companyId) {
    return expenseRepository.findAll(companyId);
  }

  async createExpense(expenseData, companyId, createdBy) {
    if (!companyId) {
      const err = new Error('Company ID is required for tenant operations.');
      err.statusCode = 400;
      throw err;
    }
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
    if (!companyId) {
      const err = new Error('Company ID is required for deletion.');
      err.statusCode = 400;
      throw err;
    }
    if (!deletedBy) {
      const err = new Error('Authenticated user identity is required for deletion.');
      err.statusCode = 400;
      throw err;
    }

    return runInTransaction(async (session) => {
      let expense = await expenseRepository.findById(expenseId, companyId, session);
      if (!expense) {
        expense = await expenseRepository.findAny(expenseId, companyId, session);
      }
      if (!expense) {
        const err = new Error('Expense not found');
        err.statusCode = 404;
        throw err;
      }
      if (expense.isDeleted) {
        return expense; // Idempotent: already soft deleted
      }

      const plainExpense = normalizeRecycleBinData(expense);
      const recycleBinItemData = {
        recycleBinItemId: `REC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        companyId,
        originalId: expense.expenseId || expense._id?.toString() || expenseId,
        name: `${expense.category}: ₹${expense.amount}`,
        module: 'Expense',
        deletedAt: new Date().toISOString(),
        deletedBy,
        originalData: plainExpense,
      };
      await recycleBinRepository.create(recycleBinItemData, session);

      const softDeleted = await expenseRepository.softDelete(expenseId, companyId, deletedBy, session);
      return softDeleted || expense;
    });
  }
}

export default new ExpenseService();
