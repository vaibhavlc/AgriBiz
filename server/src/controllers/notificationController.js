import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pushNotificationService from '../services/pushNotificationService.js';
import notificationSchedulerService from '../services/notificationSchedulerService.js';
import Notification from '../models/Notification.js';
import Settings from '../models/Settings.js';
import Company from '../models/Company.js';
import PushSubscription from '../models/PushSubscription.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function localizeNotificationRecord(notif, targetLang = 'en') {
  if (!notif) return notif;
  const isMr = targetLang === 'mr';

  // 1. Direct bilingual fields
  if (isMr && notif.titleMr) {
    notif.title = notif.titleMr;
    if (notif.bodyMr) notif.body = notif.bodyMr;
    return notif;
  }
  if (!isMr && notif.titleEn) {
    notif.title = notif.titleEn;
    if (notif.bodyEn) notif.body = notif.bodyEn;
    return notif;
  }

  // 2. Fallback translation for existing / legacy records
  const titleMapEnToMr = {
    'Payment Due Soon': 'देयक देण्याची वेळ जवळ आली आहे',
    'Payment Overdue': 'थकबाकी देयकाची मुदत संपली',
    'Payment Received': 'रक्कम प्राप्त झाली',
    'Low Stock Alert': 'कमी साठा सूचना',
    'Out of Stock Alert': 'स्टॉक संपला सूचना',
    'New Order Created': 'नवीन ऑर्डर तयार केली',
    'Order Status Updated': 'ऑर्डर स्थिती अपडेट झाली',
    'Stock Restocked': 'साठा भरला',
    'AgriBiz Alert': 'AgriBiz चाचणी सूचना',
  };

  const titleMapMrToEn = {
    'देयक देण्याची वेळ जवळ आली आहे': 'Payment Due Soon',
    'थकबाकी देयकाची मुदत संपली': 'Payment Overdue',
    'रक्कम प्राप्त झाली': 'Payment Received',
    'कमी साठा सूचना': 'Low Stock Alert',
    'स्टॉक संपला सूचना': 'Out of Stock Alert',
    'नवीन ऑर्डर तयार केली': 'New Order Created',
    'ऑर्डर स्थिती अपडेट झाली': 'Order Status Updated',
    'साठा भरला': 'Stock Restocked',
    'AgriBiz चाचणी सूचना': 'AgriBiz Alert',
  };

  if (isMr) {
    if (titleMapEnToMr[notif.title]) {
      notif.title = titleMapEnToMr[notif.title];
    }
    if (notif.body) {
      notif.body = notif.body
        .replace(/(.+) has reached low stock: only (\d+) units remaining \(Minimum threshold: (\d+)\)\.?/i, '$1 चा साठा कमी झाला आहे: फक्त $2 शिल्लक (किमान मर्यादा: $3).')
        .replace(/(.+) is completely out of stock \(0 units remaining\)\.?/i, '$1 चा साठा पूर्णपणे संपला आहे (० नग शिल्लक).')
        .replace(/(.+) has an upcoming balance of (.+) due on (.+?)\.?$/i, '$1 यांची $2 ची थकबाकी देण्याची तारीख $3 आहे.')
        .replace(/(.+) has an overdue balance of (.+) for invoice (.+?)\.?$/i, '$1 यांचे चलन $3 साठीचे $2 देयक थकीत झाले आहे.')
        .replace(/Payment of (.+) received from (.+) via (.+?)(?:\s*\(Invoice (.+)\))?\.?$/i, (m, amt, cust, method, inv) => `${cust} यांच्याकडून ${method} द्वारे ${amt} रक्कम प्राप्त झाली${inv ? ` (चलन ${inv})` : ''}.`)
        .replace(/Invoice (.+) issued to (.+) for (.+)\.?/i, '$2 यांच्यासाठी $3 चे चलन $1 तयार केले.')
        .replace(/Order (.+) for (.+) is now (.+)\.?/i, '$2 यांची ऑर्डर $1 आता $3 आहे.')
        .replace(/Mobile push notifications are working properly on your phone!/i, 'तुमच्या फोनवर मोबाइल पुश सूचना व्यवस्थित काम करत आहेत!')
        .replace(/Invoice (.+) has an upcoming payment due on (.+)\. Tap to view details\.?/i, 'चलन $1 चे देयक $2 रोजी देय आहे. तपशील पाहण्यासाठी टॅप करा.')
        .replace(/Invoice (.+) is past its payment due date\. Tap to review customer dues\.?/i, 'चलन $1 ची देय तारीख उलटून गेली आहे. थकबाकी पाहण्यासाठी टॅप करा.')
        .replace(/Customer payment received via (.+)\. Tap to view ledger entry\.?/i, '$1 द्वारे रक्कम प्राप्त झाली. तपशील पाहण्यासाठी टॅप करा.')
        .replace(/(.+) is completely out of stock\.?/i, '$1 चा साठा पूर्णपणे संपला आहे.')
        .replace(/(.+) has fallen below safety limit \((\d+) remaining\)\.?/i, '$1 साठा सुरक्षा मर्यादेपेक्षा कमी झाला आहे ($2 शिल्लक).')
        .replace(/Invoice (.+) has been issued\. Tap to view order details\.?/i, 'चलन $1 जारी केले आहे. ऑर्डर पाहण्यासाठी टॅप करा.');
    }
  } else {
    if (titleMapMrToEn[notif.title]) {
      notif.title = titleMapMrToEn[notif.title];
    }
    if (notif.body) {
      notif.body = notif.body
        .replace(/(.+) चा साठा कमी झाला आहे: फक्त (\d+) शिल्लक \(किमान मर्यादा: (\d+)\)\.?/, '$1 has reached low stock: only $2 units remaining (Minimum threshold: $3).')
        .replace(/(.+) चा साठा पूर्णपणे संपला आहे \(० नग शिल्लक\)\.?/, '$1 is completely out of stock (0 units remaining).')
        .replace(/(.+) यांची (.+) ची थकबाकी देण्याची तारीख (.+?)\.?$/, '$1 has an upcoming balance of $2 due on $3.')
        .replace(/(.+) यांचे चलन (.+) साठीचे (.+) देयक थकीत झाले आहे\.?/, '$1 has an overdue balance of $3 for invoice $2.')
        .replace(/(.+) यांच्याकडून (.+) द्वारे (.+) रक्कम प्राप्त झाली(?:\s*\(चलन (.+)\))?\.?$/, (m, cust, method, amt, inv) => `Payment of ${amt} received from ${cust} via ${method}${inv ? ` (Invoice ${inv})` : ''}.`)
        .replace(/(.+) यांच्यासाठी (.+) चे चलन (.+) तयार केले\.?/, 'Invoice $3 issued to $1 for $2.')
        .replace(/(.+) यांची ऑर्डर (.+) आता (.+) आहे\.?/, 'Order $2 for $1 is now $3.')
        .replace(/तुमच्या फोनवर मोबाइल पुश सूचना व्यवस्थित काम करत आहेत!/, 'Mobile push notifications are working properly on your phone!')
        .replace(/चलन (.+) चे देयक (.+) रोजी देय आहे\. तपशील पाहण्यासाठी टॅप करा\.?/, 'Invoice $1 has an upcoming payment due on $2. Tap to view details.')
        .replace(/चलन (.+) ची देय तारीख उलटून गेली आहे\. थकबाकी पाहण्यासाठी टॅप करा\.?/, 'Invoice $1 is past its payment due date. Tap to review customer dues.')
        .replace(/(.+) द्वारे रक्कम प्राप्त झाली\. तपशील पाहण्यासाठी टॅप करा\.?/, 'Customer payment received via $1. Tap to view ledger entry.')
        .replace(/(.+) चा साठा पूर्णपणे संपला आहे\.?/, '$1 is completely out of stock.')
        .replace(/(.+) साठा सुरक्षा मर्यादेपेक्षा कमी झाला आहे \((\d+) शिल्लक\)\.?/, '$1 has fallen below safety limit ($2 remaining).')
        .replace(/चलन (.+) जारी केले आहे\. ऑर्डर पाहण्यासाठी टॅप करा\.?/, 'Invoice $1 has been issued. Tap to view order details.');
    }
  }

  return notif;
}

