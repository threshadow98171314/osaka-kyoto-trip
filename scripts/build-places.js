#!/usr/bin/env node
/*
 * 從 docs/final/index.html 擷取行程地點，用 OpenStreetMap Nominatim 查經緯度，
 * 產生 docs/map/places.json 供地圖頁使用。
 *
 *   node scripts/build-places.js
 *
 * 行程表是唯一事實來源；改完行程重跑本腳本即可同步地圖。
 * 已查過的座標會沿用 places.json 舊值（除非加 --refresh），避免重複打 Nominatim。
 *
 * Nominatim 使用規範：每秒至多 1 次請求、必須帶可識別的 User-Agent。
 * https://operations.osmfoundation.org/policies/nominatim/
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join('docs', 'final', 'index.html');
const OUT = path.join('docs', 'map', 'places.json');
const REFRESH = process.argv.includes('--refresh');
const UA = 'osaka-kyoto-trip/1.0 (personal travel itinerary map; https://github.com/threshadow98171314/osaka-kyoto-trip)';

/* Nominatim 對少數地點解析不佳，這裡指定更精確的查法 */
const QUERY_OVERRIDE = {
  'ポケモンセンターオーサカ 大丸梅田店': '大丸梅田店',
  '叙々苑 ジェイアール京都伊勢丹店': 'ジェイアール京都伊勢丹',
  'teamLab Biovortex Kyoto': '京都市南区東九条東岩本町',
  'Apartment Hotel 11 Namba Minami Shin-Imamiya II': '大阪市西成区太子1丁目',
  'Randor Residential Hotel Kyoto Suites': '京都市南区東九条北松ノ木町',
  '日本橋でんでんタウン 大阪': '日本橋筋商店街 大阪市浪速区',
  '河原町 京都': '河原町通 京都市中京区',
  '鴨川 京都': '鴨川 京都市中京区',
  '神戸ハーバーランド モザイク': '神戸ハーバーランド',
  '南海電鉄 新今宮駅': '新今宮駅',
  // 加了空格／店名後綴反而查不到，用店名本身即可命中
  // （OSM 回傳的地址與行程表記載一致：長柄西一丁目、北長狭通一丁目 9 番）
  '天然温泉なにわの湯': 'なにわの湯',
  'モーリヤ三宮店 神戸': 'モーリヤ',
};

const strip = (s) => s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

function extract() {
  const html = fs.readFileSync(SRC, 'utf8');
  const places = [];

  const sections = html.split(/<section class="day-section[^"]*" id="day-/).slice(1);

  for (const sec of sections) {
    const day = parseInt(sec, 10);
    const date = (sec.match(/data-date="([^"]+)"/) || [])[1] || '';
    const seen = new Set();

    // --- 時間軸項目 ---
    const items = sec.split(/<div class="timeline-item/).slice(1);
    for (const raw of items) {
      const item = raw.split('<div class="day-maps')[0];
      const isTransport = /^[^>]*\btransport\b/.test(item);

      const titleRaw = (item.match(/<span class="tl-title">([\s\S]*?)<\/span>\s*(?:<span class="tl-tag|<\/div>)/) || [])[1] || '';
      const ja = strip((titleRaw.match(/<span class="ja-name">([\s\S]*?)<\/span>/) || [])[1] || '');
      const title = strip(titleRaw.replace(/<span class="ja-name">[\s\S]*?<\/span>/, ''));

      const tagMatch = item.match(/<span class="tl-tag([^"]*)">([^<]*)<\/span>/);
      const tag = tagMatch ? tagMatch[2].trim() : '';
      const isFixed = tagMatch ? /\bfixed\b/.test(tagMatch[1]) : false;

      const time = strip((item.match(/<span class="tl-time">([^<]*)<\/span>/) || [])[1] || '');
      const icon = strip((item.match(/<span class="tl-icon">([^<]*)<\/span>/) || [])[1] || '');
      const note = [...item.matchAll(/<p class="tl-note">([\s\S]*?)<\/p>/g)].map((m) => strip(m[1])).join(' ／ ');

      for (const m of item.matchAll(/<a class="map-link" href="https:\/\/maps\.google\.com\/maps\?q=([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
        const query = decodeURIComponent(m[1]).replace(/\+/g, ' ');
        seen.add(query);
        places.push({
          day, date, time, icon, title, ja,
          label: strip(m[2]),
          tag,
          kind: isTransport ? 'transport' : (isFixed ? 'fixed' : 'spot'),
          note, query,
        });
      }
    }

    // --- 只出現在「今日相關地圖」的地點 ---
    const dayMaps = sec.split('<div class="day-maps')[1] || '';
    for (const m of dayMaps.matchAll(/<a class="map-chip" href="https:\/\/maps\.google\.com\/maps\?q=([^"]+)"[^>]*>([^<]*)<\/a>/g)) {
      const query = decodeURIComponent(m[1]).replace(/\+/g, ' ');
      if (seen.has(query)) continue;
      seen.add(query);
      const text = strip(m[2]);
      places.push({
        day, date, time: '', icon: text.slice(0, 2).trim(), title: text, ja: '',
        label: text.replace(/^\S+\s*/, ''), tag: '', kind: 'spot', note: '', query,
      });
    }
  }

  return places;
}

async function geocode(query) {
  const q = QUERY_OVERRIDE[query] || query;
  const url = 'https://nominatim.openstreetmap.org/search'
    + '?format=jsonv2&limit=1&countrycodes=jp&accept-language=ja'
    + '&q=' + encodeURIComponent(q);

  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const hits = await res.json();
  if (!hits.length) return null;
  return {
    lat: +(+hits[0].lat).toFixed(6),
    lon: +(+hits[0].lon).toFixed(6),
    osm: hits[0].display_name,
    geocodedQuery: q,
  };
}

(async () => {
  const places = extract();
  console.log('從行程表擷取到 ' + places.length + ' 個地點\n');

  // 沿用既有座標，避免重複請求
  let cache = {};
  if (!REFRESH && fs.existsSync(OUT)) {
    for (const p of JSON.parse(fs.readFileSync(OUT, 'utf8')).places || []) {
      if (p.lat != null) cache[p.query] = { lat: p.lat, lon: p.lon, osm: p.osm, geocodedQuery: p.geocodedQuery };
    }
  }

  const uniq = [...new Set(places.map((p) => p.query))];
  const coords = {};
  let hit = 0, miss = 0, cached = 0;

  for (const q of uniq) {
    if (cache[q]) { coords[q] = cache[q]; cached++; console.log('  快取  ' + q); continue; }
    try {
      await new Promise((r) => setTimeout(r, 1100)); // 遵守 1 req/sec
      const c = await geocode(q);
      if (c) { coords[q] = c; hit++; console.log('  ✓ ' + q + '  →  ' + c.lat + ', ' + c.lon); }
      else { miss++; console.log('  ✗ 查無座標  ' + q); }
    } catch (e) {
      miss++;
      console.log('  ✗ ' + q + '  (' + e.message + ')');
    }
  }

  for (const p of places) Object.assign(p, coords[p.query] || {});

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({
    generatedAt: new Date().toISOString().slice(0, 10),
    source: SRC.replace(/\\/g, '/'),
    attribution: '© OpenStreetMap contributors — 座標由 Nominatim 查詢',
    places,
  }, null, 2) + '\n', 'utf8');

  console.log('\n新查 ' + hit + ' / 沿用快取 ' + cached + ' / 失敗 ' + miss);
  console.log('已寫入 ' + OUT);
})();
