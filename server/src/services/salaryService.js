import SalaryRecord from '../models/SalaryRecord.js';
import SalaryAdvance from '../models/SalaryAdvance.js';
import User from '../models/User.js';

class SalaryService {
  async getSalaryRecords(companyId) {
    return SalaryRecord.find({ companyId, isDeleted: false }).sort({ createdAt: -1 });
  }

  async getSalaryAdvances(companyId) {
    return SalaryAdvance.find({ companyId, isDeleted: false }).sort({ createdAt: -1 });
  }

  async createSalaryRecord(data, companyId, createdBy) {
    const baseSalary = Number(data.baseSalary) || 0;
    const bonus = Number(data.bonus) || 0;
    const additionalEarnings = Number(data.additionalEarnings) || 0;
    const deductions = Number(data.deductions) || 0;
    const advancesDeducted = Number(data.advancesDeducted) || 0;
    const amountPaid = Number(data.amountPaid) || 0;

    const netSalaryPayable = baseSalary + bonus + additionalEarnings - deductions - advancesDeducted;
    const balanceDue = Math.max(0, netSalaryPayable - amountPaid);
    
    let status = 'Pending';
    if (balanceDue <= 0 && netSalaryPayable > 0) {
      status = 'Paid';
    } else if (amountPaid > 0) {
      status = 'Partial';
    }

    const salaryId = data.salaryId || `SAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const salaryRecord = new SalaryRecord({
      salaryId,
      companyId,
      staffId: data.staffId,
      staffName: data.staffName,
      period: data.period || new Date().toISOString().slice(0, 7),
      date: data.date || new Date().toISOString().split('T')[0],
      baseSalary,
      bonus,
      additionalEarnings,
      deductions,
      advancesDeducted,
      netSalaryPayable,
      amountPaid,
      balanceDue,
      status,
      paymentMethod: data.paymentMethod,
      paymentDate: amountPaid > 0 ? (data.paymentDate || data.date) : undefined,
      notes: data.notes,
      createdBy,
      updatedBy: createdBy,
    });

    await salaryRecord.save();

    // Settle salary advance if advance was deducted
    if (advancesDeducted > 0 && data.staffId) {
      const activeAdvances = await SalaryAdvance.find({
        companyId,
        staffId: data.staffId,
        status: 'Active',
        isDeleted: false
      }).sort({ createdAt: 1 });

      let remainingToDeduct = advancesDeducted;
      for (const adv of activeAdvances) {
        if (remainingToDeduct <= 0) break;
        const unSettled = adv.amount - adv.settledAmount;
        if (unSettled <= 0) continue;

        const deduct = Math.min(remainingToDeduct, unSettled);
        adv.settledAmount += deduct;
        if (adv.settledAmount >= adv.amount) {
          adv.status = 'Settled';
        }
        await adv.save();
        remainingToDeduct -= deduct;
      }
    }

    return salaryRecord;
  }

  async recordSalaryPayment(salaryId, paymentData, companyId, updatedBy) {
    const record = await SalaryRecord.findOne({ salaryId, companyId, isDeleted: false });
    if (!record) {
      throw new Error('Salary record not found');
    }

    const additionalPaid = Number(paymentData.amountPaid) || 0;
    record.amountPaid += additionalPaid;
    record.balanceDue = Math.max(0, record.netSalaryPayable - record.amountPaid);

    if (record.balanceDue <= 0) {
      record.status = 'Paid';
    } else if (record.amountPaid > 0) {
      record.status = 'Partial';
    }

    if (paymentData.paymentMethod) {
      record.paymentMethod = paymentData.paymentMethod;
    }
    record.paymentDate = paymentData.paymentDate || new Date().toISOString().split('T')[0];
    record.updatedBy = updatedBy;

    await record.save();
    return record;
  }

  async createSalaryAdvance(data, companyId, createdBy) {
    const advanceId = data.advanceId || `ADV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const advance = new SalaryAdvance({
      advanceId,
      companyId,
      staffId: data.staffId,
      staffName: data.staffName,
      date: data.date || new Date().toISOString().split('T')[0],
      amount: Number(data.amount) || 0,
      settledAmount: 0,
      status: 'Active',
      notes: data.notes,
      createdBy,
      updatedBy: createdBy,
    });

    await advance.save();
    return advance;
  }
}

export default new SalaryService();
