import expenseService from '../services/expenseService.js';
import logger from '../config/logger.js';
import { socketEmitter } from '../realtime/socketEmitter.js';

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

      socketEmitter.publishSyncEvent({
        companyId,
        module: 'Expense',
        action: 'CREATE',
        recordId: expense.expenseId || expense._id || expense.id,
        updatedAt: expense.updatedAt || new Date().toISOString(),
        senderUserId: req.user.userId,
        senderDeviceId: req.body.deviceId || req.headers['x-device-id'] || null,
        senderSocketId: req.headers['x-socket-id'] || null
      });

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

      socketEmitter.publishSyncEvent({
        companyId,
        module: 'Expense',
        action: 'UPDATE',
        recordId: expense.expenseId || req.params.id,
        updatedAt: expense.updatedAt || new Date().toISOString(),
        senderUserId: req.user.userId,
        senderDeviceId: req.body.deviceId || req.headers['x-device-id'] || null,
        senderSocketId: req.headers['x-socket-id'] || null
      });

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

      socketEmitter.publishSyncEvent({
        companyId,
        module: 'Expense',
        action: 'DELETE',
        recordId: req.params.id,
        updatedAt: new Date().toISOString(),
        senderUserId: req.user.userId,
        senderDeviceId: req.headers['x-device-id'] || null,
        senderSocketId: req.headers['x-socket-id'] || null
      });

      res.status(200).json({ success: true, message: 'Expense soft-deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new ExpenseController();
