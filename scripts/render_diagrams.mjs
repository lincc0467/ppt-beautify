#!/usr/bin/env node
/**
 * render_diagrams.mjs — 圖解 SVG 原始碼 → 3x PNG，供投影片以 <img> 嵌入
 *
 * 用法：node render_diagrams.mjs --project <專案目錄>
 *
 * 為什麼要這一步：可編輯 PPTX 的 Path A 硬約束禁用複雜 SVG，但簡報需要圖解。
 * 折衷是「圖以真 SVG 撰寫 → 渲染成高解析 PNG → 用 <img> 嵌入」：
 * 頁面文字在 PPTX 裡仍可編輯，圖是圖片；向量原始檔留在 diagrams.mjs，改圖改原始碼。
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const flag = (k, d = null) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const PROJECT = path.resolve(flag('--project', process.cwd()));
const SCALE = +flag('--scale', 3);

const src = path.join(PROJECT, 'diagrams.mjs');
if (!fs.existsSync(src)) { console.log('沒有 diagrams.mjs，略過'); process.exit(0); }
const { DIAGRAMS } = await import(pathToFileURL(src).href);

const OUT = path.join(PROJECT, 'assets', 'diagrams');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
for (const [name, svg] of Object.entries(DIAGRAMS)) {
  fs.writeFileSync(path.join(OUT, `${name}.svg`), svg, 'utf8');

  const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  if (!m) throw new Error(`圖解 ${name} 缺 viewBox="0 0 w h"`);
  const w = Math.ceil(parseFloat(m[1])), h = Math.ceil(parseFloat(m[2]));

  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: SCALE });
  await page.setContent(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0}html,body{width:${w}px;height:${h}px;background:transparent}svg{display:block}</style>
</head><body>${svg}</body></html>`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), omitBackground: true });
  await page.close();
  console.log(`${name}  ${w}×${h}pt  →  ${w * SCALE}×${h * SCALE}px`);
}
await browser.close();
