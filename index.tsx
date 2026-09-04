
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ClerkProvider } from "@clerk/clerk-react";

// ── Stale Chunk / Stale Asset Recovery ───────────────────────────────────────
// After a new Vercel deployment, old hashed JS bundle filenames are no longer
// served. If a user has a cached index.html referencing the OLD bundle, the
// dynamic import/script load will fail with a 404. This handler detects that
// and does a single hard reload (bypassing the Service Worker cache) so the
// browser fetches the fresh index.html and the new hashed bundle.
//
// sessionStorage flag prevents infinite reload loops.
window.addEventListener("error", (event) => {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  const isScriptLoad =
    target instanceof HTMLScriptElement ||
    (target instanceof HTMLLinkElement && target.rel === "modulepreload");

  if (isScriptLoad) {
    const src = (target as HTMLScriptElement).src || (target as HTMLLinkElement).href || "";
    const isAsset = src.includes("/assets/");
    if (isAsset && !sessionStorage.getItem("stale_chunk_reloaded")) {
      console.warn("[QrGo] Stale asset detected, reloading to fetch latest deployment:", src);
      sessionStorage.setItem("stale_chunk_reloaded", "1");
      window.location.reload();
    }
  }
}, true /* capture phase — fires before script errors bubble */);

// Also catch dynamically imported module failures (e.g., React.lazy chunks)
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const msg = reason?.message || reason?.toString() || "";
  const isChunkError =
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Loading chunk") ||
    msg.includes("Loading CSS chunk") ||
    msg.includes("error loading dynamically imported module");

  if (isChunkError && !sessionStorage.getItem("stale_chunk_reloaded")) {
    console.warn("[QrGo] Stale chunk error detected, reloading:", msg);
    sessionStorage.setItem("stale_chunk_reloaded", "1");
    window.location.reload();
  }
});

// Clear the reload flag after a successful load so future genuine errors
// can still trigger one recovery attempt
window.addEventListener("load", () => {
  sessionStorage.removeItem("stale_chunk_reloaded");
});

// ── React Mount ──────────────────────────────────────────────────────────────
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ── Service Worker Registration ───────────────────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(registration => {
        // Check for SW updates on every page load
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            // When the new SW is installed and activated (skipWaiting is called
            // inside the SW), the controller changes. Reload to use fresh assets.
            if (newWorker.state === "activated" && navigator.serviceWorker.controller) {
              console.log("[SW] New service worker activated. Page will use new assets.");
            }
          });
        });
      })
      .catch(err => console.error("[SW] Registration failed:", err));

    // If the SW controller changes (new SW took over), reload once
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing && !sessionStorage.getItem("stale_chunk_reloaded")) {
        refreshing = true;
        console.log("[SW] Controller changed — reloading for fresh assets.");
        window.location.reload();
      }
    });
  });
}
