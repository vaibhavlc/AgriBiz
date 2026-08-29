import express from 'express';
import backupController from '../controllers/backupController.js';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Backup export, validation, and restoration routes (Owner only)
router.get('/export', authorizeRoles('Owner'), backupController.exportBackup);
router.post('/validate', authorizeRoles('Owner'), backupController.validateBackup);
router.post('/restore', authorizeRoles('Owner'), backupController.restoreBackup);
router.get('/last', authorizeRoles('Owner'), backupController.getLastBackupInfo);

export default router;
