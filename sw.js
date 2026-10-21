const V = "cg-v1", CORE = ["offline.html", "dusk.jpg", "Minecraftia.woff2"];
self.addEventListener("install", e => e.waitUntil(
  caches.open(V).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).catch(() =>
    r.mode === "navigate" ? caches.match("offline.html") : caches.match(r).then(m => m || Response.error())));
});
