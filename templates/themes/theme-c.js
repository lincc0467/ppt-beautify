// 方向 C ·「系統網格」— 白底嚴格模組網格 + 色彩即編碼
// form 來源：把資訊分類本身當成設計系統。章節有色、資料分組有色，色彩負責導航，零裝飾。
//
// 章節色：CHAPTERS 各項可自帶 color；沒帶就依序取 RAMP。
// 資料分組色：stat 頁的 group 依「首次出現順序」配 RAMP，不寫死中文分類名。

const C = {
  bg: '#FFFFFF', ink: '#1A1A1A', body: '#4A4A4A', mut: '#6E6E6E',
  line: '#D8D8D8', soft: '#F2F2F2',
};
const RAMP = ['#2E6DA4', '#5E9B47', '#7B5EA7', '#E08A2E', '#3D8A96', '#B5495B'];

const br = (s) => String(s ?? '').replace(/\n/g, '<br>');

// 標題寬度：全形算 1、半形算 0.5。用字元數當寬度會把「(量尺 Score@K)」誤判成超長，
// 讓 lead 白白下移一階、而條列起點沒跟著移，第二行就會壓到第一列。
const tw = (s) => [...String(s ?? '')].reduce(
  (a, c) => a + (/[⺀-鿿　-〿＀-｠￠-￦]/.test(c) ? 1 : 0.5), 0);

// ── lead 的行長 ───────────────────────────────────────────────
// 一行放得下就用滿版寬，放不下才退回舒適行長。
//
// 寫死一個窄行長的後果：長度落在兩者之間的 lead 會折成兩行、第二行只剩兩三個字，
// 而右邊還空著上百 pt。孤行比長行難看，而且這個區間很常中——
// 一份 20 頁的技術簡報實測有 11 頁的 lead 落在這裡。
//
// 寬度與行數必須同一個來源：table 的表頭起點是按 lead 佔幾行往下推的，
// 兩邊各算各的，表格就會依「假的行數」白白下移一階。
const LEAD_FS = 16.5, LEAD_FULL = 828, LEAD_MEASURE = 640;
// 一行容得下幾個全形；減 4 是餘裕——換行點是詞不是字，實測會比理論值提前折行
const leadCap = (w) => w / LEAD_FS - 4;
const leadW = (s) => (tw(s) <= leadCap(LEAD_FULL) ? LEAD_FULL : LEAD_MEASURE);
const leadLines = (s) => Math.ceil(tw(s) / leadCap(leadW(s)));

// figures.mjs 的通用色名 → 本 theme 的調色盤。
// acc 走章節色（色彩即編碼），在 render 裡才組得出來，這裡只放不隨章節變的部分。
const FCBASE = { accSoft: '#9AA3AD', ink: C.ink, mut: C.body, dim: C.mut,
  line: C.line, soft: C.soft, paper: '#FFFFFF' };

