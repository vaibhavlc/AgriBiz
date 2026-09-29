import express from 'express';
import supplierController from '../controllers/supplierController.js';
import { authenticate, authorizePermission } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { supplierSchema } from '../validators/domainValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizePermission('suppliers'), supplierController.getSuppliers);
router.get('/:id', authorizePermission('suppliers'), supplierController.getSupplier);
router.post('/', authorizePermission('suppliers'), validate(supplierSchema), supplierController.createSupplier);
router.put('/:id', authorizePermission('suppliers'), validate(supplierSchema), supplierController.updateSupplier);
router.delete('/:id', authorizePermission('suppliers'), supplierController.deleteSupplier);

export default router;
