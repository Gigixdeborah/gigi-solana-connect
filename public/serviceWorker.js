self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open('gigi-connect-cache').then(function(cache) {
      return cache.addAll([
        '/',
        '/index.html',
        '/src/main.jsx',
        '/public/favicon.ico'
      ]);
    })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});