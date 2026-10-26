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

      res.status(200).json({
        success: true,
        data: notifications,
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

      const title = isMr ? 'AgriBiz चाचणी सूचना' : 'AgriBiz Alert';
      const body = isMr
        ? 'तुमच्या फोनवर मोबाइल पुश सूचना व्यवस्थित काम करत आहेत!'
        : 'Mobile push notifications are working properly on your phone!';

      const result = await pushNotificationService.sendNotificationToCompany(
        companyId,
        {
          title,
          body,
          type: 'BUSINESS_ALERT',
          url: '/?tab=dashboard',
          tab: 'dashboard',
          data: {
            url: '/?tab=dashboard',
            tab: 'dashboard',
            source: 'test_notification',
            language: requestedLang,
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
