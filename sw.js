"use strict";

const CACHE_NAME = "local-workspace-shell-2026.08.01.1";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./manifest-dark.webmanifest",
  "./assets/css/app.css",
  "./assets/js/config.js",
  "./assets/js/core/utils.js",
  "./assets/js/core/state.js",
  "./assets/js/core/storage.js",
  "./assets/js/core/components.js",
  "./assets/js/core/portability.js",
  "./assets/js/core/sync.js",
  "./assets/js/core/pwa.js",
  "./assets/js/app.js",
  "./assets/icons/favicon.svg",
  "./assets/icons/app-icon-light.svg",
  "./assets/icons/app-icon-dark.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-512-maskable.png",
  "./assets/icons/icon-192-dark.png",
  "./assets/icons/icon-512-dark.png",
  "./assets/icons/icon-512-maskable-dark.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/apple-touch-icon-dark.png",
  "./assets/icons/splash-light.png",
  "./assets/icons/splash-dark.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(SHELL); }));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(Promise.all([
    caches.keys().then(function (keys) { return Promise.all(keys.filter(function (key) { return key.startsWith("local-workspace-shell-") && key !== CACHE_NAME; }).map(function (key) { return caches.delete(key); })); }),
    self.clients.claim()
  ]));
});

self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", function (event) {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(caches.match("./index.html").then(function (cached) {
      return cached || fetch(request).catch(function () { return caches.match("./index.html"); });
    }));
    return;
  }

  event.respondWith(caches.match(request).then(function (cached) {
    if (cached) return cached;
    return fetch(request).then(function (response) {
      if (!response || !response.ok || response.type !== "basic") return response;
      const copy = response.clone();
      caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
      return response;
    });
  }));
});
