/* 由 scripts/fetch-hero-photos.js 產生，請勿手動編輯 */
/* 照片來源：Wikimedia Commons，皆為自由授權、近五年拍攝，作者與授權標示於頁首下方 */
(function (global) {
  'use strict';

  var PHOTOS = [
    {
      "file": "osaka-castle.jpg",
      "caption": "大阪城天守閣",
      "author": "Don Ramey Logan",
      "license": "CC BY 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Osaka_Castle_2_Osaka_Japan_by_Don_Ramey_Logan.jpg"
    },
    {
      "file": "dotonbori.jpg",
      "caption": "道頓堀",
      "author": "Sakai Yayoi",
      "license": "CC0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Osaka_Dotonbori_yoru.jpg"
    },
    {
      "file": "umeda.jpg",
      "caption": "梅田藍天大廈",
      "author": "掬茶",
      "license": "CC BY-SA 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Worm%27s-eye_view_of_the_Umeda_Sky_Building_at_night_20250830.jpg"
    },
    {
      "file": "tsutenkaku.jpg",
      "caption": "新世界 通天閣",
      "author": "Sakai Yayoi",
      "license": "CC0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Shinsekai_and_Tsutenkaku_Tower.jpg"
    },
    {
      "file": "nakanoshima.jpg",
      "caption": "大阪 中之島",
      "author": "掬茶",
      "license": "CC BY-SA 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Cityscapes_of_Nakanoshima,_Osaka_from_Sendannoki_Bridge_20250831.jpg"
    },
    {
      "file": "abeno-harukas.jpg",
      "caption": "阿倍野 HARUKAS 與四天王寺",
      "author": "Laitche",
      "license": "CC BY-SA 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:View_of_Abeno_Harukas_and_Shitenn%C5%8D-ji_five-storied_pagoda_at_dusk,_January_2024_(clone_version)_-_9978.jpg"
    },
    {
      "file": "kobe-port.jpg",
      "caption": "神戶港 美利堅公園",
      "author": "Naokijp",
      "license": "CC BY-SA 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:2022_Kobe_Meriken_Park_001.jpg"
    },
    {
      "file": "nankinmachi.jpg",
      "caption": "神戶 南京町",
      "author": "inunami",
      "license": "CC BY 2.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Kobe_Nankinmachi_20221209.jpg"
    },
    {
      "file": "himeji-castle.jpg",
      "caption": "姬路城",
      "author": "Yasuo Hamashima",
      "license": "CC BY-SA 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Himeji_castle_20241025-_YAS2703.jpg"
    },
    {
      "file": "todaiji.jpg",
      "caption": "奈良 東大寺",
      "author": "Zairon",
      "license": "CC BY 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Nara_Todai-ji_Daibutsuden_Exterior_South_Side_09.jpg"
    },
    {
      "file": "nara-deer.jpg",
      "caption": "奈良公園 鹿",
      "author": "Daniel Lu (User:dllu)",
      "license": "CC BY-SA 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Sika_deer_doe_and_fawn_Nara_2026_dllu.jpg"
    },
    {
      "file": "kasuga-taisha.jpg",
      "caption": "奈良 春日大社",
      "author": "Zairon",
      "license": "CC BY 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Nara_Kasuga-taisha_Main_Sanctuary_Cloister_Lanterns_1.jpg"
    },
    {
      "file": "kiyomizudera.jpg",
      "caption": "清水寺",
      "author": "Suicasmo",
      "license": "CC BY-SA 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Main_Hall,_Kiyomizu-dera_20211123-1.jpg"
    },
    {
      "file": "yasaka-pagoda.jpg",
      "caption": "八坂塔",
      "author": "Suicasmo",
      "license": "CC BY-SA 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Yasaka_no_T%C5%8D_20211123-2.jpg"
    },
    {
      "file": "fushimi-inari.jpg",
      "caption": "伏見稻荷大社 千本鳥居",
      "author": "lumoplank",
      "license": "CC0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Fushimi_Inari_Taisha-_Part_II_-_FushimiInari243.jpg"
    },
    {
      "file": "kinkakuji.jpg",
      "caption": "金閣寺（鹿苑寺）",
      "author": "Nacaru",
      "license": "CC BY-SA 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Golden_Pavilion_Kinkaku-ji_2024.jpg"
    },
    {
      "file": "nishiki.jpg",
      "caption": "京都 錦市場",
      "author": "Nesnad",
      "license": "CC BY 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Nishiki_market_-_Dec_31_2021_various_18_22_46_950000.jpeg"
    },
    {
      "file": "togetsukyo.jpg",
      "caption": "嵐山 渡月橋",
      "author": "Hyppolyte de Saint-Rambert",
      "license": "CC BY 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Kyoto_Togetsukyo_hdsr_2024_S5_01.jpg"
    },
    {
      "file": "arashiyama.jpg",
      "caption": "嵐山 竹林之道",
      "author": "Jakub Hałun",
      "license": "CC BY 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Sagano_Bamboo_forest,_Kyoto,_20240818_1730_4584.jpg"
    },
    {
      "file": "byodoin.jpg",
      "caption": "宇治 平等院鳳凰堂",
      "author": "Hyppolyte de Saint-Rambert",
      "license": "CC BY 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:By%C5%8Dd%C5%8D-in_(UJI,_Kyoto)_hdsr_Pond_S5_1.jpg"
    },
    {
      "file": "kamogawa.jpg",
      "caption": "京都 鴨川",
      "author": "Joli Rumi",
      "license": "CC BY-SA 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Kamo_River,_Kyoto,_Japan.jpg"
    },
    {
      "file": "gion.jpg",
      "caption": "京都 祇園",
      "author": "lumoplank",
      "license": "CC0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Streets_of_Gion,_Kyoto_-_Gion7709.jpg"
    },
    {
      "file": "pontocho.jpg",
      "caption": "先斗町",
      "author": "Sergiy Galyonkin from Raleigh, USA",
      "license": "CC BY-SA 2.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Pontocho_Alley,_Kyoto_(52406856003).jpg"
    },
    {
      "file": "kyoto-tower.jpg",
      "caption": "京都塔",
      "author": "Jakub Hałun",
      "license": "CC BY 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Kyoto_Tower_seen_from_Kyoto_Station,_20240820_1405_5116.jpg"
    }
  ];

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
