# CLAUDE.md

本檔案提供給 Claude Code (claude.ai/code) 在本 repository 工作時的指引。

本 repository 的所有文件必須使用繁體中文撰寫。

## 重要原則

### 資訊正確性
- 所有旅遊資訊（票價、時間、開放時間等）必須有原始參考來源
- 旅遊資料具有時效性，資訊可能過時，請在引用前驗證
- 重要數據（票價、交通費用、營業時間）應交叉比對多個來源
- **嚴禁自行臆測**：嚴禁根據自身知識儲備直接回答景點、美食、交通等資訊。所有資訊必須透過 web search 查證後再提供，確保準確性與時效性

### 參考來源要求
- 每個事實性資訊（票價、時刻表、地址等）必須標註來源
- 使用爬蟲抓取網頁後，存入 `reference/` 目錄作為備份
- 在文件末尾加入「參考來源」章節，列出所有引用的 URL

### 資料更新流程
1. 發現新資訊時，先用爬蟲抓取原始頁面存入 `reference/`
2. 驗證資訊是否與現有資料衝突
3. 更新主要文件時保留參考連結

### 行程選擇階段原則
- 目前仍處於「選擇行程」階段，尚未進入「詳細規劃」階段
- 不要過早擬定「第幾天去哪裡」的具體時間表
- 優先收集候選景點、美食、活動等選項，再逐步篩選整合

## 概述

這是一個關西之旅的個人旅遊規劃 repository。

**實際行程：2026年9月26日（六）～10月3日（六），8天7夜**，路線為大阪 → 神戶／姬路 → 奈良 → 京都，含已預約的固定行程（Mouriya 神戶牛、teamLab Biovortex、任天堂博物館、敘敘苑）。

> ⚠️ 舊版的 `大阪京都七天.html`（7天6夜、10月中旬賞楓版）與實際行程不符，已於 2026-09-20 刪除。
> **唯一正式行程為 `docs/final/index.html`。**

## 主要檔案

### 網站入口 docs/
- `docs/index.html` - 網站首頁（GitHub Pages 根路徑）
- `docs/final/index.html` - **正式行程表**（逐日時間軸）
- `docs/final/styles.css` - 行程表樣式（含深色模式）
- `docs/final/sw.js` / `manifest.json` / `icon.svg` - PWA，讓行程可離線閱讀
- `docs/map/index.html` - **行程地圖**（Leaflet + OpenStreetMap）
- `docs/map/places.json` - 地圖資料，**由腳本產生，不要手動編輯**
- `docs/budget/index.html` - **預算追蹤**（依 Day 分開記帳）
- `docs/checklist/index.html` - **行前 Check List**
- `docs/assets/base.css` - 預算與 Check List 共用樣式
- `docs/assets/hero/` - 頁首背景照片，**由腳本產生，不要手動編輯**

> **每個頁面都必須有回首頁的連結。** 行程表、地圖、預算、Check List 在頂部工具列；選擇器在頁首與頁尾。

### 頁首背景照片 docs/assets/hero/
- 來源：**Wikimedia Commons，僅收自由授權**（CC0／PD／CC-BY／CC-BY-SA），作者與授權標示於頁首下方
- 每次載入隨機挑一張；`object-fit: cover` 讓直式照片也能適應手機與桌機
- 照片上方壓一層暗色漸層罩，確保白字在任何照片上都可讀
- 照片未載入或離線時，頁首自動退回原本的漸層底色

```bash
node scripts/fetch-hero-photos.js   # 重新抓圖並產生 hero.js 與 credits.json
```
`WANTED` 陣列可調整地標清單；`FREE` 正規表示式把關授權，**不要放寬**。

### 預算追蹤 docs/budget/
- 依 Day1～Day8 分別記帳，每天有交通／餐飲／門票／購物／其他五類
- 另有「共同支出」區（機票、住宿、交通票券、保險、網路）
- 行程表中<b>已查證的門票</b>寫死在 `DAYS[].fixed`，自動計入當日小計；**改動票價時這裡要一併更新**
- 資料存於 localStorage `budget2.*`

### 行前 Check List docs/checklist/
- 7 大類 36 項，勾選狀態存於 localStorage `chk.*`
- 內容經 2026-09-20 查證，來源記於 `audit/records/2026-09-20.md`
- 時效性高的項目（免稅制度、入境規定）**出發前需重新查證**

### docs/map/ 行程地圖
- 技術：Leaflet 1.9.4（CDN）+ OpenStreetMap 圖磚，**不需 API key、不需信用卡**
- 網址參數 `?day=N` 可直接開啟某一天；彈窗可跳回行程表（`../final/index.html#day-N`）

