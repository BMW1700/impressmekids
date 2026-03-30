// Service Worker for NabuLearn — push notifications only
// v3 - No caching, no clients.claim(), no SW_UPDATED messages to prevent tab-switch reloads

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))))
  );
  // Intentionally NOT calling self.clients.claim() or posting SW_UPDATED
});

self.addEventListener('fetch', () => {
  // Let the browser handle all fetches normally — no interception
});

self.addEventListener('push', (event) => {
  let d = { title: 'NabuLearn', body: 'You have a new notification', icon: '/android-chrome-192x192.png', badge: '/favicon-32x32.png', data: {} };
  if (event.data) {
    try {
      const p = event.data.json();
      d = {
        title: p.notification?.title || p.title || d.title,
        body: p.notification?.body || p.body || d.body,
        icon: p.notification?.icon || p.icon || d.icon,
        badge: p.notification?.badge || p.badge || d.badge,
        data: p.notification?.data || p.data || d.data,
        tag: p.notification?.tag || p.tag,
      };
    } catch (e) {}
  }
  event.waitUntil(
    self.registration.showNotification(d.title, {
      body: d.body, icon: d.icon, badge: d.badge, data: d.data, tag: d.tag, vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) if ('focus' in c) return c.focus();
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