class NotificationController {
  /**
   * Return VAPID Public Key for client subscription
   */
  async getVapidPublicKey(req, res) {
    try {
      const publicKey = pushNotificationService.getVapidPublicKey();
      if (!publicKey) {
        return res.status(503).json({
          success: false,
          message: 'Push notifications are not configured on the server (missing VAPID keys).',
        });
      }
      res.status(200).json({ success: true, publicKey });
    } catch (error) {
      logger.error('[NOTIFICATION] Failed to get VAPID public key: %s', error.message);
      res.status(500).json({ success: false, message: 'Failed to retrieve notification key.' });
    }
  }

  /**
   * Serve the business/company branding logo dynamically
   * Publicly accessible so browser and OS notification services can fetch the icon
   */
  async getCompanyLogo(req, res) {
    const clientUrl = (process.env.CLIENT_URL || 'https://agri-biz-snowy.vercel.app').replace(/\/+$/, '');
    const fallbackUrl = `${clientUrl}/logo-192.png`;

    const sendLocalFallback = () => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
      const serverLogo = path.resolve(__dirname, '../public/logo-192.png');
      const rootLogo = path.resolve(__dirname, '../../public/logo-192.png');
      const target = fs.existsSync(serverLogo) ? serverLogo : (fs.existsSync(rootLogo) ? rootLogo : null);
      if (target) {
        res.setHeader('Content-Type', 'image/png');
        return res.sendFile(target);
      }
      return res.redirect(302, fallbackUrl);
    };

