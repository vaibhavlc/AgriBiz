import settingsService from '../services/settingsService.js';
import logger from '../config/logger.js';

class SettingsController {
  async getSettings(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const settings = await settingsService.getSettings(companyId);
      res.status(200).json({ success: true, settings });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const companyId = req.user.companyId;
      logger.info('Updating settings for company %s', companyId);
      const settings = await settingsService.updateSettings(companyId, req.body);
      res.status(200).json({ success: true, settings });
    } catch (error) {
      next(error);
    }
  }
}

export default new SettingsController();
