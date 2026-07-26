import quotationRepository from '../repositories/quotationRepository.js';
import recycleBinRepository from '../repositories/recycleBinRepository.js';
import { runInTransaction } from '../utils/transactionHelper.js';

class QuotationService {
  async getQuotation(quotationId, companyId) {
    return quotationRepository.findById(quotationId, companyId);
  }

  async getAllQuotations(companyId) {
    return quotationRepository.findAll(companyId);
  }

  async createQuotation(quotationData, companyId, createdBy) {
    const payload = {
      ...quotationData,
      companyId,
      createdBy,
      updatedBy: createdBy,
    };
    return quotationRepository.create(payload);
  }

  async updateQuotation(quotationId, companyId, updateData, updatedBy) {
    const payload = {
      ...updateData,
      updatedBy,
    };
    return quotationRepository.update(quotationId, companyId, payload);
  }

  async deleteQuotation(quotationId, companyId, deletedBy) {
    return runInTransaction(async (session) => {
      const quotation = await quotationRepository.findById(quotationId, companyId);
      if (!quotation) throw new Error('Quotation not found');

      const recycleBinItemData = {
        recycleBinItemId: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        companyId,
        originalId: quotation.quotationId,
        name: quotation.quotationNumber,
        module: 'Quotation',
        deletedAt: new Date().toISOString(),
        deletedBy,
        originalData: quotation,
      };

      await recycleBinRepository.create(recycleBinItemData, session);
      await quotationRepository.softDelete(quotationId, companyId, deletedBy, session);
      return quotation;
    });
  }
}

export default new QuotationService();
