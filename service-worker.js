self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("three-kingdoms-cache").then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/assets/images/background-001.jpg",
        "/assets/styles/index.css",
        "/assets/styles/style.css",
        "/assets/scripts/index.js",
        "/assets/scripts/script.js",
        "/manifest.json"
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});