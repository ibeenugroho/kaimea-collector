/* KAIMEA Collector service worker: keeps the app usable with no signal.
 * Network first: with signal, the phone always gets the newest files (and refreshes its saved copy);
 * with no signal, it uses the saved copy. Bump CACHE when you publish a new version.
 */
var CACHE = "kaimea-collector-v1.6.0";
var SHELL = ["./", "index.html", "app.js", "config.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/wordmark.png", "icons/favicon-64.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    // cache: "reload" skips the browser's own HTTP cache so the new version is really fetched
    return c.addAll(SHELL.map(function (u) { return new Request(u, { cache: "reload" }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

/* Same-origin GETs: try the network (4 s limit), fall back to the saved copy.
 * Everything else (the Google Sheets POST) goes straight to the network. */
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(function (c) {
    var fromCache = function () {
      return c.match(req, { ignoreSearch: true }).then(function (hit) {
        return hit || (req.mode === "navigate" ? c.match("index.html") : new Response("", { status: 504 }));
      });
    };
    var net = fetch(req.url, { cache: "no-cache", credentials: "same-origin" }).then(function (res) {
      if (res && res.ok) c.put(req, res.clone());
      return res;
    });
    var timeout = new Promise(function (_, rej) { setTimeout(function () { rej(new Error("slow")); }, 4000); });
    return Promise.race([net, timeout]).then(function (res) { return res && res.ok ? res : fromCache(); }, fromCache);
  }));
});
