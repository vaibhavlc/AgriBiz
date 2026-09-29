import express from 'express';
import productController from '../controllers/productController.js';
import { authenticate, authorizePermission } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { productSchema } from '../validators/domainValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizePermission('inventory'), productController.getProducts);
router.get('/:id', authorizePermission('inventory'), productController.getProduct);
router.post('/', authorizePermission('inventory'), validate(productSchema), productController.createProduct);
router.put('/:id', authorizePermission('inventory'), validate(productSchema), productController.updateProduct);
router.delete('/:id', authorizePermission('inventory'), productController.deleteProduct);

export default router;
