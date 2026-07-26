import express from 'express';
import productController from '../controllers/productController.js';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { productSchema } from '../validators/domainValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeRoles('Owner', 'Accounts', 'Cashier'), productController.getProducts);
router.get('/:id', authorizeRoles('Owner', 'Accounts', 'Cashier'), productController.getProduct);
router.post('/', authorizeRoles('Owner', 'Accounts'), validate(productSchema), productController.createProduct);
router.put('/:id', authorizeRoles('Owner', 'Accounts'), validate(productSchema), productController.updateProduct);
router.delete('/:id', authorizeRoles('Owner', 'Accounts'), productController.deleteProduct);

export default router;
