import express from 'express';
import paymentController from '../controllers/paymentController.js';
import { authenticate, authorizePermission } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { paymentSchema } from '../validators/domainValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizePermission('payments'), paymentController.getPayments);
router.get('/:id', authorizePermission('payments'), paymentController.getPayment);
router.get('/contact/:contactId', authorizePermission('payments'), paymentController.getPaymentsByContact);
router.post('/', authorizePermission('payments'), validate(paymentSchema), paymentController.createPayment);
router.put('/:id', authorizePermission('payments'), validate(paymentSchema), paymentController.updatePayment);
router.delete('/:id', authorizePermission('payments'), paymentController.deletePayment);

export default router;
