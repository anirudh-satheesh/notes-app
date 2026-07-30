const CACHE_NAME = "notes-app-v3";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./manifest.json",
    "./assets/icons/icon-192.png",
    "./assets/icons/icon-512.png",

    "./js/app.js",
    "./js/categories.js",
    "./js/puter.js",
    "./js/state.js",
    "./js/storage.js",
    "./js/ui.js",
    "./js/utils.js"
];

// Install
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

// Activate
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );

    self.clients.claim();
});

// Fetch (Network first with cache fallback)
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response && response.status === 200 && response.type === "basic") {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});