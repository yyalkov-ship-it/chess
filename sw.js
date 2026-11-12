// Отдаёт расшифрованное приложение из Cache Storage. Содержимого без пароля здесь нет.
const BASE = '/chess/'
const APP = BASE + 'app/'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (url.origin !== location.origin || !url.pathname.startsWith(APP) || e.request.method !== 'GET') return
  e.respondWith((async () => {
    let p = url.pathname
    if (p.endsWith('/')) p += 'index.html'
    const hit = await caches.match(location.origin + p, { ignoreSearch: true })
    if (hit) return hit
    if (e.request.mode === 'navigate') return Response.redirect(BASE + '?next=' + encodeURIComponent(url.pathname + url.search), 302)
    return new Response('locked', { status: 404 })
  })())
})
