import express from 'express';
import invoiceController from '../controllers/invoiceController.js';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { invoiceSchema } from '../validators/domainValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeRoles('Owner', 'Accounts', 'Cashier'), invoiceController.getInvoices);
router.get('/:id', authorizeRoles('Owner', 'Accounts', 'Cashier'), invoiceController.getInvoice);
router.post('/', authorizeRoles('Owner', 'Accounts', 'Cashier'), validate(invoiceSchema), invoiceController.createInvoice);
router.put('/:id', authorizeRoles('Owner', 'Accounts'), validate(invoiceSchema), invoiceController.updateInvoice);
router.delete('/:id', authorizeRoles('Owner', 'Accounts'), invoiceController.deleteInvoice);

export default router;
