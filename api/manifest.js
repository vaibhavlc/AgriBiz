/* eslint-disable no-control-regex */
export default function handler(req, res) {
  // Support GET and HEAD
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }

  // Safely extract and sanitize custom name
  const rawName = (req.query?.name || '').toString().trim();
  // Strip control characters and cap at standard max length 45
  const cleanName = rawName.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').slice(0, 45);
  const appName = cleanName || 'AgriBiz';
  const shortName = cleanName ? cleanName.slice(0, 30) : 'AgriBiz';

  const manifest = {
    id: '/',
    name: appName,
    short_name: shortName,
    description: `${appName} — Enterprise Agriculture Business and Billing Suite`,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#f8fafc',
    theme_color: '#0b0f19',
    icons: [
      {
        src: '/logo-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/logo-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/logo-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/logo-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/badge-monochrome-96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'monochrome'
      },
      {
        src: '/badge-monochrome-72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'monochrome'
      }
    ]
  };

  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json(manifest);
}
