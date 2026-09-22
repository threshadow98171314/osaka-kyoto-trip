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

### 行程動線原則（2026-09-22 使用者明確要求）
- 改任何時間表前，先把當天地點按順序排一遍，確認是**單向掃過**（例如由北往南、由西往東），
  **同一區域不可去了又回**。Day 6 曾排成「北野天滿宮 → 金閣寺 → 回北野天滿宮」，被使用者指為低級錯誤：
  出國時間很寶貴，每一段多餘的交通都是浪費
- 使用者說「X 優先」時，只排 X 的**核心場次**；附屬儀式如果會造成折返就不排
- 新增一個點前先算交通成本：順路（在原本就要走的路線上）或值得專程才加，並在卡片上寫明代價與不去的走法

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
- `docs/map/spot.html` - 單一景點的建議順路小地圖（`?id=arashiyama`，嵌在行程表卡片裡用 `&embed=1`）
- `docs/budget/index.html` - **預算追蹤**（依 Day 分開記帳）
- `docs/checklist/index.html` - **行前 Check List**
- `docs/assets/base.css` - 預算與 Check List 共用樣式
- `docs/assets/hero/` - 頁首背景照片，**由腳本產生，不要手動編輯**

> **每個頁面都必須有回首頁的連結。** 行程表、地圖、預算、Check List 在頂部工具列；選擇器在頁首與頁尾。

### 頁首背景照片 docs/assets/hero/
- 來源：**Wikimedia Commons，僅收自由授權**（CC0／PD／CC-BY／CC-BY-SA），作者與授權標示於頁首下方
- **24 張，全部是行程會經過的地方**；每次載入隨機挑一張
- **選圖標準（2026-09-21 起，不要放寬）**：
  1. 自由授權（`FREE` 正規表示式把關）
  2. **EXIF 拍攝日期在 `TAKEN_AFTER`（2021-09-21）之後**，也就是近五年。
     上傳日期不算數 —— 很多舊照片是好幾年後才上傳的（原本 12 張有 11 張拍於 2002～2019 年）
  3. **原圖寬 ≥ 3000px 的橫式照片**。頁首是滿版、但只有約 200～250px 高的橫幅，
     直式照片會被裁成一條細縫
- 下載寬度 1920px（Wikimedia 的標準縮圖寬度之一，非標準寬度會被限流），1080p 螢幕不必放大
- 照片上方壓一層暗色漸層罩，確保白字在任何照片上都可讀；**太暗的夜景會被罩得幾乎全黑**，挑圖時要考慮
- 照片未載入或離線時，頁首自動退回原本的漸層底色

```bash
node scripts/fetch-hero-photos.js --candidates   # 依標準搜尋候選，產生 scripts/.cache/hero-candidates.html
node scripts/fetch-hero-photos.js                # 下載 WANTED 裡 pick 指定的照片，產生 hero.js 與 credits.json
```
- **一定要用眼睛看過再填 `pick`**，搜尋結果會混進同名的別處：
  搜「Byodo-In」會出現夏威夷的平等院複製品、搜「Yasaka Pagoda」會出現東大阪同名的法觀寺
- 下載時會刪掉已不在清單上的舊照片；**一張都沒下載成功時不會動既有檔案**

### 預算追蹤 docs/budget/
- 依 Day1～Day8 分別記帳，每天有交通／餐飲／門票／購物／其他五類
- 另有「共同支出」區（機票、住宿、交通票券、保險、網路）
- 行程表中<b>已查證的門票</b>寫死在 `DAYS[].fixed`，自動計入當日小計；**改動票價時這裡要一併更新**
- 資料存於 localStorage `budget2.*`

### 行前 Check List docs/checklist/
- 7 大類 37 項，勾選狀態存於 localStorage `chk.*`
- **HARUKA 單程優惠票**（10/3 回程）必須在出國前買，在日本買不到 —— 已列入「可考慮加訂」
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

