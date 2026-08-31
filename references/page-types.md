# 內容模型欄位速查

`content.js` 有三個 export：`DECK`、`CHAPTERS`、`PAGES`。三套 theme 讀同一份。

---

## DECK

| 欄位 | 必填 | 用途 |
|---|---|---|
| `title` | ✓ | 概覽牆與入口頁標題 |
| `kicker` | | 封面左上英文／代號小標（A 版等寬字排，全大寫最好看） |
| `occasion` | | 場合，例如「內部技術分享」 |
| `meta` | | 規格，例如「20 頁 · 約 40 分鐘」 |
| `motif` | | 一句話母題，B 版封面左欄。說出「這份內容的形狀是什麼」，可用 `\n` 斷行 |
| `loopLabel` | | 迴圈帶文字。**內容真的有「結果回饋到起點」的結構才填**；不填三套 theme 都不畫那條帶子 |
| `steps` | | `[{no, name}]`，C 版封面下半的步驟帶；不填就退回用 `CHAPTERS` |
| `arc` | | `[{label, level, hero?, dim?}]`，A 版封面的敘事波形。`level` 0（低點）～100（高點），`hero` 標情緒最高點 |
| `lang` | | 預設 `zh-Hant` |

## CHAPTERS

`[{ id, no, name, blurb?, color? }]`

- `id` — 頁面用 `ch` 欄位指過來
- `blurb` — B 版封面的章節說明，可用 `<br>` 斷行
- `color` — C 版章節色；不填就依序取內建色譜

## PAGES · 共通欄位

| 欄位 | 用途 |
|---|---|
| `type` | 九種頁型之一（見下） |
| `ch` | 章節 id；封面等不屬於任何章的頁面填 `null` |
| `title` | 頁標題（`cover` 除外），可用 `\n` 斷行 |
| `lead` | 標題下的導言。**用來講「為什麼這頁重要」，不是複述標題** |
| `short` | 概覽牆的短標籤；不填就用 `title` |
| `stepNo` | 頁首顯示 `STEP n` |
| `diagram` | `diagrams.mjs` 的 key，以 `<img>` 嵌入 |
| `scene` | 場景／單元標記，用強調色顯示在頁首章節之後。<br>同一個場景橫跨多頁時掛上它，聽眾才數得出「現在是第幾個」 |
| `speaker` | 講者備忘稿。投影片上不出現，匯出 PPTX 時寫進備忘稿欄。用 `\n` 分行。<br>**投影片放不下但講的時候要講的細節，放這裡**，不要硬塞進版面 |

---

## 各頁型專屬欄位

### `cover`
`title1`（必填）、`title2`、`sub`

### `bullets`
- `items: [{k, v}]` — `k` 關鍵詞、`v` 說明
- `numbered` / `startNo` — 編號條列
- `wideKey` — 加寬關鍵詞欄（預設 286pt）
- `footer` + `kicker` — 頁尾強調帶
- `logos: [{name, src?, text?}]` — 工具／來源卡；`src` 是 `assets/` 下的檔名
- `diagram` — 圖放在條列下方；條目 ≥4 時自動改雙欄把高度讓給圖
- `diagramOnly` — 圖已完整承載這些條目，不再重列（避免圖文重複）

### `split`
`left` / `right`：`{label, items: [string]}`。右欄一律是「被推薦／改良後」的那邊，theme 會給它強調色。

### `steps`
`steps: [{no, name}]`，`name` 可用 `\n` 斷行。選填 `loopLabel` 覆蓋 `DECK.loopLabel`。

### `flow`
- `steps: [{label, detail}]` — 流程卡
- 或 `diagram` — A 版以圖為主角（B/C 版沒 `steps` 時也退回貼圖）
- `notes: [{k, v}]` — 下方兩則註解

### `case`
`blocks: [{label, items: [string]}]`。每個 block 的第一行自動加粗。

### `turn` — 全場高潮頁
- `before` / `after`：`{label, score, unit?, note?, items?}`
- `sources: [{name, src?}]` + `sourcesLabel` — 改進來源帶（選填）

`score` 是大數字，左灰右彩，中間一條連接線。**整份簡報最多一頁用這個。**

### `stat`
`stats: [{value, unit?, label, group?, hero?, text?}]`
- `hero` — 最重要那個（A 版加強調線，B 版做成大卡）
- `group` — C 版依「首次出現順序」自動配色並產生圖例
- `text` — 值是文字不是數字時設 true，字級會自動縮小

一頁最多 8 格（4×2）。

### `closing`
`keyLabel` + `key`（一句關鍵洞見）、`actionLabel` + `actions: [string]`（行動清單）。

### `table` — 資料矩陣
- `cols: [{k, w, align?}]` — `k` 欄頭、`w` 相對寬度（自動正規化到版心寬）、`align` 預設 `left`
- `rows: [[string]]` — 二維陣列，每列長度要等於 `cols` 長度
- `emph` — 要加粗的欄索引（第 0 欄一律加粗，因為它是列的錨點）
- `on: [string]` — 值命中就上強調色，用來標「本次選用」「單卡可行」這類結論
- `grade` — 儲存格若為單一 `A` / `B` / `C` 就畫成分級色塊（A 版橘／灰、C 版綠／琥珀／紅熱圖）
- `note` + `noteLabel` — 表格下方的換算基準或判讀說明

行高與字級由列數反推（列多就收緊），**第一欄字級 +1pt**：拉丁字母在相同 pt 下比中文視覺上小一號，
不補這 1pt，模型名稱那欄會看起來比右邊的中文說明還小。

---

## 加新頁型

在**三套 theme 的 `render()` switch 裡都加一個 case**。少加一套，`build.mjs` 會在那頁丟錯——
這是刻意的，避免某個方向默默少一頁。
