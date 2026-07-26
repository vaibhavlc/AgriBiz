import express from 'express';
import customerController from '../controllers/customerController.js';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { customerSchema } from '../validators/domainValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeRoles('Owner', 'Accounts', 'Cashier'), customerController.getCustomers);
router.get('/:id', authorizeRoles('Owner', 'Accounts', 'Cashier'), customerController.getCustomer);
router.post('/', authorizeRoles('Owner', 'Accounts'), validate(customerSchema), customerController.createCustomer);
router.put('/:id', authorizeRoles('Owner', 'Accounts'), validate(customerSchema), customerController.updateCustomer);
router.delete('/:id', authorizeRoles('Owner', 'Accounts'), customerController.deleteCustomer);

export default router;
