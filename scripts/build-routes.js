/* 依交通方式產生地圖上的移動路線，寫入 docs/map/routes.json
 *
 * 為什麼需要這支腳本：
 *   地圖原本只把當天的地點依時間用直線連起來。Day 1 關西機場 → 新今宮、
 *   Day 8 京都 → 關西機場 的直線會橫跨大阪灣；Day 3 姬路 → 神戶 的直線則從山上
 *   切過去，和實際沿海岸走的 JR 差了十幾公里。
 *
 * 哪一段搭什麼車、在哪站上下車，寫在 data/routes.json；本腳本負責把它變成座標：
 *   - 鐵路／地鐵：抓 OpenStreetMap 上「該班次」的 route relation
 *     （例如「空港急行 (関西空港 => なんば)」），用它的軌道建圖，
 *     在上下車站之間找最短路 —— 畫出來就是列車實際走的軌道
 *   - 步行：OSRM 步行路徑（routing.openstreetmap.de，openstreetmap.org 的導航也用它）
 *   - 起訖點與車站之間、轉乘的兩站之間，會自動補上步行
 *
 * 沒有在 data/routes.json 定義的天數，地圖維持原本的虛線直線。
 * 有定義的天數，每一段都必須定義；少一段會直接報錯，避免路線默默斷掉。
 *
 * 用法：
 *   node scripts/build-routes.js            沿用已算過的路段（定義與起訖座標都沒變時）
 *   node scripts/build-routes.js --refresh  全部重算
 *
 * 請遵守公共服務的使用規範：Overpass 與 OSRM 都是志工維運的免費服務，
 * 本腳本每次請求之間都有間隔、帶可識別的 User-Agent，並且會沿用上次的結果。
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const DEF = path.join(ROOT, 'data/routes.json');
const PLACES = path.join(ROOT, 'docs/map/places.json');
const OUT = path.join(ROOT, 'docs/map/routes.json');
/* 抓過的 OSM relation 原始資料存在本機（不進版控），重跑時不必再打 Overpass */
const CACHE_DIR = path.join(ROOT, 'scripts/.cache');
const REFRESH = process.argv.includes('--refresh');

const UA = 'osaka-kyoto-trip-map/1.0 (personal trip planner; github.com/threshadow98171314/osaka-kyoto-trip)';

/* Overpass 主站常常 504，備援站依序嘗試 */
const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const OSRM_FOOT = 'https://routing.openstreetmap.de/routed-foot/route/v1/driving/';

/* 起訖點離車站超過這個距離才補畫步行，太短的畫出來只是一個點 */
const WALK_MIN_M = 120;
/* 步行路徑比直線遠這麼多就不採用。例如關西機場航廈與車站之間有室內連通道，
   OSM 的步行網路沒畫到，OSRM 會繞出 3.4 km 的怪路線；這種情況直接畫直線 */
const WALK_DETOUR_MAX = 3;
const WALK_SPEED = 1.25;   // m/s，約時速 4.5 km，退回直線時用來估時間
/* 路線演算法改版時 +1，舊的快取會自動失效 */
const ALGO_VERSION = 2;
/* 簡化折線的容許誤差（公尺）：縮小檔案，肉眼看不出差別 */
const SIMPLIFY_M = 8;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- 幾何 ---------- */
const R = 6371008.8;
const rad = (d) => (d * Math.PI) / 180;

function dist(a, b) {
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* Douglas–Peucker，距離用局部平面近似（路段不長，誤差可忽略） */
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const lat0 = rad(pts[0][0]);
  const xy = pts.map((p) => [rad(p[1]) * Math.cos(lat0) * R, rad(p[0]) * R]);
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    const [x1, y1] = xy[s];
    const [x2, y2] = xy[e];
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy || 1e-9;
    let far = -1, idx = -1;
    for (let i = s + 1; i < e; i++) {
      const t = Math.max(0, Math.min(1, ((xy[i][0] - x1) * dx + (xy[i][1] - y1) * dy) / len2));
      const d = Math.hypot(xy[i][0] - (x1 + t * dx), xy[i][1] - (y1 + t * dy));
      if (d > far) { far = d; idx = i; }
    }
    if (far > tol) { keep[idx] = 1; stack.push([s, idx], [idx, e]); }
  }
  return pts.filter((_, i) => keep[i]);
}

