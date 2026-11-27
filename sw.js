// Отдаёт расшифрованное приложение из Cache Storage. Содержимого без пароля здесь нет.
// Оболочка (страница входа, манифест, иконки) — «сначала сеть, потом кэш», чтобы иконка
// с домашнего экрана открывалась и без интернета.
const BASE = '/chess/'
const APP = BASE + 'app/'
const SHELL = 'sealed-shell'
const SHELL_FILES = [BASE, BASE + 'manifest.webmanifest', BASE + 'icons/apple-touch-icon.png', BASE + 'icons/icon-192.png', BASE + 'icons/icon-512.png']

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(caches.open(SHELL).then((c) => Promise.all(SHELL_FILES.map((u) => c.add(new Request(u, { cache: 'no-cache' })).catch(() => {})))))
})
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

const isShell = (p) => p === BASE + 'index.html' || SHELL_FILES.includes(p)

async function shell(req, p) {
  const key = p === BASE + 'index.html' ? BASE : p
  try {
    const r = await fetch(req, { signal: AbortSignal.timeout(4000) })
    if (r.ok) { const c = await caches.open(SHELL); await c.put(location.origin + key, r.clone()) }
    return r
  } catch (err) {
    const c = await caches.open(SHELL)
    const hit = await c.match(location.origin + key, { ignoreSearch: true })
    if (hit) return hit
    throw err
  }
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (url.origin !== location.origin || e.request.method !== 'GET') return
  if (isShell(url.pathname)) { e.respondWith(shell(e.request, url.pathname)); return }
  if (!url.pathname.startsWith(APP)) return
  e.respondWith((async () => {
    let p = url.pathname
    if (p.endsWith('/')) p += 'index.html'
    const hit = await caches.match(location.origin + p, { ignoreSearch: true })
    if (hit) return hit
    if (e.request.mode === 'navigate') return Response.redirect(BASE + '?next=' + encodeURIComponent(url.pathname + url.search), 302)
    return new Response('locked', { status: 404 })
  })())
})
