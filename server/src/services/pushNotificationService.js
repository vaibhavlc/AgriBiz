import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';
import Notification from '../models/Notification.js';
import Settings from '../models/Settings.js';
import Company from '../models/Company.js';
import logger from '../config/logger.js';
import { getIO } from '../config/socket.js';

// Default VAPID keys if none provided in environment
const DEFAULT_VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  'BATRbED5gJCwlsvurEOSNTljeSGSjqvPN5MD97P0BvXfFMX5VtChTczYCLcBxmeOfuhGFsJb2_wCKEam-yvW7Cw';
const DEFAULT_VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || 'jy3nc5Lp9T6hXxqBFNGn1y4VtxEDTyTYCbN7KAXeTz4';
const DEFAULT_VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:vc654810@gmail.com';

try {
  webpush.setVapidDetails(
    DEFAULT_VAPID_SUBJECT,
    DEFAULT_VAPID_PUBLIC_KEY,
    DEFAULT_VAPID_PRIVATE_KEY
  );
  logger.info('[PUSH] Web Push VAPID configuration initialized successfully.');
} catch (err) {
  logger.error('[PUSH] Failed to set VAPID details: %s', err.message);
}

class PushNotificationService {
  /**
   * Return the public VAPID key for browser subscription
   */
  getVapidPublicKey() {
    return DEFAULT_VAPID_PUBLIC_KEY;
  }

