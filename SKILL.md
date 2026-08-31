---
name: ppt-beautify
description: |
  PPT 美化／簡報改版：把純文字條列 deck 重新設計成有視覺層級的簡報，並導出「文字可編輯」的 PPTX（不是圖片貼滿的假 PPT）。
  做法是內容模型與設計系統分離——一份 content.js × 多套 theme → HTML deck → 可編輯 PPTX，改內容不必動設計，換設計不必動內容。
  觸發詞：「美化 PPT」「簡報改版」「把這份 PPT 重做」「這份投影片太醜」「幫我排版投影片」「做一份簡報」
  「PPT 太多字」「幫我把大綱做成投影片」「可編輯 PPTX」「ppt-beautify」。
  丟一個 .pptx 檔進來、或丟一份大綱／講稿要求做成投影片，都應該觸發。
---

# PPT 美化 · 簡報改版生成系統

> 這不是「套模板」。是把一份內容拆成**內容模型**與**設計系統**兩層，
> 讓版面由規則長出來——改一個字不必重排整頁，換一套設計不必重寫文案。

技術來源：[agentic-ai-deck](https://github.com/lincc0467/agentic-ai-deck) 的生成管線，
內容去除後改寫成通用管線（原專案的匯出腳本取自 huashu-design skill，已修 Windows 路徑與 letter-spacing 兩處）。

---

## 0 · 先決定：這次要做的是哪一種

| 使用者給的 | 做法 |
|---|---|
| 一個既有 `.pptx` | 走完整流程 §1 → §7 |
| 一份大綱／講稿／markdown | 跳過 §1，從 §2 開始 |
| 已有專案，只改內容 | 改 `content.js` → 跑 §5 §6 |
| 已有專案，只換設計 | 改／加 `themes/theme-*.js` → 跑 §5 §6 |

**不要問使用者「你想要什麼風格」再停下來等答案。** 預設一次生出三個方向（A/B/C）
讓他挑，這比讓他憑空描述風格快得多。有明確品牌色或指定風格才另外處理。

---

## 1 · 拆解原檔

```bash
node ~/.claude/skills/ppt-beautify/scripts/extract_pptx.mjs <原檔.pptx> --out outline.md
```

輸出每頁的標題、條列（含縮排層級）、表格、圖片數、**講者備忘稿**。

讀完 outline 之後，先回答三個問題再往下走：

1. **敘事弧線在哪裡？** 哪一頁是全場情緒最高點（翻盤／關鍵發現／最貴的一課）？
   那一頁不能跟其他頁同權重，設計上要給它視覺高潮。
2. **數字在哪裡？** 純文字 deck 最被浪費的資產就是數字（規模、耗時、通過率、成長幅度）。
   把它們挑出來，之後做成 `stat` 或 `turn` 頁，讓數字當視覺主角。
3. **有沒有結構性的重複形狀？** 迴圈、階梯、扇出、對照——那個形狀就是這份內容的視覺母題。
   form 要能說得出來自內容的哪裡；說不出來就別加。

備忘稿常常比投影片本身資訊量更大，**改版時要拿它來補投影片上被壓縮掉的邏輯**。

---

## 2 · 建專案骨架

```bash
node ~/.claude/skills/ppt-beautify/scripts/init_project.mjs --project .
```

產生 `content.js`（含全部 9 種頁型範例，可直接跑）、`diagrams.mjs`、`themes/theme-{a,b,c}.js`、`assets/`。

---

## 3 · 寫內容模型（這步最重要，佔七成工夫）

改寫 `content.js`。三個 export：`DECK`（全域設定與封面素材）、`CHAPTERS`（章節）、`PAGES`（每頁）。
欄位定義見 `references/page-types.md`，範本本身也逐欄註解過。

### 文案處理紀律

- **砍冗字，不砍資訊。** 條列句盡量壓成一行，避免換行破碎；但不要把四層結構壓成一句口號。
- **移除所有 emoji。** 原檔靠 🎯🧠✓❌1️⃣ 撐層級的，一律拿掉，層級改由排版與色彩承載。
  emoji 當圖示是 AI slop 的典型特徵，而且投影時跨系統字形不一致。
- **繁體中文台灣用語**（若原檔是簡中或混用）。詞表見 `references/zh-tw-localization.md`。
- **技術術語保留英文原詞**（LLM、Prompt、API、Agent、Function calling），不要硬翻。
- 中文不用斜體；引號用「」不用 ""。

### 頁型選擇

| type | 什麼時候用 |
|---|---|
| `cover` | 封面，整份一頁 |
| `bullets` | 關鍵詞 + 說明的條列。最常用，但**純排版頁不得超過總頁數 ⅓** |
| `split` | 左右對照（前 vs 後、傳統 vs 新做法） |
| `steps` | 橫向步驟總覽 |
| `flow` | 帶說明的流程；配 `diagram` 時圖是主角 |
| `case` | 左標籤右內容的案例區塊 |
| `turn` | **全場高潮頁**：左右兩個大數字，講「未達標 → 翻盤」 |
| `stat` | 把數字提煉成視覺主角 |
| `closing` | 一句關鍵洞見 + 行動清單 |

**視覺錨點盤點**：寫完 `PAGES` 後逐頁列出「這頁的視覺主角是誰」。
如果超過三分之一的頁面答案是「就是條列」，回頭重想——那份 deck 還是純文字 deck，只是字比較好看。

---

## 4 · 圖解（需要才做）

`diagrams.mjs` 寫 SVG 原始碼 → `render_diagrams.mjs` 渲成 3x PNG → 投影片用 `<img>` 嵌入。

```bash
node ~/.claude/skills/ppt-beautify/scripts/render_diagrams.mjs --project .
```

為什麼繞這一圈：可編輯 PPTX 禁用複雜 SVG，但簡報需要圖解。
這樣做的結果是**頁面文字在 PPTX 裡仍可編輯，圖是圖片**；向量原始檔留在 `diagrams.mjs`，改圖改原始碼再重跑。

**圖片誠實性測試**（決定要不要放圖）：把圖拿掉之後資訊有沒有損失？
沒有損失 → 那是裝飾 slop，不要加。概念／方法論／資料型內容通常**不需要取圖**，
需要的是自繪的架構圖、流程圖與數字。不要放「機器人握手」「發光大腦」這類 stock 圖。

---

## 5 · 生成

```bash
node ~/.claude/skills/ppt-beautify/scripts/build.mjs --project .
```

產出 `decks/{A,B,C}/slides/*.html` 與各自的概覽牆 `decks/*/index.html`，
以及根目錄 `index.html`（三方向入口）。開 `index.html` 就能翻頁預覽（← → 翻頁，ESC 回概覽）。

---

## 6 · 驗收（不可跳過）

```bash
node ~/.claude/skills/ppt-beautify/scripts/shoot.mjs --project .
```

逐頁截圖到 `decks/*/thumbs/`，同時體檢六項：
**pageerror / 內容溢出 / 元素出界 / 字級過小 / 空文字框 / 疊字壓線**。任何一項不過就 exit 1。

**溢出＝PPTX 匯出必定失敗**，所以這步是必經步驟不是加分項。

**疊字壓線**量的是文字的墨水範圍（不是行盒），抓兩種破法：分隔線切進字裡、兩段文字疊在一起。
版面寫死行距時這兩種最常見——截圖上看得到，但溢出檢查抓不到。
主題若刻意用不透明色塊蓋掉線的中段來放標籤（迴圈帶就是這樣），會判定為遮罩，不算破版。

接著**實際看截圖**（Read 那些 PNG）。體檢只抓得到硬性破版，抓不到「這頁很醜」。
至少看封面、高潮頁、資料頁各一張。

---

## 7 · 匯出可編輯 PPTX

```bash
node ~/.claude/skills/ppt-beautify/scripts/export_deck_pptx.mjs \
  --slides decks/A/slides --out 成品.pptx
```

逐元素把 HTML DOM 翻成 PowerPoint 原生物件——文字是真的文字框，在 PowerPoint 裡雙擊即可編輯。

**這條路徑有四條硬約束，必須從寫 HTML 的第一行就遵守**，詳見 `references/path-a-constraints.md`：

1. 文字必須包在 `<p>` / `<h1>`-`<h6>` 裡，`<div>` 不可直接裝文字
2. 禁止 CSS 漸層，只能純色
3. 背景／邊框／陰影只能寫在 `<div>` 上，不可寫在文字標籤上
4. `<div>` 不可用 `background-image`；不可用複雜 SVG、web component、動畫

附的三套 theme 全部已符合。**自己新增 theme 時要一併遵守**，否則匯出會整批失敗。

**字型（最容易在別台電腦才爆的一條）**：PPTX 只保留字型鏈的**第一個名稱**，其餘 fallback 全部丟失。
所以字型鏈第一個必須是目標機器一定裝、而且含中文字符的字型：

- 內文 `"Microsoft JhengHei","Noto Sans TC",sans-serif` —— 微軟正黑體隨 Windows 內建；
  Noto Sans TC 放第二順位，只影響本機 HTML 預覽的細部字形
- 襯線 `"PMingLiU","Noto Serif TC",serif`
- **等寬字沒有中文字符**。Consolas 只能用在純數字與拉丁；含中文的標籤掛上 `.mono`，
  在 HTML 裡會靠 CSS fallback 看起來正常，匯出後卻是整串豆腐字——
  這種錯在本機完全看不出來。使用者可填的欄位用 `mono()` 自動判斷有沒有中文。

改完字型要重跑一次版面體檢：不同字型的字寬不同，原本剛好不折行的句子可能會折行。

---

## 設計紀律（三套 theme 共同遵守，新增 theme 也要）

- **畫布固定 960pt × 540pt**（= 13.333″ × 7.5″ = pptxgenjs `LAYOUT_WIDE`），截圖 1280×720px
- **正文 ≥ 13pt**，現場投影才看得見；小標籤 9–10pt 是刻意的，不要拿來放正文
- **版面不寫死行距**——行距由可用高度反推，並扣掉頁尾帶與頁碼軸。
  否則行數一變就疊字。看 `theme-a.js` 的 `bullets` 是怎麼算的
- **有圖的頁面條列改雙欄**，把高度讓給圖，不要把圖壓成縮圖
- **對比度 ≥ 4.5:1**
- 一頁只有一處高飽和色（B 版的紀律），或色彩即編碼（C 版的紀律）——兩種都行，但要一致

---

## 三套內建設計方向

| 方向 | 特徵 | 適合 |
|---|---|---|
| **A · 敘事軸** | 冷調紙灰 + 單一橙，一條階梯敘事軸貫穿全場，每頁標出所在位置 | 內容有明顯起伏／轉折的敘事弧線 |
| **B · 暖白編輯部** | 暖白紙感 + 襯線標題 + 左右分欄，全頁只有一處高飽和色 | 偏論述、文字密度高、要沉穩可信 |
| **C · 系統網格** | 白底嚴格網格 + 色彩即編碼，章節與資料分類靠顏色說話 | 結構化內容，多章節、多分類資料 |

換色只要改各 theme 檔頂端的 `C` 常數。加第四個方向就在 `themes/` 放 `theme-d.js`，
`build.mjs` 會自動撿起來。

---

## 檔案結構

```
scripts/
  extract_pptx.mjs      原 PPTX → 文字大綱（零依賴，自解 ZIP）
  init_project.mjs      建專案骨架
  render_diagrams.mjs   圖解 SVG → 3x PNG
  build.mjs             內容模型 × 主題 → HTML deck + 概覽牆
  shoot.mjs             逐頁截圖 + 版面體檢
  export_deck_pptx.mjs  HTML deck → 可編輯 PPTX
  html2pptx.cjs         DOM → PowerPoint 原生物件（含 Windows 路徑與字距修正）
templates/              init_project 複製過去的範本
assets/deck_index.html  概覽牆＋演示模式外殼
references/             四份規範文件
examples/               原專案的設計過程文件，可當寫 spec 的範例
```

依賴（playwright / pptxgenjs / sharp）已裝在 skill 目錄，腳本從自己的位置解析 `node_modules`，
**專案目錄不需要 npm install**。若 playwright 瀏覽器沒裝過：
`cd ~/.claude/skills/ppt-beautify && npx playwright install chromium`
