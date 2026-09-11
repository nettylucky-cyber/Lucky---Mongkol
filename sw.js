/* Lucky Mongkol — service worker
   เก็บไฟล์แอปไว้ในเครื่อง เปิดใช้ได้ตอนไม่มีเน็ต
   แก้เลขเวอร์ชันทุกครั้งที่อัปเดตไฟล์ เพื่อบังคับให้โหลดของใหม่ */
const VERSION = 'lucky-mongkol-v1';
const ASSETS = [
  './',
  './lucky-mongkol.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // allSettled: ถ้าไฟล์ใดหายไป (เช่นยังไม่มี index.html) ตัวอื่นยังถูกเก็บ
    await Promise.allSettled(ASSETS.map(u => cache.add(new Request(u, { cache: 'reload' }))));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, { ignoreSearch: true });

    // มีในแคช: ส่งของเดิมทันที แล้วค่อยอัปเดตเบื้องหลัง
    if (hit) {
      fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); }).catch(() => {});
      return hit;
    }

    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      // ออฟไลน์และไม่มีในแคช: ถ้าเป็นการเปิดหน้า ให้ตกมาที่หน้าแอป
      if (req.mode === 'navigate') {
        const app = await cache.match('./lucky-mongkol.html');
        if (app) return app;
      }
      throw err;
    }
  })());
});
