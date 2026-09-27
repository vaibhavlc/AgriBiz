import quotationRepository from '../repositories/quotationRepository.js';
import recycleBinRepository from '../repositories/recycleBinRepository.js';
import { runInTransaction } from '../utils/transactionHelper.js';
import { normalizeRecycleBinData } from '../utils/normalizeRecycleBinData.js';

class QuotationService {
  async getQuotation(quotationId, companyId) {
    return quotationRepository.findById(quotationId, companyId);
  }

  async getAllQuotations(companyId) {
    return quotationRepository.findAll(companyId);
  }

  async createQuotation(quotationData, companyId, createdBy) {
    if (!companyId) {
      const err = new Error('Company ID is required for tenant operations.');
      err.statusCode = 400;
      throw err;
    }
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
    if (!companyId) {
      const err = new Error('Company ID is required for deletion.');
      err.statusCode = 400;
      throw err;
    }
    if (!deletedBy) {
      const err = new Error('Authenticated user identity is required for deletion.');
      err.statusCode = 400;
      throw err;
    }

    return runInTransaction(async (session) => {
      let quotation = await quotationRepository.findById(quotationId, companyId, session);
      if (!quotation) {
        quotation = await quotationRepository.findAny(quotationId, companyId, session);
      }
      if (!quotation) {
        const err = new Error('Quotation not found');
        err.statusCode = 404;
        throw err;
      }
      if (quotation.isDeleted) {
        return quotation; // Idempotent: already soft deleted
      }

      const plainQuotation = normalizeRecycleBinData(quotation);
      const recycleBinItemData = {
        recycleBinItemId: `REC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        companyId,
        originalId: quotation.quotationId || quotation._id?.toString() || quotationId,
        name: quotation.quotationNumber || quotationId,
        module: 'Quotation',
        deletedAt: new Date().toISOString(),
        deletedBy,
        originalData: plainQuotation,
      };
      await recycleBinRepository.create(recycleBinItemData, session);

      const softDeleted = await quotationRepository.softDelete(quotationId, companyId, deletedBy, session);
      return softDeleted || quotation;
    });
  }
}

export default new QuotationService();
