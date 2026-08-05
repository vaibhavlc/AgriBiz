import recycleBinService from '../services/recycleBinService.js';
import logger from '../config/logger.js';
import { socketEmitter } from '../realtime/socketEmitter.js';

class RecycleBinController {
  async getRecycleBin(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const items = await recycleBinService.getRecycleBin(companyId);
      res.status(200).json({ success: true, items });
    } catch (error) {
      next(error);
    }
  }

  async restoreRecord(req, res, next) {
    try {
      const companyId = req.user.companyId;
      logger.info('Restoring recycle bin item %s for company %s', req.params.id, companyId);
      const restoredItem = await recycleBinService.restoreRecord(req.params.id, companyId);

      socketEmitter.publishSyncEvent({
        companyId,
        module: restoredItem?.itemType || 'RecycleBin',
        action: 'UPDATE',
        recordId: restoredItem?.originalId || req.params.id,
        updatedAt: new Date().toISOString(),
        senderUserId: req.user.userId,
        senderDeviceId: req.headers['x-device-id'] || null,
        senderSocketId: req.headers['x-socket-id'] || null
      });

      res.status(200).json({ success: true, message: 'Record restored successfully', item: restoredItem });
    } catch (error) {
      next(error);
    }
  }

  async deletePermanently(req, res, next) {
    try {
      const companyId = req.user.companyId;
      logger.info('Permanently deleting recycle bin item %s for company %s', req.params.id, companyId);
      await recycleBinService.deletePermanently(req.params.id, companyId);

      socketEmitter.publishSyncEvent({
        companyId,
        module: 'RecycleBin',
        action: 'DELETE',
        recordId: req.params.id,
        updatedAt: new Date().toISOString(),
        senderUserId: req.user.userId,
        senderDeviceId: req.headers['x-device-id'] || null,
        senderSocketId: req.headers['x-socket-id'] || null
      });

      res.status(200).json({ success: true, message: 'Record permanently deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new RecycleBinController();