const round = (p) => [Math.round(p[0] * 1e5) / 1e5, Math.round(p[1] * 1e5) / 1e5];
const lengthOf = (pts) => pts.reduce((a, p, i) => (i ? a + dist(pts[i - 1], p) : 0), 0);

/* ---------- 網路 ---------- */
function request(url, opts, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, Object.assign({ timeout: 150000 }, opts), (res) => {
      let s = '';
      res.on('data', (d) => (s += d));
      res.on('end', () => resolve({ status: res.statusCode, body: s }));
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('timeout')));
    if (body) req.write(body);
    req.end();
  });
}

async function overpass(query) {
  const body = 'data=' + encodeURIComponent(query);
  const post = (ep, timeout) => request(ep, {
    method: 'POST',
    timeout,
    headers: {
      'User-Agent': UA,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
    },
  }, body);

  /* 主站：429（同一 IP 同時請求太多）或 504（伺服器忙）就等一下再試同一台。
     備援站在這個網路環境下常常逾時，放到最後才用 */
  let lastErr;
  for (let i = 0; i < 5; i++) {
    try {
      const r = await post(OVERPASS[0], 120000);
      if (r.status === 200) return JSON.parse(r.body);
      lastErr = new Error(OVERPASS[0] + ' HTTP ' + r.status);
    } catch (e) {
      lastErr = new Error(OVERPASS[0] + ' ' + e.message);
    }
    const wait = 20 * (i + 1);
    console.log('\n    ⟳ ' + lastErr.message + '，' + wait + ' 秒後重試');
    await sleep(wait * 1000);
  }
  for (const ep of OVERPASS.slice(1)) {
    try {
      const r = await post(ep, 90000);
      if (r.status === 200) return JSON.parse(r.body);
      lastErr = new Error(ep + ' HTTP ' + r.status);
    } catch (e) {
      lastErr = new Error(ep + ' ' + e.message);
    }
    console.log('\n    ⟳ ' + lastErr.message + '，換下一個備援站');
  }
  throw lastErr;
}

async function osrmFoot(a, b) {
  const url = OSRM_FOOT + a[1] + ',' + a[0] + ';' + b[1] + ',' + b[0]
    + '?overview=full&geometries=geojson';
  for (let i = 0; i < 3; i++) {
    try {
      const r = await request(url, { headers: { 'User-Agent': UA } });
      if (r.status === 200) {
        const j = JSON.parse(r.body);
        if (j.code === 'Ok' && j.routes && j.routes[0]) {
          return {
            coords: j.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]),
            meters: j.routes[0].distance,
            seconds: j.routes[0].duration,
          };
        }
      }
    } catch (e) { /* 重試 */ }
    await sleep(2000 * (i + 1));
  }
  throw new Error('OSRM 步行路徑查詢失敗：' + a + ' → ' + b);
}

/* ---------- 鐵路：在班次的軌道上找路 ---------- */
const relCache = new Map();

async function loadRelation(id) {
  if (relCache.has(id)) return relCache.get(id);
  const file = path.join(CACHE_DIR, 'relation-' + id + '.json');
  let j;
  if (!REFRESH && fs.existsSync(file)) {
    j = JSON.parse(fs.readFileSync(file, 'utf8'));
  } else {
    await sleep(1500);
    j = await overpass('[out:json][timeout:120];relation(' + id + ')->.r;.r out geom;node(r.r);out;');
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(j));
  }
  const rel = j.elements.find((e) => e.type === 'relation');
  if (!rel) throw new Error('OSM 找不到 relation ' + id);

  const nodeById = new Map(j.elements.filter((e) => e.type === 'node').map((n) => [n.id, n]));
  const stops = rel.members
    .filter((m) => m.type === 'node' && /stop/.test(m.role))
    .map((m) => nodeById.get(m.ref))
    .filter((n) => n && n.tags && n.tags.name)
    .map((n) => ({ name: n.tags.name, at: [n.lat, n.lon] }));
  const ways = rel.members
    .filter((m) => m.type === 'way' && !/platform/.test(m.role) && m.geometry)
    .map((m) => m.geometry.map((g) => [g.lat, g.lon]));

  const data = { id, name: rel.tags.name, stops, ways };
  relCache.set(id, data);
  return data;
}

