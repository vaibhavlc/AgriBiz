import User from '../models/User.js';

class UserRepository {
  async findById(userId) {
    return User.findOne({ userId });
  }

  async findByMobile(mobile) {
    return User.findOne({ mobile });
  }

  async findByCompanyId(companyId) {
    return User.find({ companyId });
  }

  async create(userData) {
    return User.create(userData);
  }

  async update(userId, updateData) {
    return User.findOneAndUpdate({ userId }, updateData, { new: true });
  }

  async delete(userId) {
    return User.deleteOne({ userId });
  }

  async countDocuments() {
    return User.countDocuments();
  }

  async insertMany(users) {
    return User.insertMany(users);
  }
}

export default new UserRepository();
