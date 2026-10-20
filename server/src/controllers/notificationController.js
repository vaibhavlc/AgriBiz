import pushNotificationService from '../services/pushNotificationService.js';
import Notification from '../models/Notification.js';
import Settings from '../models/Settings.js';
import PushSubscription from '../models/PushSubscription.js';
import logger from '../config/logger.js';

class NotificationController {
  /**
   * Return VAPID Public Key for client subscription
   */
  async getVapidPublicKey(req, res) {
    try {
      const publicKey = pushNotificationService.getVapidPublicKey();
      res.status(200).json({ success: true, publicKey });
    } catch (error) {
      logger.error('[NOTIFICATION] Failed to get VAPID public key: %s', error.message);
      res.status(500).json({ success: false, message: 'Failed to retrieve notification key.' });
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
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 30;
      const skip = (page - 1) * limit;

      const filter = { companyId };
      if (req.query.unreadOnly === 'true') {
        filter.isRead = false;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Notification.countDocuments(filter),
        Notification.countDocuments({ companyId, isRead: false }),
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

      const result = await pushNotificationService.sendNotificationToCompany(
        companyId,
        {
          title: 'Daivyayog Alert',
          body: 'Mobile push notifications are working properly on your phone!',
          type: 'BUSINESS_ALERT',
          url: '/?tab=dashboard',
          tab: 'dashboard',
          data: {
            url: '/?tab=dashboard',
            tab: 'dashboard',
            source: 'test_notification',
          },
        },
        { userId }
      );

      res.status(200).json({
        success: true,
        message:
          result.deliveredCount > 0
            ? `Test alert dispatched to ${result.deliveredCount} registered device(s).`
            : 'No active push device registered for your user. Please enable notifications on this device first.',
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