    try {
      const { companyId } = req.params;

      if (!companyId) {
        return sendLocalFallback();
      }

      // 1. Look up business settings (source of truth for company customizations)
      const settings = await Settings.findOne({ companyId }).select('logo').lean();
      let rawLogo = settings && settings.logo ? String(settings.logo).trim() : '';

      // 2. If not found in settings, check Company model as secondary source of truth
      if (!rawLogo) {
        const company = await Company.findOne({ companyId }).select('logo').lean();
        if (company && company.logo) {
          rawLogo = String(company.logo).trim();
        }
      }

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');

      if (!rawLogo) {
        return sendLocalFallback();
      }

      // If stored as external HTTP/HTTPS URL
      if (rawLogo.startsWith('http://') || rawLogo.startsWith('https://')) {
        return res.redirect(302, rawLogo);
      }

      // If stored as base64 Data URL (e.g. data:image/png;base64,...)
      const match = rawLogo.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const buffer = Buffer.from(match[2], 'base64');
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Length', buffer.length);
        return res.end(buffer);
      }

      return sendLocalFallback();
    } catch (error) {
      logger.warn('[NOTIFICATION] Error serving company logo for %s: %s', req.params?.companyId, error.message);
      return sendLocalFallback();
    }
  }

  /**
   * Serve the transparent monochrome notification badge for Android status bar
   */
  async getBadge(req, res) {
    try {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

      const badgeFile = path.resolve(__dirname, '../../public/badge-monochrome-96.png');
      const serverBadgeFile = path.resolve(__dirname, '../public/badge-monochrome-96.png');

      const targetPath = fs.existsSync(badgeFile) ? badgeFile : (fs.existsSync(serverBadgeFile) ? serverBadgeFile : null);
      if (targetPath) {
        res.setHeader('Content-Type', 'image/png');
        return res.sendFile(targetPath);
      }

      const clientUrl = (process.env.CLIENT_URL || 'https://agri-biz-snowy.vercel.app').replace(/\/+$/, '');
      return res.redirect(302, `${clientUrl}/badge-monochrome-96.png`);
    } catch (err) {
      logger.warn('[NOTIFICATION] Error serving monochrome badge: %s', err.message);
      const clientUrl = (process.env.CLIENT_URL || 'https://agri-biz-snowy.vercel.app').replace(/\/+$/, '');
      return res.redirect(302, `${clientUrl}/badge-monochrome-96.png`);
    }
  }

  /**
   * Register or update push subscription
   */
  async subscribe(req, res) {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.userId;
      const { subscription } = req.body;
      const userAgent = req.headers['user-agent'] || '';

      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({
          success: false,
          message: 'Invalid subscription object provided.',
        });
      }

      const savedSub = await pushNotificationService.saveSubscription(
        companyId,
        userId,
        subscription,
        userAgent
      );

      res.status(200).json({
        success: true,
        message: 'Push notifications enabled successfully on this device.',
        subscriptionId: savedSub.subscriptionId,
      });
    } catch (error) {
      logger.error('[NOTIFICATION] Subscribe error: %s', error.message);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Unsubscribe / Deactivate push subscription
   */
  async unsubscribe(req, res) {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.userId;
      const { endpoint } = req.body;

      if (!endpoint) {
        return res.status(400).json({ success: false, message: 'Endpoint is required to unsubscribe.' });
      }

      await pushNotificationService.removeSubscription(endpoint, companyId, userId);

      res.status(200).json({
        success: true,
        message: 'Push notifications disabled for this device.',
      });
    } catch (error) {
      logger.error('[NOTIFICATION] Unsubscribe error: %s', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Check subscription status for current device endpoint
   */
  async checkSubscription(req, res) {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.userId;
      const { endpoint } = req.body;

      if (!endpoint) {
        return res.status(200).json({ success: true, isSubscribed: false });
      }

      const sub = await PushSubscription.findOne({
        endpoint,
        companyId,
        userId,
        isActive: true,
      }).lean();

      res.status(200).json({
        success: true,
        isSubscribed: !!sub,
        deviceType: sub?.deviceType || null,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get list of notifications for the authenticated company
   */
  async getNotifications(req, res) {
    try {
      const companyId = req.user.companyId;

      // Lazy recovery after server sleep / restart / redeployment (throttled to 30 mins)
      notificationSchedulerService.runCatchupCheckForCompany(companyId).catch(() => {});

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 30;
      const skip = (page - 1) * limit;

      const filter = { companyId };
      // Enforce role & user privacy scoping for non-owner accounts
      if (req.user && req.user.role !== 'Owner') {
        filter.$or = [
          { userId: null, targetRole: null },
          { userId: req.user.userId },
          { targetRole: req.user.role },
        ];
      }

      if (req.query.unreadOnly === 'true') {
        filter.isRead = false;
      }

      const unreadFilter = { ...filter, isRead: false };

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments(filter),
        Notification.countDocuments(unreadFilter),
      ]);

      const targetLang = (req.query.lang || (req.headers['accept-language']?.includes('mr') ? 'mr' : 'en')).slice(0, 2);
      const localizedNotifications = notifications.map((n) => localizeNotificationRecord({ ...n }, targetLang));

      res.status(200).json({
        success: true,
        data: localizedNotifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          unreadCount,
        },
      });
    } catch (error) {
      logger.error('[NOTIFICATION] Failed to get notifications: %s', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(req, res) {
    try {
      const companyId = req.user.companyId;
      const { id } = req.params;

      const updated = await Notification.findOneAndUpdate(
        { notificationId: id, companyId },
        { $set: { isRead: true } },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Notification not found.' });
      }

      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Mark all notifications as read for current company
   */
  async markAllAsRead(req, res) {
    try {
      const companyId = req.user.companyId;
      await Notification.updateMany({ companyId, isRead: false }, { $set: { isRead: true } });

      res.status(200).json({ success: true, message: 'All notifications marked as read.' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Clear all notifications for company
   */
  async clearAll(req, res) {
    try {
      const companyId = req.user.companyId;
      await Notification.deleteMany({ companyId });

      res.status(200).json({ success: true, message: 'All notifications cleared.' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Send test push notification to user's active devices
   */
  async sendTestNotification(req, res) {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.userId;

      const settings = (await Settings.findOne({ companyId }).lean()) || {};
      const requestedLang = req.body?.language || settings.invoiceLanguage || 'en';
      const isMr = requestedLang === 'mr';

      const titleEn = 'AgriBiz Alert';
      const titleMr = 'AgriBiz चाचणी सूचना';
      const bodyEn = 'Mobile push notifications are working properly on your phone!';
      const bodyMr = 'तुमच्या फोनवर मोबाइल पुश सूचना व्यवस्थित काम करत आहेत!';

      const title = isMr ? titleMr : titleEn;
      const body = isMr ? bodyMr : bodyEn;

      const result = await pushNotificationService.sendNotificationToCompany(
        companyId,
        {
          title,
          titleMr,
          titleEn,
          body,
          bodyMr,
          bodyEn,
          type: 'BUSINESS_ALERT',
          url: '/?tab=dashboard',
          tab: 'dashboard',
          data: {
            url: '/?tab=dashboard',
            tab: 'dashboard',
            source: 'test_notification',
            language: requestedLang,
            titleEn,
            titleMr,
            bodyEn,
            bodyMr,
          },
        },
        { userId }
      );

      res.status(200).json({
        success: true,
        message:
          result.deliveredCount > 0
            ? (isMr ? `${result.deliveredCount} नोंदणीकृत डिव्हाइसवर चाचणी सूचना पाठवली.` : `Test alert dispatched to ${result.deliveredCount} registered device(s).`)
            : (isMr ? 'कोणतेही सक्रिय डिव्हाइस आढळले नाही. कृपया प्रथम या डिव्हाइसवर सूचना सुरू करा.' : 'No active push device registered for your user. Please enable notifications on this device first.'),
        details: result,
      });
    } catch (error) {
      logger.error('[NOTIFICATION] Send test error: %s', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get notification settings
   */
  async getSettings(req, res) {
    try {
      const companyId = req.user.companyId;
      const settings = (await Settings.findOne({ companyId }).lean()) || {};

      res.status(200).json({
        success: true,
        data: {
          notifyLowStock: settings.notifyLowStock !== false,
          notifyOutOfStock: settings.notifyOutOfStock !== false,
          notifyUpcomingDues: settings.notifyUpcomingDues !== false,
          notifyOverdueDues: settings.notifyOverdueDues !== false,
          dueReminderDaysBefore: settings.dueReminderDaysBefore || 2,
          notifyPaymentReceived: settings.notifyPaymentReceived !== false,
          notifyNewOrders: settings.notifyNewOrders !== false,
          notifyOrderStatus: settings.notifyOrderStatus !== false,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Update notification settings
   */
  async updateSettings(req, res) {
    try {
      const companyId = req.user.companyId;
      const {
        notifyLowStock,
        notifyOutOfStock,
        notifyUpcomingDues,
        notifyOverdueDues,
        dueReminderDaysBefore,
        notifyPaymentReceived,
        notifyNewOrders,
        notifyOrderStatus,
      } = req.body;

      const updateFields = {};
      if (typeof notifyLowStock === 'boolean') updateFields.notifyLowStock = notifyLowStock;
      if (typeof notifyOutOfStock === 'boolean') updateFields.notifyOutOfStock = notifyOutOfStock;
      if (typeof notifyUpcomingDues === 'boolean') updateFields.notifyUpcomingDues = notifyUpcomingDues;
      if (typeof notifyOverdueDues === 'boolean') updateFields.notifyOverdueDues = notifyOverdueDues;
      if (typeof dueReminderDaysBefore === 'number') {
        updateFields.dueReminderDaysBefore = Math.max(1, Math.min(30, dueReminderDaysBefore));
      }
      if (typeof notifyPaymentReceived === 'boolean') updateFields.notifyPaymentReceived = notifyPaymentReceived;
      if (typeof notifyNewOrders === 'boolean') updateFields.notifyNewOrders = notifyNewOrders;
      if (typeof notifyOrderStatus === 'boolean') updateFields.notifyOrderStatus = notifyOrderStatus;

      const updated = await Settings.findOneAndUpdate(
        { companyId },
        { $set: updateFields },
        { new: true, upsert: true }
      );

      res.status(200).json({
        success: true,
        message: 'Notification preferences updated successfully.',
        data: updated,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new NotificationController();
