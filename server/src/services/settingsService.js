import settingsRepository from '../repositories/settingsRepository.js';
import companyRepository from '../repositories/companyRepository.js';

class SettingsService {
  async getSettings(companyId) {
    let settings = await settingsRepository.findByCompanyId(companyId);
    if (!settings && companyId) {
      const company = await companyRepository.findById(companyId);
      if (company) {
        settings = await settingsRepository.create({
          companyId: company.companyId || companyId,
          businessName: company.businessName,
          ownerName: company.ownerName,
          phone: company.mobile,
          email: company.email || '',
          gstin: company.gstin || '',
          city: company.city || '',
          state: company.state || '',
          address: `${company.city || ''}, ${company.state || ''}`.trim(),
        });
      }
    }
    return settings;
  }

  async updateSettings(companyId, settingsData) {
    if (settingsData && settingsData.logo !== undefined) {
      try {
        const Company = (await import('../models/Company.js')).default;
        await Company.findOneAndUpdate(
          { $or: [{ companyId }, { _id: companyId }] },
          { logo: settingsData.logo }
        );
      } catch (e) {
        console.warn('Failed to update company logo on Company model:', e);
      }
    }
    return settingsRepository.upsert(companyId, settingsData);
  }
}

export default new SettingsService();
