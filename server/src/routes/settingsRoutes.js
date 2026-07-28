import express from 'express';
import settingsController from '../controllers/settingsController.js';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { settingsSchema } from '../validators/domainValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeRoles('Owner', 'Accounts', 'Cashier'), settingsController.getSettings);
router.put('/', authorizeRoles('Owner'), validate(settingsSchema), settingsController.updateSettings);

// DELETE Business Account (Owner only)
router.delete('/company', authorizeRoles('Owner'), settingsController.deleteCompanyAccount);

export default router;