export default {
  id: 'C',
  name: '系統網格',
  desc: '白底嚴格網格 + 色彩即編碼，章節與資料分類都靠顏色說話',
  fonts: `<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap" rel="stylesheet">`,

  css: `
  body { background:${C.bg}; font-family:"Microsoft JhengHei","Noto Sans TC","PingFang TC",sans-serif; }
  .cap  { font-size:10pt; font-weight:500; letter-spacing:0.2em; color:${C.mut}; }
  .h2   { font-size:28pt; font-weight:700; line-height:1.35; color:${C.ink}; }
  .lead { font-size:16.5pt; font-weight:300; line-height:1.6; color:${C.body}; }
  .k    { font-size:17pt; font-weight:700; line-height:1.4; color:${C.ink}; }
  .v    { font-size:14.5pt; font-weight:400; line-height:1.5; color:${C.body}; }
  .key  { font-size:9pt; font-weight:500; letter-spacing:0.16em; }
  .num  { font-size:42pt; font-weight:700; line-height:1; color:${C.ink}; font-variant-numeric:tabular-nums; }
  .unit { font-size:13pt; font-weight:400; color:${C.mut}; }
  .lbl  { font-size:13.5pt; font-weight:400; line-height:1.45; color:${C.body}; }
  `,

  chColor(ch, ctx) {
    if (!ch) return RAMP[0];
    if (ch.color) return ch.color;
    const i = ctx.chapters.indexOf(ch);
    return RAMP[(i < 0 ? 0 : i) % RAMP.length];
  },

  color(p, ctx) { return this.chColor(ctx.chapterOf(p), ctx); },

  // 資料分組 → 色：依 stats 裡首次出現的順序配色，回傳 { map, order }
  groupColors(stats) {
    const order = [];
    for (const s of stats) if (s.group && !order.includes(s.group)) order.push(s.group);
    const map = Object.fromEntries(order.map((g, i) => [g, RAMP[i % RAMP.length]]));
    return { map, order };
  },

  head(p, ctx) {
    const ch = ctx.chapterOf(p);
    const c = this.color(p, ctx);
    // p.scene：場景標記，用章節色接在頁首後面，讓聽眾隨時知道現在講第幾個場景
    const scene = p.scene ? `<span style="color:${c}; font-weight:700;">${p.scene}</span>` : '';
    const kick = [ch ? `${ch.no} ${ch.name}` : '', p.stepNo ? `STEP ${p.stepNo}` : '', scene]
      .filter(Boolean).join('　·　');
    return `
  <div style="position:absolute; left:0; top:0; width:40pt; height:540pt; background:${c};"></div>
  ${kick ? `<div style="position:absolute; left:88pt; top:52pt; width:560pt;"><p class="cap">${kick}</p></div>` : ''}
  <div style="position:absolute; left:648pt; top:52pt; width:268pt; text-align:right;"><p class="cap">${ctx.index} / ${ctx.total}</p></div>
  <div style="position:absolute; left:88pt; top:76pt; width:828pt; height:2pt; background:${C.ink};"></div>`;
  },

  leadTop(p) { return tw(p.title) > 16 ? 190 : 152; },

  title(p) {
    return `
  <div style="position:absolute; left:88pt; top:104pt; width:760pt;"><h2 class="h2">${br(p.title)}</h2></div>
  ${p.lead ? `<div style="position:absolute; left:88pt; top:${this.leadTop(p)}pt; width:${leadW(p.lead)}pt;"><p class="lead">${p.lead}</p></div>` : ''}`;
  },

  // frame：不透明底的圖加一圈細框收邊。邊框畫在墊底的 div 上（Path A 規則 3）
  img(ctx, name, x, y, w, frame = false) {
    const [nw, nh] = ctx.dsize(name);
    const h = +(w * nh / nw).toFixed(1);
    const tag = `<img src="${ctx.dsrc(name)}" style="position:absolute; left:${x}pt; top:${y}pt; width:${w}pt; height:${h}pt;" alt="">`;
    if (!frame) return tag;
    const pad = 6;
    return `<div style="position:absolute; left:${x - pad}pt; top:${y - pad}pt; width:${w + pad * 2}pt; height:${h + pad * 2}pt; background:#FFFFFF; border:1pt solid ${C.line};"></div>` + tag;
  },

  // 在給定矩形內置中並等比塞入一或多張圖。cx 是版心中線，不是畫布中線。
  // 多張並排時，其餘的圖用滿帶高、最扁的那張吃掉剩下的寬度 —— 否則會被它拖著一起縮小。
  fit(ctx, names, { top, bottom, maxW, cx, gap = 20 }) {
    const list = (Array.isArray(names) ? names : [names])
      .map((v) => (typeof v === 'string' ? { img: v, frame: false } : v));
    const availH = bottom - top;
    if (availH <= 0) return '';
    const ar = list.map(({ img }) => { const [w, h] = ctx.dsize(img); return w / h; });

    let widths = ar.map((a) => availH * a);
    let total = widths.reduce((a, b) => a + b, 0) + gap * (list.length - 1);
    if (total > maxW) {
      const flat = ar.reduce((mi, a, i) => (a > ar[mi] ? i : mi), 0);
      const others = widths.reduce((a, w, i) => (i === flat ? a : a + w), 0);
      const rest = maxW - gap * (list.length - 1) - others;
      if (rest > 40) widths[flat] = rest;
      else {
        const k = (maxW - gap * (list.length - 1)) / widths.reduce((a, b) => a + b, 0);
        widths = widths.map((w) => w * k);
      }
      total = widths.reduce((a, b) => a + b, 0) + gap * (list.length - 1);
    }

    let x = cx - total / 2;
    return list.map(({ img, frame }, i) => {
      const w = widths[i], h = w / ar[i];
      const out = this.img(ctx, img, Math.round(x), Math.round(top + (availH - h) / 2), +w.toFixed(1), frame);
      x += w + gap;
      return out;
    }).join('');
  },

  loop(ctx, p, y, col) {
    const label = p.loopLabel || ctx.deck.loopLabel;
    if (!label) return '';
    return `
  <div style="position:absolute; left:88pt;  top:${y}pt; width:2pt; height:22pt; background:${col};"></div>
  <div style="position:absolute; left:914pt; top:${y}pt; width:2pt; height:22pt; background:${col};"></div>
  <div style="position:absolute; left:88pt;  top:${y + 20}pt; width:828pt; height:2pt; background:${col};"></div>
  <div style="position:absolute; left:352pt; top:${y + 12}pt; width:300pt; height:19pt; background:${C.bg};">
    <p style="font-size:10pt; font-weight:500; letter-spacing:0.12em; line-height:19pt; color:${col}; text-align:center;">${label}</p>
  </div>`;
  },

  render(p, ctx) {
    const t = this;
    const c = t.color(p, ctx);
    const D = ctx.deck || {};

    switch (p.type) {

      case 'cover': {
        // 左側色帶＝整份簡報的章節色譜（一眼看見有幾章）
        const n = Math.max(1, ctx.chapters.length);
        const band = ctx.chapters.map((ch, i) => `
  <div style="position:absolute; left:0; top:${Math.round(i * 540 / n)}pt; width:40pt; height:${Math.ceil(540 / n)}pt; background:${t.chColor(ch, ctx)};"></div>`).join('');

        // 下半的步驟／章節帶：優先用 DECK.steps，沒有就用 CHAPTERS
        const items = (D.steps && D.steps.length)
          ? D.steps
          : ctx.chapters.map((ch) => ({ no: ch.no, name: ch.name }));
        const w = Math.floor((828 - 12 * (items.length - 1)) / items.length);
        const steps = items.map((s, i) => `
  <div style="position:absolute; left:${88 + i * (w + 12)}pt; top:398pt; width:${w}pt; height:5pt; background:${RAMP[i % RAMP.length]};"></div>
  <div style="position:absolute; left:${88 + i * (w + 12)}pt; top:414pt; width:${w}pt;" data-pptx-merge="true">
    <p style="font-size:22pt; font-weight:700; line-height:1; color:${RAMP[i % RAMP.length]}; font-variant-numeric:tabular-nums;">${s.no}</p>
    <p style="font-size:13pt; font-weight:500; line-height:1.45; color:${C.ink}; margin-top:10pt;">${br(s.name)}</p>
  </div>`).join('');

        return band + `
  ${D.occasion || D.kicker ? `<div style="position:absolute; left:88pt; top:60pt; width:500pt;"><p class="cap">${[D.occasion, D.kicker].filter(Boolean).join(' · ')}</p></div>` : ''}
  ${D.meta ? `<div style="position:absolute; left:588pt; top:60pt; width:328pt; text-align:right;"><p class="cap">${D.meta}</p></div>` : ''}
  <div style="position:absolute; left:88pt; top:84pt; width:828pt; height:2pt; background:${C.ink};"></div>
  <div style="position:absolute; left:88pt; top:132pt; width:700pt;">
    <h1 style="font-size:54pt; font-weight:700; line-height:1.2; color:${C.ink};">${p.title1}</h1>
    ${p.title2 ? `<h1 style="font-size:54pt; font-weight:700; line-height:1.2; color:${C.ink};">${p.title2}</h1>` : ''}
  </div>
  ${p.sub ? `<div style="position:absolute; left:88pt; top:284pt; width:580pt;"><p style="font-size:16pt; font-weight:300; line-height:1.65; color:${C.body};">${p.sub}</p></div>` : ''}
  <div style="position:absolute; left:88pt; top:378pt; width:828pt; height:1pt; background:${C.line};"></div>
  ${steps}`;
        // 封面不畫迴圈帶：步驟名稱長度不可控，容易與帶子撞在一起。
        // 迴圈母題留給 steps / flow 頁去承載。
      }

      case 'bullets': {
        const hasBand = !!(p.logos || p.footer);
        const stats = p.stats || [];
        const bandTop = p.lead ? t.leadTop(p) + 80 : 176;
        const top = bandTop + (stats.length ? 72 : 0);
        const start = p.startNo || 1;
        // figure / diagramOnly 主導的頁面不會有條列，items 省略是合理的寫法
        const n = (p.items || []).length;

        // 有圖時：條目壓縮（≥4 條改雙欄），把剩下的高度全讓給圖
        const twoCol = !!p.diagram && !p.diagramOnly && n >= 4;
        // 行距不寫死：最後一列還要放得下 k + v，否則加了大數字帶就會撐破畫布
        const rowNeed = 46, listBottom = hasBand ? 420 : 488;
        const gap = (p.figure || p.diagram) ? 46
          : Math.min(n >= 5 ? 52 : 64, Math.floor((listBottom - rowNeed - top) / Math.max(1, n - 1)));
        // 行距擠不下「k 疊 v」時改成左右並排——否則 v 會壓到下一列的 k
        const tight = !twoCol && !p.diagram && gap < 54;
        const kX = p.numbered ? 140 : 108;
        const kW = Math.min(p.wideKey || 200, 250);
        const vX = kX + kW + 16, vW = 916 - vX;
        // diagramOnly：圖已完整承載這些條目，不再重列
        const shown = p.diagramOnly ? [] : p.items;

        const rows = shown.map((it, i) => {
          if (twoCol) {
            const col = i % 2, r = Math.floor(i / 2);
            const y = top + r * gap;
            return `
  <div style="position:absolute; left:${88 + col * 432}pt; top:${y}pt; width:4pt; height:${gap - 18}pt; background:${c};"></div>
  <div style="position:absolute; left:${108 + col * 432}pt; top:${y - 3}pt; width:396pt;" data-pptx-merge="true">
    <p class="k" style="font-size:15pt;">${it.k}</p>
    <p class="v" style="font-size:13pt; margin-top:4pt;">${it.v}</p>
  </div>`;
          }
          return `
  <div style="position:absolute; left:88pt; top:${top + i * gap}pt; width:${p.numbered ? 44 : 4}pt; ${p.numbered ? '' : `height:${gap - 18}pt; background:${c};`}">
    ${p.numbered ? `<p style="font-size:16pt; font-weight:700; line-height:1; color:${c}; font-variant-numeric:tabular-nums;">${String(start + i).padStart(2, '0')}</p>` : ''}
  </div>
  ${tight ? `
  <div style="position:absolute; left:${kX}pt; top:${top + i * gap - 3}pt; width:${kW}pt;"><p class="k" style="font-size:13.5pt;">${it.k}</p></div>
  <div style="position:absolute; left:${vX}pt; top:${top + i * gap - 1}pt; width:${vW}pt;"><p class="v" style="font-size:12.5pt;">${it.v}</p></div>` : `
  <div style="position:absolute; left:${kX}pt; top:${top + i * gap - 3}pt; width:${p.numbered ? 776 : 808}pt;" data-pptx-merge="true">
    <p class="k">${it.k}</p>
    <p class="v" style="margin-top:5pt;">${it.v}</p>
  </div>`}`;
        }).join('');

        const rowsH = (twoCol ? Math.ceil(shown.length / 2) : shown.length) * gap;
        const dia = p.figure
          ? ctx.figure(p.figure, { x: 88, y: top + rowsH + (shown.length ? 12 : 0), w: 828, C: { ...FCBASE, acc: c } })
          : p.diagram
          ? t.fit(ctx, p.diagram, {
            top: top + rowsH + (shown.length ? 12 : 0),
            bottom: hasBand ? 420 : 488,
            maxW: 828, cx: 502,
          })
          : '';

        const statBand = stats.map((s, i) => {
          const w = Math.floor(828 / stats.length);
          const x = 88 + i * w;
          const gc = s.hero ? c : RAMP[(i + 1) % RAMP.length];
          return `
  <div style="position:absolute; left:${x}pt; top:${bandTop}pt; width:${w - 18}pt; height:4pt; background:${gc};"></div>
  <div style="position:absolute; left:${x}pt; top:${bandTop + 14}pt; width:${w - 18}pt;" data-pptx-merge="true">
    <p class="num" style="font-size:34pt; color:${gc};">${s.value}${s.unit ? `<span class="unit">&nbsp;${s.unit}</span>` : ''}</p>
    <p class="lbl" style="margin-top:6pt;">${s.label}</p>
  </div>`;
        }).join('');

        const logos = p.logos ? `
  <div style="position:absolute; left:88pt; top:428pt; width:828pt; height:1pt; background:${C.line};"></div>
  <div style="position:absolute; left:88pt; top:444pt; width:200pt;"><p class="key" style="color:${c};">${p.kicker || ''}</p></div>
  ${p.logos.map((g, i) => `
  <div style="position:absolute; left:${248 + i * 224}pt; top:438pt; width:210pt; height:34pt; background:${C.soft};"></div>
  ${g.src ? `<div style="position:absolute; left:${262 + i * 224}pt; top:446pt; width:18pt; height:18pt;"><img src="../assets/${g.src}" style="width:18pt; height:18pt;" alt=""></div>` : ''}
  <div style="position:absolute; left:${(g.src ? 288 : 262) + i * 224}pt; top:${g.src ? 448 : 444}pt; width:${g.src ? 160 : 186}pt;"><p style="font-size:11.5pt; line-height:1.3; color:${C.ink};">${g.text ? `<span style="font-weight:700;">${g.text}</span>　` : ''}${g.name}</p></div>`).join('')}` : '';

        const footer = (p.footer && !p.logos) ? `
  <div style="position:absolute; left:88pt; top:432pt; width:828pt; height:4pt; background:${c};"></div>
  <div style="position:absolute; left:88pt; top:448pt; width:828pt;" data-pptx-merge="true">
    ${p.kicker ? `<p class="key" style="color:${c};">${p.kicker}</p>` : ''}
    <p style="font-size:16.5pt; font-weight:500; line-height:1.5; color:${C.ink}; margin-top:${p.kicker ? 8 : 0}pt;">${p.footer}</p>
  </div>` : '';

        return t.head(p, ctx) + t.title(p) + statBand + rows + dia + logos + footer;
      }

      case 'split': {
        // lead 佔兩行時整組欄位下移，否則導言第二行會壓到欄標題
        // （lead 欄寬 640pt、16.5pt，理論一行 38 字；取 35 留餘裕）
        const dy = p.lead && tw(p.lead) > 35 ? 26 : 0;
        const gy = dy ? 36 : 40;
        const col = (d, x, on) => `
  <div style="position:absolute; left:${x}pt; top:${190 + dy}pt; width:396pt; height:5pt; background:${on ? c : '#B8B8B8'};"></div>
  <div style="position:absolute; left:${x}pt; top:${206 + dy}pt; width:396pt;"><p style="font-size:18pt; font-weight:700; color:${on ? c : C.mut};">${d.label}</p></div>
  ${d.items.map((s, i) => `
  <div style="position:absolute; left:${x}pt; top:${248 + dy + i * gy}pt; width:396pt;">
    <p style="font-size:15pt; font-weight:${on ? 500 : 400}; line-height:1.4; color:${on ? C.ink : C.mut};">${s}</p>
  </div>
  <div style="position:absolute; left:${x}pt; top:${248 + dy + i * gy + 28}pt; width:396pt; height:1pt; background:${C.line};"></div>`).join('')}`;
        return t.head(p, ctx) + t.title(p) + col(p.left, 88, false) + col(p.right, 520, true);
      }

      case 'flow': {
        if (!p.steps && p.figure) {
          const notes = (p.notes || []).map((nt, i) => `
  <div style="position:absolute; left:${88 + i * 420}pt; top:430pt; width:400pt;" data-pptx-merge="true">
    <p class="key" style="color:${c};">${nt.k}</p>
    <p style="font-size:13.5pt; font-weight:300; line-height:1.5; color:${C.body}; margin-top:8pt;">${nt.v}</p>
  </div>`).join('');
          // 可用高度 216pt
          return t.head(p, ctx) + t.title(p) + ctx.figure(p.figure, { x: 148, y: 214, w: 704, C: { ...FCBASE, acc: c } }) + notes;
        }
        if (!p.steps && p.diagram) {
          const notes = (p.notes || []).map((nt, i) => `
  <div style="position:absolute; left:${88 + i * 420}pt; top:430pt; width:400pt;" data-pptx-merge="true">
    <p class="key" style="color:${c};">${nt.k}</p>
    <p style="font-size:13.5pt; font-weight:300; line-height:1.5; color:${C.body}; margin-top:8pt;">${nt.v}</p>
  </div>`).join('');
          return t.head(p, ctx) + t.title(p) + t.img(ctx, p.diagram, 148, 200, 704) + notes;
        }
        const n = p.steps.length;
        const w = Math.floor((828 - 20 * (n - 1)) / n);
        const items = p.steps.map((s, i) => `
  <div style="position:absolute; left:${88 + i * (w + 20)}pt; top:238pt; width:${w}pt; height:5pt; background:${RAMP[i % RAMP.length]};"></div>
  <div style="position:absolute; left:${88 + i * (w + 20)}pt; top:254pt; width:${w}pt;" data-pptx-merge="true">
    <p style="font-size:11pt; font-weight:500; letter-spacing:0.14em; color:${RAMP[i % RAMP.length]};">${String(i + 1).padStart(2, '0')}</p>
    <p style="font-size:18pt; font-weight:700; line-height:1.3; color:${C.ink}; margin-top:10pt;">${s.label}</p>
    <p class="v" style="margin-top:8pt;">${s.detail}</p>
  </div>`).join('');
        const notes = (p.notes || []).map((nt, i) => `
  <div style="position:absolute; left:${88 + i * 420}pt; top:420pt; width:400pt;" data-pptx-merge="true">
    <p class="key" style="color:${c};">${nt.k}</p>
    <p style="font-size:13.5pt; font-weight:300; line-height:1.5; color:${C.body}; margin-top:8pt;">${nt.v}</p>
  </div>`).join('');
        return t.head(p, ctx) + t.title(p) + items + t.loop(ctx, p, 360, c) + notes;
      }

      case 'steps': {
        const n = p.steps.length;
        const w = Math.floor((828 - 12 * (n - 1)) / n);
        const cols = p.steps.map((s, i) => `
  <div style="position:absolute; left:${88 + i * (w + 12)}pt; top:250pt; width:${w}pt; height:5pt; background:${RAMP[i % RAMP.length]};"></div>
  <div style="position:absolute; left:${88 + i * (w + 12)}pt; top:268pt; width:${w}pt;" data-pptx-merge="true">
    <p style="font-size:24pt; font-weight:700; line-height:1; color:${RAMP[i % RAMP.length]}; font-variant-numeric:tabular-nums;">${s.no}</p>
    <p style="font-size:15pt; font-weight:500; line-height:1.45; color:${C.ink}; margin-top:14pt;">${br(s.name)}</p>
  </div>`).join('');
        return t.head(p, ctx) + t.title(p) + cols + t.loop(ctx, p, 400, C.line);
      }

      case 'stat': {
        const { map, order } = t.groupColors(p.stats);
        const cells = p.stats.map((s, i) => {
          const x = 88 + (i % 4) * 210, y = i < 4 ? 216 : 352;
          const gc = map[s.group] || c;
          return `
  <div style="position:absolute; left:${x}pt; top:${y}pt; width:198pt; height:4pt; background:${gc};"></div>
  <div style="position:absolute; left:${x}pt; top:${y + 16}pt; width:198pt;" data-pptx-merge="true">
    ${s.group ? `<p class="key" style="color:${gc};">${s.group}</p>` : ''}
    <p class="num" style="margin-top:${s.group ? 10 : 0}pt;${s.text ? 'font-size:32pt;' : ''}">${s.value}${s.unit ? `<span class="unit">&nbsp;${s.unit}</span>` : ''}</p>
    <p class="lbl" style="margin-top:${s.text ? 16 : 10}pt;">${s.label}</p>
  </div>`;
        }).join('');
        const legend = order.map((g, i) => `
  <div style="position:absolute; left:${88 + i * 96}pt; top:506pt; width:10pt; height:10pt; background:${map[g]};"></div>
  <div style="position:absolute; left:${104 + i * 96}pt; top:504pt; width:80pt;"><p style="font-size:10pt; color:${C.mut};">${g}</p></div>`).join('');
        return t.head(p, ctx) + t.title(p) + cells +
          (order.length ? `
  <div style="position:absolute; left:88pt; top:490pt; width:828pt; height:1pt; background:${C.line};"></div>` + legend : '');
      }

      case 'case': {
        const gapY = Math.min(92, Math.floor((490 - 228) / Math.max(1, p.blocks.length)));
        const blocks = p.blocks.map((b, i) => `
  <div style="position:absolute; left:88pt; top:${228 + i * gapY}pt; width:828pt; height:1pt; background:${C.line};"></div>
  <div style="position:absolute; left:88pt; top:${244 + i * gapY}pt; width:180pt;"><p class="key" style="color:${c};">${b.label}</p></div>
  <div style="position:absolute; left:288pt; top:${238 + i * gapY}pt; width:628pt;" data-pptx-merge="true">
    ${b.items.map((s, j) => `<p class="${j === 0 ? 'k' : 'v'}" style="margin-top:${j ? 7 : 0}pt;">${s}</p>`).join('')}
  </div>`).join('');
        return t.head(p, ctx) + t.title(p) + blocks;
      }

      case 'turn': {
        const side = (d, x, on) => `
  <div style="position:absolute; left:${x}pt; top:196pt; width:396pt; height:5pt; background:${on ? c : '#B8B8B8'};"></div>
  <div style="position:absolute; left:${x}pt; top:212pt; width:396pt;"><p class="key" style="color:${on ? c : C.mut};">${d.label}</p></div>
  <div style="position:absolute; left:${x}pt; top:236pt; width:396pt;" data-pptx-merge="true">
    <p style="font-size:66pt; font-weight:700; line-height:1; color:${on ? c : '#9A9A9A'}; font-variant-numeric:tabular-nums;">${d.score}${d.unit ? `<span style="font-size:20pt; font-weight:400;">&nbsp;${d.unit}</span>` : ''}</p>
    ${d.note ? `<p class="lbl" style="margin-top:10pt;">${d.note}</p>` : ''}
  </div>
  ${(d.items || []).map((s, i) => `
  <div style="position:absolute; left:${x}pt; top:${360 + i * 32}pt; width:396pt;">
    <p style="font-size:14pt; font-weight:400; line-height:1.4; color:${on ? C.ink : C.mut};">${s}</p>
  </div>`).join('')}`;
        const band = p.sources ? `
  <div style="position:absolute; left:88pt; top:476pt; width:828pt; height:1pt; background:${C.line};"></div>
  <div style="position:absolute; left:88pt; top:490pt; width:160pt;"><p class="key" style="color:${C.mut};">${p.sourcesLabel || ''}</p></div>
  ${p.sources.map((s, i) => `
  ${s.src ? `<div style="position:absolute; left:${228 + i * 130}pt; top:488pt; width:16pt; height:16pt;"><img src="../assets/${s.src}" style="width:16pt; height:16pt;" alt=""></div>` : ''}
  <div style="position:absolute; left:${(s.src ? 252 : 228) + i * 130}pt; top:490pt; width:106pt;"><p style="font-size:11pt; color:${C.mut};">${s.name}</p></div>`).join('')}` : '';
        return t.head(p, ctx) + t.title(p) + side(p.before, 88, false) + side(p.after, 520, true) + band;
      }

      case 'closing': {
        // 行距由可用高度反推：PPTX 要求文字框離底邊 ≥0.5"，5 條就得收緊
        const an = (p.actions || []).length;
        const aY = an > 4 ? 348 : 362;
        const aG = Math.min(34, Math.floor((490 - aY - 22) / Math.max(1, an - 1)));
        const acts = (p.actions || []).map((s, i) => `
  <div style="position:absolute; left:88pt; top:${aY + i * aG}pt; width:40pt;"><p style="font-size:14pt; font-weight:700; color:${c}; font-variant-numeric:tabular-nums;">${String(i + 1).padStart(2, '0')}</p></div>
  <div style="position:absolute; left:136pt; top:${aY - 2 + i * aG}pt; width:780pt;"><p style="font-size:${an > 4 ? 14 : 15.5}pt; font-weight:400; line-height:1.45; color:${C.body};">${s}</p></div>`).join('');
        return t.head(p, ctx) + t.title(p) + `
  <div style="position:absolute; left:88pt; top:186pt; width:828pt; height:5pt; background:${c};"></div>
  <div style="position:absolute; left:88pt; top:206pt; width:828pt;" data-pptx-merge="true">
    ${p.keyLabel ? `<p class="key" style="color:${c};">${p.keyLabel}</p>` : ''}
    <p style="font-size:27pt; font-weight:700; line-height:1.4; color:${C.ink}; margin-top:12pt;">${p.key}</p>
  </div>
  <div style="position:absolute; left:88pt; top:322pt; width:828pt; height:1pt; background:${C.line};"></div>
  ${p.actionLabel ? `<div style="position:absolute; left:88pt; top:336pt; width:300pt;"><p class="key" style="color:${C.mut};">${p.actionLabel}</p></div>` : ''}` + acts;
      }

      // ── table：資料矩陣。C 版紀律是色彩即編碼，所以分級直接畫成綠／琥珀／紅熱圖 ──
      case 'table': {
        const cols = p.cols || [], rows = p.rows || [], on = p.on || [];
        const X0 = 88, TOTAL = 828;
        const GR = { A: '#4A7F37', B: '#B5721E', C: '#9E3C4C' };
        const sum = cols.reduce((a, cc) => a + (cc.w || 1), 0);
        const ws = cols.map((cc) => (cc.w || 1) / sum * TOTAL);
        const xs = []; let acc = X0;
        for (const w of ws) { xs.push(acc); acc += w; }
        const top = p.lead ? t.leadTop(p) + 50 : 152;
        const bot = p.note ? 458 : 492;
        const headH = 22;
        // 上限 60 而非 46：三、四列的表格若卡在 46，版心會空掉一大片；
        // 十列以上的表格本來就遠低於上限，不受影響
        const rowH = Math.min(60, (bot - top - headH) / Math.max(1, rows.length));
        const fs = +Math.max(9.5, Math.min(13, rowH * 0.46)).toFixed(1);

        const head = cols.map((cc, i) => `
  <div style="position:absolute; left:${xs[i].toFixed(1)}pt; top:${top}pt; width:${(ws[i] - 10).toFixed(1)}pt;"><p style="font-size:9.5pt; font-weight:500; letter-spacing:0.05em; line-height:1.3; color:${C.mut}; text-align:${cc.align || 'left'};">${cc.k}</p></div>`).join('') + `
  <div style="position:absolute; left:${X0}pt; top:${top + headH - 4}pt; width:${TOTAL}pt; height:2pt; background:${C.ink};"></div>`;

        const body = rows.map((r, ri) => {
          const y = top + headH + ri * rowH;
          const ty = (y + (rowH - fs * 1.4) / 2).toFixed(1);
          const band = p.grade
            ? (ri ? `<div style="position:absolute; left:${X0}pt; top:${y.toFixed(1)}pt; width:${TOTAL}pt; height:1pt; background:${C.line};"></div>` : '')
            : (ri % 2 ? `<div style="position:absolute; left:${X0}pt; top:${y.toFixed(1)}pt; width:${TOTAL}pt; height:${rowH.toFixed(1)}pt; background:${C.soft};"></div>` : '');
          const cells = r.map((v, ci) => {
            const cw = ws[ci], cx = xs[ci], al = cols[ci].align || 'left';
            if (p.grade && /^[ABC]$/.test(v)) {
              const cwc = Math.min(cw - 14, 54), cxc = cx + (cw - 10 - cwc) / 2;
              return `
  <div style="position:absolute; left:${cxc.toFixed(1)}pt; top:${(y + 2.5).toFixed(1)}pt; width:${cwc.toFixed(1)}pt; height:${(rowH - 5).toFixed(1)}pt; background:${GR[v]};"></div>
  <div style="position:absolute; left:${cxc.toFixed(1)}pt; top:${ty}pt; width:${cwc.toFixed(1)}pt;"><p style="font-size:${fs}pt; font-weight:700; line-height:1.4; color:#FFFFFF; text-align:center;">${v}</p></div>`;
            }
            const hot = on.includes(v);
            const bold = ci === 0 || ci === p.emph || hot;
            return `
  <div style="position:absolute; left:${cx.toFixed(1)}pt; top:${ty}pt; width:${(cw - 10).toFixed(1)}pt;"><p style="font-size:${fs}pt; font-weight:${bold ? 700 : 400}; line-height:1.4; color:${hot ? c : (ci === 0 ? C.ink : C.body)}; text-align:${al};">${v}</p></div>`;
          }).join('');
          return band + cells;
        }).join('');

        const note = p.note ? `
  <div style="position:absolute; left:${X0}pt; top:466pt; width:${TOTAL}pt; height:1pt; background:${C.line};"></div>
  ${p.noteLabel ? `<div style="position:absolute; left:${X0}pt; top:476pt; width:${TOTAL}pt;"><p class="key" style="color:${c};">${p.noteLabel}</p></div>` : ''}
  <div style="position:absolute; left:${X0}pt; top:${p.noteLabel ? 494 : 480}pt; width:${TOTAL}pt;"><p style="font-size:10.5pt; font-weight:300; line-height:1.35; color:${C.body};">${p.note}</p></div>` : '';

        return t.head(p, ctx) + t.title(p) + head + body + note;
      }
    }
    return '';
  },
};
