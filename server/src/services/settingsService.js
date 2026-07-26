import settingsRepository from '../repositories/settingsRepository.js';

class SettingsService {
  async getSettings(companyId) {
    return settingsRepository.findByCompanyId(companyId);
  }

  async updateSettings(companyId, settingsData) {
    return settingsRepository.upsert(companyId, settingsData);
  }
}

export default new SettingsService();
