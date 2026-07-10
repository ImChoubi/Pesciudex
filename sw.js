const CACHE = 'pesciudex-v2';
const ASSETS = ['./index.html', './logo.png', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isHTML = e.request.mode === 'navigate' || e.request.url.endsWith('index.html');
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(r => {
        if (r.ok && e.request.url.startsWith(self.location.origin)) {
          const cl = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, cl));
        }
        return r;
      }).catch(() => cached);
      // HTML : réseau d'abord (mises à jour immédiates), reste : cache d'abord
      return isHTML ? network : (cached || network);
    })
  );
});
