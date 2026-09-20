/* 把首頁上「景點選擇器 / 美食選擇器」的筆數，同步成選擇器裡實際的資料筆數。
 *
 * 為什麼需要這支腳本：
 *   筆數原本是手寫在 docs/index.html 的 badge 裡，資料加了卻沒人記得改，
 *   曾經出現美食實際有 63 筆、首頁還寫 37 筆的情況。
 *   改完 attractions / foods 陣列後執行一次即可。
 *
 *   node scripts/sync-counts.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/* 從選擇器 HTML 裡把 `const <name> = [ … ]` 整段括出來並算長度 */
function countEntries(file, varName) {
  const src = fs.readFileSync(file, 'utf8');
  const decl = 'const ' + varName + ' = [';
  const at = src.indexOf(decl);
  if (at === -1) throw new Error(file + ' 找不到 ' + decl);

  let depth = 0;
  const from = src.indexOf('[', at);
  let to = -1;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) { to = i; break; } }
  }
  if (to === -1) throw new Error(file + ' 的 ' + varName + ' 陣列沒有結尾');

  const arr = JSON.parse(src.slice(from, to + 1));
  return arr.length;
}

const targets = [
  { file: 'docs/selector/attractions.html', varName: 'attractions', href: 'selector/attractions.html' },
  { file: 'docs/selector/foods.html', varName: 'foods', href: 'selector/foods.html' },
];

const indexPath = path.join(ROOT, 'docs/index.html');
let index = fs.readFileSync(indexPath, 'utf8');
let changed = 0;

targets.forEach((t) => {
  const n = countEntries(path.join(ROOT, t.file), t.varName);

  // 找到那張卡片的 badge：<a … href="selector/foods.html"> … <span class="badge tool">37 筆</span>
  const re = new RegExp(
    '(href="' + t.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[\\s\\S]{0,400}?<span class="badge tool">)(\\d+)( 筆</span>)'
  );
  const m = index.match(re);
  if (!m) throw new Error('docs/index.html 找不到 ' + t.href + ' 的筆數 badge');

  if (+m[2] !== n) {
    index = index.replace(re, '$1' + n + '$3');
    changed++;
    console.log('✓ ' + t.href + '：' + m[2] + ' 筆 → ' + n + ' 筆');
  } else {
    console.log('・' + t.href + '：' + n + ' 筆（已同步）');
  }
});

if (changed) {
  fs.writeFileSync(indexPath, index, 'utf8');
  console.log('已更新 docs/index.html');
} else {
  console.log('沒有需要更新的筆數');
}
