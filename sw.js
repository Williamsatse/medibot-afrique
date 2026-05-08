const CACHE = 'medibot-v1';
const ASSETS = ['/', '/index.html', '/style.css', '/script.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => {
      return r || fetch(e.request).catch(() => caches.match('/'));
    })
  );
});
