// Simple caching service worker for robodex.com
const CACHE_NAME = 'robodex-cache-v1';

// List of assets to cache immediately on installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/index.js',
  '/bg.mp4',
  '/assets/bg.mp4',
  '/assets/load.mp4',
  '/conthrax-sb.ttf'
];

// Installation event - cache important files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching pre-defined assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
  );
});

// Activation event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Fetch event - serve from cache, fall back to network and cache the result
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Special handling for video files
  if (event.request.url.match(/\.(mp4|webm)$/)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          // Serve video from cache if available
          console.log('Serving video from cache:', event.request.url);
          return cachedResponse;
        }
        
        // Otherwise fetch from network and cache
        return fetch(event.request).then(response => {
          // Only cache valid responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Cache a copy of the video response
          let responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            console.log('Caching video:', event.request.url);
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
    );
    return;
  }
  
  // For other assets (images, CSS, JS, etc.)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then(response => {
        // Only cache valid responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Cache a copy of the response
        let responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      });
    })
  );
});