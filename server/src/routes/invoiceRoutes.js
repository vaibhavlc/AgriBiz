import express from 'express';
import invoiceController from '../controllers/invoiceController.js';
import { authenticate, authorizePermission } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { invoiceSchema } from '../validators/domainValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizePermission('sales'), invoiceController.getInvoices);
router.get('/:id', authorizePermission('sales'), invoiceController.getInvoice);
router.post('/', authorizePermission('sales'), validate(invoiceSchema), invoiceController.createInvoice);
router.put('/:id', authorizePermission('sales'), validate(invoiceSchema), invoiceController.updateInvoice);
router.delete('/:id', authorizePermission('sales'), invoiceController.deleteInvoice);

export default router;