- 視野（`fitBounds`）**只依行程地點（與當天實際路線）計算**，避免被散落各地的推薦景點拉遠
- **移動路線開關**（〰️ 移動路線）：只在單日檢視有作用；路線依「有時間的地點」排序連線，
  因此**每個地點都必須有時間**。若某地點只出現在「今日相關地圖」而沒有對應的時間軸項目，
  它就不會有時間，那天的路線會斷掉或畫不出來 —— 請把 map-link 補回對應的時間軸項目
- **依交通方式的實際路線**（2026-09-21 起）：直線連線會把 Day 1 關西機場 → 新今宮、
  Day 8 京都 → 關西機場 畫成橫跨大阪灣，Day 3 姬路 → 神戶 則從山上切過去、偏離實際沿海的 JR
  十幾公里。這幾天改畫實際路線：
  - 鐵路／地鐵沿著 **OpenStreetMap 上該班次的 route relation** 的軌道畫（例如「空港急行 (関西空港 => なんば)」）；
    步行由 **OSRM** 計算；起訖點與車站之間、轉乘的兩站之間自動補步行
  - 定義在 `data/routes.json`（哪一段搭什麼車、哪站上下車），由 `scripts/build-routes.js` 產生
    `docs/map/routes.json`（**不要手動編輯**）。`build-places.js` 跑完會自動接著跑它
  - 目前定義了 **Day 1、3、8**。其餘天數的直線都在市區內、不跨海，**維持原本的虛線直線**；
    沒有定義的天數地圖會自動退回虛線直線
  - 有定義的天數，**每一段都要定義**，少一段 `build-routes.js` 會直接報錯（避免路線默默斷掉）；
    行程改了地點或時間，舊的路段定義沒用到時會印出警告
  - 地圖樣式：鐵路＝主色實線、地鐵＝次色實線、步行＝灰色點線，滑過路線會顯示搭哪一班；
    狀態列圖例只列當天用到的交通方式
  - 步行路徑若比直線遠 3 倍以上（例如關西機場航廈與車站之間的室內連通道 OSM 沒畫到，
    OSRM 會繞出 3.4 km），直接畫直線
  - Overpass 主站常回 429／504，腳本會等待重試；抓過的 relation 存在 `scripts/.cache/`（不進版控）
- **地點座標要對**：`QUERY_OVERRIDE` 裡的查詢字串錯了，步行路線會整個繞錯。
  例如飯店曾被指到「西成区太子1丁目」（鐵路另一側，差約 700m），實際地址是
  **浪速区恵美須西3-8-7**；關西機場只查「関西国際空港」會落在跑道區，改指第 1 航廈。
  override 改了之後，快取的舊座標會自動重查
- **序號**：當天最早的點若是機場，編號從 0 起算（代表抵達／出發點），其餘從 1 開始。
  注意 `makeIcon()` 不可用 `seq ? ...` 判斷，因為 0 在 JS 是 falsy
- 類別開關：景點／美食／交通／住宿／已預約

**資料產生流程**：`docs/final/index.html` 是唯一事實來源。改完行程後執行
```bash
node scripts/build-places.js          # 沿用已查過的座標與路線（會自動接著跑 build-routes.js）
node scripts/build-places.js --refresh # 全部重查
node scripts/build-routes.js          # 只重算路線（改了 data/routes.json 時）
```
腳本會解析行程表的地圖連結，透過 OpenStreetMap Nominatim 查經緯度，寫入 `docs/map/places.json`。
Nominatim 對少數地點解析不佳，腳本內 `QUERY_OVERRIDE` 可指定替代查詢字串。
**請遵守 Nominatim 使用規範**：每秒至多 1 次請求、帶可識別的 User-Agent（腳本已處理）。

