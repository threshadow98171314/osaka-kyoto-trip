/* 由 scripts/fetch-hero-photos.js 產生，請勿手動編輯 */
/* 照片來源：Wikimedia Commons，皆為自由授權，作者與授權標示於頁面右下角 */
(function (global) {
  'use strict';

  var PHOTOS = [
    {
      "file": "osaka-castle.jpg",
      "caption": "大阪城天守閣",
      "author": "663highland",
      "license": "CC BY 2.5",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Osaka_Castle_02bs3200.jpg"
    },
    {
      "file": "dotonbori.jpg",
      "caption": "道頓堀",
      "author": "Martin Falbisoner",
      "license": "CC BY-SA 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Dotonbori,_Osaka,_at_night,_November_2016.jpg"
    },
    {
      "file": "kiyomizudera.jpg",
      "caption": "清水寺",
      "author": "Oilstreet",
      "license": "CC BY 2.5",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Kiyomizu-dera_in_Kyoto-r.jpg"
    },
    {
      "file": "fushimi-inari.jpg",
      "caption": "伏見稻荷大社 千本鳥居",
      "author": "Jason Zhang",
      "license": "CC BY-SA 3.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Fushimi_Inari-taisha_senbon-torii,_August_2019.jpg"
    },
    {
      "file": "kinkakuji.jpg",
      "caption": "金閣寺（鹿苑寺）",
      "author": "Martin Falbisoner",
      "license": "CC BY-SA 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Kinkaku-ji_in_November_2016_-02.jpg"
    },
    {
      "file": "arashiyama.jpg",
      "caption": "嵐山 竹林之道",
      "author": "Mitchwandrew",
      "license": "CC BY 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Arashiyama_Bamboo_Grove.jpg"
    },
    {
      "file": "himeji-castle.jpg",
      "caption": "姬路城",
      "author": "by ja:User:Reggaeman",
      "license": "Public domain",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Himeji_Castle_The_Keep_Towers.jpg"
    },
    {
      "file": "todaiji.jpg",
      "caption": "奈良 東大寺",
      "author": "Martin Falbisoner",
      "license": "CC BY-SA 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:The_Great_Buddha_Hall_of_T%C5%8Ddai-ji,_Nara,_November_2016.jpg"
    },
    {
      "file": "byodoin.jpg",
      "caption": "宇治 平等院鳳凰堂",
      "author": "663highland",
      "license": "CC BY 2.5",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Byodo-in_Uji03bs2640.jpg"
    },
    {
      "file": "nara-deer.jpg",
      "caption": "奈良公園 鹿",
      "author": "Christophe95",
      "license": "CC BY-SA 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Deer_in_Nara_Park.jpg"
    },
    {
      "file": "kamogawa.jpg",
      "caption": "京都 鴨川",
      "author": "Tomomarusan",
      "license": "CC BY 2.5",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:Kamo_River_Kyoto.jpg"
    },
    {
      "file": "umeda-night.jpg",
      "caption": "大阪 梅田夜景",
      "author": "Jakub Hałun",
      "license": "CC BY-SA 4.0",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:20100715_Osaka_Umeda_Sky_Building_escalator_1855.jpg"
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
