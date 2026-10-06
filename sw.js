const CACHE_NAME = 'eraport-v2';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    // Biarkan aplikasi mengambil data secara normal
    return;
});

// --- TAMBAHAN BARU: MENANGKAP NOTIFIKASI MASUK ---
self.addEventListener('push', function(event) {
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'Notifikasi', body: event.data.text() };
        }
    } else {
        data = { title: 'SMK Ad-Da\'wah', body: 'Ada pemberitahuan baru!' };
    }

    const options = {
        body: data.body,
        icon: 'https://i.ibb.co.com/rfXvc7cX/icon-512x512.png', // Logo sekolah Anda
        badge: 'https://i.ibb.co.com/rfXvc7cX/icon-512x512.png',
        vibrate: [200, 100, 200, 100, 200], // Efek getar di HP
        data: data.url || '/' // Halaman yang dibuka saat notif diklik
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// --- TAMBAHAN BARU: AKSI SAAT NOTIFIKASI DI-KLIK ---
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    const targetUrl = event.notification.data || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            // Jika aplikasi sudah terbuka di background, fokuskan ke sana
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Jika belum terbuka, buka aplikasi baru
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
