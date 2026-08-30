import Invoice from '../models/Invoice.js';
import Purchase from '../models/Purchase.js';
import Expense from '../models/Expense.js';
import Payment from '../models/Payment.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import SalaryRecord from '../models/SalaryRecord.js';
import SalaryAdvance from '../models/SalaryAdvance.js';

class DashboardService {
  async getDashboardSummary(companyId) {
    const [
      salesAgg,
      purchasesAgg,
      expensesAgg,
      paymentsAgg,
      customerAgg,
      productCount,
      salaryAgg,
      advanceAgg
    ] = await Promise.all([
      Invoice.aggregate([
        { $match: { companyId, isDeleted: false } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$grandTotal' },
            totalAmountPaid: { $sum: '$amountPaid' },
            totalBalanceDue: { $sum: '$balanceDue' },
            count: { $sum: 1 }
          }
        }
      ]),
      Purchase.aggregate([
        { $match: { companyId, isDeleted: false } },
        {
          $group: {
            _id: null,
            totalPurchases: { $sum: '$grandTotal' },
            totalAmountPaid: { $sum: '$amountPaid' },
            totalBalanceDue: { $sum: '$balanceDue' },
            count: { $sum: 1 }
          }
        }
      ]),
      Expense.aggregate([
        { $match: { companyId, isDeleted: false } },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      Payment.aggregate([
        { $match: { companyId, isDeleted: false } },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      Customer.aggregate([
        { $match: { companyId, isDeleted: false } },
        {
          $group: {
            _id: null,
            totalOutstanding: { $sum: '$outstanding' },
            count: { $sum: 1 }
          }
        }
      ]),
      Product.countDocuments({ companyId, isDeleted: false }),
      SalaryRecord.aggregate([
        { $match: { companyId, isDeleted: false } },
        {
          $group: {
            _id: null,
            totalPayable: { $sum: '$netSalaryPayable' },
            totalPaid: { $sum: '$amountPaid' },
            totalPending: { $sum: '$balanceDue' },
            count: { $sum: 1 }
          }
        }
      ]),
      SalaryAdvance.aggregate([
        { $match: { companyId, isDeleted: false } },
        {
          $group: {
            _id: null,
            totalAdvances: { $sum: '$amount' },
            totalSettled: { $sum: '$settledAmount' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const sales = salesAgg[0] || { totalSales: 0, totalAmountPaid: 0, totalBalanceDue: 0, count: 0 };
    const purchases = purchasesAgg[0] || { totalPurchases: 0, totalAmountPaid: 0, totalBalanceDue: 0, count: 0 };
    const expenses = expensesAgg[0] || { totalExpenses: 0, count: 0 };
    const payments = paymentsAgg[0] || { totalPayments: 0, count: 0 };
    const customers = customerAgg[0] || { totalOutstanding: 0, count: 0 };
    const salary = salaryAgg[0] || { totalPayable: 0, totalPaid: 0, totalPending: 0, count: 0 };
    const advances = advanceAgg[0] || { totalAdvances: 0, totalSettled: 0, count: 0 };

    return {
      sales,
      purchases,
      expenses,
      payments,
      customers: {
        count: customers.count,
        totalOutstanding: customers.totalOutstanding
      },
      productCount,
      salary: {
        totalSalaryPayable: salary.totalPayable,
        totalSalaryPaid: salary.totalPaid,
        pendingSalary: salary.totalPending,
        totalAdvancesGiven: advances.totalAdvances,
        totalAdvancesSettled: advances.totalSettled,
        count: salary.count
      }
    };
  }
}

export default new DashboardService();
