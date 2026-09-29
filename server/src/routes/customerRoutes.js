import express from 'express';
import customerController from '../controllers/customerController.js';
import { authenticate, authorizePermission } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { customerSchema } from '../validators/domainValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizePermission('customers'), customerController.getCustomers);
router.get('/:id', authorizePermission('customers'), customerController.getCustomer);
router.post('/', authorizePermission('customers'), validate(customerSchema), customerController.createCustomer);
router.put('/:id', authorizePermission('customers'), validate(customerSchema), customerController.updateCustomer);
router.delete('/:id', authorizePermission('customers'), customerController.deleteCustomer);

export default router;
