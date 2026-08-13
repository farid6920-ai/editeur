// Service worker : va toujours chercher la dernière version sur le réseau en premier,
// et ne se rabat sur la version en cache que si le téléphone est hors ligne.
var CACHE_NAME = 'editeur-boutique-v2';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  var req = event.request;
  // Ne jamais mettre en cache les appels à l'API GitHub ou aux polices externes.
  if (req.url.indexOf('api.github.com') !== -1 || req.url.indexOf('fonts.g') !== -1) return;

  // Réseau en priorité (pour toujours avoir la dernière version publiée),
  // avec repli sur le cache uniquement si le réseau échoue (mode hors ligne).
  event.respondWith(
    fetch(req).then(function(res){
      if (req.method === 'GET' && res.ok && req.url.indexOf(self.location.origin) === 0){
        var resClone = res.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(req, resClone); });
      }
      return res;
    }).catch(function(){
      return caches.match(req);
    })
  );
});
