import express from 'express';
import purchaseController from '../controllers/purchaseController.js';
import { authenticate, authorizePermission } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { purchaseSchema } from '../validators/domainValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizePermission('purchases'), purchaseController.getPurchases);
router.get('/:id', authorizePermission('purchases'), purchaseController.getPurchase);
router.post('/', authorizePermission('purchases'), validate(purchaseSchema), purchaseController.createPurchase);
router.put('/:id', authorizePermission('purchases'), validate(purchaseSchema), purchaseController.updatePurchase);
router.delete('/:id', authorizePermission('purchases'), purchaseController.deletePurchase);

export default router;
