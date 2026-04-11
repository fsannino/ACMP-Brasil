var CACHE_NAME = 'acmp-brasil-v1';
var URLS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/main.js',
    '/img/logo-acmp-brasil.png',
    '/img/logo-acmp-brasil-white.png'
];

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(URLS);
        })
    );
});

self.addEventListener('fetch', function (e) {
    e.respondWith(
        caches.match(e.request).then(function (response) {
            return response || fetch(e.request);
        })
    );
});
