const CACHE_NAME = 'agribiz-v11';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/favicon.png',
  '/favicon.svg',
  '/logo-192.png',
  '/logo-512.png',
  '/logo-maskable-192.png',
  '/logo-maskable-512.png',
  '/badge-monochrome-96.png',
  '/badge-monochrome-72.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // Continue install even if optional static assets fail
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http://') && !event.request.url.startsWith('https://')) return;

  const requestUrl = new URL(event.request.url);

  // Skip API backend requests and websockets, except for company branding logo images
  if (requestUrl.pathname.startsWith('/api/') && !requestUrl.pathname.includes('/company-logo/')) return;

  // 1. Static assets, icons, logos, badges: CACHE-FIRST strategy
  // Returning local cached assets in 0ms guarantees Blink's NotificationResourcesLoader
  // and Android's BitmapFetcher never time out on slow mobile networks!
  if (
    requestUrl.origin === self.location.origin &&
    (requestUrl.pathname.endsWith('.png') ||
     requestUrl.pathname.endsWith('.ico') ||
     requestUrl.pathname.endsWith('.svg') ||
     requestUrl.pathname.endsWith('.webmanifest') ||
     requestUrl.pathname.includes('/assets/'))
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(event.request).then((response) => {
          if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // 2. Network-first strategy with cache fallback for HTML and all other resources
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        if (event.request.headers.get('accept')?.includes('text/html')) {
          const indexHtml = await caches.match('/index.html');
          if (indexHtml) {
            return indexHtml;
          }
        }
        return new Response('Network error or resource unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// ─────────────────────────────────────────────────────────
// WEB PUSH NOTIFICATIONS EVENT LISTENERS
// ─────────────────────────────────────────────────────────

// 1. Receive Push Event in background (even when web app is closed)
self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let notificationData = {
      title: 'AgriBiz',
      body: 'You have a new business notification.',
      icon: `${self.location.origin}/logo-192.png`,
      badge: `${self.location.origin}/badge-monochrome-96.png`,
      tag: 'agribiz-business-alert',
      data: { url: '/?tab=dashboard', tab: 'dashboard' }
    };

    if (event.data) {
      try {
        const parsed = event.data.json();
        notificationData = { ...notificationData, ...parsed };
      } catch (e) {
        notificationData.body = event.data.text() || notificationData.body;
      }
    }

    const title = notificationData.title || 'AgriBiz';

    // Guaranteed fallback assets on high-availability Vercel CDN origin
    const fallbackIcon = `${self.location.origin}/logo-192.png`;
    const fallbackBadge = `${self.location.origin}/badge-monochrome-96.png`;

    // Ensure icon and badge URLs are always fully-qualified absolute HTTPS URLs
    let iconUrl = notificationData.icon || fallbackIcon;
    let badgeUrl = notificationData.badge || fallbackBadge;

    if (!iconUrl.startsWith('http://') && !iconUrl.startsWith('https://')) {
      iconUrl = new URL(iconUrl, self.location.origin).href;
    }
    if (!badgeUrl.startsWith('http://') && !badgeUrl.startsWith('https://')) {
      badgeUrl = new URL(badgeUrl, self.location.origin).href;
    }

    // Android status bar strictly requires monochrome alpha mask
    // Always use our verified local monochrome asset so Android never falls back to the system bell!
    badgeUrl = fallbackBadge;

    // For the notification drawer avatar (icon):
    // If it's a custom business logo URL, verify it is reachable and responds quickly.
    // If it fails or the server is in cold sleep (>2s), gracefully fall back to the real AgriBiz logo
    // so Android NEVER displays the generic "A" circle avatar fallback!
    if (iconUrl !== fallbackIcon) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const checkRes = await fetch(iconUrl, { method: 'GET', signal: controller.signal });
        clearTimeout(timeoutId);
        if (checkRes.ok) {
          const cacheCopy = checkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(iconUrl, cacheCopy)).catch(() => {});
        } else {
          iconUrl = fallbackIcon;
        }
      } catch (err) {
        console.warn('[SW] Remote custom icon unreachable or timed out, using AgriBiz fallback:', err);
        iconUrl = fallbackIcon;
      }
    }

    const options = {
      body: notificationData.body,
      icon: iconUrl,
      badge: badgeUrl,
      tag: notificationData.tag || `agribiz-notif-${Date.now()}`,
      data: notificationData.data || { url: '/?tab=dashboard', tab: 'dashboard' },
      vibrate: notificationData.vibrate || [150, 50, 150, 50, 200],
      renotify: true,
      requireInteraction: true,
      actions: notificationData.actions || [
        { action: 'open', title: 'Open' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };

    // If expanded image banner is provided, ensure it is an absolute URL
    if (notificationData.image) {
      let imageUrl = notificationData.image;
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        imageUrl = new URL(imageUrl, self.location.origin).href;
      }
      options.image = imageUrl;
    }

    return self.registration.showNotification(title, options);
  })());
});

// 2. Handle User Clicking the Notification or Action Button
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const notificationData = event.notification.data || {};
  let targetUrl = '/';
  try {
    const rawUrl = notificationData.url || '/';
    const parsed = new URL(rawUrl, self.location.origin);
    if (parsed.origin === self.location.origin) {
      targetUrl = parsed.pathname + parsed.search + parsed.hash;
    }
  } catch (e) {
    targetUrl = '/';
  }

  // If a specific tab is targeted, ensure URL reflects it
  const validTabs = ['dashboard', 'sales', 'purchases', 'inventory', 'customers', 'suppliers', 'payments', 'expenses', 'reports', 'settings', 'recycle_bin'];
  const safeTab = validTabs.includes(notificationData.tab) ? notificationData.tab : null;

  if (safeTab && !targetUrl.includes('tab=')) {
    targetUrl = targetUrl.includes('?')
      ? `${targetUrl}&tab=${safeTab}`
      : `${targetUrl}?tab=${safeTab}`;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window of the app is already open, focus it and tell it to navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NAVIGATE_TAB',
            url: targetUrl,
            tab: notificationData.tab || null,
            data: notificationData
          });
          return;
        }
      }

      // If no open window, open a new window to the target URL
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 3. Handle Subscription Change (Browser / Platform Refresh)
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription?.options || { userVisibleOnly: true })
      .then((newSubscription) => {
        // Inform active client windows about the new subscription
        return self.clients.matchAll({ type: 'window' }).then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'PUSH_SUBSCRIPTION_CHANGED',
              subscription: newSubscription.toJSON()
            });
          });
        });
      })
      .catch((err) => {
        console.warn('[SW] pushsubscriptionchange failed:', err);
      })
  );
});