### docs/final/index.html 功能說明（請勿移除）
- **逐日切換**：`showDay(n)` 一次只顯示一天。初始顯示順序為：網址 `#day-N` > 今天的日期 > 上次瀏覽的日期（localStorage `lastDay`）
- **切換方式**：日期列點擊、鍵盤左右方向鍵、手機左右滑動（橫向位移 >70px 且明顯大於縱向才觸發，避免干擾上下捲動）
- **換天後的捲動位置**（2026-09-22 起）：回到「日期列貼齊畫面頂端」的位置（`navHomeY()`），
  **不要改回捲到頁面最上面** —— 使用者反映每換一天就要把頁首照片重看一次
  - 已經停在日期列上方（頁首還看得到）時**不捲動**，工具列的「複製這天行程」才不會被捲走
  - 瞬間跳過去、不做 smooth 動畫：內容已經整個換掉，捲動動畫只會讓新的一天從眼前刷過去
  - 日期列是 sticky，捲下去後量它自己永遠是 0，所以 `navHomeY()` 量的是前一個元素（航班列）的底邊
  - 第一次載入（`initDay()` 傳 `noScroll`）不主動捲動；網址帶 `#day-N` 時（從地圖頁「看這天的行程」
    連回來）交給瀏覽器原生的錨點捲動，`.day-section` 的 `scroll-margin-top: calc(var(--nav-h) + 16px)`
    讓它停在同一個位置。**沒有這個 margin，sticky 的日期列會蓋住當天標題**。
    `--nav-h` 由 `syncNavHeight()` 用 `getBoundingClientRect().height` 量 ——
    `offsetHeight` 會四捨五入（61.6 → 62），頂端會露出一條航班列
- **今日標記**：日期列上「今天」那一格右上角有金色圓點
- **三種項目分類**（2026-09-21 起）：每個 `.timeline-item` 都必須有 `.tl-kind` 標示
  - `.is-main` ＋ `主行程`：航班、住宿 check-in/out、5 個已預約項目、報到與退房，
    8 個大景點（大阪城、姬路城、奈良公園、伏見稻荷、平等院、金閣寺、嵐山、清水寺），
    以及 Day 6 瑞饋祭的 2 項（神轎出遊、御旅所）。左側為實線邊
  - `.is-move` ＋ `交通`：**所有移動與過關**。交通不是「行程」而是兩個行程之間的過程，
    所以獨立成一類，左側為灰色點線、標籤是灰字外框，讓視線可以直接跳過
  - `.is-flex` ＋ `彈性`：其餘餐飲、購物、機動景點。左側為虛線邊，內含方案輪播
  - 目前為 **21 主行程 / 26 交通 / 18 彈性**（共 65），**不應有未標示的項目**
  - 交通項目**不再另外掛 `.tl-tag.transport`「交通」pill**，那會和分類標籤重複顯示同一個字
