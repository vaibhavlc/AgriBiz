import express from 'express';
import backupController from '../controllers/backupController.js';
import { authenticate, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public OAuth callback route from Google (bypasses header authentication middleware)
router.get('/google/callback', backupController.handleGoogleCallback);

router.use(authenticate);

// Backup export, validation, and restoration routes (Owner only)
router.get('/export', authorizeRoles('Owner'), backupController.exportBackup);
router.post('/validate', authorizeRoles('Owner'), backupController.validateBackup);
router.post('/restore', authorizeRoles('Owner'), backupController.restoreBackup);
router.get('/last', authorizeRoles('Owner'), backupController.getLastBackupInfo);

// Phase 2: Google Drive & Automatic Backup Routes (Owner only)
router.get('/google/auth-url', authorizeRoles('Owner'), backupController.getGoogleAuthUrl);
router.get('/google/status', authorizeRoles('Owner'), backupController.getGoogleDriveStatus);
router.post('/google/disconnect', authorizeRoles('Owner'), backupController.disconnectGoogleDrive);
router.post('/google/trigger', authorizeRoles('Owner'), backupController.triggerManualGoogleBackup);
router.get('/history', authorizeRoles('Owner'), backupController.getBackupHistory);

export default router;
