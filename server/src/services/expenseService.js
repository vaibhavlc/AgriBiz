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
      const expense = await expenseRepository.findById(expenseId, companyId);
      if (!expense) throw new Error('Expense not found');

      const recycleBinItemData = {
        recycleBinItemId: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        companyId,
        originalId: expense.expenseId,
        name: `${expense.category}: ₹${expense.amount}`,
        module: 'Expense',
        deletedAt: new Date().toISOString(),
        deletedBy,
        originalData: expense,
      };

      await recycleBinRepository.create(recycleBinItemData, session);
      await expenseRepository.softDelete(expenseId, companyId, deletedBy, session);
      return expense;
    });
  }
}

export default new ExpenseService();
