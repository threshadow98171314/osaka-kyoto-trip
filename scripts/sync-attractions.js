/* 用 data/attractions.json 重新產生 docs/selector/attractions.html 裡的 `const attractions = [ … ]`。
 *
 * 為什麼需要這支腳本：
 *   景點資料同時存在 JSON 與選擇器的內嵌陣列兩份，以前各改各的，
 *   分岔到出現重複項目、同一個景點兩邊地址不同。現在 JSON 是唯一來源，
 *   改完 JSON 後執行一次，再跑 sync-counts.js 同步首頁筆數：
 *
 *   node scripts/sync-attractions.js
 *   node scripts/sync-counts.js
 *
 * 陣列沿用原本的單行格式（Python json.dumps 風格：", " 與 ": "），diff 才不會整段翻掉。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const jsonPath = path.join(ROOT, 'data/attractions.json');
const htmlPath = path.join(ROOT, 'docs/selector/attractions.html');

const list = JSON.parse(fs.readFileSync(jsonPath, 'utf8')).attractions;

const ids = new Set();
list.forEach((a) => {
  if (ids.has(a.id)) throw new Error('data/attractions.json 有重複的 id：' + a.id);
  ids.add(a.id);
});

const py = (v) => Array.isArray(v) ? '[' + v.map(py).join(', ') + ']'
  : (v && typeof v === 'object') ? '{' + Object.keys(v).map((k) => JSON.stringify(k) + ': ' + py(v[k])).join(', ') + '}'
    : JSON.stringify(v);

let html = fs.readFileSync(htmlPath, 'utf8');
const decl = 'const attractions = [';
const at = html.indexOf(decl);
if (at === -1) throw new Error('attractions.html 找不到 ' + decl);

const from = html.indexOf('[', at);
let depth = 0;
let to = -1;
for (let i = from; i < html.length; i++) {
  if (html[i] === '[') depth++;
  else if (html[i] === ']') { depth--; if (depth === 0) { to = i + 1; break; } }
}
if (to === -1) throw new Error('attractions.html 的 attractions 陣列沒有結尾');

const next = html.slice(0, from) + py(list) + html.slice(to);
if (next === html) {
  console.log('・attractions.html 已與 data/attractions.json 一致（' + list.length + ' 筆）');
} else {
  fs.writeFileSync(htmlPath, next, 'utf8');
  console.log('✓ attractions.html 已由 data/attractions.json 重新產生（' + list.length + ' 筆）');
}
