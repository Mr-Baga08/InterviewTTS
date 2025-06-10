// public/sw.js - Fixed Service Worker with proper redirect handling
const CACHE_NAME = 'thetruthschool-v1';
const STATIC_CACHE_NAME = 'thetruthschool-static-v1';

// Resources to cache immediately
const PRECACHE_RESOURCES = [
  '/',
  '/manifest.json',
  '/logo.svg',
  '/favicon.ico',
  '/covers/default.png'
];

// Resources that should bypass cache (dynamic content)
const BYPASS_CACHE_PATTERNS = [
  /\/api\//,
  /\/auth\//,
  /\/_next\/webpack/,
  /\.hot-update\./,
  /\/socket\.io/
];

// Resources that should use network-first strategy
const NETWORK_FIRST_PATTERNS = [
  /\/dashboard/,
  /\/interview/,
  /\/feedback/,
  /\/api\//
];

// Install event - precache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching static resources');
        return cache.addAll(PRECACHE_RESOURCES.map(url => new Request(url, {
          redirect: 'follow', // CRITICAL FIX: Allow redirects
          credentials: 'same-origin'
        })));
      })
      .then(() => {
        console.log('[SW] Precaching complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Precaching failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Cache cleanup complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies with proper redirect handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Skip bypass patterns
  if (BYPASS_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return;
  }
  
  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // Network-first strategy for dynamic content
    if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return await networkFirst(request);
    }
    
    // Cache-first strategy for static assets
    if (isStaticAsset(url.pathname)) {
      return await cacheFirst(request);
    }
    
    // Stale-while-revalidate for everything else
    return await staleWhileRevalidate(request);
    
  } catch (error) {
    console.error('[SW] Fetch error:', error);
    
    // Try to serve from cache as fallback
    const cachedResponse = await getCachedResponse(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If it's a navigation request, serve offline page or redirect to sign-in
    if (request.mode === 'navigate') {
      return handleNavigationFallback(request);
    }
    
    // For other requests, return a basic error response
    return new Response('Network error', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Network-first strategy with proper redirect handling
async function networkFirst(request) {
  try {
    // CRITICAL FIX: Create request with explicit redirect handling
    const networkRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      mode: request.mode,
      credentials: request.credentials,
      redirect: 'follow', // Allow following redirects
      cache: 'no-cache'
    });
    
    const networkResponse = await fetch(networkRequest);
    
    // Only cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone()).catch(console.warn);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.warn('[SW] Network request failed:', error);
    
    // Fallback to cache
    const cachedResponse = await getCachedResponse(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Cache-first strategy for static assets
async function cacheFirst(request) {
  const cachedResponse = await getCachedResponse(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Not in cache, fetch from network
  try {
    const networkRequest = new Request(request.url, {
      redirect: 'follow',
      credentials: 'same-origin'
    });
    
    const networkResponse = await fetch(networkRequest);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone()).catch(console.warn);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Failed to fetch static asset:', error);
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Start network request (don't await)
  const networkResponsePromise = fetch(new Request(request.url, {
    redirect: 'follow',
    credentials: request.credentials
  })).then(async (networkResponse) => {
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(console.warn);
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If no cached response, wait for network
  return networkResponsePromise;
}

// Helper function to get cached response
async function getCachedResponse(request) {
  const staticCache = await caches.open(STATIC_CACHE_NAME);
  const staticResponse = await staticCache.match(request);
  
  if (staticResponse) {
    return staticResponse;
  }
  
  const dynamicCache = await caches.open(CACHE_NAME);
  return await dynamicCache.match(request);
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') && (
      pathname.endsWith('.js') ||
      pathname.endsWith('.css') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.gif') ||
      pathname.endsWith('.webp') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.ico') ||
      pathname.endsWith('.woff') ||
      pathname.endsWith('.woff2')
    )
  );
}

// Handle navigation fallback
async function handleNavigationFallback(request) {
  const url = new URL(request.url);
  
  // For auth-related pages, always try network first
  if (url.pathname.includes('/sign-in') || url.pathname.includes('/sign-up')) {
    try {
      return await fetch(new Request(request.url, {
        redirect: 'follow',
        credentials: 'same-origin'
      }));
    } catch (error) {
      // If network fails, return a basic response
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>ThetruthSchool - Offline</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { 
                font-family: system-ui, sans-serif; 
                text-align: center; 
                padding: 50px;
                background: #000;
                color: #fff;
              }
              .container {
                max-width: 400px;
                margin: 0 auto;
                padding: 2rem;
                background: rgba(255,255,255,0.1);
                border-radius: 1rem;
                backdrop-filter: blur(20px);
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>You're Offline</h1>
              <p>Please check your internet connection and try again.</p>
              <button onclick="window.location.reload()">Retry</button>
            </div>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
  }
  
  // For other pages, try to serve from cache or redirect
  try {
    const cachedResponse = await getCachedResponse(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // No cache available, try network with redirect handling
    return await fetch(new Request(request.url, {
      redirect: 'follow',
      credentials: 'same-origin'
    }));
    
  } catch (error) {
    // Return offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ThetruthSchool - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              text-align: center; 
              padding: 50px;
              background: #000;
              color: #fff;
            }
            .container {
              max-width: 400px;
              margin: 0 auto;
              padding: 2rem;
              background: rgba(255,255,255,0.1);
              border-radius: 1rem;
              backdrop-filter: blur(20px);
            }
            button {
              background: #3b82f6;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 0.5rem;
              cursor: pointer;
              margin: 0.5rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>You're Offline</h1>
            <p>ThetruthSchool is not available right now. Please check your internet connection.</p>
            <button onclick="window.location.reload()">Retry</button>
            <button onclick="window.location.href='/sign-in'">Go to Sign In</button>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Message handling for cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});

// Error handling for unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

console.log('[SW] Service Worker script loaded successfully');