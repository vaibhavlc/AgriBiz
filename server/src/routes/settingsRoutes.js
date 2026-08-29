import express from 'express';
import settingsController from '../controllers/settingsController.js';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { settingsSchema } from '../validators/domainValidator.js';

const router = express.Router();

router.use(authenticate);

router.get('/stream', authorizeRoles('Owner', 'Accounts', 'Cashier'), settingsController.streamRealtimeUpdates);
router.get('/version', authorizeRoles('Owner', 'Accounts', 'Cashier'), settingsController.getDataVersion);
router.get('/', authorizeRoles('Owner', 'Accounts', 'Cashier'), settingsController.getSettings);
router.put('/', authorizeRoles('Owner'), validate(settingsSchema), settingsController.updateSettings);

// DELETE Business Account (Owner only)
router.delete('/company', authorizeRoles('Owner'), settingsController.deleteCompanyAccount);

// Erase Business Data Routes (Owner only)
router.get('/erase/summary', authorizeRoles('Owner'), settingsController.getEraseSummary);
router.post('/erase/temporary', authorizeRoles('Owner'), settingsController.temporaryErase);
router.post('/erase/undo', authorizeRoles('Owner'), settingsController.undoLastErase);
router.post('/erase/permanent', authorizeRoles('Owner'), settingsController.permanentErase);

export default router;