**兩種標記必須在視覺上明確區分（請勿合併）**：

| | 行程地點 | 推薦景點 |
|---|---|---|
| 來源 | `places`（行程表） | `recommended`（`data/attractions.json`） |
| 外觀 | 橘色水滴大頭針＋emoji | 青綠小圓點（`必去` 標籤為較大的★） |
| 時間標籤 | 常駐顯示（`.time-tip`），可由「🕐 顯示時間」開關 | 無 |
| 預設 | 顯示 | **隱藏**，由「💡 推薦景點」開關 |
| 圖層 | `layer`（上層，`zIndexOffset: 500`） | `recoLayer`（下層） |

- 視野（`fitBounds`）**只依行程地點計算**，避免被散落各地的推薦景點拉遠
- **移動路線開關**（〰️ 移動路線）：只在單日檢視有作用；路線依「有時間的地點」排序連線，
  因此**每個地點都必須有時間**。若某地點只出現在「今日相關地圖」而沒有對應的時間軸項目，
  它就不會有時間，那天的路線會斷掉或畫不出來 —— 請把 map-link 補回對應的時間軸項目
- **序號**：當天最早的點若是機場，編號從 0 起算（代表抵達／出發點），其餘從 1 開始。
  注意 `makeIcon()` 不可用 `seq ? ...` 判斷，因為 0 在 JS 是 falsy
- 類別開關：景點／美食／交通／住宿／已預約

**資料產生流程**：`docs/final/index.html` 是唯一事實來源。改完行程後執行
```bash
node scripts/build-places.js          # 沿用已查過的座標
node scripts/build-places.js --refresh # 全部重查
```
腳本會解析行程表的地圖連結，透過 OpenStreetMap Nominatim 查經緯度，寫入 `docs/map/places.json`。
Nominatim 對少數地點解析不佳，腳本內 `QUERY_OVERRIDE` 可指定替代查詢字串。
**請遵守 Nominatim 使用規範**：每秒至多 1 次請求、帶可識別的 User-Agent（腳本已處理）。

### docs/final/index.html 功能說明（請勿移除）
- **逐日切換**：`showDay(n)` 一次只顯示一天。初始顯示順序為：網址 `#day-N` > 今天的日期 > 上次瀏覽的日期（localStorage `lastDay`）
- **切換方式**：日期列點擊、鍵盤左右方向鍵、手機左右滑動（橫向位移 >70px 且明顯大於縱向才觸發，避免干擾上下捲動）
- **今日標記**：日期列上「今天」那一格右上角有金色圓點
- **主行程 / 彈性行程**（2026-09-21 起）：每個 `.timeline-item` 都必須有 `.tl-kind` 標示
  - `.is-main` ＋ `主行程`：航班、**所有交通移動**、住宿 check-in/out、5 個已預約項目，
    以及 8 個大景點（大阪城、姬路城、奈良公園、伏見稻荷、平等院、金閣寺、嵐山、清水寺）。左側為實線邊
  - `.is-flex` ＋ `彈性`：其餘餐飲、購物、機動景點。左側為虛線邊，內含方案輪播
  - 目前為 45 主行程 / 16 彈性，**不應有未標示的項目**
- **方案輪播 `.plans`**：方案 A 一律是原訂行程，B／C 為替代方案（共 32 個）
  - 切換方式：圓點、左右箭頭、**區塊內左右滑動**（門檻 40px）
  - **切換方式是 display 顯示／隱藏，不要改回 transform + 量高度。**
    非 active 的方案為 `display:none`，容器高度自然貼合目前那一張。
    曾因為 `initPlans()` 在 `initDay()` 之前執行、當下所有 `.day-section` 都是
    `display:none`，量到的 `offsetHeight` 為 0，導致容器高度被鎖成 0px、內容全被裁掉
  - **頁面層級的日期滑動會略過起點落在 `.plans` 內的手勢**，兩種滑動才不會打架
  - 方案中引用的店家／景點資料一律來自已查證的資料庫（`docs/selector/foods.html` 的
    `foods`、`data/attractions.json`），**不要在方案裡手寫未查證的票價或營業時間**
  - 列印時所有方案會攤平顯示，不會只印出目前那一個
