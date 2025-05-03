// sw.js (place in your public folder)  
const CACHE_NAME = 'your-app-cache-v1';  
const urlsToCache = [  
  '/',  
  '/index.html',  
  '/manifest.json',  
  // Add other static assets you want to cache  
];  

// Install event - cache assets  
self.addEventListener('install', (event) => {  
  event.waitUntil(  
    caches.open(CACHE_NAME)  
      .then((cache) => {  
        return cache.addAll(urlsToCache);  
      })  
  );  
});  

// Activate event - clean up old caches  
self.addEventListener('activate', (event) => {  
  event.waitUntil(  
    caches.keys().then((cacheNames) => {  
      return Promise.all(  
        cacheNames.map((cacheName) => {  
          if (cacheName !== CACHE_NAME) {  
            return caches.delete(cacheName);  
          }  
        })  
      );  
    })  
  );  
});  

// Fetch event - serve from cache, fall back to network  
self.addEventListener('fetch', (event) => {  
  // This is the most important part for SPA/PWA navigation  
  if (event.request.mode === 'navigate') {  
    event.respondWith(  
      fetch(event.request).catch(() => {  
        return caches.match('/index.html');  
      })  
    );  
    return;  
  }  
  
  // Standard cache-first strategy for other requests  
  event.respondWith(  
    caches.match(event.request)  
      .then((response) => {  
        // Return from cache if found  
        if (response) {  
          return response;  
        }  
        // Otherwise fetch from network  
        return fetch(event.request);  
      })  
      .catch(() => {  
        // For image resources, return a placeholder if available  
        if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {  
          return caches.match('/images/placeholder.png');  
        }  
        return new Response('Network error happened', {  
          status: 408,  
          headers: { 'Content-Type': 'text/plain' },  
        });  
      })  
  );  
});  