/* Service Worker：讓整份行程在日本沒網路時也能開啟
 *
 * 策略（2026-09-21 修正）
 *   - install：預先快取行程本體（HTML / CSS / icon / manifest）
 *   - fetch  ：同源請求一律 **network-first**，成功就順手更新快取，失敗才回快取
 *   - 跨網域請求（Google Fonts、Google Maps、Leaflet CDN）不攔截，交給瀏覽器
 *
 * ⚠️ 為什麼不用 cache-first：
 *   舊版對 CSS/JS 採 cache-first，造訪過的使用者會永遠拿到舊樣式，
 *   除非改 CACHE 版本號。曾因此導致新版 HTML 配上舊版 CSS，
 *   方案輪播整個跑版。行程內容會持續修正，正確性比那幾十毫秒重要，
 *   而離線時 network 會失敗並自動回退到快取，離線閱讀不受影響。
 *
 * 改版時把 CACHE 的版本號 +1，舊快取會在 activate 時清掉。
 */
const CACHE = 'kansai-2026-v4';

const PRECACHE = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './icon.svg',
  '../assets/hero/hero.js',
];

/* hero 照片（約 5.6MB）不預先快取，改在使用者實際看到時才存下來，
   避免第一次開頁就吃掉大量流量。 */

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

  // 只處理自己網域的檔案；字體 CDN、地圖圖磚等交給瀏覽器
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // 只快取正常回應，避免把 404 或 opaque 回應存進去
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => {
          if (hit) return hit;
          // 離線且未快取過的頁面導覽，回退到行程表本體
          if (req.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        })
      )
  );
});
