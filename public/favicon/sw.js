const CACHE_NAME = 'phc-platform-cache-v1';
const API_CACHE = 'phc-platform-api-v1';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon/favicon.ico',
  '/favicon/favicon.svg',
  '/favicon/favicon-96x96.png',
  '/favicon/apple-touch-icon.png',
  '/favicon/manifest.webmanifest',
  '/favicon/web-app-manifest-192x192.png',
  '/favicon/web-app-manifest-512x512.png',
  '/favicon/logo stacked vertical version.png',
  '/favicon/logo horizontal with wordmap.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch((err) => {
      console.warn('SW install: some assets failed to cache, installing anyway', err);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== API_CACHE) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCacheFallback(request));
    return;
  }

  if (request.method !== 'GET') {
    return;
  }

  if (url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/favicon/') ||
      url.pathname.startsWith('/images/') ||
      url.pathname.startsWith('/public/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname.startsWith('/fonts/') || url.pathname.endsWith('.woff2') || url.pathname.endsWith('.woff')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.origin === location.origin) {
    event.respondWith(networkFirstWithCacheFallback(request));
    return;
  }
});

async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response && response.status === 200 && response.type !== 'opaque') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return caches.match(request);
  }
}

async function networkFirstWithCacheFallback(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type !== 'opaque') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
      const fallback = await caches.match('/');
      if (fallback) return fallback;
    }

    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
