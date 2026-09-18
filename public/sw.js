// Estrategia:
// - Páginas (navegación): red primero; la caché solo como respaldo sin conexión.
//   Así el HTML nunca apunta a CSS/JS de un despliegue anterior que ya no existe.
// - /_astro/* (nombres con hash, inmutables): caché primero.
// - Resto de estáticos: se sirve la caché y se revalida en segundo plano.
// - /api/*: nunca se cachea.
const CACHE_NAME = 'nexus-terminal-v5';
const SHELL_ASSETS = ['/', '/favicon.svg', '/manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // cache: 'reload' evita rellenar la caché con copias antiguas de la caché HTTP.
      .then(cache => cache.addAll(SHELL_ASSETS.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const putInCache = (request, response) => {
  if (response.ok && response.type === 'basic') {
    const clone = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
  }
  return response;
};

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Navegación y plantillas de la terminal: red primero (nunca HTML viejo con
  // código nuevo tras un despliegue).
  if (request.mode === 'navigate' || url.pathname.startsWith('/terminal-vistas')) {
    event.respondWith(
      fetch(request)
        .then(response => putInCache(request, response))
        .catch(() => caches.match(request).then(cached => cached || caches.match('/')))
    );
    return;
  }

  if (url.pathname.startsWith('/_astro/')) {
    event.respondWith(
      caches
        .match(request)
        .then(cached => cached || fetch(request).then(response => putInCache(request, response)))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request)
        .then(response => putInCache(request, response))
        .catch(() => cached);
      return cached || network;
    })
  );
});
