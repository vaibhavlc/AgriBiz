const CACHE_NAME = 'agribiz-v5';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/logo-192.png',
  '/logo-512.png',
  '/favicon.svg'
];

let customPwaName = 'AgriBiz';

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_PWA_NAME') {
    customPwaName = event.data.name || 'AgriBiz';
  }
});

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

  // Skip API backend requests and websockets so SW doesn't intercept or corrupt API calls
  if (requestUrl.pathname.startsWith('/api/')) return;

  // Intercept Web App Manifest requests and return dynamic JSON with customized app name
  if (requestUrl.pathname.includes('manifest.webmanifest')) {
    const urlName = requestUrl.searchParams.get('name');
    const nameToUse = urlName || customPwaName || 'AgriBiz';

    const dynamicManifest = {
      name: nameToUse,
      short_name: nameToUse,
      start_url: '/',
      display: 'standalone',
      background_color: '#f8fafc',
      theme_color: '#0b0f19',
      icons: [
        {
          src: '/logo-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/logo-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    };

    event.respondWith(
      new Response(JSON.stringify(dynamicManifest, null, 2), {
        headers: {
          'Content-Type': 'application/manifest+json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    );
    return;
  }

  // Network-first strategy with safe Response fallback for all other assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
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