- **方案輪播 `.plans`**：方案 A 一律是原訂行程，B～E 為替代方案
  （2026-09-22：18 組、共 54 個替代方案 —— B、C 各 18，D 16，E 2）
  - **Day 6 11:30 午餐**也是 2026-09-22 新增（北野天滿宮一帶、週四有開的四家），A 是首選
  - **Day 4 15:30** 是 2026-09-22 為了填補「入住後到 teamLab 前的 2 小時空檔」新增的一組，
    沒有原訂行程，A 是首選（東寺）；四個方案都要能在 18:30 前走到 teamLab
  - **挑選原則**（使用者明確要求，不要退回「每天都給同一批店」）：
    - **同一家店不要出現在不同天的方案裡**；每一組都要配合當天的星期（公休日）、所在區域與前後行程
    - 優先選評價高、有人氣的店：食べログ評分與評論數、百名店／食べログ Award，並參考近五年的
      部落客、論壇與社群評價 —— **五年以前的評價不採用**
    - 每一家都要確認「那天那個時段有開」。曾經 Day 4（週二）午餐的 A、B、C 三家店週二全部公休
  - **方案小卡 `.plan-ref`**：`.pr-name` 店名／`.pr-feat` 特色／`.pr-facts`
    （⭐ 食べログ評分與評論數＋查詢年月、🏅 百名店／Award、🕐 營業時間、🎫 價位、📍 地址、⚠️ 注意）／
    `.pr-links`（`.pr-map` 地圖＋`.pr-src` 查證來源）。評分會隨時間變動，**一定要寫查詢年月**
  - 切換方式：圓點、左右箭頭、**區塊內左右滑動**（門檻 40px）、桌機滑鼠拖曳
  - **切換方式是 display 顯示／隱藏，不要改回 transform + 量高度。**
    非 active 的方案為 `display:none`，容器高度自然貼合目前那一張。
    曾因為 `initPlans()` 在 `initDay()` 之前執行、當下所有 `.day-section` 都是
    `display:none`，量到的 `offsetHeight` 為 0，導致容器高度被鎖成 0px、內容全被裁掉
  - **導覽列 `.plans-nav` 必須在輪播「上方」，不要搬回下方。**
    A／B／C 的內容長度差到 224px，導覽列放下方時換一次方案整排按鈕就上下跳
    84～230px，而按鈕只有 26px 高 —— 桌機連點兩次「›」第二下必定落空，
    使用者看到的就是「網頁版根本不能切換」
  - **每個方案自己帶標題與 emoji**：`.plan` 上的 `data-icon`，以及 `.plan` 內第一個
    `<span class="plan-title" hidden>`。`go()` 會把它們寫進 `.tl-title`／`.tl-icon`，
    並更新 header 上的 `.tl-plan` 指示（A 用主色、B～E 用次色）。
    **不可以只換內文不換標題** —— 否則會出現「標題寫木津市場、內容是黑門市場」。
    方案 A 的 `plan-title` 就是原本的標題（含 `.ja-name`）；B～E 只寫繁中，
    未經查證的日文寫法一律不寫
  - `go()` 會把導覽列**釘回原本的螢幕位置**：方案長短不同會改變整份文件的高度，
    使用者若正捲在頁尾，瀏覽器會夾住捲動位置、整頁往下位移。捲不動時會撐開
    `.scroll-slack`（頁尾臨時墊片）補回距離，使用者一捲動就收掉
  - **頁面層級的日期滑動會略過起點落在 `.plans` 或 `.spot-photos` 內的手勢**，兩種滑動才不會打架
  - 方案中引用的店家／景點資料一律來自已查證的資料庫（`docs/selector/foods.html` 的
    `foods`、`data/attractions.json`），**不要在方案裡手寫未查證的票價或營業時間**
  - 列印時所有方案會攤平顯示（連同各自的標題），不會只印出目前那一個
- **主行程的計畫B `.alt-plan`**（2026-09-22 起）：主行程描述裡原本用一句「計畫B：…」帶過的備案，
  改成主行程卡片底部的收合區塊
  - **不做成方案輪播**：輪播代表「任選一個」而且會換掉標題；主行程是已訂或非去不可，計畫B 只是備案
  - `<details class="alt-plan">`：收合時一列寫明「B｜計畫B｜名稱」＋什麼情況用（`.ap-when`），
    點開才看 `.plan-ref` 小卡。B 字方塊直接用 `.plan-tag`，虛線框與顏色沿用次色＝替代方案
  - 小卡裡的地圖連結用 `.pr-map`，**不要用 `.map-link`** —— 否則 `build-places.js` 會把它當成
    行程地點畫上地圖、串進當天的移動路線
  - 內容一樣只能引用已查證的資料庫（目前是 `data/attractions.json` 的 `osaka-museum-history`）
  - 列印時由 `beforeprint` 全部展開、`afterprint` 還原；`copyDay()` 會在該項下面多一行「└ 計畫B｜…」
  - 目前只有一處：Day 2 大阪城 → 大阪歷史博物館
- **Day 6（10/1）瑞饋祭優先＝13:00 神轎出遊＋晚上的御旅所**（2026-09-22 使用者要求）：
  08:05 出發 → 09:00 金閣寺（早上整段，約 2 小時）→ 11:30 北野午餐 → 12:40 神轎出遊（13:00 出發）→
  14:45 嵐山 3 小時、渡月橋看日落（17:42）→ 18:20 御旅所（ずいき神轎＋攤販）→ 19:30 木屋町晚餐 → 21:00 夜間
  - **不排 09:00 出御祭**：排進去會變成 北野 → 金閣寺 → 回北野 的折返（見「行程動線原則」）
  - 御旅所保留的理由：ずいき神轎不參加 10/1 的隊伍（10/4 才出巡），這趟只有御旅所看得到；
    攤販只擺 10/1～10/3；円町就在嵐山回市區的 JR 上。卡片上寫了代價（約 1 小時）與不去的走法
  - **北野天滿宮本社沒有攤販**，攤販只在西ノ京的御旅所（地圖用 OSM 的「北野神社御旅所」，
    Nominatim 查「北野天満宮御旅所」會落到中京區壬生的另一個點）
  - 16:00 御旅所的着御祭・八乙女舞和嵐山夕陽衝突，行程選了嵐山，卡片裡有寫明
