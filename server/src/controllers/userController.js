import userService from '../services/userService.js';
import logger from '../config/logger.js';
import bcrypt from 'bcryptjs';
import userRepository from '../repositories/userRepository.js';
import { touchCompanyData } from '../utils/updateCompanyTimestamp.js';

const mapUserToClient = (user) => {
  if (!user) return null;
  return {
    id: user.userId,
    companyId: user.companyId,
    name: user.name,
    mobile: user.mobile,
    email: user.email,
    role: user.role,
    customPermissions: user.customPermissions,
    status: user.status,
    presenceStatus: user.presenceStatus || 'online',
    avatar: user.avatar,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

class UserController {
  async getCompanyUsers(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const users = await userService.getCompanyUsers(companyId);
      const clientUsers = users.map(mapUserToClient);
      res.status(200).json({ success: true, users: clientUsers });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const companyId = req.user.companyId;
      logger.info('Creating staff user for company %s', companyId);
      
      const payload = {
        ...req.body,
        userId: req.body.id || req.body.userId,
      };

      const user = await userService.createUser(payload, companyId);
      const mappedUser = mapUserToClient(user);
      await touchCompanyData(companyId, req.headers['x-socket-id'], 'Staff', 'CREATE', user._id, mappedUser);
      res.status(201).json({ success: true, message: 'Staff user created successfully', user: mappedUser });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const companyId = req.user.companyId;
      logger.info('Updating staff user %s for company %s', req.params.id, companyId);
      const user = await userService.updateUser(req.params.id, companyId, req.body);
      const mappedUser = mapUserToClient(user);
      await touchCompanyData(companyId, req.headers['x-socket-id'], 'Staff', 'UPDATE', req.params.id, mappedUser);
      res.status(200).json({ success: true, message: 'Staff user updated successfully', user: mappedUser });
    } catch (error) {
      next(error);
    }
  }

  async updatePresence(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.userId;
      const { presenceStatus } = req.body;

      if (!['online', 'busy', 'away'].includes(presenceStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid presence status.' });
      }

      logger.info('Updating presence status to %s for user %s', presenceStatus, userId);
      const user = await userService.updateUser(userId, companyId, { presenceStatus });
      const mappedUser = mapUserToClient(user);
      await touchCompanyData(companyId, req.headers['x-socket-id'], 'Staff', 'UPDATE', userId, mappedUser);
      res.status(200).json({ success: true, message: 'Presence status updated', presenceStatus: user.presenceStatus });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const companyId = req.user.companyId;
      logger.info('Deleting staff user %s for company %s', req.params.id, companyId);
      await userService.deleteUser(req.params.id, companyId);
      await touchCompanyData(companyId, req.headers['x-socket-id'], 'Staff', 'DELETE', req.params.id);
      res.status(200).json({ success: true, message: 'Staff user deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // Update own PIN (any authenticated user)
  async updateMyPin(req, res, next) {
    try {
      const userId = req.user.userId;
      const { currentPin, newPin } = req.body;

      if (!newPin || !/^\d{4}$/.test(newPin)) {
        return res.status(400).json({ success: false, message: 'New PIN must be exactly 4 digits.' });
      }

      const user = await userRepository.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      // If user already has a PIN, verify the current PIN first
      if (user.pin && currentPin) {
        const isMatch = await bcrypt.compare(currentPin.toString(), user.pin);
        if (!isMatch) {
          return res.status(401).json({ success: false, message: 'Current PIN is incorrect.' });
        }
      }

      user.pin = await bcrypt.hash(newPin.toString(), 10);
      user.updatedAt = new Date();
      await user.save();

      logger.info('PIN updated for user %s', userId);
      res.status(200).json({ success: true, message: 'PIN updated successfully.' });
    } catch (error) {
      next(error);
    }
  }

  // Owner resets any staff member's PIN
  async resetStaffPin(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const { newPin } = req.body;
      const targetUserId = req.params.id;

      if (!newPin || !/^\d{4}$/.test(newPin)) {
        return res.status(400).json({ success: false, message: 'New PIN must be exactly 4 digits.' });
      }

      const user = await userRepository.findById(targetUserId);
      if (!user || user.companyId !== companyId) {
        return res.status(404).json({ success: false, message: 'Staff member not found.' });
      }

      user.pin = await bcrypt.hash(newPin.toString(), 10);
      user.updatedAt = new Date();
      await user.save();

      logger.info('PIN reset for staff %s by owner %s', targetUserId, req.user.userId);
      res.status(200).json({ success: true, message: 'Staff PIN reset successfully.' });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