/* 用軌道的 way 建無向圖；相鄰 way 若沒有共用節點（OSM 偶有小縫），30m 內自動接起來 */
function buildGraph(ways) {
  const key = (p) => p[0].toFixed(7) + ',' + p[1].toFixed(7);
  const coords = new Map();
  const adj = new Map();
  const link = (a, b) => {
    const ka = key(a), kb = key(b);
    if (ka === kb) return;
    coords.set(ka, a); coords.set(kb, b);
    const w = dist(a, b);
    if (!adj.has(ka)) adj.set(ka, []);
    if (!adj.has(kb)) adj.set(kb, []);
    adj.get(ka).push([kb, w]);
    adj.get(kb).push([ka, w]);
  };
  ways.forEach((w) => { for (let i = 1; i < w.length; i++) link(w[i - 1], w[i]); });

  const deg = new Map();
  ways.forEach((w) => [w[0], w[w.length - 1]].forEach((p) => {
    const k = key(p); deg.set(k, (adj.get(k) || []).length);
  }));
  const all = [...coords.entries()];
  for (const [k, d] of deg) {
    if (d > 1) continue;                       // 已經接上別的 way
    const p = coords.get(k);
    let best = null, bd = 30;
    for (const [k2, p2] of all) {
      if (k2 === k || (adj.get(k) || []).some((e) => e[0] === k2)) continue;
      const dd = dist(p, p2);
      if (dd < bd) { bd = dd; best = p2; }
    }
    if (best) link(p, best);
  }
  return { coords, adj, key };
}

function nearestNode(graph, p) {
  let best = null, bd = Infinity;
  for (const [k, c] of graph.coords) {
    const d = dist(p, c);
    if (d < bd) { bd = d; best = k; }
  }
  return { key: best, meters: bd };
}

