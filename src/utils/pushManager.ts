import api from './api';

/**
 * Converts a base64 string to a Uint8Array for VAPID applicationServerKey
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check whether Web Push & Service Workers are supported in the current environment
 */
export const isPushSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

/**
 * Get current browser notification permission
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};

/**
 * Check if current device is actively subscribed
 */
export const checkCurrentSubscription = async (): Promise<{
  supported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  endpoint?: string;
}> => {
  if (!isPushSupported()) {
    return { supported: false, permission: 'denied', isSubscribed: false };
  }

  const permission = Notification.permission;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return { supported: true, permission, isSubscribed: false };
    }

    // Verify status with server
    try {
      const res = await api.post('/notifications/check-subscription', {
        endpoint: subscription.endpoint,
      });
      return {
        supported: true,
        permission,
        isSubscribed: res.data?.isSubscribed ?? true,
        endpoint: subscription.endpoint,
      };
    } catch {
      return {
        supported: true,
        permission,
        isSubscribed: true,
        endpoint: subscription.endpoint,
      };
    }
  } catch (err) {
    console.warn('[PushManager] Error checking subscription:', err);
    return { supported: true, permission, isSubscribed: false };
  }
};

/**
 * Subscribe current device to push notifications
 */
export const subscribeToPush = async (): Promise<{
  success: boolean;
  message: string;
  subscription?: PushSubscription;
}> => {
  if (!isPushSupported()) {
    return {
      success: false,
      message: 'Push notifications are not supported on this browser or platform.',
    };
  }

  try {
    // 1. Request user permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        message:
          permission === 'denied'
            ? 'Notification permission was denied. Please allow notifications in your browser/device site settings.'
            : 'Notification permission was dismissed.',
      };
    }

    // 2. Fetch VAPID Public Key from backend
    let keyRes;
    try {
      keyRes = await api.get('/notifications/vapid-public-key');
    } catch (apiErr: any) {
      const msg = apiErr.response?.data?.message || apiErr.message;
      if (apiErr.response?.status === 404) {
        throw new Error('Notification service endpoint not found (HTTP 404). Backend service deployment is pending.');
      }
      if (apiErr.response?.status === 503) {
        throw new Error(msg || 'Web Push notifications are not configured on the server (missing VAPID keys).');
      }
      throw new Error(`Failed to retrieve notification credentials: ${msg}`);
    }

    if (!keyRes.data?.success || !keyRes.data?.publicKey) {
      throw new Error(keyRes.data?.message || 'Unable to retrieve application push credentials from server.');
    }
    const convertedVapidKey = urlBase64ToUint8Array(keyRes.data.publicKey);

    // 3. Register service worker push subscription
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    // If existing subscription has mismatched key, unsubscribe first
    if (subscription) {
      try {
        await subscription.unsubscribe();
      } catch (e) {
        // Continue
      }
    }

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey as any,
    });

    // 4. Send subscription to backend
    const subJSON = subscription.toJSON();
    const saveRes = await api.post('/notifications/subscribe', {
      subscription: subJSON,
    });

    return {
      success: true,
      message: saveRes.data?.message || 'Push notifications enabled successfully!',
      subscription,
    };
  } catch (error: any) {
    console.error('[PushManager] Subscription error:', error);
    return {
      success: false,
      message: error?.response?.data?.message || error.message || 'Failed to enable notifications.',
    };
  }
};

/**
 * Unsubscribe current device from push notifications
 */
export const unsubscribeFromPush = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  if (!isPushSupported()) {
    return { success: true, message: 'Push notifications already unsupported.' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      // Inform backend
      try {
        await api.post('/notifications/unsubscribe', { endpoint });
      } catch (err) {
        console.warn('[PushManager] Backend unsubscribe sync error:', err);
      }
      // Unsubscribe locally
      await subscription.unsubscribe();
    }

    return {
      success: true,
      message: 'Push notifications disabled on this device.',
    };
  } catch (error: any) {
    console.error('[PushManager] Unsubscribe error:', error);
    return {
      success: false,
      message: error?.response?.data?.message || error.message || 'Failed to disable notifications.',
    };
  }
};

/**
 * Dispatch test notification to current user
 */
export const sendTestPushNotification = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const res = await api.post('/notifications/test');
    return {
      success: res.data?.success ?? true,
      message: res.data?.message || 'Test alert dispatched.',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || error.message || 'Failed to send test alert.',
    };
  }
};
