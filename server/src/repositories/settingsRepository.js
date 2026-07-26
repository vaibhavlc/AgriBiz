import Settings from '../models/Settings.js';

class SettingsRepository {
  async findByCompanyId(companyId) {
    return Settings.findOne({ companyId });
  }

  async create(settingsData, session) {
    const opts = session ? { session } : {};
    const [settings] = await Settings.create([settingsData], opts);
    return settings;
  }

  async update(companyId, updateData, session) {
    const opts = session ? { session, new: true } : { new: true };
    return Settings.findOneAndUpdate({ companyId }, updateData, opts);
  }

  async upsert(companyId, settingsData, session) {
    const opts = session ? { session, new: true, upsert: true } : { new: true, upsert: true };
    return Settings.findOneAndUpdate({ companyId }, settingsData, opts);
  }
}

export default new SettingsRepository();
