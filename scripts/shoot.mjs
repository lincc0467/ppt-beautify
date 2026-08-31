#!/usr/bin/env node
/**
 * shoot.mjs — 逐頁截圖 ＋ 版面體檢（pageerror／溢出／小字）
 *
 * 用法：node shoot.mjs --project <專案目錄> [--decks A,B,C]
 *
 * 這一步不是為了好看，是驗收：溢出 = PPTX 匯出必失敗，字太小 = 現場看不見。
 * 有任何一項不合格就以 exit 1 結束，別把破版的 deck 交出去。
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const flag = (k, d = null) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const PROJECT = path.resolve(flag('--project', process.cwd()));
const MIN_PT = +flag('--min-pt', 9);   // 低於這個字級就是失誤；小標籤 9-10pt 是設計，正文請 >=13pt

const decksRoot = path.join(PROJECT, 'decks');
const ids = (flag('--decks') || fs.readdirSync(decksRoot).join(',')).split(',').map((s) => s.trim()).filter(Boolean);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e}`));

let n = 0;
for (const id of ids) {
  const slidesDir = path.join(decksRoot, id, 'slides');
  if (!fs.existsSync(slidesDir)) continue;
  const outDir = path.join(decksRoot, id, 'thumbs');
  fs.mkdirSync(outDir, { recursive: true });

  for (const f of fs.readdirSync(slidesDir).filter((x) => x.endsWith('.html')).sort()) {
    await page.goto(pathToFileURL(path.join(slidesDir, f)).href, { waitUntil: 'networkidle' });
    await page.waitForTimeout(320);

    const check = await page.evaluate((minPt) => {
      const body = document.body;
      const out = {};
      if (body.scrollWidth > body.clientWidth + 2 || body.scrollHeight > body.clientHeight + 2) {
        out.over = { w: body.scrollWidth, h: body.scrollHeight };
      }
      // 超出畫布邊界的絕對定位元素（scrollWidth 抓不到往上／往左溢出）
      const B = body.getBoundingClientRect();
      out.out = [...body.querySelectorAll('*')].filter((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width && !r.height) return false;
        return r.right > B.right + 2 || r.bottom > B.bottom + 2 || r.left < B.left - 2 || r.top < B.top - 2;
      }).slice(0, 4).map((el) => el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''));
      // 過小的正文字級（px → pt 換算：×0.75）
      out.tiny = [...body.querySelectorAll('p,h1,h2,h3,h4,h5,h6')].filter((el) => {
        if (!el.textContent.trim()) return false;
        return parseFloat(getComputedStyle(el).fontSize) * 0.75 < minPt - 0.05;   // pt→px 換算有浮點誤差
      }).length;
      // 空文字節點（多半是內容模型欄位打錯）
      out.empty = [...body.querySelectorAll('p,h1,h2,h3')].filter((el) => !el.textContent.trim()).length;
      return out;
    }, MIN_PT);

    if (check.over) problems.push(`${id}/${f} 溢出 ${check.over.w}×${check.over.h}px`);
    if (check.out?.length) problems.push(`${id}/${f} 元素出界：${check.out.join(', ')}`);
    if (check.tiny) problems.push(`${id}/${f} ${check.tiny} 個文字小於 ${MIN_PT}pt`);
    if (check.empty) problems.push(`${id}/${f} ${check.empty} 個空文字框`);

    await page.screenshot({ path: path.join(outDir, f.replace('.html', '.png')) });
    n++;
  }
}

await browser.close();
console.log(`截圖完成：${n} 張 → decks/*/thumbs/`);
if (problems.length) {
  console.log('⚠️ 版面體檢未過：');
  problems.forEach((p) => console.log('  ' + p));
  process.exit(1);
}
console.log('版面體檢通過：無 pageerror、無溢出、無過小字。');
