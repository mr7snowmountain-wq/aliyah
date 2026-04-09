const CACHE = 'aliyah-v1'

// Installation : mise en cache des assets principaux
self.addEventListener('install', e => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim())
})

// Réception d'une notification push
self.addEventListener('push', e => {
  if (!e.data) return
  const data = e.data.json()
  e.waitUntil(
    self.registration.showNotification(data.title || 'Aliyah 🌸', {
      body   : data.body   || '',
      icon   : '/icon-192.png',
      badge  : '/icon-192.png',
      tag    : data.tag    || 'aliyah-notif',
      data   : { url: data.url || '/' },
      vibrate: [200, 100, 200],
      actions: data.actions || [],
    })
  )
})

// Clic sur la notification → ouvre l'app sur la bonne page
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin))
      if (existing) { existing.focus(); existing.navigate(url) }
      else clients.openWindow(url)
    })
  )
})
