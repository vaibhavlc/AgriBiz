import express from 'express';
import purchaseController from '../controllers/purchaseController.js';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { purchaseSchema } from '../validators/domainValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeRoles('Owner', 'Accounts'), purchaseController.getPurchases);
router.get('/:id', authorizeRoles('Owner', 'Accounts'), purchaseController.getPurchase);
router.post('/', authorizeRoles('Owner', 'Accounts'), validate(purchaseSchema), purchaseController.createPurchase);
router.put('/:id', authorizeRoles('Owner', 'Accounts'), validate(purchaseSchema), purchaseController.updatePurchase);
router.delete('/:id', authorizeRoles('Owner', 'Accounts'), purchaseController.deletePurchase);

export default router;
