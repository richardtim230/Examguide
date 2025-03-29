

self.addEventListener('install', event => {
    console.log('Service Worker installing.');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('Service Worker activating.');
});

self.addEventListener('push', event => {
    const data = event.data.json();
    console.log('Push received:', data);

    const options = {
        body: data.body,
        icon: 'logo.png', // Path to an icon image
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});
