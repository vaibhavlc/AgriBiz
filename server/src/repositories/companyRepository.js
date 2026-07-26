import Company from '../models/Company.js';

class CompanyRepository {
  async findById(companyId) {
    return Company.findOne({ companyId });
  }

  async findByMobile(mobile) {
    return Company.findOne({ mobile });
  }

  async create(companyData) {
    return Company.create(companyData);
  }

  async update(companyId, updateData) {
    return Company.findOneAndUpdate({ companyId }, updateData, { new: true });
  }
}

export default new CompanyRepository();
