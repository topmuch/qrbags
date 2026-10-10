/* QRBags Service Worker — cache PWA (JavaScript pur : les fichiers de /public
 * ne passent PAS par le compilateur TypeScript, toute annotation TS y est
 * fatale → « ServiceWorker script evaluation failed » dans le navigateur). */

const CACHE_NAME = 'qrbag-v1';

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/favicon.png',
];

// Install event - pre-cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[QRBags SW] Precaching app shell');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activate immediately without waiting
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[QRBags SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - routing based on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // API calls: network-only (no cache) for real-time data
  if (request.url.includes('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Static images / icons / items: cache-first
  const isImageRequest =
    request.url.includes('/images/') ||
    request.url.includes('/items/') ||
    request.url.includes('/icons/');

  if (isImageRequest) {
    event.respondWith(cacheFirstWithNetworkFallback(request));
    return;
  }

  // Navigation / other requests: network-first
  event.respondWith(networkFirstWithCacheFallback(request));
});

/**
 * Network-first strategy: try network, fall back to cache.
 * On success, update the cache with the fresh response.
 */
async function networkFirstWithCacheFallback(request) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // If nothing in cache either, return a minimal offline response
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Cache-first strategy: try cache, fall back to network.
 * On network success, populate the cache for future use.
 */
async function cacheFirstWithNetworkFallback(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}
