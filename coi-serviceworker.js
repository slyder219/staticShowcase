/* coi-serviceworker
   Enables SharedArrayBuffer on any static host (GitHub Pages, Netlify, file://)
   by injecting Cross-Origin-Isolation headers via a Service Worker.
   Adapted from https://github.com/gzuidhof/coi-serviceworker (MIT License) */

if (typeof window === "undefined") {
  // ── Service Worker context ──────────────────────────────────────────────────
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

  self.addEventListener("fetch", (e) => {
    const req = e.request;
    // Avoid breaking opaque same-origin cache reads
    if (req.cache === "only-if-cached" && req.mode !== "same-origin") return;

    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.status === 0) return res;
          const headers = new Headers(res.headers);
          headers.set("Cross-Origin-Embedder-Policy", "require-corp");
          headers.set("Cross-Origin-Opener-Policy", "same-origin");
          return new Response(res.body, {
            status: res.status,
            statusText: res.statusText,
            headers,
          });
        })
        .catch((err) => {
          console.warn("coi-serviceworker fetch error:", err);
        })
    );
  });
} else {
  // ── Window context: register the Service Worker ────────────────────────────
  if (window.crossOriginIsolated) {
    // Already isolated – nothing to do
  } else if (!("serviceWorker" in navigator)) {
    console.warn("[coi] Service workers not supported; SharedArrayBuffer unavailable.");
  } else {
    (async () => {
      try {
        await navigator.serviceWorker.register(document.currentScript.src, {
          scope: "/",
        });
        // Reload once so the SW can intercept and add COOP/COEP headers.
        // Store a flag to avoid infinite reload loops.
        if (!sessionStorage.getItem("coi-reloaded")) {
          sessionStorage.setItem("coi-reloaded", "1");
          window.location.reload();
        } else {
          sessionStorage.removeItem("coi-reloaded");
          console.warn(
            "[coi] Reload did not establish crossOriginIsolated. " +
              "SharedArrayBuffer may be unavailable."
          );
        }
      } catch (err) {
        console.error("[coi] Service worker registration failed:", err);
      }
    })();
  }
}
