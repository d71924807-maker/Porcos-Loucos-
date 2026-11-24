// Service worker: deixa o jogo abrir sem internet. As salas online (Firebase) nunca passam pelo cache.
const CACHE = "porcos-loucos-v9";
const ARQUIVOS = ["./", "index.html", "style.css", "config.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "js-00-util.js","js-01-data.js","js-02-store.js","js-03-engine.js","js-04-pig.js","js-05-maps.js","js-06-audio.js","js-07-online.js","js-08-game.js","js-09-ui.js"];

const PERMITIDOS = new Set(ARQUIVOS.map(a => new URL(a, self.registration.scope).pathname));

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.origin === location.origin) {
    // Só os arquivos do próprio jogo entram no cache; qualquer outra coisa vai direto para a rede.
    if (!PERMITIDOS.has(url.pathname)) return;
    // Abre do cache na hora e atualiza em segundo plano.
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req, { ignoreSearch: true });
      const rede = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || rede;
    }));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(CACHE).then(async c => {
      try { const r = await fetch(req); c.put(req, r.clone()); return r; } catch (err) { return (await c.match(req)) || Response.error(); }
    }));
  }
});
