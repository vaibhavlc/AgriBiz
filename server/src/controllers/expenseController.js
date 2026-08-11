import expenseService from '../services/expenseService.js';
import logger from '../config/logger.js';
import { touchCompanyData } from '../utils/updateCompanyTimestamp.js';

class ExpenseController {
  async getExpense(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const expense = await expenseService.getExpense(req.params.id, companyId);
      if (!expense) {
        return res.status(404).json({ success: false, message: 'Expense record not found' });
      }
      res.status(200).json({ success: true, expense });
    } catch (error) {
      next(error);
    }
  }

  async getExpenses(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const expenses = await expenseService.getAllExpenses(companyId);
      res.status(200).json({ success: true, expenses });
    } catch (error) {
      next(error);
    }
  }

  async createExpense(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const creatorName = req.user.name;
      logger.info('Creating expense for company %s by %s', companyId, creatorName);
      const expense = await expenseService.createExpense(req.body, companyId, creatorName);
      await touchCompanyData(companyId, req.headers['x-socket-id'], 'Expenses', 'CREATE', expense._id || expense.expenseId, expense);
      res.status(201).json({ success: true, expense });
    } catch (error) {
      next(error);
    }
  }

  async updateExpense(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const updaterName = req.user.name;
      logger.info('Updating expense %s for company %s by %s', req.params.id, companyId, updaterName);
      const expense = await expenseService.updateExpense(req.params.id, companyId, req.body, updaterName);
      if (!expense) {
        return res.status(404).json({ success: false, message: 'Expense record not found' });
      }
      await touchCompanyData(companyId, req.headers['x-socket-id'], 'Expenses', 'UPDATE', req.params.id, expense);
      res.status(200).json({ success: true, expense });
    } catch (error) {
      next(error);
    }
  }

  async deleteExpense(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const deleterName = req.user.name;
      logger.info('Deleting expense %s for company %s by %s', req.params.id, companyId, deleterName);
      await expenseService.deleteExpense(req.params.id, companyId, deleterName);
      await touchCompanyData(companyId, req.headers['x-socket-id'], 'Expenses', 'DELETE', req.params.id);
      res.status(200).json({ success: true, message: 'Expense soft-deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new ExpenseController();
