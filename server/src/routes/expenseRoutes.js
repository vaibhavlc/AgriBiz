import express from 'express';
import expenseController from '../controllers/expenseController.js';
import { authenticate, authorizePermission } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { expenseSchema } from '../validators/domainValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizePermission('expenses'), expenseController.getExpenses);
router.get('/:id', authorizePermission('expenses'), expenseController.getExpense);
router.post('/', authorizePermission('expenses'), validate(expenseSchema), expenseController.createExpense);
router.put('/:id', authorizePermission('expenses'), validate(expenseSchema), expenseController.updateExpense);
router.delete('/:id', authorizePermission('expenses'), expenseController.deleteExpense);

export default router;
