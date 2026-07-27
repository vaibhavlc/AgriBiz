import userRepository from '../repositories/userRepository.js';
import bcrypt from 'bcryptjs';

class UserService {
  async getCompanyUsers(companyId) {
    return userRepository.findByCompanyId(companyId);
  }

  async createUser(userData, companyId) {
    const timestampSuffix = Date.now().toString().slice(-4);
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const userId = `USR-${userData.role.toUpperCase().slice(0, 4)}-${timestampSuffix}-${randomStr}`;

    const payload = {
      userId,
      name: userData.name,
      role: userData.role,
      status: userData.status || 'Active',
      companyId,
    };

    if (userData.mobile && userData.mobile.trim()) payload.mobile = userData.mobile.trim();
    if (userData.email && userData.email.trim()) payload.email = userData.email.trim();
    if (userData.password && userData.password.trim()) payload.password = await bcrypt.hash(userData.password.trim(), 10);

    if (userData.pin && userData.pin.toString().trim()) {
      payload.pin = await bcrypt.hash(userData.pin.toString().trim(), 10);
    }

    return userRepository.create(payload);
  }

  async updateUser(userId, companyId, updateData) {
    const user = await userRepository.findById(userId);
    if (!user || user.companyId !== companyId) {
      throw new Error('User not found');
    }

    const payload = {
      name: updateData.name,
      role: updateData.role,
      status: updateData.status
    };

    if (updateData.pin && updateData.pin.toString().trim()) {
      payload.pin = await bcrypt.hash(updateData.pin.toString().trim(), 10);
    }

    return userRepository.update(userId, payload);
  }

  async deleteUser(userId, companyId) {
    const user = await userRepository.findById(userId);
    if (!user || user.companyId !== companyId) {
      throw new Error('User not found');
    }
    return userRepository.delete(userId);
  }
}

export default new UserService();
