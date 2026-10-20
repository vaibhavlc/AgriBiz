import cron from 'node-cron';
import Company from '../models/Company.js';
import Settings from '../models/Settings.js';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import pushNotificationService from './pushNotificationService.js';
import logger from '../config/logger.js';

class NotificationSchedulerService {
  constructor() {
    this.isInitialized = false;
    this.lastCompanyCheck = new Map();
  }

  initScheduler() {
    if (this.isInitialized) {
      logger.warn('[NOTIFICATION-SCHEDULER] Scheduler already initialized, skipping duplicate call.');
      return false;
    }
    this.isInitialized = true;
    logger.info('[NOTIFICATION-SCHEDULER] Initializing business notifications scheduler (09:00 AM IST & 02:00 PM IST + Cloud Catch-up)...');

    // 1. Daily Morning Business Alerts at 09:00 AM IST (Asia/Kolkata)
    cron.schedule(
      '0 9 * * *',
      async () => {
        logger.info('[NOTIFICATION-SCHEDULER] 09:00 AM Daily Business Alerts triggered.');
        await this.runDuesAndStockCheck('Cron_09AM');
      },
      {
        scheduled: true,
        timezone: 'Asia/Kolkata',
      }
    );

    // 2. Afternoon Overdue Check at 02:00 PM IST
    cron.schedule(
      '0 14 * * *',
      async () => {
        logger.info('[NOTIFICATION-SCHEDULER] 02:00 PM Overdue Payment Reminder triggered.');
        await this.runDuesAndStockCheck('Cron_02PM');
      },
      {
        scheduled: true,
        timezone: 'Asia/Kolkata',
      }
    );

    // 3. Periodic Hourly Check: Catches up on missed daily reminders if server was sleeping/restarted
    cron.schedule('0 * * * *', async () => {
      await this.runDuesAndStockCheck('HourlyCatchup');
    });

    // 4. Initial check 25 seconds after server startup
    setTimeout(() => {
      this.runDuesAndStockCheck('StartupCheck').catch((err) => {
        logger.warn('[NOTIFICATION-SCHEDULER] Startup check error: %s', err.message);
      });
    }, 25000);

    return true;
  }

  /**
   * On-demand / lazy catch-up check for a single company (e.g. on user dashboard load after server sleep)
   */
  async runCatchupCheckForCompany(companyId) {
    if (!companyId) return;
    const now = Date.now();
    const last = this.lastCompanyCheck.get(companyId) || 0;
    // Throttle to at most once every 30 minutes (1800000 ms)
    if (now - last < 1800000) return;
    this.lastCompanyCheck.set(companyId, now);

    try {
      const istTime = new Date(now + 5.5 * 60 * 60 * 1000);
      const todayIST = istTime.toISOString().split('T')[0];
      await this.checkSingleCompanyDuesAndStock(companyId, todayIST, istTime);
    } catch (e) {
      logger.warn('[NOTIFICATION-SCHEDULER] Catchup error for company %s: %s', companyId, e.message);
    }
  }

  /**
   * Evaluates a single company for upcoming dues, overdue invoices, and low stock
   */
  async checkSingleCompanyDuesAndStock(companyId, todayIST, istTime) {
    const settings = (await Settings.findOne({ companyId }).lean()) || {};
    const currencySymbol = settings.currencySymbol || '₹';
    const reminderDays = settings.dueReminderDaysBefore || 2;

    // Calculate target upcoming date
    const targetDateObj = new Date(istTime.getTime() + reminderDays * 24 * 60 * 60 * 1000);
    const targetDateIST = targetDateObj.toISOString().split('T')[0];

    // ── A. Upcoming & Overdue Invoice Dues ──
    if (settings.notifyUpcomingDues !== false || settings.notifyOverdueDues !== false) {
      const pendingInvoices = await Invoice.find({
        companyId,
        isDeleted: false,
        balanceDue: { $gt: 0 },
        paymentStatus: { $ne: 'Paid' },
        status: { $nin: ['Returned', 'Cancelled'] },
        dueDate: { $exists: true, $ne: '' },
      })
        .select('invoiceNumber customerName balanceDue dueDate paymentStatus status')
        .lean();

      for (const inv of pendingInvoices) {
        const { invoiceNumber, customerName, balanceDue, dueDate } = inv;
        if (!dueDate) continue;

        // Normalized comparison string YYYY-MM-DD
        const invDue = dueDate.trim();

        if (invDue < todayIST) {
          // Overdue
          if (settings.notifyOverdueDues !== false) {
            await pushNotificationService.notifyOverduePayment({
              companyId,
              invoiceNumber,
              customerName,
              balanceDue,
              dueDate: invDue,
              currencySymbol,
            });
          }
        } else if (invDue >= todayIST && invDue <= targetDateIST) {
          // Upcoming within reminder threshold
          if (settings.notifyUpcomingDues !== false) {
            await pushNotificationService.notifyUpcomingDue({
              companyId,
              invoiceNumber,
              customerName,
              balanceDue,
              dueDate: invDue,
              currencySymbol,
            });
          }
        }
      }
    }

    // ── B. Low Stock & Out-of-Stock Products ──
    if (settings.notifyLowStock !== false || settings.notifyOutOfStock !== false) {
      const lowStockProducts = await Product.find({
        companyId,
        isDeleted: false,
        $or: [
          { stock: { $lte: 0 } },
          { $expr: { $lte: ['$stock', '$minStock'] } },
        ],
      })
        .select('productId name stock minStock')
        .lean();

      for (const prod of lowStockProducts) {
        await pushNotificationService.notifyStockAlert({
          companyId,
          productId: prod.productId,
          productName: prod.name,
          stock: prod.stock,
          minStock: prod.minStock,
        });
      }
    }
  }

  /**
   * Evaluates all companies for upcoming dues, overdue invoices, and low stock
   */
  async runDuesAndStockCheck(source = 'Manual') {
    try {
      const companies = await Company.find({ isActive: true }).select('companyId businessName').lean();
      if (!companies || companies.length === 0) return;

      const now = new Date();
      // IST date string YYYY-MM-DD
      const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
      const todayIST = istTime.toISOString().split('T')[0];

      for (const comp of companies) {
        await this.checkSingleCompanyDuesAndStock(comp.companyId, todayIST, istTime);
        this.lastCompanyCheck.set(comp.companyId, Date.now());
      }
    } catch (error) {
      logger.error('[NOTIFICATION-SCHEDULER] Error during dues & stock check (%s): %s', source, error.message);
    }
  }
}

export default new NotificationSchedulerService();
