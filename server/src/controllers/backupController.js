import backupService from '../services/backupService.js';
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
}

export default new BackupController();
