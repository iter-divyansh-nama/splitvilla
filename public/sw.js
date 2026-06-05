// Splitr service worker — best-effort offline support.
// Strategy:
//   - Never cache Supabase API or auth calls (always go to network).
//   - Static assets (icons, manifest, _next static): cache-first.
//   - Navigations / pages: network-first, falling back to cache, then to a
//     minimal offline page.

const CACHE = "splitr-v1";
const PRECACHE = [
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(png|jpg|jpeg|svg|webp|ico|woff2?|css|js)$/.test(url.pathname) ||
    url.pathname === "/manifest.json"
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Skip cross-origin (e.g. Supabase) and API/auth routes entirely.
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/auth") ||
    url.pathname.startsWith("/api")
  ) {
    return;
  }

  // Cache-first for static assets.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          })
      )
    );
    return;
  }

  // Network-first for navigations / everything else.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then(
            (cached) =>
              cached ||
              new Response(
                "<h1>You're offline</h1><p>Reconnect to use Splitr.</p>",
                { headers: { "Content-Type": "text/html" } }
              )
          )
        )
    );
  }
});
