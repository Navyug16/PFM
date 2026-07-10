const CACHE_NAME = 'pfm-cache-v1.0.0'
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
]

// 1. Install Event: Cache app shell
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE)
    })
  )
})

// 2. Activate Event: Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key)
            }
          })
        )
      }),
      self.clients.claim()
    ])
  )
})

// 3. Fetch Event: Intercept static assets, bypass Supabase/REST APIs
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  // STRICT BYPASS RULES:
  // Never cache POST/PUT/DELETE mutations to prevent duplicate transactions
  // Never cache Supabase REST APIs (/rest/v1/) or Auth endpoints (/auth/v1/)
  // Never cache Supabase origins or authenticated responses
  const isPostOrMutation = request.method !== 'GET'
  const isSupabaseRequest = url.hostname.includes('supabase.co') || url.pathname.includes('/rest/v1/') || url.pathname.includes('/auth/v1/')
  
  if (isPostOrMutation || isSupabaseRequest) {
    return // Let request flow through directly to network
  }

  // Only intercept GET requests for local app shell assets, fonts, or images
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request)
        .then((response) => {
          // Cache Vite hashed assets (/assets/index-*.js, index-*.css) or icons on the fly
          const isStaticAsset = url.pathname.startsWith('/assets/') || url.pathname.endsWith('.png') || url.pathname.endsWith('.ico') || url.pathname.endsWith('.woff2')
          
          if (response && response.status === 200 && isStaticAsset) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return response
        })
        .catch(() => {
          // Navigation fallback: return cached index.html when offline and navigating pages
          if (request.mode === 'navigate') {
            return caches.match('/index.html')
          }
        })
    })
  )
})
