import RecycleBinItem from '../models/RecycleBinItem.js';

class RecycleBinRepository {
  async findById(recycleBinItemId, companyId) {
    return RecycleBinItem.findOne({ recycleBinItemId, companyId });
  }

  async findAll(companyId) {
    return RecycleBinItem.find({ companyId }).sort({ createdAt: -1 });
  }

  async create(recycleBinItemData, session) {
    const opts = session ? { session } : {};
    const [item] = await RecycleBinItem.create([recycleBinItemData], opts);
    return item;
  }

  async delete(recycleBinItemId, companyId, session) {
    const opts = session ? { session } : {};
    return RecycleBinItem.deleteOne({ recycleBinItemId, companyId }, opts);
  }

  async clearAll(companyId, session) {
    const opts = session ? { session } : {};
    return RecycleBinItem.deleteMany({ companyId }, opts);
  }
}

export default new RecycleBinRepository();
