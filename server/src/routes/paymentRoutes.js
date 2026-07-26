import express from 'express';
import paymentController from '../controllers/paymentController.js';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { paymentSchema } from '../validators/domainValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeRoles('Owner', 'Accounts', 'Cashier'), paymentController.getPayments);
router.get('/:id', authorizeRoles('Owner', 'Accounts', 'Cashier'), paymentController.getPayment);
router.get('/contact/:contactId', authorizeRoles('Owner', 'Accounts', 'Cashier'), paymentController.getPaymentsByContact);
router.post('/', authorizeRoles('Owner', 'Accounts', 'Cashier'), validate(paymentSchema), paymentController.createPayment);
router.put('/:id', authorizeRoles('Owner', 'Accounts'), validate(paymentSchema), paymentController.updatePayment);
router.delete('/:id', authorizeRoles('Owner', 'Accounts'), paymentController.deletePayment);

export default router;
