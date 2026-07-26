import express from 'express';
import supplierController from '../controllers/supplierController.js';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { supplierSchema } from '../validators/domainValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeRoles('Owner', 'Accounts'), supplierController.getSuppliers);
router.get('/:id', authorizeRoles('Owner', 'Accounts'), supplierController.getSupplier);
router.post('/', authorizeRoles('Owner', 'Accounts'), validate(supplierSchema), supplierController.createSupplier);
router.put('/:id', authorizeRoles('Owner', 'Accounts'), validate(supplierSchema), supplierController.updateSupplier);
router.delete('/:id', authorizeRoles('Owner', 'Accounts'), supplierController.deleteSupplier);

export default router;
