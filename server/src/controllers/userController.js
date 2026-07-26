import userService from '../services/userService.js';
import logger from '../config/logger.js';

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
      res.status(201).json({ success: true, message: 'Staff user created successfully', user: mapUserToClient(user) });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const companyId = req.user.companyId;
      logger.info('Updating staff user %s for company %s', req.params.id, companyId);
      const user = await userService.updateUser(req.params.id, companyId, req.body);
      res.status(200).json({ success: true, message: 'Staff user updated successfully', user: mapUserToClient(user) });
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
      res.status(200).json({ success: true, message: 'Staff user deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
