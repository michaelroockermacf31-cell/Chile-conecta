/* Chile Conecta: primero la red, y si no hay señal usa lo último guardado. No guarda datos de Supabase. */
const C = 'cc-red-v1';
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c => c.addAll(['cc-red.html', 'cc-icon-192.png', 'cc-icon-512.png'])).catch(() => {}));
});
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => {
    const copia = res.clone();
    caches.open(C).then(c => c.put(r, copia));
    return res;
  }).catch(() => caches.match(r).then(m => m || caches.match('cc-red.html'))));
});