- **複製這天行程**：`copyDay()` 匯出純文字（含日文地名）貼給旅伴；Clipboard API 失敗時退回 `execCommand`
- **日期列置中**：`.day-nav-inner` 用 `width: fit-content` + `margin: 0 auto` 達成寬螢幕置中；`min-width: max-content` 會讓 `justify-content` 失效，**不要改回去**。560px 以下改為靠左並可橫向捲動
  - `.tip.warn` — **會撲空／會關門的警告**（例如木津市場週日公休）
  - `.tip.book` — 需預約、有時限
  - `.tip.near` — 附近推薦、替代方案
  - `.tip.info` — 營業時間、交通等實務資訊
- **日文地名**：`.ja-name` 標註日文寫法，僅在繁中與日文寫法不同時才加；切換狀態存於 localStorage `showJa`；**列印時一律顯示**，方便在當地出示給站務人員
- **主題**：自動／淺色／深色三段循環，存於 localStorage `theme`
- **預算追蹤已移出本頁**，改為獨立的 `docs/budget/`（依 Day 分開記帳，localStorage `budget2.*`）
- **離線**：Service Worker 快取行程本體；字體採非阻塞載入，CDN 失效時退回系統中日文字型
- **地圖連結**：`?q=` 一律使用**明文日文地名**，不要改回 percent-encoding（歷史上曾因編碼轉換導致 17 個連結指向錯誤地點）

### 審核目錄 audit/
- `audit/records/` - 審核記錄（按日期存放）
- `audit/records/2026-05-24.md` - 最新審核記錄
- `audit/verified.md` - 已驗證的資訊
- `audit/discrepancies.md` - 發現的資訊不一致處

### 景點選擇輸出 attraction_selector_output/
- `attraction_selector_output/attractions.csv` - 景點清單 CSV（由 generate.py 產生）

> 產生腳本只有一份，位於 `.claude/skills/attraction-selector/scripts/generate.py`。
> 互動式 HTML 選擇器在 `docs/selector/`（見下方），不在本目錄。

### docs/selector/ -HTML選擇器（GitHub Pages顯示用）
這些 HTML 檔案使用 Tailwind CSS CDN 引入樣式，無需 build step：
- `docs/selector/attractions.html` - 景點選擇器（綠色主題，110 筆）
- `docs/selector/foods.html` - 美食選擇器（橙色主題，63 筆）

> **兩個選擇器已於 2026-09-21 改用 `docs/assets/base.css` 的設計語彙**（同樣的頁首、
> 隨機風景照、工具列與色票），與站內其他頁面一致，並支援深色模式。
> Tailwind 仍用於排版，硬編碼色（`bg-white`、`text-gray-*`）在深色模式下有覆寫。

> ⚠️ **`getTagClass()` 的 key 必須與資料中的實際標籤值一致。**
> 兩個選擇器的標籤集合完全不同，各有各的配色表，不要共用。
> 歷史上曾因 key 寫成 `type-ramen`、`city-osaka` 而與實際值對不上，導致所有標籤變灰。

> 選擇器是出發前在家規劃用的工具，**不需要做離線版本**；依賴 Tailwind CDN 是可接受的取捨。
> 需要離線的是行程表與地圖。
> `candidates.html`（候選清單）已於 2026-09-20 依需求移除。

**attractions.html 功能說明（請勿移除）**：
- 資料來源：景點資料內嵌於 HTML 中的 JavaScript `attractions` 陣列
- 篩選功能：城市（單選）、標籤（多選 AND 邏輯）、免費景點、已選景點、文字搜尋
- 檢視模式：卡片視圖 / 表格視圖，可切換
- 標籤系統：所有標籤都有顏色底色，支援多選（需同時滿足所有選中的標籤）
- 地圖連結：表格檢視有 Google Maps 📍 欄位
- 選擇功能：可勾選景點加入已選清單，支援匯出 JSON / 複製名稱
- localStorage：選擇會自動保存到 localStorage，跨分頁可見
- UI樣式：Tailwind CSS CDN，響應式設計，漸層背景與毛玻璃效果
- 重要：修改 HTML 時請勿移除這些功能的核心 JavaScript 邏輯

**foods.html 功能說明（請勿移除）**：
- 資料來源：美食店家資料內嵌於 HTML 中的 JavaScript `foods` 陣列
- 結構與 attractions.html 類似，便於同步操作
- 篩選功能：地區（單選）、類別標籤（多選 AND 邏輯）、平價、已選、文字搜尋
- 標籤系統：所有標籤都有顏色底色，支援多選（需同時滿足所有選中的標籤）
- 價位標籤：自動判斷平價/中價位/高價位
- 地圖連結：表格檢視有 Google Maps 📍 欄位
- localStorage：選擇會自動保存到 localStorage，跨分頁可見
- UI樣式：Tailwind CSS CDN，響應式設計，暖色漸層背景
- 重要：修改 HTML 時請勿移除這些功能的核心 JavaScript 邏輯

