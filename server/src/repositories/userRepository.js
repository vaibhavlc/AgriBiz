import User from '../models/User.js';
import mongoose from 'mongoose';

class UserRepository {
  async findById(userId) {
    if (!userId) return null;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      return User.findOne({ $or: [{ userId }, { _id: userId }] });
    }
    return User.findOne({ userId });
  }

  async findByMobile(mobile) {
    return User.findOne({ mobile });
  }

  async findByCompanyId(companyId) {
    return User.find({ companyId });
  }

  async create(userData) {
    // Remove mobile if null/empty so sparse unique index isn't violated
    if (!userData.mobile) delete userData.mobile;
    if (!userData.presenceStatus) userData.presenceStatus = 'online';
    return User.create(userData);
  }

  async update(userId, updateData) {
    if (!userId) return null;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      return User.findOneAndUpdate({ $or: [{ userId }, { _id: userId }] }, updateData, { new: true });
    }
    return User.findOneAndUpdate({ userId }, updateData, { new: true });
  }

  async delete(userId) {
    if (!userId) return null;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      return User.deleteOne({ $or: [{ userId }, { _id: userId }] });
    }
    return User.deleteOne({ userId });
  }

  async countDocuments() {
    return User.countDocuments();
  }

  async insertMany(users) {
    // Strip null/empty mobile so sparse unique index allows multiple staff without mobile
    const cleaned = users.map(u => {
      const doc = { ...u };
      if (!doc.mobile) delete doc.mobile;
      return doc;
    });
    return User.insertMany(cleaned);
  }
}

export default new UserRepository();