- **景點卡片裡的順路清單 `ul.spot-route`**（2026-09-22 起，金閣寺與嵐山）：**不要用 `<ol>`** ——
  「1. 14:50 天龍寺」序號後面緊接時間很難讀（使用者反映）。改成圓點清單，時間放在 `.sr-time`（主色粗體）
- **景點卡片的照片與小地圖 `.spot-media`**（2026-09-22 起，目前只有 Day 6 嵐山）：
  - 照片：`docs/assets/spots/<id>/`，**和頁首照片同一套標準**（Wikimedia Commons 自由授權、近五年拍攝），
    下載 960px 版本即可；作者與授權寫在每張照片下方，來源記在 `credits.json`；`loading="lazy"`
  - 小地圖：`<iframe src="../map/spot.html?id=<id>&embed=1" loading="lazy">`。Leaflet 只在 spot.html 載入，
    行程表本身不載入。停留點定義在 `data/spots/<id>.json`（座標要自己查證，同名地點很多），
    `node scripts/build-spots.js` 用 OSRM 算步行路線寫入 `docs/map/spots/<id>.json`（**不要手動編輯**）
  - iframe 在那一天還沒顯示時尺寸是 0，spot.html 會在尺寸改變時重新 `fitBounds`；離線時隱藏地圖、顯示提示
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
  - `sw.js` 對同源請求一律 **network-first**（見檔案內註解），改版時把 `CACHE` 版本號 +1
  - 頁面另外監聽 `controllerchange`，**新版 SW 接手後會自動重新整理一次**。
    沒有這段的話，改版當下已開著舊頁面的人會停在「新 HTML ＋ 舊 CSS／JS」的半舊狀態
- **地圖連結**：`?q=` 一律使用**明文日文地名**，不要改回 percent-encoding（歷史上曾因編碼轉換導致 17 個連結指向錯誤地點）
  - 方案小卡的 `.pr-map` 也一樣。這些連結原本是「店名 ＋ 資料庫的分類欄位」拼出來的，
    出現過「八坂神社 定番」「錦市場 文化體驗」「神戶港塔 關西延伸」這種查不到的字串，
    已於 2026-09-21 全部改為查證過的日文正式名稱

### 審核目錄 audit/
- `audit/records/` - 審核記錄（按日期存放）
- `audit/records/2026-09-22.md` - 最新審核記錄（主行程計畫B、換天捲動位置、大丸梅田店改名 LUCUA SOUTH、麵包類擴充、
  Day 4 空檔與 teamLab、Day 6 瑞饋祭規劃與動線原則）
- `audit/records/2026-09-21.md` - 地圖實際路線、Day 8 出發時間、頁首照片、彈性方案 B～E
- `audit/verified.md` - 已驗證的資訊
- `audit/discrepancies.md` - 發現的資訊不一致處

### 景點選擇輸出 attraction_selector_output/
- `attraction_selector_output/attractions.csv` - 景點清單 CSV（由 generate.py 產生）

> 產生腳本只有一份，位於 `.claude/skills/attraction-selector/scripts/generate.py`。
> 互動式 HTML 選擇器在 `docs/selector/`（見下方），不在本目錄。

### docs/selector/ -HTML選擇器（GitHub Pages顯示用）
這些 HTML 檔案使用 Tailwind CSS CDN 引入樣式，無需 build step：
- `docs/selector/attractions.html` - 景點選擇器（綠色主題，123 筆）
- `docs/selector/foods.html` - 美食選擇器（橙色主題，115 筆）

