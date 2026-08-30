import salaryService from '../services/salaryService.js';
import { touchCompanyData } from '../utils/updateCompanyTimestamp.js';

class SalaryController {
  async getSalaryRecords(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const records = await salaryService.getSalaryRecords(companyId);
      res.status(200).json({ success: true, records });
    } catch (error) {
      next(error);
    }
  }

  async getSalaryAdvances(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const advances = await salaryService.getSalaryAdvances(companyId);
      res.status(200).json({ success: true, advances });
    } catch (error) {
      next(error);
    }
  }

  async createSalaryRecord(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const createdBy = req.user.name;
      const record = await salaryService.createSalaryRecord(req.body, companyId, createdBy);
      await touchCompanyData(companyId, req.headers['x-socket-id'], 'SalaryRecord', 'CREATE', record.salaryId, record);
      res.status(201).json({ success: true, record });
    } catch (error) {
      next(error);
    }
  }

  async recordSalaryPayment(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const updatedBy = req.user.name;
      const record = await salaryService.recordSalaryPayment(req.params.id, req.body, companyId, updatedBy);
      await touchCompanyData(companyId, req.headers['x-socket-id'], 'SalaryRecord', 'UPDATE', record.salaryId, record);
      res.status(200).json({ success: true, record });
    } catch (error) {
      next(error);
    }
  }

  async createSalaryAdvance(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const createdBy = req.user.name;
      const advance = await salaryService.createSalaryAdvance(req.body, companyId, createdBy);
      await touchCompanyData(companyId, req.headers['x-socket-id'], 'SalaryAdvance', 'CREATE', advance.advanceId, advance);
      res.status(201).json({ success: true, advance });
    } catch (error) {
      next(error);
    }
  }
}

export default new SalaryController();
