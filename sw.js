// sw.js – FIXED (Caching entschärft für Debug & stabile Entwicklung)

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

// Kein Cache mehr – jede Anfrage geht direkt ans Netz
self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request));
});