> ⚠️ 首頁 `docs/index.html` 的卡片上有筆數 badge，**改完資料陣列後要同步**：
> ```bash
> node scripts/sync-counts.js
> ```
> 手寫的筆數沒人記得改 —— 曾經美食實際有 63 筆、首頁還寫 37 筆。

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
- 資料來源：景點資料內嵌於 HTML 中的 JavaScript `attractions` 陣列，
  **由 `data/attractions.json` 產生，不要直接改陣列**（兩份以前各改各的，分岔到出現重複項目）：
  改完 JSON 後執行 `node scripts/sync-attractions.js`，再執行 `node scripts/sync-counts.js`
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
- 選填欄位（2026-09-21 起，供行程表的方案小卡使用）：`rating`／`reviews`（食べログ評分與評論數，
  要寫查詢年月）、`award`（百名店／Award）、`note`（公休、預約等注意事項）、
  `mapq`（Google Maps 查詢字串，**明文日文**）、`src`（查證來源網址）。
  `data/attractions.json` 也有 `mapq`
- **選擇器只顯示** 店名、標籤、`features`、價位、`hours`、`address`；`rating`／`award`／`note` 不會顯示。
  公休一定要寫進 `hours`，百名店入選紀錄寫進 `features` 並加上 `百名店` 標籤
- `price` 用字串比對判斷價位：含「¥1,000」就算中價位，所以千円以內要寫成「¥999 內」才會是平價
- **麵包類**（2026-09-22，22 筆）：以食べログ パン WEST 百名店 2026 為名單，只收行程會經過、
  而且**行程當天有營業**的店（例如 Day 3 神戶是週一，週一公休的名店一律不收）；同一品牌只收一家
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
- `reference/plans-2026-09/` - 彈性方案（B～E）與主行程計畫B 的查證來源備份（2026-09-22）。
  檔名是「網域_路徑」，避免不同網站的首頁都變成 `index.md` 互相覆蓋
- `reference/bread-2026-09/` - 美食選擇器麵包類的查證來源備份（2026-09-22，含沒收的店的食べログ頁面）

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

> ⚠️ **存完一定要檢查檔案內容**（2026-09-22 踩過的兩個坑）：
> - 預設的內文擷取會挑第一個 class 含 `content` 的 div，在 **Tabelog** 等網站只會存到頁首選單（約 245 bytes），
>   評分和營業時間都沒存到。檔案太小時，改成覆寫 `extract_content()` 直接回傳 `soup.body`
> - 網頁可能內嵌**第三方的存取權杖**（例如 Yahoo 地圖頁裡的 Mapbox token），GitHub 的推送保護會把整批 push 擋下。
>   **commit 前先把權杖遮蔽掉**，不要到 GitHub 上按「允許這個 secret」
> - 有些官網**明文禁止複製、轉載**（例如三十三間堂）。這個 repo 是公開的，這種網站**不存整頁副本**，
>   改寫一份只記錄查證事實與網址的筆記（`網域_查證筆記.md`）
> - 伺服器沒送中繼憑證的網站（Python／Node 會報 `UNABLE_TO_VERIFY_LEAF_SIGNATURE`），
>   **不要關掉 TLS 驗證**，改用瀏覽器開頁面讀取

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
  - 解析標題的正規表示式必須列出標題後面可能出現的所有 span
    （`.tl-tag`／`.tl-kind`／`.tl-plan`）。少列一個，那個 span 的文字就會被吃進標題，
    地圖上會出現「入住｜一難波南2號店 主行程」這種標題
- `scripts/build-routes.js` - 依 `data/routes.json` 產生地圖上依交通方式的實際路線（見上方「docs/map/ 行程地圖」）
- `scripts/sync-attractions.js` - 用 `data/attractions.json` 重新產生景點選擇器的內嵌陣列
- `scripts/build-spots.js` - 依 `data/spots/*.json` 產生景點小地圖的步行路線（`docs/map/spots/`）
- `scripts/sync-counts.js` - 把首頁的選擇器筆數 badge 同步成實際資料筆數
- `scripts/fetch-hero-photos.js` - 重新抓取頁首背景照片（見上方「頁首背景照片」）