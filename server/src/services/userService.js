import userRepository from '../repositories/userRepository.js';
import bcrypt from 'bcryptjs';

class UserService {
  async getCompanyUsers(companyId) {
    return userRepository.findByCompanyId(companyId);
  }

  async createUser(userData, companyId) {
    const cleanMobile = userData.mobile.replace(/\D/g, '');
    const existingUser = await userRepository.findByMobile(cleanMobile);
    if (existingUser) {
      throw new Error('A user account with this mobile number already exists.');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const payload = {
      ...userData,
      mobile: cleanMobile,
      password: hashedPassword,
      companyId,
      status: 'Active'
    };

    return userRepository.create(payload);
  }

  async updateUser(userId, companyId, updateData) {
    const user = await userRepository.findById(userId);
    if (!user || user.companyId !== companyId) {
      throw new Error('User not found');
    }

    const payload = { ...updateData };
    if (updateData.password && updateData.password.trim()) {
      payload.password = await bcrypt.hash(updateData.password.trim(), 10);
    } else {
      delete payload.password;
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
