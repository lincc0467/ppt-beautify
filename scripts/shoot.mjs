#!/usr/bin/env node
/**
 * shoot.mjs — 逐頁截圖 ＋ 版面體檢（pageerror／溢出／小字／疊字）
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
      // 疊字／壓線：只驗溢出的話，抓不到「線切進字裡」與「兩段文字疊在一起」——
      // 這兩種是版面寫死行距時最常見的破法，截圖上看得到、程式卻不報錯。
      //
      // 量的是「墨水範圍」不是行盒：行盒含 line-height 的上下空隙，用它會整片誤報。
      // 另外要避開「遮罩」——有些主題用不透明色塊蓋掉線的中段來放標籤（迴圈帶就是），那是刻意的。
      const ink = [];
      const boxes = [];   // 不透明色塊，供遮罩判定
      const rules = [];   // 細長實心 div ＝ 分隔線／色條
      const opaque = (el) => {
        const bg = getComputedStyle(el).backgroundColor;
        return bg && bg !== 'transparent' && !/rgba\(.*,\s*0\s*\)$/.test(bg);
      };
      let order = 0;
      for (const el of body.querySelectorAll('*')) {
        const i = order++;
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        if (el.tagName === 'DIV' && opaque(el)) {
          // 遮罩盒多半自己就裝著標籤文字（迴圈帶），所以不能因為有子元素就排除
          boxes.push({ r, i });
          if (!el.children.length && !el.textContent.trim()
              && ((r.height <= 5 && r.width > 20) || (r.width <= 5 && r.height > 20))) rules.push({ r, i });
        }
        if (/^(P|H[1-6])$/.test(el.tagName) && el.textContent.trim()) {
          const range = document.createRange();
          range.selectNodeContents(el);
          for (const cr of range.getClientRects()) {
            if (cr.width < 2 || cr.height < 2) continue;
            const pad = cr.height * 0.2;                       // 只取中間 60% 當墨水
            ink.push({ r: { left: cr.left, right: cr.right, top: cr.top + pad, bottom: cr.bottom - pad },
                       t: el.textContent.trim().slice(0, 26), i, el });
          }
        }
      }
      const lap = (a, b) => ({
        x: Math.min(a.right, b.right) - Math.max(a.left, b.left),
        y: Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top),
      });
      const hits = [];
      // 線壓字
      for (const L of rules) {
        for (const T of ink) {
          const o = lap(L.r, T.r);
          if (o.x <= 6 || o.y <= 0.5) continue;
          const x1 = Math.max(L.r.left, T.r.left), x2 = Math.min(L.r.right, T.r.right);
          // 線之後畫的不透明色塊若整段蓋住它，就是刻意的遮罩，不算破版
          const masked = boxes.some((B) => B.i > L.i && B.r.top <= L.r.top + 0.5 && B.r.bottom >= L.r.bottom - 0.5
                                        && B.r.left <= x1 + 0.5 && B.r.right >= x2 - 0.5);
          if (!masked) hits.push(`線壓「${T.t}」`);
        }
      }
      // 字壓字（同一個 <p> 折出來的相鄰行不算）
      for (let a = 0; a < ink.length; a++) {
        for (let b = a + 1; b < ink.length; b++) {
          if (ink[a].el === ink[b].el) continue;
          const o = lap(ink[a].r, ink[b].r);
          if (o.x > 4 && o.y > 1.5) hits.push(`「${ink[a].t}」壓「${ink[b].t}」`);
        }
      }
      out.lap = [...new Set(hits)].slice(0, 3);
      out.lapN = new Set(hits).size;
      // 空文字節點（多半是內容模型欄位打錯）
      out.empty = [...body.querySelectorAll('p,h1,h2,h3')].filter((el) => !el.textContent.trim()).length;
      return out;
    }, MIN_PT);

    if (check.over) problems.push(`${id}/${f} 溢出 ${check.over.w}×${check.over.h}px`);
    if (check.out?.length) problems.push(`${id}/${f} 元素出界：${check.out.join(', ')}`);
    if (check.tiny) problems.push(`${id}/${f} ${check.tiny} 個文字小於 ${MIN_PT}pt`);
    if (check.empty) problems.push(`${id}/${f} ${check.empty} 個空文字框`);
    if (check.lapN) problems.push(`${id}/${f} ${check.lapN} 處疊字／壓線：${check.lap.join('、')}`);

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
console.log('版面體檢通過：無 pageerror、無溢出、無過小字、無疊字。');
