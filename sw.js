const CACHE_NAME = 'vidhyashram-boardprep-shell-v7';
const SHELL = [
  './', './index.html', './exam.html', './styles.css', './app.js',
  './questions.js', './source-questions.js', './chapter-map.js', './mock-papers.js',
  './chapter-catalog.js', './practice-expansion.js', './manifest.webmanifest',
  './pwa-icon-192.png', './pwa-icon-512.png', './pyq-images-class12.js',
  './class12-image-bank.js',
  './image-first-ui.js',
  './image-first-ui.css'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith('vidhyashram-boardprep-') && key !== CACHE_NAME).map((key) => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const path = url.pathname;
  const isImageBundle = /pyq-images-.*\.js$/i.test(path);
  const isAppAsset = /\.(js|css|webmanifest)$/i.test(path) && !isImageBundle;
  if (request.mode === 'navigate' || isAppAsset) {
    event.respondWith(fetch(request, { cache: 'no-cache' }).then((response) => {
      if (response && response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      return response;
    }).catch(() => caches.match(request).then((cached) => cached || (request.mode === 'navigate' ? caches.match('./index.html') : Promise.reject(new Error('Offline asset unavailable'))))));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response && response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
    return response;
  })));
});
