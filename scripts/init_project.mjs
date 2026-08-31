#!/usr/bin/env node
/**
 * init_project.mjs — 在工作目錄建立一個改版專案的骨架
 *
 * 用法：
 *   node init_project.mjs --project <目錄> [--themes A,B,C] [--force]
 *
 * 複製過去的東西（已存在的檔案預設不覆蓋）：
 *   content.js        內容模型範本（含全部 9 種頁型的欄位示範，可直接跑）
 *   diagrams.mjs      圖解範本
 *   themes/theme-*.js 設計主題
 *   assets/           空資料夾，放 logo 等素材
 *
 * 之後：
 *   node <skill>/scripts/render_diagrams.mjs --project <目錄>
 *   node <skill>/scripts/build.mjs           --project <目錄>
 *   node <skill>/scripts/shoot.mjs           --project <目錄>
 *   node <skill>/scripts/export_deck_pptx.mjs --slides <目錄>/decks/A/slides --out 成品.pptx
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TPL = path.join(path.dirname(HERE), 'templates');

const args = process.argv.slice(2);
const flag = (k, d = null) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const PROJECT = path.resolve(flag('--project', process.cwd()));
const FORCE = args.includes('--force');
const themeIds = (flag('--themes', 'A,B,C')).split(',').map((s) => s.trim().toLowerCase());

fs.mkdirSync(path.join(PROJECT, 'themes'), { recursive: true });
fs.mkdirSync(path.join(PROJECT, 'assets'), { recursive: true });

const copy = (from, to) => {
  const dst = path.join(PROJECT, to);
  if (fs.existsSync(dst) && !FORCE) { console.log(`略過（已存在）：${to}`); return; }
  fs.copyFileSync(path.join(TPL, from), dst);
  console.log(`建立：${to}`);
};

copy('content.js', 'content.js');
copy('diagrams.mjs', 'diagrams.mjs');
for (const id of themeIds) copy(path.join('themes', `theme-${id}.js`), path.join('themes', `theme-${id}.js`));

console.log(`\n專案骨架已建立於 ${PROJECT}`);
console.log('下一步：改寫 content.js，然後跑 build.mjs。');
