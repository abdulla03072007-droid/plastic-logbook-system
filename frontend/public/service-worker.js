const CACHE_NAME = 'plastic-logbook-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install SW
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the new service worker to become active immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Network-First Strategy (Best for fixing blank pages)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // If we have internet, use it and update cache
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return res;
      })
      .catch(() => caches.match(event.request)) // If offline, use cache
  );
});

// Activate the SW
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [];
  cacheWhitelist.push(CACHE_NAME);

  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => {
        if (!cacheWhitelist.includes(cacheName)) {
          return caches.delete(cacheName);
        }
      })
    ))
  );
});
