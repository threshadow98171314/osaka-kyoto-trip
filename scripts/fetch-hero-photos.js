#!/usr/bin/env node
/*
 * 從 Wikimedia Commons 抓取行程相關地標的照片，存到 docs/assets/hero/
 * 並產生 docs/assets/hero/credits.json（含作者與授權，供頁面標示出處）。
 *
 *   node scripts/fetch-hero-photos.js
 *
 * 只收「明確標示自由授權」的圖（CC0 / PD / CC-BY / CC-BY-SA）。
 * 抓的是 Commons 產生的縮圖（寬 1600px），不是原始大檔，以控制 repo 體積。
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join('docs', 'assets', 'hero');
const UA = 'osaka-kyoto-trip/1.0 (personal travel itinerary; https://github.com/threshadow98171314/osaka-kyoto-trip)';
/* 1200px 對滿版 hero 已足夠（手機 CSS 寬度多在 430px 以內），再大只是浪費頻寬 */
const WIDTH = 1200;

/* 每個地標先試指定的 Commons 檔名，查不到再用英文關鍵字搜尋
   （Commons 的搜尋索引以英文為主，用中文幾乎搜不到東西） */
const WANTED = [
  { slug: 'osaka-castle',  caption: '大阪城天守閣',         file: 'File:Osaka Castle 02bs3200.jpg',      q: 'Osaka Castle tenshu' },
  { slug: 'dotonbori',     caption: '道頓堀',               file: 'File:Dotonbori at night.jpg',          q: 'Dotonbori Osaka night' },
  { slug: 'kiyomizudera',  caption: '清水寺',               file: 'File:Kiyomizu-dera in Kyoto-r.jpg',    q: 'Kiyomizu-dera Kyoto' },
  { slug: 'fushimi-inari', caption: '伏見稻荷大社 千本鳥居',  file: 'File:Fushimi Inari Taisha Torii.jpg',  q: 'Fushimi Inari senbon torii' },
  { slug: 'kinkakuji',     caption: '金閣寺（鹿苑寺）',       file: 'File:Kinkakuji in Kyoto.jpg',          q: 'Kinkaku-ji golden pavilion' },
  { slug: 'arashiyama',    caption: '嵐山 竹林之道',         file: 'File:Arashiyama Bamboo Grove.jpg',     q: 'Arashiyama bamboo grove Sagano' },
  { slug: 'himeji-castle', caption: '姬路城',               file: 'File:Himeji Castle The Keep Towers.jpg', q: 'Himeji Castle' },
  { slug: 'todaiji',       caption: '奈良 東大寺',           file: 'File:Todai-ji Kon-do.jpg',             q: 'Todai-ji Great Buddha Hall Nara' },
  { slug: 'byodoin',       caption: '宇治 平等院鳳凰堂',      file: 'File:Byodo-in Phoenix Hall.jpg',       q: 'Byodo-in Phoenix Hall Uji' },
  { slug: 'nara-deer',     caption: '奈良公園 鹿',           file: 'File:Deer in Nara Park.jpg',           q: 'Nara Park sika deer' },
  { slug: 'kamogawa',      caption: '京都 鴨川',             file: 'File:Kamo River Kyoto.jpg',            q: 'Kamo River Kyoto' },
  { slug: 'umeda-night',   caption: '大阪 梅田夜景',         file: 'File:Umeda Sky Building from Osaka Station.jpg', q: 'Umeda Sky Building Osaka' },
];

/* 可接受的自由授權；注意要能同時對到 "CC BY-SA 4.0" 與 "Public domain" */
const FREE = /^(cc0|cc[ -]by|pd|public[ -]domain|no restrictions)/i;
const isFree = (lic) => FREE.test(String(lic || '').trim());

