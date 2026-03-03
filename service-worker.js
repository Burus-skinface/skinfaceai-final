// Bump cache version to ensure clients don't get stuck on stale index.html across deployments.
const CACHE_NAME = 'ai-facial-tracker-v2';
const URLS_TO_CACHE = [
  '/',
  '/index.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', event => {
  // Skip Vite dev server requests and external resources
  const url = new URL(event.request.url);
  
  // Skip Vite HMR and dev server requests
  if (url.pathname.includes('/@vite') || 
      url.pathname.includes('/@react-refresh') ||
      url.pathname.includes('/@fs/') ||
      url.hostname === 'localhost' && (url.port === '3001' || url.port === '3002' || url.port === '5173')) {
    // Let Vite dev server handle these
    return;
  }
  
  // Skip external resources (CDN, APIs, etc.)
  if (url.origin !== self.location.origin && 
      !url.hostname.includes('localhost') &&
      !url.hostname.includes('127.0.0.1')) {
    // Let browser handle external requests
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        // Try to fetch, but don't fail if it errors
        return fetch(event.request).catch(error => {
          console.log('Fetch failed for:', event.request.url, error);
          // Return a basic response for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html') || new Response('Offline', { status: 503 });
          }
          throw error;
        });
      })
      .catch(error => {
        console.log('Cache match failed:', error);
        // For navigation requests, try to return cached index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html') || new Response('Offline', { status: 503 });
        }
        throw error;
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
