# ppt-beautify · PPT 美化／簡報改版

把純文字條列 deck 重新設計成有視覺層級的簡報，並導出**文字可編輯**的 PPTX。

給 Claude 用的操作說明在 `SKILL.md`。這份是給人看的。

## 這是什麼

一條生成管線，不是一套模板：

```
原 PPTX ──extract──▶ 大綱
                      │
                      ▼
                  content.js          ← 內容模型（一份真相來源）
                      ×
              themes/theme-{a,b,c}.js ← 設計系統（各自的視覺邏輯）
                      │ build
                      ▼
              HTML deck + 概覽牆
                      │ shoot（截圖 + 版面體檢）
                      ▼
              可編輯 PPTX
```

改內容不必動設計，換設計不必動內容。加第四套設計就在 `themes/` 放 `theme-d.js`。

## 安裝

當成 Claude Code skill 用，clone 到 skills 目錄底下再裝依賴：

```bash
git clone https://github.com/lincc0467/ppt-beautify.git ~/.claude/skills/ppt-beautify
cd ~/.claude/skills/ppt-beautify
npm install
npx playwright install chromium
```

裝好之後在 Claude Code 裡說「美化這份 PPT」並附上 `.pptx`，或直接 `/ppt-beautify`，
skill 就會被載入。也可以不透過 Claude、自己照下面的步驟跑腳本。

## 快速開始

```bash
SK=~/.claude/skills/ppt-beautify

node $SK/scripts/extract_pptx.mjs 原檔.pptx --out outline.md   # 讀原檔
node $SK/scripts/init_project.mjs --project .                  # 建骨架
#   ← 這裡改寫 content.js（七成工夫在這步）
node $SK/scripts/render_diagrams.mjs --project .               # 圖解 → PNG
node $SK/scripts/build.mjs --project .                         # 生成三套 deck
node $SK/scripts/shoot.mjs --project .                         # 截圖 + 體檢
node $SK/scripts/export_deck_pptx.mjs --slides decks/A/slides --out 成品.pptx
```

開 `index.html` 預覽（← → 翻頁，ESC 回概覽）。

## 三套內建設計方向

| | 特徵 | 適合 |
|---|---|---|
| **A · 敘事軸** | 冷調紙灰 + 單一橙，一條階梯敘事軸貫穿全場 | 內容有明顯起伏／轉折 |
| **B · 暖白編輯部** | 暖白紙感 + 襯線標題 + 左右分欄，全頁只有一處高飽和色 | 論述型、文字密度高 |
| **C · 系統網格** | 白底嚴格網格 + 色彩即編碼 | 多章節、多分類資料 |

## 兩個關鍵設計決策

**圖解怎麼跟可編輯 PPTX 共存** —— 匯出路徑禁用複雜 SVG，但簡報需要圖解。
作法是圖以真 SVG 寫在 `diagrams.mjs` → 渲成 3x PNG → 用 `<img>` 嵌入。
結果：頁面文字在 PPTX 裡仍可編輯，圖是圖片；向量原始檔保留，改圖改原始碼再重跑。

**版面不寫死行距** —— 行距由可用高度反推，並扣掉頁尾帶與頁碼軸。
有圖的頁面條列自動改雙欄，把高度讓給圖。這兩點是為了避免行數變動時疊字、以及圖被壓成縮圖。

## 依賴

playwright / pptxgenjs / sharp 裝在**本目錄**（見上面的安裝步驟），腳本從自己的位置解析
`node_modules`，所以**你的簡報專案目錄不需要 `npm install`**。瀏覽器沒裝過的話：

```bash
cd ~/.claude/skills/ppt-beautify && npx playwright install chromium
```

## 來源

生成管線取自 [lincc0467/agentic-ai-deck](https://github.com/lincc0467/agentic-ai-deck)，
去除該專案的內容後改寫成通用版：內容欄位化（`DECK.arc` / `steps` / `loopLabel` / 章節色）、
主題不再寫死中文分類名、`build`／`shoot`／`render` 全部改吃 `--project`、
自帶概覽牆外殼（原本依賴另一個 skill 的檔案）、新增 `extract_pptx.mjs` 與 `init_project.mjs`、
版面體檢從「只驗溢出」擴充為五項。

`scripts/export_deck_pptx.mjs` 與 `scripts/html2pptx.cjs` 原出自 huashu-design skill，
原專案已修好三處（CommonJS 副檔名、Windows `file://` 路徑、`letter-spacing` → `charSpacing`），此處照收。
