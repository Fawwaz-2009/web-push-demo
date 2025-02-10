// Skip waiting and claim clients immediately
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon.png',
    badge: '/badge.png',
    data: {
      url: self.location.origin
    }
  };

  event.waitUntil(
    self.registration.showNotification('Web Push Demo', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
}); 