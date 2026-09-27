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
      let quotation = await quotationRepository.findById(quotationId, companyId, session);
      if (!quotation) {
        quotation = await quotationRepository.findAny(quotationId, companyId, session);
      }
      if (!quotation) {
        quotation = await quotationRepository.findAny(quotationId, null, session);
      }
      if (!quotation) {
        const err = new Error('Quotation not found');
        err.statusCode = 404;
        throw err;
      }
      if (quotation.isDeleted) {
        return quotation; // Idempotent: already soft deleted
      }

      try {
        const plainQuotation = quotation.toObject ? quotation.toObject() : JSON.parse(JSON.stringify(quotation));
        const effectiveDeleter = deletedBy || 'System';
        const effectiveCompany = companyId || quotation.companyId || 'DEFAULT_COMPANY';
        const recycleBinItemData = {
          recycleBinItemId: `REC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          companyId: effectiveCompany,
          originalId: quotation.quotationId || quotation._id?.toString() || quotationId,
          name: quotation.quotationNumber || quotationId,
          module: 'Quotation',
          deletedAt: new Date().toISOString(),
          deletedBy: effectiveDeleter,
          originalData: plainQuotation,
        };
        await recycleBinRepository.create(recycleBinItemData, session);
      } catch (rErr) {
        console.warn('Recycle bin record warning on quotation delete:', rErr.message);
      }

      const effectiveDeleter = deletedBy || 'System';
      let res = await quotationRepository.softDelete(quotationId, companyId || quotation.companyId, effectiveDeleter, session);
      if (!res && quotation._id) {
        await quotation.constructor.updateOne({ _id: quotation._id }, { isDeleted: true, deletedAt: new Date(), updatedBy: effectiveDeleter }, { session });
        res = await quotationRepository.findAny(quotationId, null, session);
      }
      return res || quotation;
    });
  }
}

export default new QuotationService();
