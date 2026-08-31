#!/usr/bin/env node
/**
 * extract_pptx.mjs — 把既有 .pptx 拆成純文字大綱，供改版時建 content.js
 *
 * 用法：
 *   node extract_pptx.mjs <原檔.pptx> [--out outline.md] [--json outline.json]
 *
 * 輸出每頁：標題（版面配置的 title 佔位符）／各文字框的段落／講者備忘稿，
 * 並統計圖片、表格、圖表數量——用來判斷原檔是不是純文字 deck。
 *
 * 零外部依賴：自行解 ZIP（PPTX 就是 ZIP）＋ 正則掃 DrawingML 文字節點。
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// ── 極簡 ZIP 讀取器（只需 stored / deflate 兩種壓縮法，PPTX 不會有別的）──
function readZip(buf) {
  const files = new Map();
  // 由檔尾往回找 End of Central Directory
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('不是合法的 ZIP／PPTX 檔（找不到 EOCD）');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);

  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const cmtLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);

    // 本地檔頭的 extra 長度可能與中央目錄不同，必須重讀
    const lNameLen = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const start = localOff + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(start, start + compSize);
    files.set(name, method === 0 ? raw : zlib.inflateRawSync(raw));

    p += 46 + nameLen + extraLen + cmtLen;
  }
  return files;
}

const unesc = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&amp;/g, '&');

// 一個 <a:p> 是一段；段內所有 <a:t> 串起來就是該段文字
function paragraphs(xml) {
  const out = [];
  for (const m of xml.matchAll(/<a:p\b[\s\S]*?<\/a:p>/g)) {
    const txt = [...m[0].matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)]
      .map((t) => unesc(t[1])).join('').trim();
    // 縮排層級（條列的巢狀深度）
    const lvl = /lvl="(\d+)"/.exec(m[0]);
    if (txt) out.push({ text: txt, level: lvl ? +lvl[1] : 0 });
  }
  return out;
}

// 拆出每個形狀，並判斷哪個是標題佔位符
function shapes(xml) {
  const out = [];
  for (const m of xml.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)) {
    const s = m[0];
    const ph = /<p:ph\b[^>]*type="(\w+)"/.exec(s);
    const name = /<p:cNvPr\b[^>]*name="([^"]*)"/.exec(s);
    const ps = paragraphs(s);
    if (!ps.length) continue;
    out.push({
      placeholder: ph ? ph[1] : (/<p:ph\b/.test(s) ? 'body' : null),
      name: name ? unesc(name[1]) : '',
      paragraphs: ps,
    });
  }
  return out;
}

function tables(xml) {
  return [...xml.matchAll(/<a:tbl>[\s\S]*?<\/a:tbl>/g)].map((m) =>
    [...m[0].matchAll(/<a:tr\b[\s\S]*?<\/a:tr>/g)].map((r) =>
      [...r[0].matchAll(/<a:tc\b[\s\S]*?<\/a:tc>/g)].map((c) =>
        [...c[0].matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((t) => unesc(t[1])).join('').trim()
      )
    )
  );
}

const args = process.argv.slice(2);
const src = args.find((a) => !a.startsWith('--'));
const flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
if (!src) {
  console.error('用法: node extract_pptx.mjs <原檔.pptx> [--out outline.md] [--json outline.json]');
  process.exit(1);
}

const zip = readZip(fs.readFileSync(path.resolve(src)));

const slideNames = [...zip.keys()]
  .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
  .sort((a, b) => (+a.match(/(\d+)/)[1]) - (+b.match(/(\d+)/)[1]));

const deck = slideNames.map((n, i) => {
  const xml = zip.get(n).toString('utf8');
  const sps = shapes(xml);
  const titleSp = sps.find((s) => s.placeholder === 'title' || s.placeholder === 'ctrTitle');
  const body = sps.filter((s) => s !== titleSp);

  // 講者備忘稿
  const notesName = `ppt/notesSlides/notesSlide${i + 1}.xml`;
  const notes = zip.has(notesName)
    ? paragraphs(zip.get(notesName).toString('utf8')).map((p) => p.text)
        .filter((t) => t !== String(i + 1)).join('\n')
    : '';

  return {
    index: i + 1,
    title: titleSp ? titleSp.paragraphs.map((p) => p.text).join(' ') : '',
    blocks: body.map((s) => ({ name: s.name, lines: s.paragraphs })),
    tables: tables(xml),
    images: (xml.match(/<p:pic>/g) || []).length,
    charts: (xml.match(/graphicFrame/g) || []).length,
    notes,
  };
});

const md = [
  `# 原檔大綱 · ${path.basename(src)}`,
  '',
  `共 ${deck.length} 頁。圖片 ${deck.reduce((a, s) => a + s.images, 0)} 張、表格 ${deck.reduce((a, s) => a + s.tables.length, 0)} 個。`,
  '',
  ...deck.flatMap((s) => [
    `## ${String(s.index).padStart(2, '0')} · ${s.title || '（無標題佔位符）'}`,
    '',
    ...s.blocks.flatMap((b) => b.lines.map((l) => `${'  '.repeat(l.level)}- ${l.text}`)),
    ...s.tables.flatMap((t, ti) => [
      '',
      `表格 ${ti + 1}：`,
      ...t.map((row) => `  | ${row.join(' | ')} |`),
    ]),
    ...(s.images ? ['', `（本頁含 ${s.images} 張圖片）`] : []),
    ...(s.notes ? ['', '> 備忘稿：' + s.notes.replace(/\n/g, '\n> ')] : []),
    '',
  ]),
].join('\n');

const outMd = flag('--out');
if (outMd) { fs.writeFileSync(path.resolve(outMd), md, 'utf8'); console.log(`大綱 → ${outMd}`); }
else console.log(md);

const outJson = flag('--json');
if (outJson) {
  fs.writeFileSync(path.resolve(outJson), JSON.stringify(deck, null, 2), 'utf8');
  console.log(`結構 → ${outJson}`);
}
