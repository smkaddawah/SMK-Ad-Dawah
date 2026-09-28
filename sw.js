const CACHE_NAME = 'eraport-v1';

// Cukup pasang ini agar Chrome menganggap web ini adalah PWA yang valid
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    // Biarkan aplikasi mengambil data dari internet (Supabase) secara normal
    return;
});