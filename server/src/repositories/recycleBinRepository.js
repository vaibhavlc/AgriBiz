import mongoose from 'mongoose';
import RecycleBinItem from '../models/RecycleBinItem.js';

class RecycleBinRepository {
  buildQuery(recycleBinItemId, companyId) {
    if (!companyId) {
      const err = new Error('Company ID is required for database query.');
      err.statusCode = 400;
      throw err;
    }
    const cleanId = typeof recycleBinItemId === 'object' && recycleBinItemId !== null
      ? (recycleBinItemId.recycleBinItemId || recycleBinItemId._id?.toString() || String(recycleBinItemId))
      : String(recycleBinItemId || '');
    const $or = [{ recycleBinItemId: cleanId }];
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      $or.push({ _id: cleanId });
    }
    return { companyId, $or };
  }

  async findById(recycleBinItemId, companyId, session) {
    const opts = session ? { session } : {};
    return RecycleBinItem.findOne(this.buildQuery(recycleBinItemId, companyId), null, opts);
  }

  async findAll(companyId) {
    if (!companyId) return [];
    return RecycleBinItem.find({ companyId }).sort({ createdAt: -1 });
  }

  async create(recycleBinItemData, session) {
    const opts = session ? { session } : {};
    const [item] = await RecycleBinItem.create([recycleBinItemData], opts);
    return item;
  }

  async delete(recycleBinItemId, companyId, session) {
    const opts = session ? { session } : {};
    return RecycleBinItem.deleteOne(this.buildQuery(recycleBinItemId, companyId), opts);
  }

  async clearAll(companyId, session) {
    if (!companyId) return { deletedCount: 0 };
    const opts = session ? { session } : {};
    return RecycleBinItem.deleteMany({ companyId }, opts);
  }
}

export default new RecycleBinRepository();