### 資料目錄 data/
- `data/attractions.json` - 景點資料庫

### 參考資料 reference/
- 爬蟲抓取的原始網頁備份（34+ 個檔案）
- 包含交通、美食、景點等各類參考資料

### docs/ 目錄結構
```
docs/
├── 01_overview/          # 概覽
│   ├── 基本資訊.md        # 基本旅遊資訊
│   └── 天氣.md           # 天氣穿搭建議
├── 02_transport/         # 交通
│   ├── 交通票券.md       # ICOCA、JR Pass 等票券
│   ├── 交通總覽.md       # 交通整體說明
│   ├── 京都車站.md       # 京都車站相關
│   ├── 嵐山小火車.md     # 嵐山小火車資訊
│   ├── 大阪車站.md       # 大阪車站相關
│   └── 機場交通.md       # 機場來往交通
├── 03_areas/             # 區域
│   ├── 京都/京都.md      # 京都區域
│   ├── 大阪/大阪.md      # 大阪區域
│   ├── 奈良/奈良.md      # 奈良區域
│   └── 區域總覽.md       # 區域分類總覽
├── 04_attractions/       # 景點
│   ├── 景點總覽.md       # 景點分類總覽
│   ├── 主題分類.md       # 主題性景點分類
│   ├── 秋季賞楓專篇.md   # 秋季賞楓推薦
│   ├── 大阪/             # 大阪景點
│   │   ├── 大阪市中心.md
│   │   ├── 大阪灣.md
│   │   └── 大阪其他.md
│   ├── 京都/             # 京都景點
│   │   ├── 京都經典.md
│   │   ├── 京都秘境.md
│   │   └── 京都文化.md
│   ├── 奈良/奈良景點.md  # 奈良景點
│   └── 關西延伸/         # 關西延伸景點
│       ├── 環球影城.md
│       ├── 動漫.md
│       └── 關西延伸.md
└── 05_food/              # 美食
    ├── 美食總覽.md       # 美食分類總覽
    ├── 伴手禮.md         # 伴手禮推薦
    ├── 大阪/             # 大阪美食
    │   ├── 道頓堀.md
    │   ├── 心齋橋.md
    │   ├── 黑門市場.md
    │   └── 臨空城.md
    ├── 京都/             # 京都美食
    │   ├── 祇園.md
    │   ├── 宇治.md
    │   └── 嵐山.md
    └── 奈良/奈良美食.md  # 奈良美食
```

## 爬蟲工具

爬蟲工具位於 `.claude/skills/web-crawler/`。

> `.venv/` 已從版控移除（原本誤 commit 了 1,306 個檔案，且是 Linux 版無法跨平台）。
> 使用前請自行建立：
> ```bash
> python -m venv .venv
> # Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
> pip install markdownify requests beautifulsoup4
> ```

使用方式：

```bash
python -c "
from pathlib import Path
import sys
sys.path.insert(0, str(Path('.claude/skills/web-crawler/scripts')))
from crawl import WebCrawler
crawler = WebCrawler(output_dir='reference', delay=2)
crawler.crawl_batch(['https://example.com/page1', 'https://example.com/page2'])
"
```

## 參考資料

`reference/` 目錄包含爬蟲抓取的原始參考資料備份（34+ 個檔案），涵蓋交通、美食、景點等各類資訊。

`data/attractions.json` - 景點資料庫 JSON 檔案

## 技能工具

### .claude/skills/
- `attraction-selector/` - 景點篩選工具
- `web-crawler/` - 網頁爬蟲工具
- `fact-check/` - 資訊審核工具

## HTML 選擇器開發原則

### 技術棧
- **Tailwind CSS CDN** - 透過 CDN 引入，無需 build step
- **Vanilla JavaScript** - 不使用框架，保持輕量
- **localStorage** - 用戶端資料持久化

### 開發注意事項
1. 保留所有核心 JavaScript 邏輯（篩選、localStorage、視圖切換）
2. 可自由強化 CSS 樣式（使用 Tailwind 類別或自訂 CSS）
3. 資料結構變更時需同步更新 HTML 中的 JS 陣列
4. 所有 HTML 檔案須相容 GitHub Pages 靜態 hosting

### 檔案位置
- 景點選擇器：`docs/selector/attractions.html`
- 美食選擇器：`docs/selector/foods.html`

## 建置腳本 scripts/
- `scripts/build-places.js` - 從行程表產生地圖資料（見上方「docs/map/ 行程地圖」）