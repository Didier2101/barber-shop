self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Solo interceptar peticiones GET de navegación o recursos locales
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch((error) => {
      console.warn('[SW] Fetch failed; returning offline fallback if available.', error);
      // Aquí podrías retornar una página offline si la tuvieras cacheada
      // Por ahora solo evitamos el error fatal
      return new Response('Network error occurred', {
        status: 408,
        statusText: 'Network error occurred',
      });
    })
  );
});