  /**
   * Determine device type from user-agent string
   */
  detectDeviceType(userAgent = '') {
    const ua = userAgent.toLowerCase();
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|android|touch/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  /**
   * Save or renew a browser push subscription for a user & company
   */
  async saveSubscription(companyId, userId, subscriptionData, userAgent = '') {
    if (!companyId || !userId) {
      throw new Error('Company ID and User ID are required to register subscription.');
    }
    if (!subscriptionData || !subscriptionData.endpoint || !subscriptionData.keys) {
      throw new Error('Invalid push subscription format: endpoint and keys are required.');
    }

    const { endpoint, keys } = subscriptionData;
    if (!keys.p256dh || !keys.auth) {
      throw new Error('Invalid push subscription keys: p256dh and auth are required.');
    }

    const deviceType = this.detectDeviceType(userAgent);

    let sub = await PushSubscription.findOne({ endpoint });
    if (sub) {
      sub.companyId = companyId;
      sub.userId = userId;
      sub.keys = keys;
      sub.userAgent = userAgent;
      sub.deviceType = deviceType;
      sub.isActive = true;
      sub.failedAttempts = 0;
      await sub.save();
      logger.info(
        '[PUSH] Subscription updated for user %s (%s) on endpoint %s',
        userId,
        deviceType,
        endpoint.slice(-15)
      );
      return sub;
    }

    const subscriptionId = `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    sub = await PushSubscription.create({
      subscriptionId,
      companyId,
      userId,
      endpoint,
      keys,
      userAgent,
      deviceType,
      isActive: true,
      failedAttempts: 0,
    });

    logger.info(
      '[PUSH] New subscription created for user %s (%s) on endpoint %s',
      userId,
      deviceType,
      endpoint.slice(-15)
    );
    return sub;
  }

  /**
   * Deactivate or remove a push subscription (e.g., on logout or disable)
   */
  async removeSubscription(endpoint, companyId = null, userId = null) {
    if (!endpoint) return false;
    const query = { endpoint };
    if (companyId) query.companyId = companyId;
    if (userId) query.userId = userId;

    const result = await PushSubscription.deleteOne(query);
    logger.info('[PUSH] Subscription removed for endpoint %s: %d deleted', endpoint.slice(-15), result.deletedCount);
    return result.deletedCount > 0;
  }

  /**
   * Deactivate subscriptions for a specific user (e.g. on full logout)
   */
  async deactivateUserSubscriptions(companyId, userId) {
    if (!companyId || !userId) return;
    await PushSubscription.updateMany(
      { companyId, userId },
      { $set: { isActive: false } }
    );
    logger.info('[PUSH] All subscriptions deactivated for user %s in company %s', userId, companyId);
  }

  /**
   * Get current date string formatted as YYYY-MM-DD in Asia/Kolkata timezone
   */
  getTodayIST() {
    return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
  }

  /**
   * Resolve push notification body text based on privacy settings
   */
  resolvePushBody(payload, maskPrivacy = true) {
    if (maskPrivacy && payload && payload.privacySafeBody) {
      return payload.privacySafeBody;
    }
    return payload ? payload.body : '';
  }

  /**
   * Core method to send notification to company devices and record to Notification history
   */
  async sendNotificationToCompany(companyId, payload, options = {}) {
    if (!companyId) {
      logger.warn('[PUSH] Cannot send notification: missing companyId');
      return { success: false, reason: 'Missing companyId' };
    }

    // 1. Check Business Settings preferences
    const settings = await Settings.findOne({ companyId }).lean();
    if (settings) {
      if (payload.type === 'LOW_STOCK' && settings.notifyLowStock === false) {
        logger.info('[PUSH] Skipped LOW_STOCK notification as per business settings');
        return { success: false, reason: 'Disabled in settings' };
      }
      if (payload.type === 'OUT_OF_STOCK' && settings.notifyOutOfStock === false) {
        logger.info('[PUSH] Skipped OUT_OF_STOCK notification as per business settings');
        return { success: false, reason: 'Disabled in settings' };
      }
      if (payload.type === 'DUE_REMINDER' && settings.notifyUpcomingDues === false) {
        logger.info('[PUSH] Skipped DUE_REMINDER notification as per business settings');
        return { success: false, reason: 'Disabled in settings' };
      }
      if (payload.type === 'OVERDUE_PAYMENT' && settings.notifyOverdueDues === false) {
        logger.info('[PUSH] Skipped OVERDUE_PAYMENT notification as per business settings');
        return { success: false, reason: 'Disabled in settings' };
      }
      if (payload.type === 'PAYMENT_RECEIVED' && settings.notifyPaymentReceived === false) {
        logger.info('[PUSH] Skipped PAYMENT_RECEIVED notification as per business settings');
        return { success: false, reason: 'Disabled in settings' };
      }
      if (payload.type === 'NEW_ORDER' && settings.notifyNewOrders === false) {
        logger.info('[PUSH] Skipped NEW_ORDER notification as per business settings');
        return { success: false, reason: 'Disabled in settings' };
      }
      if (payload.type === 'ORDER_STATUS' && settings.notifyOrderStatus === false) {
        logger.info('[PUSH] Skipped ORDER_STATUS notification as per business settings');
        return { success: false, reason: 'Disabled in settings' };
      }
    }

    // 2. Prevent duplicate notifications if eventReference provided
    if (payload.eventReference) {
      const existing = await Notification.findOne({
        companyId,
        eventReference: payload.eventReference,
      }).lean();

      if (existing) {
        logger.info(
          '[PUSH] Skipped duplicate notification with eventReference: %s',
          payload.eventReference
        );
        return { success: false, reason: 'Duplicate notification ignored', existingId: existing.notificationId };
      }
    }

    // 3. Resolve Company Branding Logo (from Settings or Company model)
    let hasCustomLogo = Boolean(settings && settings.logo && String(settings.logo).trim());
    if (!hasCustomLogo) {
      try {
        const comp = await Company.findOne({ companyId }).select('logo').lean();
        if (comp && comp.logo && String(comp.logo).trim()) {
          hasCustomLogo = true;
        }
      } catch (e) {
        // Fallback gracefully
      }
    }

    const backendOrigin = (
      process.env.BACKEND_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      (process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/:\d+$/, ':5000') : '') ||
      'https://agribiz-backend.onrender.com'
    ).replace(/\/+$/, '');

    const clientOrigin = (
      process.env.CLIENT_URL ||
      'https://agri-biz-snowy.vercel.app'
    ).replace(/\/+$/, '');

    const companyLogoEndpoint = `${backendOrigin}/api/v1/notifications/company-logo/${encodeURIComponent(companyId)}`;
    const notificationIcon = hasCustomLogo ? companyLogoEndpoint : (payload.icon || `${clientOrigin}/logo-192.png`);
    const notificationImage = hasCustomLogo ? companyLogoEndpoint : (payload.image || null);
    const notificationBadge = payload.badge || `${backendOrigin}/api/v1/notifications/badge`;

    // 4. Save Notification DB Record with atomic duplicate key protection
    const notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    let notificationDoc;
    try {
      notificationDoc = await Notification.create({
        notificationId,
        companyId,
        userId: options.userId || null,
        targetRole: options.targetRole || null,
        title: payload.title,
        body: payload.body,
        type: payload.type || 'BUSINESS_ALERT',
        icon: notificationIcon,
        image: notificationImage,
        data: {
          ...payload.data,
          companyLogo: hasCustomLogo ? companyLogoEndpoint : null,
        },
        eventReference: payload.eventReference || null,
      });
    } catch (createErr) {
      if (createErr.code === 11000) {
        logger.info(
          '[PUSH] Atomic deduplication prevented duplicate notification for eventReference: %s',
          payload.eventReference
        );
        return { success: false, reason: 'Duplicate notification ignored (atomic DB constraint)' };
      }
      throw createErr;
    }

    // 5. Query active subscriptions
    const subQuery = { companyId, isActive: true };
    if (options.userId) {
      subQuery.userId = options.userId;
    }

    const subscriptions = await PushSubscription.find(subQuery);
    logger.info(
      '[PUSH] Dispatching notification "%s" to %d active subscriptions (company: %s, brandedLogo: %s)',
      payload.title,
      subscriptions.length,
      companyId,
      hasCustomLogo
    );

    // 6. Construct Push payload with privacy preservation, branding, and size limit safeguards
    const maskPrivacy = settings ? settings.maskSensitiveNotificationData !== false : true;
    const pushBody = this.resolvePushBody(payload, maskPrivacy);
    const safeBody = (pushBody || '').slice(0, 400);

    const pushPayload = JSON.stringify({
      notificationId,
      title: payload.title,
      body: safeBody,
      type: payload.type || 'BUSINESS_ALERT',
      icon: notificationIcon,
      image: notificationImage,
      badge: notificationBadge,
      data: {
        url: payload.url || (payload.data && payload.data.url) || '/',
        tab: payload.tab || (payload.data && payload.data.tab) || 'dashboard',
        notificationId,
        companyId,
        companyLogo: hasCustomLogo ? companyLogoEndpoint : null,
        ...payload.data,
      },
      tag: payload.tag || `${payload.type || 'alert'}-${Date.now()}`,
      vibrate: [100, 50, 100],
      actions: payload.actions || [
        { action: 'open', title: 'Open' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
      timestamp: Date.now(),
    });

    // 6. Deliver to each device
    let deliveredCount = 0;
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          pushPayload,
          {
            TTL: 60 * 60 * 24, // 24 hours
            urgency: 'high',
          }
        );
        deliveredCount++;
        sub.lastDeliveredAt = new Date();
        sub.failedAttempts = 0;
        await sub.save();
      } catch (err) {
        logger.warn(
          '[PUSH] Push dispatch failed for endpoint %s: %s (Status: %s)',
          sub.endpoint.slice(-15),
          err.message,
          err.statusCode
        );

        // Status 410 (Gone) or 404 (Not Found) indicates uninstalled / revoked subscription
        if (err.statusCode === 410 || err.statusCode === 404) {
          logger.info('[PUSH] Removing expired/uninstalled subscription: %s', sub.endpoint.slice(-15));
          sub.isActive = false;
          await sub.save();
        } else {
          sub.failedAttempts = (sub.failedAttempts || 0) + 1;
          if (sub.failedAttempts >= 5) {
            sub.isActive = false;
          }
          await sub.save();
        }
      }
    });

    await Promise.allSettled(sendPromises);

    // 7. Update Notification record
    notificationDoc.deliveredCount = deliveredCount;
    notificationDoc.isDelivered = deliveredCount > 0;
    await notificationDoc.save();

    // 8. Real-time emit via Socket.IO for connected tabs
    try {
      const io = getIO();
      if (io) {
        io.to(`company:${companyId}`).emit('new_notification', {
          ...notificationDoc.toObject(),
        });
      }
    } catch (e) {
      logger.warn('[PUSH] Socket notification broadcast failed: %s', e.message);
    }

    return {
      success: true,
      notification: notificationDoc,
      deliveredCount,
      totalSubscribers: subscriptions.length,
    };
  }

  // ----------------------------------------------------
  // BUSINESS EVENT HELPER METHODS
  // ----------------------------------------------------

  /**
   * A. Upcoming Due Reminder
   */
  async notifyUpcomingDue({ companyId, invoiceNumber, customerName, balanceDue, dueDate, currencySymbol = '₹' }) {
    const formattedAmount = `${currencySymbol}${Number(balanceDue).toLocaleString('en-IN')}`;
    const eventReference = `due_reminder:${invoiceNumber}:${dueDate}`;

    return this.sendNotificationToCompany(
      companyId,
      {
        title: 'Payment Due Soon',
        body: `${customerName} has an upcoming balance of ${formattedAmount} due on ${dueDate}.`,
        privacySafeBody: `Invoice ${invoiceNumber} has an upcoming payment due on ${dueDate}. Tap to view details.`,
        type: 'DUE_REMINDER',
        url: '/?tab=sales',
        tab: 'sales',
        data: {
          invoiceNumber,
          customerName,
          balanceDue,
          dueDate,
          url: '/?tab=sales',
          tab: 'sales',
        },
        eventReference,
      },
      { targetRole: 'Accounts' }
    );
  }

  /**
   * B. Overdue Payment Alert
   */
  async notifyOverduePayment({ companyId, invoiceNumber, customerName, balanceDue, dueDate, currencySymbol = '₹' }) {
    const formattedAmount = `${currencySymbol}${Number(balanceDue).toLocaleString('en-IN')}`;
    const todayStr = this.getTodayIST();
    const eventReference = `overdue:${invoiceNumber}:${todayStr}`;

    return this.sendNotificationToCompany(
      companyId,
      {
        title: 'Payment Overdue',
        body: `${customerName} has an overdue balance of ${formattedAmount} for invoice ${invoiceNumber}.`,
        privacySafeBody: `Invoice ${invoiceNumber} is past its payment due date. Tap to review customer dues.`,
        type: 'OVERDUE_PAYMENT',
        url: '/?tab=sales',
        tab: 'sales',
        data: {
          invoiceNumber,
          customerName,
          balanceDue,
          dueDate,
          url: '/?tab=sales',
          tab: 'sales',
        },
        eventReference,
      },
      { targetRole: 'Accounts' }
    );
  }

  /**
   * C. Payment Received
   */
  async notifyPaymentReceived({ companyId, customerName, amount, paymentMethod, referenceNumber, invoiceNumber, paymentId, currencySymbol = '₹' }) {
    const formattedAmount = `${currencySymbol}${Number(amount).toLocaleString('en-IN')}`;
    let body = `Payment of ${formattedAmount} received from ${customerName || 'Customer'} via ${paymentMethod || 'UPI'}.`;
    if (invoiceNumber) {
      body += ` (Invoice ${invoiceNumber})`;
    }
    const privacySafeBody = `Customer payment received via ${paymentMethod || 'UPI'}. Tap to view ledger entry.`;
    const eventReference = paymentId ? `payment:${paymentId}` : (invoiceNumber ? `payment:inv:${invoiceNumber}` : null);

    return this.sendNotificationToCompany(companyId, {
      title: 'Payment Received',
      body,
      privacySafeBody,
      type: 'PAYMENT_RECEIVED',
      url: '/?tab=payments',
      tab: 'payments',
      data: {
        customerName,
        amount,
        paymentMethod,
        referenceNumber,
        invoiceNumber,
        paymentId,
        url: '/?tab=payments',
        tab: 'payments',
      },
      eventReference,
    });
  }

  /**
   * D. Low Stock & Out of Stock Alert
   */
  async notifyStockAlert({ companyId, productId, productName, stock, minStock }) {
    const isOutOfStock = stock <= 0;
    const type = isOutOfStock ? 'OUT_OF_STOCK' : 'LOW_STOCK';
    const title = isOutOfStock ? 'Out of Stock Alert' : 'Low Stock Alert';
    const body = isOutOfStock
      ? `${productName} is completely out of stock (0 units remaining).`
      : `${productName} has reached low stock: only ${stock} units remaining (Minimum threshold: ${minStock}).`;
    const privacySafeBody = isOutOfStock
      ? `${productName} is completely out of stock.`
      : `${productName} has fallen below safety limit (${stock} remaining).`;

    const todayStr = this.getTodayIST();
    const eventReference = `stock:${productId}:${type}:${todayStr}`;

    return this.sendNotificationToCompany(companyId, {
      title,
      body,
      privacySafeBody,
      type,
      url: '/?tab=inventory',
      tab: 'inventory',
      data: {
        productId,
        productName,
        stock,
        minStock,
        url: '/?tab=inventory',
        tab: 'inventory',
      },
      eventReference,
    });
  }

  /**
   * E. New Order / Invoice Created
   */
  async notifyNewOrder({ companyId, invoiceNumber, customerName, grandTotal, currencySymbol = '₹' }) {
    const formattedAmount = `${currencySymbol}${Number(grandTotal).toLocaleString('en-IN')}`;
    const eventReference = `order:${invoiceNumber}`;

    return this.sendNotificationToCompany(companyId, {
      title: 'New Order Created',
      body: `Invoice ${invoiceNumber} issued to ${customerName} for ${formattedAmount}.`,
      privacySafeBody: `Invoice ${invoiceNumber} has been issued. Tap to view order details.`,
      type: 'NEW_ORDER',
      url: '/?tab=sales',
      tab: 'sales',
      data: {
        invoiceNumber,
        customerName,
        grandTotal,
        url: '/?tab=sales',
        tab: 'sales',
      },
      eventReference,
    });
  }

  /**
   * F. Order Status Change
   */
  async notifyOrderStatus({ companyId, invoiceNumber, customerName, status, statusText }) {
    const eventReference = `order_status:${invoiceNumber}:${status}`;

    return this.sendNotificationToCompany(companyId, {
      title: 'Order Status Updated',
      body: `Order ${invoiceNumber} for ${customerName} is now ${statusText || status}.`,
      privacySafeBody: `Order ${invoiceNumber} status is now ${statusText || status}.`,
      type: 'ORDER_STATUS',
      url: '/?tab=sales',
      tab: 'sales',
      data: {
        invoiceNumber,
        customerName,
        status,
        url: '/?tab=sales',
        tab: 'sales',
      },
      eventReference,
    });
  }
}

export default new PushNotificationService();
