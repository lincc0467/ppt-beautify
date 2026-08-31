#!/usr/bin/env node
/**
 * build.mjs — 一份內容模型 × N 套設計主題 → N 套完整 HTML deck ＋ 概覽牆
 *
 * 用法：
 *   node build.mjs --project <專案目錄> [--themes A,B,C]
 *
 * 專案目錄必須有：
 *   content.js        export { DECK, CHAPTERS, PAGES }
 *   themes/theme-*.js 各 export default { id, name, desc, fonts, css, render(p, ctx) }
 *   diagrams.mjs      （選用）export { DIAGRAMS }：name → SVG 原始碼
 *   assets/           （選用）圖片素材，會複製進每套 deck
 *
 * 產出：
 *   <專案>/decks/<id>/slides/NN-type.html   每頁獨立 HTML（960pt × 540pt）
 *   <專案>/decks/<id>/index.html            概覽牆＋演示模式
 *   <專案>/index.html                       多方向入口（只有一套主題時省略）
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.dirname(HERE);

const args = process.argv.slice(2);
const flag = (k, d = null) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const PROJECT = path.resolve(flag('--project', process.cwd()));

const W = 1280, H = 720;   // 960pt × 540pt @ 96dpi

// ── 載入專案內容 ──────────────────────────────────────────
const load = (rel) => import(pathToFileURL(path.join(PROJECT, rel)).href);

const { DECK = {}, CHAPTERS = [], PAGES } = await load('content.js');
if (!Array.isArray(PAGES) || !PAGES.length) {
  console.error(`✗ ${PROJECT}/content.js 沒有 export 非空的 PAGES`);
  process.exit(1);
}

let DIAGRAMS = {};
if (fs.existsSync(path.join(PROJECT, 'diagrams.mjs'))) {
  ({ DIAGRAMS = {} } = await load('diagrams.mjs'));
}

const themesDir = path.join(PROJECT, 'themes');
const only = flag('--themes');
const wanted = only ? only.split(',').map((s) => s.trim()) : null;
const THEMES = [];
for (const f of fs.readdirSync(themesDir).filter((x) => x.endsWith('.js')).sort()) {
  const th = (await load(path.join('themes', f))).default;
  if (!wanted || wanted.includes(th.id)) THEMES.push(th);
}
if (!THEMES.length) { console.error('✗ themes/ 下沒有可用的主題'); process.exit(1); }

// ── 可用圖片清單：diagrams.mjs 產出的圖解 ＋ assets/ 底下現成的圖片 ──
// 兩者都用同一個 key 引用，版面只要給寬度就能等比縮放。
const IMAGES = {};

// 圖解：直接讀 viewBox（那是 pt 尺寸，比 PNG 像素數更權威）
for (const [k, svg] of Object.entries(DIAGRAMS)) {
  const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  if (!m) throw new Error(`圖解 ${k} 缺 viewBox="0 0 w h"`);
  IMAGES[k] = { src: `assets/diagrams/${k}.png`, w: parseFloat(m[1]), h: parseFloat(m[2]) };
}

// assets/ 底下的現成圖片（自己拍的、別處畫的、logo…），以相對路徑去副檔名當 key
const IMG_EXT = /\.(png|jpe?g|webp|gif)$/i;
const walk = (dir, base = '') => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const rel = base ? `${base}/${e.name}` : e.name;
    return e.isDirectory() ? walk(path.join(dir, e.name), rel) : (IMG_EXT.test(e.name) ? [rel] : []);
  });
};
const sharp = (await import('sharp')).default;
for (const rel of walk(path.join(PROJECT, 'assets'))) {
  const key = rel.replace(IMG_EXT, '');
  if (IMAGES[key]) continue;                    // 圖解已用 viewBox 註冊過，不要被 PNG 像素蓋掉
  const { width, height } = await sharp(path.join(PROJECT, 'assets', rel)).metadata();
  IMAGES[key] = { src: `assets/${rel}`, w: width, h: height };
}

// 講者備忘稿寫進 meta 的 content：換行編成 &#10;，匯出時再還原
const attrEsc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/\r?\n/g, '&#10;');

const shell = (theme, page, body, idx) => `<!DOCTYPE html>
<html lang="${DECK.lang || 'zh-Hant'}">
<head>
<meta charset="UTF-8">
<title>${String(idx).padStart(2, '0')} · ${page.short || page.title || page.title1 || '封面'}</title>
${page.speaker ? `<meta name="speaker-notes" content="${attrEsc(page.speaker)}">` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${theme.fonts}
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:960pt; height:540pt; position:relative; overflow:hidden; -webkit-font-smoothing:antialiased; }
  h1,h2,h3,h4,h5,h6,p { font-weight:inherit; }
${theme.css}
</style>
</head>
<body>
${body}
</body>
</html>
`;

function buildIndex(theme, files) {
  let html = fs.readFileSync(path.join(SKILL, 'assets', 'deck_index.html'), 'utf8');
  const manifest = files
    .map((f) => `    { file: "slides/${f.file}", label: ${JSON.stringify(f.label)} },`)
    .join('\n');
  html = html.replace(/window\.DECK_MANIFEST = \[[\s\S]*?\];/, `window.DECK_MANIFEST = [\n${manifest}\n  ];`);
  html = html.replace(/window\.DECK_WIDTH = \d+;/, `window.DECK_WIDTH = ${W};`);
  html = html.replace(/window\.DECK_HEIGHT = \d+;/, `window.DECK_HEIGHT = ${H};`);
  const title = THEMES.length > 1
    ? `${DECK.title || 'Deck'} · 方向 ${theme.id} ${theme.name}`
    : (DECK.title || 'Deck');
  html = html.replace(/window\.DECK_TITLE = ".*?";/, `window.DECK_TITLE = ${JSON.stringify(title)};`);
  return html;
}

const ctxFor = (i) => ({
  deck: DECK,
  index: i + 1,
  total: PAGES.length,
  chapters: CHAPTERS,
  chapterOf: (p) => CHAPTERS.find((c) => c.id === p.ch) || null,
  chapterIndex: (p) => CHAPTERS.findIndex((c) => c.id === p.ch),
  // 圖片查詢：dsize 給原生寬高、dsrc 給投影片用的相對路徑
  dsize: (name) => {
    const im = IMAGES[name];
    if (!im) throw new Error(`未知圖片「${name}」——需為 diagrams.mjs 的 key（記得跑 render_diagrams.mjs），或 assets/ 底下的圖檔`);
    return [im.w, im.h];
  },
  dsrc: (name) => `../${IMAGES[name].src}`,
});

const report = [];
for (const theme of THEMES) {
  const dir = path.join(PROJECT, 'decks', theme.id);
  const slidesDir = path.join(dir, 'slides');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(slidesDir, { recursive: true });

  // 每套 deck 自帶資產副本 → 整個資料夾可獨立搬移
  const srcAssets = path.join(PROJECT, 'assets');
  if (fs.existsSync(srcAssets)) {
    fs.cpSync(srcAssets, path.join(dir, 'assets'), { recursive: true });
  }

  const files = [];
  PAGES.forEach((p, i) => {
    const ctx = ctxFor(i);
    const body = theme.render(p, ctx);
    if (!body) throw new Error(`方向 ${theme.id} 第 ${i + 1} 頁（type=${p.type}）沒有輸出——主題沒實作這個頁型`);
    const name = `${String(i + 1).padStart(2, '0')}-${p.type}.html`;
    fs.writeFileSync(path.join(slidesDir, name), shell(theme, p, body, i + 1), 'utf8');
    files.push({ file: name, label: p.short || p.title || `${p.title1 || ''}${p.title2 || ''}` });
  });

  fs.writeFileSync(path.join(dir, 'index.html'), buildIndex(theme, files), 'utf8');
  report.push(`方向 ${theme.id} · ${theme.name}　→　${files.length} 頁 + 概覽牆`);
}

// ── 多方向時才產根目錄入口 ──
if (THEMES.length > 1) {
  const rootIndex = `<!DOCTYPE html>
<html lang="${DECK.lang || 'zh-Hant'}">
<head>
<meta charset="UTF-8">
<title>${DECK.title || 'Deck'} · ${THEMES.length} 個設計方向</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { min-height:100vh; background:#F1F2F0; color:#14161A;
         font-family:"Noto Sans TC","Microsoft JhengHei",sans-serif; padding:64px 72px; }
  h1 { font-size:38px; font-weight:900; letter-spacing:0.01em; }
  .sub { margin-top:12px; font-size:15px; font-weight:300; color:#4F5358; line-height:1.7; }
  .grid { margin-top:44px; display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:20px; }
  a.card { display:block; padding:28px 26px; background:#FFFFFF; border:1px solid #DCDEDB;
           border-radius:10px; text-decoration:none; color:inherit; transition:border-color .18s ease; }
  a.card:hover { border-color:#D4501A; }
  .id { font-size:12px; letter-spacing:0.2em; color:#D4501A; }
  .nm { margin-top:14px; font-size:23px; font-weight:700; }
  .ds { margin-top:10px; font-size:13.5px; font-weight:300; color:#4F5358; line-height:1.65; }
  .mt { margin-top:18px; font-size:12px; color:#6E7278; }
</style>
</head>
<body>
  <h1>${DECK.title || 'Deck'} · ${THEMES.length} 個設計方向</h1>
  <p class="sub">同一份內容、同一組資產、同樣 ${PAGES.length} 頁，只換設計邏輯。點進任一版進入概覽牆，按 → 翻頁、ESC 回概覽。</p>
  <div class="grid">
${THEMES.map((t) => `    <a class="card" href="decks/${t.id}/index.html">
      <p class="id">方向 ${t.id}</p>
      <p class="nm">${t.name}</p>
      <p class="ds">${t.desc}</p>
      <p class="mt">${PAGES.length} 頁 · 960×540pt</p>
    </a>`).join('\n')}
  </div>
</body>
</html>
`;
  fs.writeFileSync(path.join(PROJECT, 'index.html'), rootIndex, 'utf8');
  report.push('根目錄入口：index.html');
}

console.log(report.join('\n'));
