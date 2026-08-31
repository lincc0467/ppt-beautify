// 方向 A ·「敘事軸」— 冷調紙灰底 + 單一橙，一條階梯敘事軸貫穿全場
// form 來源：內容若有「起伏／轉折」的敘事弧線，就把弧線本身畫成貫穿全場的軸。
// 波形以 CSS 線段實作（Path A 禁用複雜 SVG）——戲劇性有損失，這是誠實降級。
//
// 改色只改 C；改敘事波形改 content.js 的 DECK.arc，不要動這裡。

const C = {
  bg: '#F1F2F0', ink: '#14161A', mut: '#4F5358', dim: '#6E7278',
  line: '#DCDEDB', rule: '#BFC3BE', acc: '#D4501A', off: '#8E9294',
};

const br = (s) => String(s ?? '').replace(/\n/g, '<br>');

// 標題寬度：全形算 1、半形算 0.5。用字元數當寬度會把「(量尺 Score@K)」誤判成超長，
// 讓 lead 白白下移一階、而條列起點沒跟著移，第二行就會壓到第一列。
const tw = (s) => [...String(s ?? '')].reduce(
  (a, c) => a + (/[⺀-鿿　-〿＀-｠￠-￦]/.test(c) ? 1 : 0.5), 0);

export default {
  id: 'A',
  name: '敘事軸',
  desc: '冷調紙灰 + 單一橙，一條階梯敘事軸貫穿全場，每頁標出所在位置',
  fonts: `<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap" rel="stylesheet">`,

  css: `
  body { background:${C.bg}; font-family:"Noto Sans TC","Microsoft JhengHei",sans-serif; }
  /* 等寬字用系統內建款（Windows 有 Consolas、macOS 有 Menlo）——
     PPTX 只保留字型鏈的第一個名稱，用 webfont 會在沒裝字型的機器上 fallback 破版 */
  .mono { font-family:"Consolas","Menlo","Noto Sans TC","Microsoft JhengHei",monospace; font-variant-numeric:tabular-nums; }
  h1,h2,h3 { color:${C.ink}; }
  .kick { font-size:11pt; letter-spacing:0.2em; color:${C.dim}; }
  .h2   { font-size:34pt; font-weight:900; line-height:1.24; letter-spacing:0.01em; color:${C.ink}; }
  .lead { font-size:17pt; font-weight:300; line-height:1.55; color:${C.mut}; }
  .k    { font-size:18pt; font-weight:700; line-height:1.4; color:${C.ink}; }
  .v    { font-size:15pt; font-weight:300; line-height:1.5; color:${C.mut}; }
  .no   { font-size:16pt; font-weight:500; letter-spacing:0.1em; color:${C.acc}; font-variant-numeric:tabular-nums; }
  .num  { font-size:48pt; font-weight:900; line-height:1; color:${C.ink}; font-variant-numeric:tabular-nums; }
  .unit { font-size:14pt; font-weight:400; color:${C.dim}; }
  .lbl  { font-size:13.5pt; font-weight:300; line-height:1.4; color:${C.mut}; }
  `,

  // ── 共用：頁首（章節標 + 進度條）──
  head(p, ctx) {
    const ch = ctx.chapterOf(p);
    const kick = [ch ? `${ch.no} ${ch.name}` : '', p.stepNo ? `STEP ${p.stepNo}` : '']
      .filter(Boolean).join('　/　');
    const w = Math.round(828 * (ctx.index / ctx.total));
    return `
  ${kick ? `<div style="position:absolute; left:64pt; top:46pt; width:600pt;"><p class="mono kick">${kick}</p></div>` : ''}
  <div style="position:absolute; left:64pt; top:46pt; width:832pt; text-align:right;"><p class="mono kick">${String(ctx.index).padStart(2, '0')} / ${ctx.total}</p></div>
  <div style="position:absolute; left:64pt; top:70pt; width:832pt; height:1pt; background:${C.line};"></div>
  <div style="position:absolute; left:64pt; top:69pt; width:${w}pt; height:3pt; background:${C.acc};"></div>`;
  },

  // ── 共用：底部敘事軸縮影 ──
  axis(ctx) {
    const x = 64 + Math.round(828 * ((ctx.index - 1) / Math.max(1, ctx.total - 1)));
    return `
  <div style="position:absolute; left:64pt; top:504pt; width:828pt; height:1pt; background:${C.line};"></div>
  <div style="position:absolute; left:${Math.min(x, 890)}pt; top:500pt; width:9pt; height:9pt; background:${C.acc};"></div>`;
  },

  // 圖以 <img> 嵌入（Path A 規則 4 允許），等比依原生尺寸縮放。
  // frame：不透明底的圖（截圖、外部圖表）加一圈細框收邊，否則白底會在紙灰底上跳出來。
  // 邊框畫在墊底的 div 上，不是寫在 img 上 —— Path A 規則 3。
  img(ctx, name, x, y, w, frame = false) {
    const [nw, nh] = ctx.dsize(name);
    const h = +(w * nh / nw).toFixed(1);
    const tag = `<img src="${ctx.dsrc(name)}" style="position:absolute; left:${x}pt; top:${y}pt; width:${w}pt; height:${h}pt;" alt="">`;
    if (!frame) return tag;
    const pad = 6;
    return `<div style="position:absolute; left:${x - pad}pt; top:${y - pad}pt; width:${w + pad * 2}pt; height:${h + pad * 2}pt; background:#FFFFFF; border:1pt solid ${C.line};"></div>` + tag;
  },

  // 在給定矩形內置中並等比塞入一或多張圖（寬高皆不溢出）
  //
  // 多張並排時不是等比一起縮 —— 那會讓「又扁又長」的那張把所有圖都拖小。
  // 作法是：其餘的圖用滿帶高，最扁的那張吃掉剩下的寬度。
  fit(ctx, names, { top, bottom, maxW = 800, gap = 24 }) {
    // 每張可寫成 'name' 或 { img:'name', frame:true }
    const list = (Array.isArray(names) ? names : [names])
      .map((v) => (typeof v === 'string' ? { img: v, frame: false } : v));
    const availH = bottom - top;
    const ar = list.map(({ img }) => { const [w, h] = ctx.dsize(img); return w / h; });

    let widths = ar.map((a) => availH * a);
    let total = widths.reduce((a, b) => a + b, 0) + gap * (list.length - 1);
    if (total > maxW) {
      const flat = ar.reduce((mi, a, i) => (a > ar[mi] ? i : mi), 0);   // 最扁的那張
      const others = widths.reduce((a, w, i) => (i === flat ? a : a + w), 0);
      const rest = maxW - gap * (list.length - 1) - others;
      if (rest > 40) widths[flat] = rest;
      else {                                                            // 讓不出來就整排等比縮
        const k = (maxW - gap * (list.length - 1)) / widths.reduce((a, b) => a + b, 0);
        widths = widths.map((w) => w * k);
      }
      total = widths.reduce((a, b) => a + b, 0) + gap * (list.length - 1);
    }

    let x = 480 - total / 2;
    return list.map(({ img, frame }, i) => {
      const w = widths[i], h = w / ar[i];
      const out = this.img(ctx, img, Math.round(x), Math.round(top + (availH - h) / 2), +w.toFixed(1), frame);
      x += w + gap;
      return out;
    }).join('');
  },

  // leadTop 同時決定 lead 位置與條列起點，兩者必須同一個來源
  leadTop(p) { return tw(p.title) > 18 ? 178 : 142; },

  title(p) {
    return `
  <div style="position:absolute; left:64pt; top:94pt; width:760pt;"><h2 class="h2">${br(p.title)}</h2></div>
  ${p.lead ? `<div style="position:absolute; left:64pt; top:${this.leadTop(p)}pt; width:640pt;"><p class="lead">${p.lead}</p></div>` : ''}`;
  },

  // turn 頁專用：標題不帶大 lead（lead 另放在兩欄之上，避免壓到分隔線）
  head0(p) {
    return `
  <div style="position:absolute; left:64pt; top:94pt; width:760pt;"><h2 class="h2">${br(p.title)}</h2></div>
  ${p.lead ? `<div style="position:absolute; left:64pt; top:150pt; width:640pt;"><p class="lead" style="font-size:15pt;">${p.lead}</p></div>` : ''}`;
  },

  // 迴圈帶：內容有「回饋回到起點」的結構才畫；沒有 loopLabel 就不畫
  loop(ctx, p, y) {
    const label = p.loopLabel || ctx.deck.loopLabel;
    if (!label) return '';
    return `
  <div style="position:absolute; left:64pt;  top:${y}pt; width:2pt; height:22pt; background:${C.rule};"></div>
  <div style="position:absolute; left:894pt; top:${y}pt; width:2pt; height:22pt; background:${C.rule};"></div>
  <div style="position:absolute; left:64pt;  top:${y + 20}pt; width:284pt; height:2pt; background:${C.rule};"></div>
  <div style="position:absolute; left:612pt; top:${y + 20}pt; width:284pt; height:2pt; background:${C.rule};"></div>
  <div style="position:absolute; left:352pt; top:${y + 12}pt; width:256pt;">
    <p class="mono" style="font-size:11pt; letter-spacing:0.14em; line-height:19pt; color:${C.dim}; text-align:center;">${label}</p>
  </div>`;
  },

  render(p, ctx) {
    const t = this;
    const D = ctx.deck || {};

    switch (p.type) {

      case 'cover': {
        // 敘事波形由 DECK.arc 生成：每站一段線，高度 = level（0 低 100 高），hero 站上色
        const arc = (D.arc && D.arc.length)
          ? D.arc
          : ctx.chapters.map((c, i) => ({ label: c.name, level: 30 + i * 20 }));
        const n = arc.length;
        const segW = Math.floor(832 / n);
        const topOf = (lvl) => Math.round(470 - (Math.max(0, Math.min(100, lvl ?? 50)) / 100) * 74);

        const segs = arc.map((a, i) => {
          const col = a.hero ? C.acc : (a.dim ? C.off : C.rule);
          return `<div style="position:absolute; left:${64 + i * segW}pt; top:${topOf(a.level)}pt; width:${segW - 2}pt; height:2pt; background:${col};"></div>`;
        }).join('');

        const conns = arc.slice(0, -1).map((a, i) => {
          const y1 = topOf(a.level), y2 = topOf(arc[i + 1].level);
          const top = Math.min(y1, y2), h = Math.max(2, Math.abs(y2 - y1));
          const col = arc[i + 1].hero ? C.acc : C.rule;
          return `<div style="position:absolute; left:${64 + (i + 1) * segW - 2}pt; top:${top}pt; width:2pt; height:${h}pt; background:${col};"></div>`;
        }).join('');

        const marks = arc.map((a, i) => a.hero
          ? `<div style="position:absolute; left:${64 + i * segW - 6}pt; top:${topOf(a.level) - 6}pt; width:13pt; height:13pt; background:${C.acc};"></div>`
          : '').join('');

        const labels = arc.map((a, i) => `
  <div style="position:absolute; left:${64 + i * segW}pt; top:482pt; width:${segW}pt;"><p class="mono" style="font-size:11pt; letter-spacing:0.14em; color:${a.hero ? C.acc : C.dim};">${a.label}</p></div>`).join('');

        return `
  <div style="position:absolute; left:64pt; top:52pt; width:832pt;"><p class="mono" style="font-size:11pt; font-weight:500; letter-spacing:0.22em; color:${C.acc};">${String(D.kicker || '').replace(/ /g, '&nbsp;')}</p></div>
  <div style="position:absolute; left:64pt; top:52pt; width:832pt; text-align:right;"><p class="mono" style="font-size:11pt; letter-spacing:0.18em; color:${C.dim};">${[D.occasion, D.meta].filter(Boolean).join('&nbsp;/&nbsp;')}</p></div>
  <div style="position:absolute; left:64pt; top:78pt; width:832pt; height:1pt; background:${C.line};"></div>
  <div style="position:absolute; left:64pt; top:150pt; width:800pt;">
    <h1 style="font-size:66pt; font-weight:900; line-height:1.16; letter-spacing:0.01em;">${p.title1}</h1>
    ${p.title2 ? `<h1 style="font-size:66pt; font-weight:900; line-height:1.16; letter-spacing:0.01em;">${p.title2}</h1>` : ''}
  </div>
  ${p.sub ? `<div style="position:absolute; left:64pt; top:318pt; width:620pt;"><p style="font-size:21pt; font-weight:300; line-height:1.6; color:${C.mut};">${p.sub}</p></div>` : ''}
  ${segs}${conns}${marks}${labels}`;
      }

      case 'bullets': {
        // 版面由可用高度反推行距，不寫死常數——否則行數變多或有頁尾帶時會疊字
        const hasBand = !!(p.logos || p.footer);
        // 大數字帶（選填）：條列上方橫排幾個數字，把最有份量的數字提到視覺主角
        const stats = p.stats || [];
        const bandTop = p.lead ? t.leadTop(p) + 64 : 182;
        const statH = stats.length ? 100 : 0;   // 數字帶實高約 77pt，其餘留給與條列之間的呼吸
        const areaTop = bandTop + statH;
        const n = p.items.length;
        // 有圖時：條目排雙欄、行高壓縮，把高度讓給圖（圖是主角，不是插圖）
        const twoCol = !!p.diagram && !p.diagramOnly && n >= 4;
        const rowsCount = twoCol ? Math.ceil(n / 2) : n;
        const rowH = twoCol ? 54 : (p.diagram ? 34 : ((hasBand ? 414 : 488) - areaTop) / n);
        const areaBot = p.diagramOnly ? areaTop - 14
          : (p.diagram ? areaTop + rowsCount * rowH : (hasBand ? 414 : 488));
        // diagramOnly 若同時有頁尾帶，圖高要讓出帶子的位置，否則會蓋上去
        const DIA_H = p.diagramOnly ? (hasBand ? 196 : 248) : (hasBand ? 400 : 486) - (areaBot + 14);
        const start = p.startNo || 1;
        const numW = p.numbered ? 60 : 0;
        const kX = 64 + numW;
        const kW = p.wideKey || 286;
        const vX = kX + kW + 20;
        const vW = 896 - vX;
        const kSize = p.diagram ? 16 : 18;
        const vSize = p.diagram ? 14 : 15;

        // diagramOnly：圖已完整承載這些條目，再列一次就是重複
        const rows = (p.diagramOnly ? [] : p.items).map((it, i) => {
          if (twoCol) {
            const col = i % 2, r = Math.floor(i / 2);
            const y = Math.round(areaTop + r * rowH);
            const cx = 64 + col * 428;
            return `
  ${col === 0 ? `<div style="position:absolute; left:64pt; top:${y - 10}pt; width:832pt; height:1pt; background:${C.line};"></div>` : ''}
  <div style="position:absolute; left:${cx}pt; top:${y}pt; width:404pt;" data-pptx-merge="true">
    <p class="k" style="font-size:15.5pt;">${it.k}</p>
    <p class="v" style="font-size:14pt; margin-top:4pt;">${it.v}</p>
  </div>`;
          }
          const y = Math.round(areaTop + i * rowH);
          return `
  <div style="position:absolute; left:64pt; top:${y - (p.diagram ? 9 : 15)}pt; width:832pt; height:1pt; background:${C.line};"></div>
  ${p.numbered ? `<div style="position:absolute; left:64pt; top:${y + 2}pt; width:52pt;"><p class="mono no" style="font-size:${p.diagram ? 14 : 16}pt;">${String(start + i).padStart(2, '0')}</p></div>` : ''}
  <div style="position:absolute; left:${kX}pt; top:${y}pt; width:${kW}pt;"><p class="k" style="font-size:${kSize}pt;">${it.k}</p></div>
  <div style="position:absolute; left:${vX}pt; top:${y + 2}pt; width:${vW}pt;"><p class="v" style="font-size:${vSize}pt;">${it.v}</p></div>`;
        }).join('');

        const statBand = stats.map((s, i) => {
          const w = Math.floor(832 / stats.length);
          const x = 64 + i * w;
          return `
  <div style="position:absolute; left:${x}pt; top:${bandTop}pt; width:${w - 18}pt; height:3pt; background:${s.hero ? C.acc : C.rule};"></div>
  <div style="position:absolute; left:${x}pt; top:${bandTop + 14}pt; width:${w - 18}pt;" data-pptx-merge="true">
    <p class="num" style="font-size:38pt; color:${s.hero ? C.acc : C.ink};">${s.value}${s.unit ? `<span class="unit">&nbsp;${s.unit}</span>` : ''}</p>
    <p class="lbl" style="margin-top:6pt;">${s.label}</p>
  </div>`;
        }).join('');

        const logos = p.logos ? `
  <div style="position:absolute; left:64pt; top:428pt; width:832pt; height:1pt; background:${C.rule};"></div>
  <div style="position:absolute; left:64pt; top:444pt; width:200pt;"><p class="mono kick" style="color:${C.acc};">${p.kicker || ''}</p></div>
  ${p.logos.map((g, i) => `
  ${g.src ? `<div style="position:absolute; left:${280 + i * 210}pt; top:440pt; width:200pt; height:30pt;"><img src="../assets/${g.src}" style="width:19pt; height:19pt; opacity:0.85;" alt=""></div>` : ''}
  <div style="position:absolute; left:${280 + i * 210 + (g.src ? 27 : 0)}pt; top:${g.src ? 444 : 440}pt; width:180pt;"><p style="font-size:13pt; color:${C.mut};">${g.text ? `<span class="mono" style="color:${C.ink};">${g.text}</span>　` : ''}${g.name}</p></div>`).join('')}` : '';

        const footer = (p.footer && !p.logos) ? `
  <div style="position:absolute; left:64pt; top:432pt; width:832pt; height:1pt; background:${C.acc};"></div>
  <div style="position:absolute; left:64pt; top:448pt; width:832pt;" data-pptx-merge="true">
    ${p.kicker ? `<p class="mono kick" style="color:${C.acc};">${p.kicker}</p>` : ''}
    <p style="font-size:17pt; font-weight:500; line-height:1.5; color:${C.ink}; margin-top:${p.kicker ? 6 : 0}pt;">${p.footer}</p>
  </div>` : '';

        const diaTop = areaBot + 16;
        const dia = p.diagram ? `
  <div style="position:absolute; left:64pt; top:${diaTop - 12}pt; width:832pt; height:1pt; background:${C.line};"></div>` +
          t.fit(ctx, p.diagram, { top: diaTop, bottom: diaTop + DIA_H, maxW: 812 }) : '';

        return t.head(p, ctx) + t.title(p) + statBand + rows + dia + logos + footer + t.axis(ctx);
      }

      case 'split': {
        const strip = (name, x) => (name ? t.img(ctx, name, x, 148, 380) : '');
        const col = (c, x, on) => `
  <div style="position:absolute; left:${x}pt; top:238pt; width:396pt; height:3pt; background:${on ? C.acc : C.rule};"></div>
  <div style="position:absolute; left:${x}pt; top:252pt; width:396pt;"><p style="font-size:19pt; font-weight:700; color:${on ? C.acc : C.dim};">${c.label}</p></div>
  ${c.items.map((s, i) => `
  <div style="position:absolute; left:${x}pt; top:${292 + i * 35}pt; width:396pt;">
    <p style="font-size:15pt; font-weight:${on ? 500 : 300}; line-height:1.4; color:${on ? C.ink : C.mut};">${s}</p>
  </div>
  <div style="position:absolute; left:${x}pt; top:${292 + i * 35 + 26}pt; width:396pt; height:1pt; background:${C.line};"></div>`).join('')}`;
        return t.head(p, ctx) + t.title(p) +
          strip(p.diagrams?.left, 64) + strip(p.diagrams?.right, 500) +
          col(p.left, 64, false) + col(p.right, 500, true) + t.axis(ctx);
      }

      case 'flow': {
        // A 版的 flow 以一張圖解當主角；沒有圖解時降級成橫向步驟條
        const notes = (p.notes || []).map((nt, i) => `
  <div style="position:absolute; left:${64 + i * 420}pt; top:424pt; width:400pt;" data-pptx-merge="true">
    <p class="mono kick" style="color:${C.acc};">${nt.k}</p>
    <p style="font-size:16pt; font-weight:300; line-height:1.5; color:${C.mut}; margin-top:8pt;">${nt.v}</p>
  </div>`).join('');
        const body = p.diagram
          ? t.img(ctx, p.diagram, 120, 208, 720)
          : (p.steps || []).map((s, i, arr) => {
            const w = Math.floor(832 / arr.length);
            return `
  <div style="position:absolute; left:${64 + i * w}pt; top:238pt; width:${w - 16}pt; height:3pt; background:${i === arr.length - 1 ? C.acc : C.rule};"></div>
  <div style="position:absolute; left:${64 + i * w}pt; top:254pt; width:${w - 16}pt;" data-pptx-merge="true">
    <p class="mono kick" style="color:${C.acc};">${String(i + 1).padStart(2, '0')}</p>
    <p style="font-size:18pt; font-weight:700; line-height:1.3; color:${C.ink}; margin-top:10pt;">${s.label}</p>
    <p class="v" style="margin-top:8pt;">${s.detail}</p>
  </div>`;
          }).join('');
        return t.head(p, ctx) + t.title(p) + body + `
  <div style="position:absolute; left:64pt; top:408pt; width:832pt; height:1pt; background:${C.line};"></div>` +
          notes + t.axis(ctx);
      }

      case 'steps': {
        const n = p.steps.length;
        const gap = 12;
        const w = Math.floor((832 - gap * (n - 1)) / n);
        const cols = p.steps.map((s, i) => `
  <div style="position:absolute; left:${64 + i * (w + gap)}pt; top:250pt; width:${w}pt; height:4pt; background:${C.acc};"></div>
  <div style="position:absolute; left:${64 + i * (w + gap)}pt; top:268pt; width:${w}pt;" data-pptx-merge="true">
    <p class="mono" style="font-size:28pt; font-weight:500; line-height:1; color:${C.acc};">${s.no}</p>
    <p style="font-size:18pt; font-weight:700; line-height:1.45; color:${C.ink}; margin-top:14pt;">${br(s.name)}</p>
  </div>`).join('');
        return t.head(p, ctx) + t.title(p) + cols + t.loop(ctx, p, 400) + t.axis(ctx);
      }

      case 'stat': {
        const cells = p.stats.map((s, i) => {
          const x = 64 + (i % 4) * 214, y = i < 4 ? 212 : 348;
          return `
  <div style="position:absolute; left:${x}pt; top:${y}pt; width:190pt; height:2pt; background:${s.hero ? C.acc : C.rule};"></div>
  <div style="position:absolute; left:${x}pt; top:${y + 14}pt; width:190pt;" data-pptx-merge="true">
    <p class="num" ${s.text ? 'style="font-size:38pt;"' : ''}>${s.value}${s.unit ? `<span class="unit">&nbsp;${s.unit}</span>` : ''}</p>
    <p class="lbl" style="margin-top:${s.text ? 14 : 10}pt;">${s.label}</p>
  </div>`;
        }).join('');
        return t.head(p, ctx) + `
  <div style="position:absolute; left:64pt; top:96pt; width:600pt;"><h2 class="h2">${br(p.title || p.short)}</h2></div>
  ${p.lead ? `<div style="position:absolute; left:64pt; top:146pt; width:560pt;"><p class="lead">${p.lead}</p></div>` : ''}` + cells + t.axis(ctx);
      }

      case 'case': {
        // 有圖時改為「圖解主導」：圖放上半，文字壓成下方兩欄
        if (p.diagram) {
          const cols = p.blocks.map((b, i) => `
  <div style="position:absolute; left:${64 + i * 432}pt; top:392pt; width:400pt; height:1pt; background:${C.rule};"></div>
  <div style="position:absolute; left:${64 + i * 432}pt; top:406pt; width:400pt;" data-pptx-merge="true">
    <p class="mono kick" style="color:${C.acc};">${b.label}</p>
    ${b.items.map((s) => `<p style="font-size:15pt; font-weight:300; line-height:1.5; color:${C.mut}; margin-top:7pt;">${s}</p>`).join('')}
  </div>`).join('');
          return t.head(p, ctx) + t.title(p) + t.img(ctx, p.diagram, 140, 168, 680) + cols + t.axis(ctx);
        }
        const gapY = Math.min(92, Math.floor((488 - 222) / Math.max(1, p.blocks.length)));
        const blocks = p.blocks.map((b, i) => `
  <div style="position:absolute; left:64pt; top:${222 + i * gapY}pt; width:832pt; height:1pt; background:${C.line};"></div>
  <div style="position:absolute; left:64pt; top:${238 + i * gapY}pt; width:220pt;"><p class="mono kick" style="color:${C.acc};">${b.label}</p></div>
  <div style="position:absolute; left:300pt; top:${232 + i * gapY}pt; width:596pt;" data-pptx-merge="true">
    ${b.items.map((s, j) => `<p style="font-size:16.5pt; font-weight:${j === 0 ? 500 : 300}; line-height:1.55; color:${j === 0 ? C.ink : C.mut}; margin-top:${j ? 6 : 0}pt;">${s}</p>`).join('')}
  </div>`).join('');
        return t.head(p, ctx) + t.title(p) + blocks + t.axis(ctx);
      }

      case 'turn': {
        const side = (d, x, on) => `
  <div style="position:absolute; left:${x}pt; top:196pt; width:396pt; height:3pt; background:${on ? C.acc : C.off};"></div>
  <div style="position:absolute; left:${x}pt; top:210pt; width:396pt;"><p style="font-size:17pt; font-weight:700; color:${on ? C.acc : C.dim};">${d.label}</p></div>
  <div style="position:absolute; left:${x}pt; top:238pt; width:396pt;" data-pptx-merge="true">
    <p style="font-size:70pt; font-weight:900; line-height:1; color:${on ? C.acc : C.off}; font-variant-numeric:tabular-nums;">${d.score}${d.unit ? `<span style="font-size:24pt; font-weight:400;">&nbsp;${d.unit}</span>` : ''}</p>
    ${d.note ? `<p class="lbl" style="margin-top:10pt;">${d.note}</p>` : ''}
  </div>
  ${(d.items || []).map((s, i) => `
  <div style="position:absolute; left:${x}pt; top:${372 + i * 34}pt; width:396pt;">
    <p style="font-size:15pt; font-weight:300; line-height:1.4; color:${on ? C.ink : C.mut};">${s}</p>
  </div>`).join('')}`;
        const band = p.sources ? `
  <div style="position:absolute; left:64pt; top:474pt; width:832pt; height:1pt; background:${C.line};"></div>
  <div style="position:absolute; left:64pt; top:486pt; width:400pt;"><p class="mono kick">${p.sourcesLabel || ''}</p></div>
  ${p.sources.map((s, i) => `
  ${s.src ? `<div style="position:absolute; left:${500 + i * 120}pt; top:486pt; width:19pt; height:19pt;"><img src="../assets/${s.src}" style="width:16pt; height:16pt; opacity:0.8;" alt=""></div>` : ''}
  <div style="position:absolute; left:${500 + i * 120 + (s.src ? 24 : 0)}pt; top:488pt; width:96pt;"><p style="font-size:12pt; color:${C.dim};">${s.name}</p></div>`).join('')}` : '';
        return t.head(p, ctx) + t.head0(p) +
          side(p.before, 64, false) + side(p.after, 500, true) + `
  <div style="position:absolute; left:470pt; top:250pt; width:20pt; height:2pt; background:${C.rule};"></div>` +
          // 有來源帶時底部已被佔用，沒有的話補上敘事軸，維持每頁一致
          (band || t.axis(ctx));
      }

      case 'closing': {
        const acts = (p.actions || []).map((s, i) => `
  <div style="position:absolute; left:64pt; top:${370 + i * 34}pt; width:52pt;"><p class="mono no">${String(i + 1).padStart(2, '0')}</p></div>
  <div style="position:absolute; left:116pt; top:${368 + i * 34}pt; width:780pt;"><p style="font-size:17pt; font-weight:300; line-height:1.4; color:${C.mut};">${s}</p></div>`).join('');
        return t.head(p, ctx) + t.title(p) + `
  <div style="position:absolute; left:64pt; top:196pt; width:832pt; height:3pt; background:${C.acc};"></div>
  <div style="position:absolute; left:64pt; top:214pt; width:832pt;" data-pptx-merge="true">
    ${p.keyLabel ? `<p class="mono kick" style="color:${C.acc};">${p.keyLabel}</p>` : ''}
    <p style="font-size:30pt; font-weight:900; line-height:1.35; color:${C.ink}; margin-top:12pt;">${p.key}</p>
  </div>
  <div style="position:absolute; left:64pt; top:330pt; width:832pt; height:1pt; background:${C.line};"></div>
  ${p.actionLabel ? `<div style="position:absolute; left:64pt; top:344pt; width:300pt;"><p class="mono kick">${p.actionLabel}</p></div>` : ''}` + acts + t.axis(ctx);
      }
    }
    return '';
  },
};