function shortestPath(graph, from, to) {
  const d = new Map([[from, 0]]);
  const prev = new Map();
  const heap = [[0, from]];
  const push = (x) => {
    heap.push(x);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  while (heap.length) {
    const [du, u] = pop();
    if (u === to) break;
    if (du > (d.get(u) ?? Infinity)) continue;
    for (const [v, w] of graph.adj.get(u) || []) {
      const nd = du + w;
      if (nd < (d.get(v) ?? Infinity)) { d.set(v, nd); prev.set(v, u); push([nd, v]); }
    }
  }
  if (!d.has(to)) return null;
  const out = [];
  for (let u = to; u; u = prev.get(u)) out.push(graph.coords.get(u));
  return out.reverse();
}

function findStop(rel, name) {
  const s = rel.stops.find((x) => x.name === name)
    || rel.stops.find((x) => x.name.replace(/駅$/, '') === name.replace(/駅$/, ''));
  if (!s) {
    throw new Error('relation ' + rel.id + '（' + rel.name + '）沒有「' + name + '」這一站。'
      + '可用的站：' + rel.stops.map((x) => x.name).join('、'));
  }
  return s;
}

async function railLeg(leg) {
  const rel = await loadRelation(leg.relation);
  const board = findStop(rel, leg.board);
  const alight = findStop(rel, leg.alight);
  const g = buildGraph(rel.ways);
  const a = nearestNode(g, board.at);
  const b = nearestNode(g, alight.at);
  if (a.meters > 400 || b.meters > 400) {
    throw new Error(rel.name + '：車站離軌道太遠（' + Math.round(a.meters) + 'm / '
      + Math.round(b.meters) + 'm），relation 資料可能不完整');
  }
  const p = shortestPath(g, a.key, b.key);
  if (!p) throw new Error(rel.name + '：' + leg.board + ' → ' + leg.alight + ' 之間的軌道不連通');
  return {
    board: board.at,
    alight: alight.at,
    coords: p,
    meters: lengthOf(p),
    service: rel.name,
  };
}

/* ---------- 主流程 ---------- */
function dayPoints(places, day) {
  const pts = places
    .filter((p) => String(p.day) === String(day) && p.time && p.lat != null)   // places.json 的 day 是數字
    .map((p, i) => ({ p, i }))
    .sort((a, b) => a.p.time.localeCompare(b.p.time) || a.i - b.i)   // 與地圖排序一致
    .map((x) => x.p);
  // 同一個座標連續出現（例如「步行到姬路城」和「參觀姬路城」）只算一次
  return pts.filter((p, i) => i === 0 || p.lat !== pts[i - 1].lat || p.lon !== pts[i - 1].lon);
}

const walkLabel = (m, s) => '步行 約 ' + Math.max(1, Math.round(s / 60)) + ' 分鐘（' + (m >= 1000 ? (m / 1000).toFixed(1) + ' km' : Math.round(m) + ' m') + '）';

async function buildSegment(seg, A, B) {
  const legs = [];
  let cursor = [A.lat, A.lon];
  const end = [B.lat, B.lon];

  const walkTo = async (to) => {
    if (dist(cursor, to) < WALK_MIN_M) { cursor = to; return; }
    await sleep(1200);
    let w = await osrmFoot(cursor, to);
    const straight = dist(cursor, to);
    if (w.meters > Math.max(straight * WALK_DETOUR_MAX, straight + 800)) {
      w = { coords: [cursor, to], meters: straight, seconds: straight / WALK_SPEED };
    }
    legs.push({ mode: 'walk', label: walkLabel(w.meters, w.seconds), coords: w.coords, meters: w.meters });
    cursor = to;
  };

  for (const leg of seg.legs) {
    if (leg.mode === 'walk') {
      await walkTo(end);
    } else if (leg.mode === 'rail' || leg.mode === 'subway') {
      const r = await railLeg(leg);
      await walkTo(r.board);
      legs.push({
        mode: leg.mode,
        label: (leg.label || r.service) + '｜' + leg.board + ' → ' + leg.alight,
        coords: r.coords,
        meters: r.meters,
      });
      cursor = r.alight;
    } else {
      throw new Error('不支援的交通方式：' + leg.mode);
    }
  }
  await walkTo(end);

  return legs.map((l) => Object.assign(l, {
    coords: simplify(l.coords, SIMPLIFY_M).map(round),
    meters: Math.round(l.meters),
  }));
}

(async () => {
  const def = JSON.parse(fs.readFileSync(DEF, 'utf8'));
  const places = JSON.parse(fs.readFileSync(PLACES, 'utf8')).places;

  let prev = {};
  if (!REFRESH && fs.existsSync(OUT)) {
    const old = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    for (const d of Object.values(old.days || {})) for (const s of d) prev[s.key] = s;
  }

  const days = {};
  let built = 0, reused = 0;

  for (const day of Object.keys(def.days).sort()) {
    const pts = dayPoints(places, day);
    const segs = def.days[day];
    days[day] = [];

    for (let i = 1; i < pts.length; i++) {
      const A = pts[i - 1], B = pts[i];
      const seg = segs.find((s) => s.from === A.query && s.to === B.query);
      if (!seg) {
        throw new Error('Day ' + day + ' 缺少路段定義：\n  "from": ' + JSON.stringify(A.query)
          + ',\n  "to":   ' + JSON.stringify(B.query) + '\n請在 data/routes.json 補上。');
      }
      const key = crypto.createHash('sha1')
        .update(JSON.stringify([ALGO_VERSION, seg, A.lat, A.lon, B.lat, B.lon])).digest('hex').slice(0, 12);

      if (prev[key]) {
        days[day].push(prev[key]);
        reused++;
        continue;
      }
      process.stdout.write('  Day ' + day + '  ' + A.query + ' → ' + B.query + ' … ');
      const legs = await buildSegment(seg, A, B);
      days[day].push({ key, from: A.query, to: B.query, legs });
      built++;
      console.log(legs.map((l) => l.mode + ' ' + (l.meters / 1000).toFixed(1) + 'km').join(' + '));
    }

    const unused = segs.filter((s) => !days[day].some((x) => x.from === s.from && x.to === s.to));
    unused.forEach((s) => console.log('  ⚠ Day ' + day + ' 的路段定義沒被用到（地點或時間可能改了）：' + s.from + ' → ' + s.to));
  }

  fs.writeFileSync(OUT, JSON.stringify({
    generatedAt: new Date().toISOString().slice(0, 10),
    source: 'data/routes.json',
    attribution: '© OpenStreetMap contributors — 鐵路軌道取自 OSM route relation，步行路徑由 OSRM 計算',
    days,
  }) + '\n', 'utf8');

  console.log('\n路線：新算 ' + built + ' 段 / 沿用 ' + reused + ' 段，已寫入 ' + path.relative(ROOT, OUT));
})().catch((e) => {
  console.error('\n✗ ' + e.message);
  process.exit(1);
});
