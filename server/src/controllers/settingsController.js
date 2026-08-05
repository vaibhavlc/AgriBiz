import settingsService from '../services/settingsService.js';
import userRepository from '../repositories/userRepository.js';
import { cascadeDeleteCompany } from '../utils/cascadeDelete.js';
import bcrypt from 'bcryptjs';
import logger from '../config/logger.js';
import { socketEmitter } from '../realtime/socketEmitter.js';

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

      socketEmitter.publishSyncEvent({
        companyId,
        module: 'Settings',
        action: 'UPDATE',
        recordId: 'business',
        updatedAt: settings.updatedAt || new Date().toISOString(),
        senderUserId: req.user.userId,
        senderDeviceId: req.body.deviceId || req.headers['x-device-id'] || null,
        senderSocketId: req.headers['x-socket-id'] || null
      });

      res.status(200).json({ success: true, settings });
    } catch (error) {
      next(error);
    }
  }

  async deleteCompanyAccount(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.userId;
      const { confirmText, passwordOrPin } = req.body;

      if (confirmText !== 'DELETE') {
        return res.status(400).json({
          success: false,
          message: 'Confirmation mismatch. You must type "DELETE" exactly to confirm account deletion.',
        });
      }

      if (!passwordOrPin || !passwordOrPin.toString().trim()) {
        return res.status(400).json({
          success: false,
          message: 'Owner password or PIN is required for verification.',
        });
      }

      const user = await userRepository.findById(userId);
      if (!user || user.role !== 'Owner' || user.companyId !== companyId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Only the registered Business Owner can delete this account.',
        });
      }

      const input = passwordOrPin.toString().trim();
      let isVerified = false;

      if (user.password) {
        isVerified = await bcrypt.compare(input, user.password);
      }
      if (!isVerified && user.pin) {
        isVerified = await bcrypt.compare(input, user.pin);
      }

      if (!isVerified) {
        return res.status(401).json({
          success: false,
          message: 'Verification failed: Incorrect Owner Password or PIN.',
        });
      }

      logger.warn('Owner %s confirmed full account deletion for company %s. Deleting all records...', userId, companyId);

      const deleteResult = await cascadeDeleteCompany(companyId);

      socketEmitter.publishSyncEvent({
        companyId,
        module: 'Settings',
        action: 'DELETE',
        recordId: 'company_account',
        updatedAt: new Date().toISOString(),
        senderUserId: req.user.userId,
        senderDeviceId: req.headers['x-device-id'] || null,
        senderSocketId: req.headers['x-socket-id'] || null
      });

      res.clearCookie('agribiz_refresh_token');

      res.status(200).json({
        success: true,
        message: 'Business account and all associated company data deleted permanently.',
        details: deleteResult.results,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SettingsController();
