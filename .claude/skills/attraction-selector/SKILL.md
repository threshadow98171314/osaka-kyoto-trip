---
name: attraction-selector
description: 將景點資料整理成CSV或HTML格式，方便旅伴選擇最終想去的景點。當用戶提到「整理景點」、「選擇景點」、「景點清單」、「旅伴選擇」、「景點CSV」、「景點HTML」、「景點表格」時觸發。
---

# Attraction Selector

將景點資料整理成結構化的 CSV 和互動式 HTML，讓旅伴能夠輕鬆選擇想去的景點。

## 資料架構

```
data/
└── attractions.json    ← 單一事實來源（110+ 結構化景點資料，含 tags 標籤）

docs/
└── 04_attractions/...  ← Markdown 原始文件（我閱讀用）

attraction_selector_output/
└── attractions.csv       ← CSV 輸出

docs/selector/
└── attractions.html, foods.html  ← 互動式選擇器（GitHub Pages）
```

## 工作流程

### 流程 1: 新增/更新景點（我執行）

當 markdown 文件有變動時，我會：
1. 從 markdown 讀取景點資訊
2. 更新 `data/attractions.json`
3. 自動產生 tags 標籤（從 features 和名稱推斷）

### 流程 2: 產生 CSV/HTML（我執行）

執行產生腳本（腳本只有一份，就在本 skill 的 scripts/ 下）：
```bash
python .claude/skills/attraction-selector/scripts/generate.py
```

## JSON 資料格式

```json
{
  "attractions": [
    {
      "id": "dotonbori",
      "name": "道頓堀",
      "city": "大阪",
      "area": "市中心",
      "category": "市中心",
      "features": "跑跑人、美食、大板燒、章魚燒",
      "price": "免費",
      "duration": "2-3小時",
      "address": "大阪市中央區道頓堀",
      "hours": "24小時（店鋪各異）",
      "transport": "Metro 禦堂筋線「難波駅」步行5分",
      "link": "",
      "tags": ["大阪", "市中心", "美食", "免費", "夜景"]
    }
  ]
}
```

### 欄位說明

| 欄位 | 說明 |
|------|------|
| id | 英文slug，URL友善 |
| name | 景點中文名稱 |
| city | 城市（大阪/京都/奈良/關西延伸） |
| area | 區域（逐漸被 tags 取代） |
| category | 人類可讀類別（逐漸被 tags 取代） |
| features | 強化特色描述 |
| price | 票價 |
| duration | 建議停留時間 |
| address | 地址 |
| hours | 開放時間 |
| transport | 交通方式 |
| link | 官方連結（無則使用 Google Maps 搜尋） |
| tags | 標籤陣列（自動產生，最多6個）|

### 標籤系統

每個景點自動產生 1-6 個標籤，反映景點特色：

| 標籤 | 意義 |
|------|------|
| 大阪/京都/奈良/關西延伸 | 地理城市 |
| 免費/收費 | 票價特性 |
| 必去 | 世界遺產、著名景點 |
| 賞楓/賞花 | 季節性景色 |
| 夜景 | 夜景景觀 |
| 美食 | 美食/市場 |
| 購物 | 購物商街 |
| 神社寺院 | 神社寺廟 |
| 文化體驗 | 和服、茶道、抹茶等 |
| 體驗 | 互動體驗 |
| 自然 | 森林、竹林、海灣等 |
| 主題樂園 | 水族館、遊樂園 |
| ACG/玩具 | 動漫、任天堂、模型 |
| 溫泉 | 溫泉 |

## HTML 功能

1. **視圖切換** — 卡片視圖 / 表格視圖
2. **篩選功能**
   - 按城市篩選
   - 按標籤篩選（新）
   - 免費景點篩選
   - 只顯示已選景點
3. **景點卡片** — 顯示名稱、城市、標籤、特色、停留時間等
4. **景點表格** — 適合快速比較多個景點
5. **勾選功能** — 每個景點有 checkbox 可勾選「想去」
6. **匯出功能**
   - 「匯出已選景點」— 產生 JSON 格式的已選清單
   - 「複製選擇」— 複製景點名稱列表

## 提示

- CSV/HTML 永遠從 `data/attractions.json` 產生
- 要新增或修改景點，直接編輯 `data/attractions.json`
- tags 欄位會自動從 features 和名稱推斷，不需要手動填寫
- 執行產生腳本後，輸出會覆蓋 `attraction_selector_output/` 下的檔案
- 選擇狀態使用 Set 管理，避免 DOM 查詢問題