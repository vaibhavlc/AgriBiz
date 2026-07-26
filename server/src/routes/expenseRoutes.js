import express from 'express';
import expenseController from '../controllers/expenseController.js';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { expenseSchema } from '../validators/domainValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeRoles('Owner', 'Accounts'), expenseController.getExpenses);
router.get('/:id', authorizeRoles('Owner', 'Accounts'), expenseController.getExpense);
router.post('/', authorizeRoles('Owner', 'Accounts'), validate(expenseSchema), expenseController.createExpense);
router.put('/:id', authorizeRoles('Owner', 'Accounts'), validate(expenseSchema), expenseController.updateExpense);
router.delete('/:id', authorizeRoles('Owner', 'Accounts'), expenseController.deleteExpense);

export default router;
