import express from 'express';
import quotationController from '../controllers/quotationController.js';
import { authenticate, authorizePermission } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { quotationSchema } from '../validators/domainValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizePermission('sales'), quotationController.getQuotations);
router.get('/:id', authorizePermission('sales'), quotationController.getQuotation);
router.post('/', authorizePermission('sales'), validate(quotationSchema), quotationController.createQuotation);
router.put('/:id', authorizePermission('sales'), validate(quotationSchema), quotationController.updateQuotation);
router.delete('/:id', authorizePermission('sales'), quotationController.deleteQuotation);

export default router;
