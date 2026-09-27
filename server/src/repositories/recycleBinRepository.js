import mongoose from 'mongoose';
import RecycleBinItem from '../models/RecycleBinItem.js';

class RecycleBinRepository {
  buildQuery(recycleBinItemId, companyId) {
    const cleanId = typeof recycleBinItemId === 'object' && recycleBinItemId !== null
      ? (recycleBinItemId.recycleBinItemId || recycleBinItemId._id?.toString() || String(recycleBinItemId))
      : String(recycleBinItemId || '');
    const $or = [{ recycleBinItemId: cleanId }];
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      $or.push({ _id: cleanId });
    }
    const query = { $or };
    if (companyId) {
      query.$and = [
        { $or: [{ companyId }, { companyId: { $exists: false } }, { companyId: null }, { companyId: '' }] }
      ];
    }
    return query;
  }

  async findById(recycleBinItemId, companyId, session) {
    const opts = session ? { session } : {};
    return RecycleBinItem.findOne(this.buildQuery(recycleBinItemId, companyId), null, opts);
  }

  async findAll(companyId) {
    const query = companyId ? { $or: [{ companyId }, { companyId: { $exists: false } }] } : {};
    return RecycleBinItem.find(query).sort({ createdAt: -1 });
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
    const opts = session ? { session } : {};
    const query = companyId ? { $or: [{ companyId }, { companyId: { $exists: false } }] } : {};
    return RecycleBinItem.deleteMany(query, opts);
  }
}

export default new RecycleBinRepository();