async function api(params) {
  const url = 'https://commons.wikimedia.org/w/api.php?origin=*&format=json&' + new URLSearchParams(params);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

/* 指定檔名找不到時，用關鍵字搜尋遞補 */
async function searchFallback(caption) {
  const j = await api({
    action: 'query', generator: 'search', gsrsearch: 'filetype:bitmap ' + caption,
    gsrnamespace: '6', gsrlimit: '5', prop: 'imageinfo',
    iiprop: 'url|extmetadata|size', iiurlwidth: String(WIDTH),
  });
  var pages = j.query && j.query.pages ? Object.values(j.query.pages) : [];
  return pages.filter(function (p) {
    var ii = p.imageinfo && p.imageinfo[0];
    if (!ii || !ii.thumburl) return false;
    if (ii.width < 1200) return false;
    var lic = (ii.extmetadata && ii.extmetadata.LicenseShortName && ii.extmetadata.LicenseShortName.value) || '';
    return isFree(lic);
  });
}

async function infoFor(title) {
  const j = await api({
    action: 'query', titles: title, prop: 'imageinfo',
    iiprop: 'url|extmetadata|size', iiurlwidth: String(WIDTH),
  });
  const pages = j.query && j.query.pages ? Object.values(j.query.pages) : [];
  const p = pages[0];
  if (!p || p.missing !== undefined || !p.imageinfo) return null;
  return p;
}

function meta(page) {
  const ii = page.imageinfo[0];
  const em = ii.extmetadata || {};
  const clean = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return {
    thumburl: ii.thumburl,
    descurl: ii.descriptionurl,
    artist: clean(em.Artist && em.Artist.value) || '未註明',
    license: clean(em.LicenseShortName && em.LicenseShortName.value) || '未註明',
    licenseUrl: clean(em.LicenseUrl && em.LicenseUrl.value),
    title: page.title,
  };
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const credits = [];

  for (const want of WANTED) {
    let page = null;
    try { page = await infoFor(want.file); } catch (e) { /* 下面會走遞補 */ }

    if (!page) {
      console.log('· 指定檔名查無：' + want.file + ' → 改用關鍵字搜尋');
      try {
        const hits = await searchFallback(want.q || want.caption);
        page = hits[0] || null;
      } catch (e) { page = null; }
    }

    if (!page) { console.log('✗ ' + want.slug + '  找不到合適圖片'); continue; }

    const m = meta(page);
    if (!isFree(m.license)) {
      console.log('✗ ' + want.slug + '  授權不符（' + m.license + '）：' + m.title);
      continue;
    }

    const dest = path.join(OUT_DIR, want.slug + '.jpg');
    try {
      const res = await fetch(m.thumburl, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buf);
      credits.push({
        slug: want.slug, caption: want.caption, file: want.slug + '.jpg',
        sourceTitle: m.title, sourceUrl: m.descurl,
        author: m.artist, license: m.license, licenseUrl: m.licenseUrl,
        bytes: buf.length,
      });
      console.log('✓ ' + want.slug.padEnd(16) + (buf.length / 1024).toFixed(0).padStart(5) + ' KB  ' + m.license + '  ' + m.artist.slice(0, 40));
    } catch (e) {
      console.log('✗ ' + want.slug + '  下載失敗：' + e.message);
    }

    await new Promise((r) => setTimeout(r, 400));
  }

  fs.writeFileSync(path.join(OUT_DIR, 'credits.json'),
    JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), source: 'Wikimedia Commons', photos: credits }, null, 2) + '\n', 'utf8');

  /* 產生共用的 hero.js：清單直接內嵌，頁面不必再 fetch，也能被 Service Worker 快取 */
  const list = credits.map((c) => ({
    file: c.file, caption: c.caption,
    author: c.author, license: c.license, sourceUrl: c.sourceUrl,
  }));

  const heroJs = `/* 由 scripts/fetch-hero-photos.js 產生，請勿手動編輯 */
/* 照片來源：Wikimedia Commons，皆為自由授權，作者與授權標示於頁面右下角 */
(function (global) {
  'use strict';

  var PHOTOS = ${JSON.stringify(list, null, 2).split('\n').join('\n  ')};

  /* base 是 hero 圖片資料夾相對於目前頁面的路徑，例如 '../assets/hero/' */
  global.applyHero = function (base) {
    var host = document.querySelector('[data-hero]');
    if (!host || !PHOTOS.length) return;

    var pick = PHOTOS[Math.floor(Math.random() * PHOTOS.length)];

    var img = document.createElement('img');
    img.className = 'hero-img';
    img.alt = '';            // 純裝飾，讀螢幕軟體略過
    img.decoding = 'async';
    img.src = base + pick.file;
    // 圖還沒載完前先不顯示，避免閃一下未套用樣式的畫面
    img.addEventListener('load', function () { img.classList.add('is-loaded'); });

    var credit = document.createElement('a');
    credit.className = 'hero-credit';
    credit.href = pick.sourceUrl;
    credit.target = '_blank';
    credit.rel = 'noopener';
    credit.textContent = pick.caption + '｜' + pick.author + '／' + pick.license;

    host.insertBefore(img, host.firstChild);
    host.appendChild(credit);
  };

  global.HERO_PHOTOS = PHOTOS;
})(window);
`;

  fs.writeFileSync(path.join(OUT_DIR, 'hero.js'), heroJs, 'utf8');

  const total = credits.reduce((s, c) => s + c.bytes, 0);
  console.log('\n成功 ' + credits.length + ' 張，合計 ' + (total / 1024 / 1024).toFixed(1) + ' MB');
  console.log('已產生 credits.json 與 hero.js');
})();
