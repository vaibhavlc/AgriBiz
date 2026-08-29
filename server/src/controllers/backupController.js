import backupService from '../services/backupService.js';
import googleDriveService from '../services/googleDriveService.js';
import logger from '../config/logger.js';

class BackupController {
  async exportBackup(req, res, next) {
    try {
      const companyId = req.user.companyId;
      logger.info('User %s requested backup export for company %s', req.user.userId, companyId);

      const backupPayload = await backupService.exportBackup(companyId, req.user);
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `agribiz-backup-${companyId}-${dateStr}.json`;

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.status(200).send(JSON.stringify(backupPayload, null, 2));
    } catch (error) {
      next(error);
    }
  }

  async validateBackup(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const backupPayload = req.body;

      if (!backupPayload) {
        return res.status(400).json({ success: false, message: 'No backup file payload provided.' });
      }

      const validation = backupService.validateBackup(backupPayload, companyId);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          valid: false,
          message: validation.message,
        });
      }

      res.status(200).json({
        success: true,
        valid: true,
        metadata: validation.metadata,
        dataSummary: validation.calculatedSummary,
      });
    } catch (error) {
      next(error);
    }
  }

  async restoreBackup(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const { backupPayload, confirmText } = req.body;

      if (confirmText !== 'RESTORE') {
        return res.status(400).json({
          success: false,
          message: 'Confirmation mismatch. You must type "RESTORE" exactly to confirm data restoration.',
        });
      }

      if (!backupPayload) {
        return res.status(400).json({
          success: false,
          message: 'Missing backup payload for restoration.',
        });
      }

      const socketId = req.headers['x-socket-id'] || null;
      const result = await backupService.restoreBackup(companyId, backupPayload, socketId, req.user);

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Restoration failed.',
      });
    }
  }

  async getLastBackupInfo(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const info = await backupService.getLastBackupInfo(companyId);
      res.status(200).json({
        success: true,
        ...info,
      });
    } catch (error) {
      next(error);
    }
  }

  async getGoogleAuthUrl(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const url = googleDriveService.getAuthUrl(companyId);
      res.status(200).json({ success: true, url });
    } catch (error) {
      next(error);
    }
  }

  async handleGoogleCallback(req, res, next) {
    try {
      const { code, state } = req.query;
      const companyId = state || (req.user ? req.user.companyId : null);

      if (!code || !companyId) {
        return res.status(400).send('Missing authorization code or company identifier.');
      }

      await googleDriveService.handleOAuthCallback(code, companyId);

      // Redirect back to Settings UI page
      res.redirect(`http://localhost:5173/#settings?gdrive=connected`);
    } catch (error) {
      logger.error('Google OAuth callback error: %s', error.message);
      res.redirect(`http://localhost:5173/#settings?gdrive=error&msg=${encodeURIComponent(error.message)}`);
    }
  }

  async getGoogleDriveStatus(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const status = await googleDriveService.getStatus(companyId);
      res.status(200).json({ success: true, ...status });
    } catch (error) {
      next(error);
    }
  }

  async disconnectGoogleDrive(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const result = await googleDriveService.disconnectGoogleDrive(companyId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async triggerManualGoogleBackup(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const socketId = req.headers['x-socket-id'] || null;
      const result = await googleDriveService.uploadAndVerifyBackup(companyId, 'Manual', socketId, req.user);
      
      if (!result.success) {
        return res.status(500).json(result);
      }
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Manual Google Drive backup failed.',
      });
    }
  }

  async getBackupHistory(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const historyData = await googleDriveService.getHistory(companyId);
      res.status(200).json({ success: true, ...historyData });
    } catch (error) {
      next(error);
    }
  }
}

export default new BackupController();
