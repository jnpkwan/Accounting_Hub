/* Accounting Hub service worker.
   Keeps the screens available when the connection drops; never stores the books.
   Screens: network first, so a new upload shows on the next open; the saved copy is used only when offline.
   Apps Script: always the network, never cached. */
const CACHE_NAME = 'accounting-hub-v2';
const SHELL = ['./', './index.html', './manifest.json', './favicon.png', './logo.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => Promise.all(SHELL.map(u => cache.add(u).catch(() => null)))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(resp => {
      if (resp && resp.ok) { const copy = resp.clone(); caches.open(CACHE_NAME).then(c => c.put(req, copy)); }
      return resp;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
