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
const RECO_SRC = path.join('data', 'attractions.json');
const OUT = path.join('docs', 'map', 'places.json');
const REFRESH = process.argv.includes('--refresh');
const UA = 'osaka-kyoto-trip/1.0 (personal travel itinerary map; https://github.com/threshadow98171314/osaka-kyoto-trip)';

/* Nominatim 對少數地點解析不佳，這裡指定更精確的查法 */
const QUERY_OVERRIDE = {
  // 大丸梅田店 10～13F 已於 2026/4/5 改為 LUCUA SOUTH，行程表只寫店名；
  // 但 Nominatim 用店名查不到，OSM 上這棟還叫「大丸梅田店」（2026-09-22 查），座標相同
  'ポケモンセンターオーサカ': '大丸梅田店',
  '叙々苑 ジェイアール京都伊勢丹店': 'ジェイアール京都伊勢丹',
  'teamLab Biovortex Kyoto': '京都市南区東九条東岩本町',
  // 飯店地址：大阪市浪速区恵美須西3-8-7（Trip.com、Hotels.com 查證，2026-09-21）。
  // 舊值「西成区太子1丁目」在鐵路另一側，差了約 700m，地圖上的步行路線會整個繞錯
  'Apartment Hotel 11 Namba Minami Shin-Imamiya II': '大阪市浪速区恵美須西3丁目',
  'Randor Residential Hotel Kyoto Suites': '京都市南区東九条北松ノ木町',
  '日本橋でんでんタウン 大阪': '日本橋筋商店街 大阪市浪速区',
  '河原町 京都': '河原町通 京都市中京区',
  '鴨川 京都': '鴨川 京都市中京区',
  '神戸ハーバーランド モザイク': '神戸ハーバーランド',
  '南海電鉄 新今宮駅': '新今宮駅',
  // 只查「関西国際空港」會落在島中央的跑道區，離航廈和車站近 2 公里，
  // 地圖上的路線會從跑道上出發。中華航空在第 1 航廈
  '関西国際空港': '関西国際空港 第1ターミナル',
  // 加了空格／店名後綴反而查不到，用店名本身即可命中
  // （OSM 回傳的地址與行程表記載一致：長柄西一丁目、北長狭通一丁目 9 番）
  '天然温泉なにわの湯': 'なにわの湯',
  'モーリヤ三宮店 神戸': 'モーリヤ',

  /* ---- 推薦景點（data/attractions.json）：繁中名稱與日文正式名差異較大者 ---- */
  '哲學之道 京都': '哲学の道 京都',
  '比叡山延曆寺 京都': '延暦寺 大津',
  '天保山摩天輪 大阪': '天保山大観覧車',
  '神戶港塔 関西': '神戸ポートタワー',
  '北野異人館 関西': '北野異人館 神戸',
  '有馬溫泉 関西': '有馬温泉',
  '城崎溫泉 関西': '城崎温泉',
  '倉敷美觀地區 関西': '倉敷美観地区',
  '姬路動物園 関西': '姫路市立動物園',
  '神戶動物王國 関西': '神戸どうぶつ王国',
  '任天堂博物館 京都': 'ニンテンドーミュージアム 宇治',
  '嵐山小火車 京都': 'トロッコ嵯峨駅',
  '京都國際マンガ博物館 京都': '京都国際マンガミュージアム',
  '伊根灣舟屋 京都': '伊根の舟屋',
  '奈良老街 奈良': 'ならまち 奈良',
  '臨空城 Outlets 大阪': 'りんくうプレミアム・アウトレット',
  '心齋橋 PARCO 大阪': '心斎橋PARCO',
  'teamLab 長居植物園 大阪': '長居植物園 大阪',
  '大阪灣格蘭王子大飯店 大阪': 'グランドプリンスホテル大阪ベイ',
  // 2026-09-21 新增的推薦景點
  // 只查「南京町（神戶中華街） 関西」會落到東京，要指定神戶
  '南京町（神戶中華街） 関西': '南京町 神戸市中央区',
  'スパワールド 世界の大温泉 大阪': 'スパワールド',
  // 店名與地址都查不到（京都有好幾個塩屋町），用店門口的路口定位
  'ドン・キホーテ 四条河原町店 京都': '蛸薬師通 河原町',
  // 以下兩筆原本被定位到茨城縣、福島縣（地圖推薦圖層上會跑出關西）
  '姬路城 関西': '姫路城',
  '和服體驗 京都': '祇園 京都市東山区',
  '京都駅ビル 大階段燈飾 京都': '京都駅ビル',
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

      // 標題後面可能接 .tl-tag／.tl-kind／.tl-plan，或直接收尾；
      // 少列一個就會把那個 span 的文字吃進標題裡
      const titleRaw = (item.match(/<span class="tl-title">([\s\S]*?)<\/span>\s*(?:<span class="tl-(?:tag|kind|plan)|<\/div>)/) || [])[1] || '';
      const ja = strip((titleRaw.match(/<span class="ja-name">([\s\S]*?)<\/span>/) || [])[1] || '');
      const title = strip(titleRaw.replace(/<span class="ja-name">[\s\S]*?<\/span>/, ''));

      const tagMatch = item.match(/<span class="tl-tag([^"]*)">([^<]*)<\/span>/);
      // 交通項目沒有 .tl-tag（那會和 .tl-kind 的「交通」重複顯示），改用分類標籤當後備
      const kindMatch = item.match(/<span class="tl-kind[^"]*">([^<]*)<\/span>/);
      const tag = tagMatch ? tagMatch[2].trim() : (kindMatch ? kindMatch[1].trim() : '');
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

/* 繁體漢字 → 日文新字體。OSM 的日本資料用日文漢字，
   「有馬溫泉」查不到但「有馬温泉」查得到。 */
const ZH_TO_JA = {
  '溫': '温', '戶': '戸', '區': '区', '縣': '県', '觀': '観', '國': '国',
  '學': '学', '灣': '湾', '醫': '医', '藝': '芸', '櫻': '桜', '舊': '旧',
  '寶': '宝', '鐵': '鉄', '驛': '駅', '澤': '沢', '濱': '浜', '缽': '鉢',
  '龍': '竜', '藥': '薬', '橫': '横', '嶽': '岳', '團': '団', '廣': '広',
  '劍': '剣', '萬': '万', '歷': '歴', '澀': '渋', '祕': '秘', '眾': '衆',
};

const toJaKanji = (s) => s.replace(/[一-鿿]/g, (c) => ZH_TO_JA[c] || c);

/* 產生由精確到寬鬆的候選查詢字串 */
function queryVariants(query) {
  const out = [];
  const push = (s) => { s = (s || '').trim(); if (s && out.indexOf(s) === -1) out.push(s); };

  push(query);
  push(toJaKanji(query));

  // 去掉括號內的補充說明：「銀閣寺（慈照寺） 京都」→「銀閣寺 京都」
  const noParen = query.replace(/[（(][^）)]*[）)]/g, ' ').replace(/\s+/g, ' ');
  push(noParen);
  push(toJaKanji(noParen));

  // 取括號內的名稱：「美國村（アメリカ村） 大阪」→「アメリカ村 大阪」
  const inner = query.match(/[（(]([^）)]+)[）)]/);
  if (inner) {
    const tail = query.replace(/^.*[）)]/, '').trim();
    push((inner[1] + ' ' + tail).trim());
  }

  // 「新世界・通天閣 大阪」→ 取「・」後段
  if (query.indexOf('・') !== -1) {
    const parts = query.split(' ')[0].split('・');
    const tail = query.split(' ').slice(1).join(' ');
    parts.forEach((p) => { push((p + ' ' + tail).trim()); push(toJaKanji((p + ' ' + tail).trim())); });
  }

  return out;
}

