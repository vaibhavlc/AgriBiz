import Invoice from '../models/Invoice.js';
import Purchase from '../models/Purchase.js';
import Expense from '../models/Expense.js';
import Payment from '../models/Payment.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';

class DashboardService {
  async getDashboardSummary(companyId) {
    const [salesAgg, purchasesAgg, expensesAgg, paymentsAgg, customerAgg, productCount] = await Promise.all([
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
      Product.countDocuments({ companyId, isDeleted: false })
    ]);

    const sales = salesAgg[0] || { totalSales: 0, totalAmountPaid: 0, totalBalanceDue: 0, count: 0 };
    const purchases = purchasesAgg[0] || { totalPurchases: 0, totalAmountPaid: 0, totalBalanceDue: 0, count: 0 };
    const expenses = expensesAgg[0] || { totalExpenses: 0, count: 0 };
    const payments = paymentsAgg[0] || { totalPayments: 0, count: 0 };
    const customers = customerAgg[0] || { totalOutstanding: 0, count: 0 };

    return {
      sales,
      purchases,
      expenses,
      payments,
      customers: {
        count: customers.count,
        totalOutstanding: customers.totalOutstanding
      },
      productCount
    };
  }
}

export default new DashboardService();
