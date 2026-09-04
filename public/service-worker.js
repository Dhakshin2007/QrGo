// ── QrGo Service Worker ─────────────────────────────────────────────────────
// Strategy:
//   • Navigation requests (HTML pages): Network-first → never serve stale HTML
//   • Hashed /assets/*: Cache-first → safe because filenames change with content
//   • Everything else (icons, manifest): Network-first with cache fallback
//
// IMPORTANT: Bump CACHE_VERSION on every deploy to force old SW caches to clear.
// This is handled automatically by Vite's content-hash asset filenames — the
// assets cache only grows and old entries are pruned during the activate step.

const CACHE_VERSION = "qrgo-v3";
const ASSETS_CACHE   = `${CACHE_VERSION}-assets`;
const FALLBACK_CACHE = `${CACHE_VERSION}-fallback`;

const STATIC_FALLBACKS = [
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json"
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", event => {
  // Pre-cache only truly static assets (no HTML, no JS bundles)
  event.waitUntil(
    caches.open(FALLBACK_CACHE)
      .then(cache => cache.addAll(STATIC_FALLBACKS))
      .then(() => self.skipWaiting()) // activate immediately — don't wait for old tabs to close
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          // Delete ALL caches that don't belong to this version
          .filter(key => key !== ASSETS_CACHE && key !== FALLBACK_CACHE)
          .map(key => {
            console.log("[SW] Deleting stale cache:", key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim()) // take control of all open tabs immediately
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return; // let the browser handle cross-origin requests normally
  }

  // ── Navigation requests (HTML) → Network-first, NO cache ──────────────────
  // This is the critical rule: never serve a cached index.html.
  // If the network is unavailable, show a meaningful offline page instead of
  // a blank white screen caused by stale HTML referencing deleted JS.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .catch(() =>
          // Offline fallback: return cached homepage if available, else a plain error
          caches.match("/") || new Response(
            "You are offline. Please check your connection and refresh.",
            { status: 503, headers: { "Content-Type": "text/plain" } }
          )
        )
    );
    return;
  }

  // ── Hashed /assets/* → Cache-first (immutable by filename) ────────────────
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.open(ASSETS_CACHE).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(response => {
            // Only cache successful responses
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // ── Everything else → Network-first with cache fallback ──────────────────
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          caches.open(FALLBACK_CACHE).then(cache => cache.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