async function geocodeOnce(q) {
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

async function geocode(query) {
  // 有手動指定就只用指定的，不再試其他變體
  if (QUERY_OVERRIDE[query]) return geocodeOnce(QUERY_OVERRIDE[query]);

  const variants = queryVariants(query);
  for (let i = 0; i < variants.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1100)); // 每次請求都要守速率
    const hit = await geocodeOnce(variants[i]);
    if (hit) return hit;
  }
  return null;
}

/* 推薦景點：來自 data/attractions.json，與行程表地點分開呈現 */
function extractRecommended() {
  if (!fs.existsSync(RECO_SRC)) return [];
  const json = JSON.parse(fs.readFileSync(RECO_SRC, 'utf8'));
  return (json.attractions || []).map((a) => ({
    id: a.id,
    name: a.name,
    city: a.city,
    category: a.category || a.area || '',
    features: a.features || '',
    price: a.price || '',
    duration: a.duration || '',
    hours: a.hours || '',
    transport: a.transport || '',
    link: a.link || '',
    tags: a.tags || [],
    // 加上城市可大幅提高 Nominatim 命中率（「清水寺」全日本不只一間）
    query: a.name + ' ' + (a.city === '關西延伸' ? '関西' : a.city),
  }));
}

(async () => {
  const places = extract();
  const recommended = extractRecommended();
  console.log('行程表地點 ' + places.length + ' 個，推薦景點 ' + recommended.length + ' 個\n');

  // 沿用既有座標，避免重複請求
  let cache = {};
  if (!REFRESH && fs.existsSync(OUT)) {
    const prev = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    for (const p of (prev.places || []).concat(prev.recommended || [])) {
      if (p.lat != null) cache[p.query] = { lat: p.lat, lon: p.lon, osm: p.osm, geocodedQuery: p.geocodedQuery };
    }
    // 上次查不到的也記下來，不要每次重試
    for (const q of prev.unresolved || []) cache[q] = null;
  }

  const all = places.concat(recommended);
  const uniq = [...new Set(all.map((p) => p.query))];
  const coords = {};
  const unresolved = [];
  let hit = 0, miss = 0, cached = 0;

  for (const q of uniq) {
    // QUERY_OVERRIDE 改過的地點，舊座標是用舊查詢字串查的，要重查
    // 上次查不到（null）的，加了 override 之後也要重查
    if (QUERY_OVERRIDE[q] && (cache[q] === null || (cache[q] && cache[q].geocodedQuery !== QUERY_OVERRIDE[q]))) delete cache[q];
    if (Object.prototype.hasOwnProperty.call(cache, q)) {
      cached++;
      if (cache[q]) coords[q] = cache[q]; else unresolved.push(q);
      continue;
    }
    try {
      await new Promise((r) => setTimeout(r, 1100)); // 遵守 Nominatim 每秒 1 次
      const c = await geocode(q);
      if (c) { coords[q] = c; hit++; console.log('  ✓ ' + q + '  →  ' + c.lat + ', ' + c.lon); }
      else { miss++; unresolved.push(q); console.log('  ✗ 查無座標  ' + q); }
    } catch (e) {
      miss++;
      unresolved.push(q);
      console.log('  ✗ ' + q + '  (' + e.message + ')');
    }
  }

  for (const p of all) Object.assign(p, coords[p.query] || {});

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({
    generatedAt: new Date().toISOString().slice(0, 10),
    source: SRC.replace(/\\/g, '/'),
    recommendedSource: RECO_SRC.replace(/\\/g, '/'),
    attribution: '© OpenStreetMap contributors — 座標由 Nominatim 查詢',
    places,
    recommended: recommended.filter((r) => r.lat != null),
    unresolved,
  }, null, 2) + '\n', 'utf8');

  console.log('\n新查 ' + hit + ' / 沿用快取 ' + cached + ' / 查無座標 ' + miss);
  console.log('行程表地點 ' + places.filter((p) => p.lat != null).length + '/' + places.length
            + '，推薦景點 ' + recommended.filter((r) => r.lat != null).length + '/' + recommended.length);
  console.log('已寫入 ' + OUT);

  /* 地點座標變了，依交通方式畫的路線也要跟著重算（沒變的路段會沿用，不會重打 API） */
  console.log('\n— 更新移動路線 —');
  const r = require('child_process').spawnSync(process.execPath,
    [path.join(__dirname, 'build-routes.js')].concat(REFRESH ? ['--refresh'] : []),
    { stdio: 'inherit' });
  if (r.status !== 0) {
    console.log('⚠ 路線沒有更新成功（places.json 已寫入）。可稍後單獨執行 node scripts/build-routes.js');
  }
})();
