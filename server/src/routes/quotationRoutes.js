import express from 'express';
import quotationController from '../controllers/quotationController.js';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { quotationSchema } from '../validators/domainValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeRoles('Owner', 'Accounts', 'Cashier'), quotationController.getQuotations);
router.get('/:id', authorizeRoles('Owner', 'Accounts', 'Cashier'), quotationController.getQuotation);
router.post('/', authorizeRoles('Owner', 'Accounts', 'Cashier'), validate(quotationSchema), quotationController.createQuotation);
router.put('/:id', authorizeRoles('Owner', 'Accounts'), validate(quotationSchema), quotationController.updateQuotation);
router.delete('/:id', authorizeRoles('Owner', 'Accounts'), quotationController.deleteQuotation);

export default router;
