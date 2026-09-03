# Path A 硬約束 · 可編輯 PPTX 的四條規則

`export_deck_pptx.mjs` 是逐元素把 HTML DOM 翻譯成 PowerPoint 原生物件，不是截圖貼上。
代價是 HTML 只能用 PowerPoint 表達得出來的那個子集。

**這四條要從寫 HTML 的第一行就遵守。**視覺驅動先寫、事後再改幾乎不可能改得過來。

---

## 1 · 文字必須包在 `<p>` / `<h1>`–`<h6>` 裡

```html
<!-- ✗ div 直接裝文字 → 翻不出文字框 -->
<div style="position:absolute; left:64pt; top:96pt;">標題文字</div>

<!-- ✓ -->
<div style="position:absolute; left:64pt; top:96pt; width:600pt;">
  <p class="h2">標題文字</p>
</div>
```

`<span>` 只能夾在 `p` / `h*` 內做局部樣式（換色、換字級、加單位）。

## 2 · 禁止 CSS 漸層，只能純色

```html
<!-- ✗ -->
<div style="background:linear-gradient(90deg,#D4501A,#F1F2F0);"></div>

<!-- ✓ 需要多色條帶就用相鄰的純色子元素 -->
<div style="position:absolute; left:64pt;  top:250pt; width:156pt; height:4pt; background:#2E6DA4;"></div>
<div style="position:absolute; left:232pt; top:250pt; width:156pt; height:4pt; background:#5E9B47;"></div>
```

## 3 · 背景／邊框／陰影只能寫在 `<div>` 上

```html
<!-- ✗ 樣式寫在文字標籤上 -->
<p style="background:#FAF9F5; border:1pt solid #E3DFD4; padding:18pt;">卡片內文</p>

<!-- ✓ 外層 div 承載視覺，內層 p 只承載文字 -->
<div class="card" style="position:absolute; left:298pt; top:410pt; width:598pt; height:74pt; padding:18pt 22pt;">
  <p>卡片內文</p>
</div>
```

## 4 · `<div>` 不可用 `background-image`；不可用複雜 SVG、web component、動畫

圖片一律用 `<img>` 嵌入。

**這條會讓任何依賴 SVG path 的視覺失效**（曲線、波形、路徑圖）。

但要先分清楚：**「不能用 SVG」不等於「不能畫圖」。**
上面三條規則允許的元素已經足以畫出大部分技術圖解——
有背景／邊框的 `<div>` 會被翻成 PowerPoint 矩形、細長的 `<div>` 會被翻成線、`<p>` 是文字框。
只有方塊、直線、文字的圖（流程、分支、階梯、甘特、對照軌）都該直接用 HTML 畫。

三個出路，依序考慮：

- **直接用 HTML 畫**（`figures.mjs`）——圖在 PPTX 裡是一堆原生物件，可拖拉、可改字。
  畫不了曲線與箭頭三角形；連接線改直角折線，方向靠標籤與版面順序表達
- **降級**成 CSS 線段／色塊，並在設計說明裡**明確標註是降級**，不要假裝做出了原版質感
  （`theme-a.js` 的敘事波形就是這樣做的）
- **繞道**：圖以真 SVG 寫在 `diagrams.mjs` → 渲成 3x PNG → 用 `<img>` 嵌入（規則 4 允許）。
  **只在真的需要曲線時才走這條**——代價是圖在 PPTX 裡不可編輯

---

## 其他會咬人的地方

| 症狀 | 原因 | 解法 |
|---|---|---|
| 匯出時報 `content overflows body` | 內容超出 960×540pt | 跑 `shoot.mjs` 找出是哪一頁哪個元素 |
| 匯出時報 dimensions don't match | body 尺寸不是 960pt × 540pt | 檢查 `build.mjs` 的 shell 有沒有被改壞 |
| PPTX 裡字型全變成別的 | 用了 webfont，目標機器沒裝 | 字型鏈第一名改成系統內建款 |
| 字距不見了 | 舊版腳本沒接 `letter-spacing` | 本 skill 的 `html2pptx.cjs` 已修（轉成 `charSpacing`） |
| 圖片讀不到（Windows） | `file://` 去除後留下 `/D:/…`，被接成 `D:\D:\…` | 已修（`fileUrlToPath()`） |
| 同一區塊的多行文字在 PPTX 裡被拆成多個框 | 預設逐元素轉換 | 外層 div 加 `data-pptx-merge="true"` 合併成一個文字框 |

---

## 什麼時候不該走這條路

需要動畫、web component、CSS 漸層、複雜 SVG 的場合——那就別做可編輯 PPTX，改交 PDF。
硬要兩者兼得的結果是設計被約束綁死，而且匯出還是會失敗。

先問使用者：**這份 PPTX 是要拿去改，還是只要能播？**
只要能播 → 走 PDF，設計自由度高得多。要能改 → 才接受這四條約束。
