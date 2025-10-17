const CACHE_NAME = "QrGo-v1";
const urlsToCache = ["/", "/index.html", "/manifest.json", "/\QrGo_Logo_192x192.png.png", "/icon-512.png"];

// Install event
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch event
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
