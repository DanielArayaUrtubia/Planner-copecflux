const CACHE_NAME = "planner-copecflux-v14";
const FILES_TO_CACHE = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// El HTML principal usa "network-first": intenta traer la versión más
// nueva del servidor primero, y solo si no hay conexión usa la copia
// guardada. Así, cuando subes cambios a GitHub, la app (incluida la APK)
// los muestra la próxima vez que abre con internet, sin quedar pegada
// en una versión vieja.
self.addEventListener("fetch", (event) => {
  const isHTML =
    event.request.mode === "navigate" ||
    event.request.url.endsWith("/index.html") ||
    event.request.url.endsWith("/");

  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return res;
        })
        .catch(() => caches.match(event.request).then((c) => c || caches.match("./index.html")))
    );
    return;
  }

  // Íconos, manifest, etc: caché primero (no cambian seguido), con
  // respaldo de red.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => caches.match("./index.html"))
      );
    })
  );
});
