/* Service Worker：讓整份行程在日本沒網路時也能開啟
 *
 * 策略
 *   - install：預先快取行程本體（HTML / CSS / icon / manifest）
 *   - fetch  ：導覽請求走 network-first（有網路時拿最新版），失敗才回快取
 *              其餘同源靜態檔走 cache-first
 *   - 跨網域請求（Google Fonts、Google Maps）一律不攔截，交給瀏覽器處理
 *
 * 改版時把 CACHE 的版本號 +1，舊快取會在 activate 時清掉。
 */
const CACHE = 'kansai-2026-v1';

const PRECACHE = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // 單檔失敗不讓整個安裝失敗
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;

  // 只處理自己網域的檔案；字體 CDN 和 Google Maps 交給瀏覽器
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 頁面導覽：優先拿線上最新版，離線時回退到快取
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  // 靜態檔：先用快取，順手把新抓到的存起來
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
