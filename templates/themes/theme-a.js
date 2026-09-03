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
// 等寬字（Consolas）沒有中文字符，而 PPTX 只保留字型鏈的第一個名稱 ——
// 一旦內容含中文就不能掛 .mono，否則換一台機器就是整串豆腐字。
// 使用者填的欄位（封面 kicker、步驟編號）無法預期，這裡自動判斷。
const mono = (s) => (/[一-鿿　-〿＀-￯]/.test(String(s ?? '')) ? '' : 'mono');

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
const LEAD_FS = 17, LEAD_FULL = 832, LEAD_MEASURE = 640;
// 一行容得下幾個全形；減 4 是餘裕——換行點是詞不是字，實測會比理論值提前折行
const leadCap = (w) => w / LEAD_FS - 4;
const leadW = (s) => (tw(s) <= leadCap(LEAD_FULL) ? LEAD_FULL : LEAD_MEASURE);
const leadLines = (s) => Math.ceil(tw(s) / leadCap(leadW(s)));

// figures.mjs 的通用色名 → 本 theme 的調色盤。
// 圖解不寫死顏色，換 theme 就跟著換。
const FC = { acc: C.acc, accSoft: C.off, ink: C.ink, mut: C.mut, dim: C.dim,
  line: C.line, soft: '#E9E7E3', paper: '#FFFFFF' };

export default {
  id: 'A',
  name: '敘事軸',
  desc: '冷調紙灰 + 單一橙，一條階梯敘事軸貫穿全場，每頁標出所在位置',
  fonts: `<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700;900&display=swap" rel="stylesheet">`,

  css: `
  /* PPTX 只保留字型鏈的「第一個名稱」，其餘 fallback 全部丟失。
     所以第一個必須是目標機器一定裝、而且含中文字符的字型——微軟正黑體隨 Windows 內建。
     Noto Sans TC 留在第二順位，只影響本機 HTML 預覽的細部字形。 */
  body { background:${C.bg}; font-family:"Microsoft JhengHei","Noto Sans TC","PingFang TC",sans-serif; }
  /* 等寬字沒有中文字符：只能用在純數字與拉丁，含中文的標籤一律用 .kick（走內文字型） */
  .mono { font-family:"Consolas","Menlo",monospace; font-variant-numeric:tabular-nums; }
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
    // p.scene：場景標記，橘色接在章節後面，讓聽眾隨時知道現在講第幾個場景
    const scene = p.scene ? `<span style="color:${C.acc}; font-weight:700; letter-spacing:0.08em;">${p.scene}</span>` : '';
    const kick = [ch ? `${ch.no} ${ch.name}` : '', p.stepNo ? `STEP ${p.stepNo}` : '', scene]
      .filter(Boolean).join('　/　');
    const w = Math.round(828 * (ctx.index / ctx.total));
    return `
  ${kick ? `<div style="position:absolute; left:64pt; top:46pt; width:600pt;"><p class="kick">${kick}</p></div>` : ''}
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
  ${p.lead ? `<div style="position:absolute; left:64pt; top:${this.leadTop(p)}pt; width:${leadW(p.lead)}pt;"><p class="lead">${p.lead}</p></div>` : ''}`;
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
    <p style="font-size:11pt; letter-spacing:0.14em; line-height:19pt; color:${C.dim}; text-align:center;">${label}</p>
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
  <div style="position:absolute; left:${64 + i * segW}pt; top:482pt; width:${segW}pt;"><p style="font-size:11pt; letter-spacing:0.14em; color:${a.hero ? C.acc : C.dim};">${a.label}</p></div>`).join('');

        return `
  <div style="position:absolute; left:64pt; top:52pt; width:832pt;"><p class="${mono(D.kicker)}" style="font-size:11pt; font-weight:500; letter-spacing:0.22em; color:${C.acc};">${String(D.kicker || '').replace(/ /g, '&nbsp;')}</p></div>
  <div style="position:absolute; left:64pt; top:52pt; width:832pt; text-align:right;"><p style="font-size:11pt; letter-spacing:0.18em; color:${C.dim};">${[D.occasion, D.meta].filter(Boolean).join('&nbsp;/&nbsp;')}</p></div>
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
        // figure / diagramOnly 主導的頁面不會有條列，items 省略是合理的寫法
        const n = (p.items || []).length;
        // 有圖時：條目排雙欄、行高壓縮，把高度讓給圖（圖是主角，不是插圖）
        const hasFig = !!(p.figure || p.diagram);
        const twoCol = !!p.diagram && !p.diagramOnly && n >= 4;
        const rowsCount = twoCol ? Math.ceil(n / 2) : n;
        const rowH = twoCol ? 54 : (hasFig ? 34 : ((hasBand ? 414 : 488) - areaTop) / Math.max(1, n));
        const areaBot = p.diagramOnly ? areaTop - 14
          : (hasFig ? areaTop + rowsCount * rowH : (hasBand ? 414 : 488));
        // diagramOnly 若同時有頁尾帶，圖高要讓出帶子的位置，否則會蓋上去
        // 圖高一律由剩餘空間反推，不寫死常數——否則加了數字帶（statH）之後圖會壓到頁尾帶
        const DIA_H = (hasBand ? 414 : 486) - (areaBot + 16);
        const start = p.startNo || 1;
        const numW = p.numbered ? 60 : 0;
        const kX = 64 + numW;
        const kW = p.wideKey || 286;
        const vX = kX + kW + 20;
        const vW = 896 - vX;
        const kSize = hasFig ? 16 : 18;
        const vSize = hasFig ? 14 : 15;

        // diagramOnly：圖已完整承載這些條目，再列一次就是重複
        const rows = (p.diagramOnly ? [] : (p.items || [])).map((it, i) => {
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
          // 分隔線置中在列與列的間隙裡。寫死 15pt 的話，列數一多（行距 < 40pt）就會切進上一列的標題
          const sepUp = Math.min(15, Math.max(4, (rowH - kSize * 1.4) / 2)).toFixed(1);
          return `
  <div style="position:absolute; left:64pt; top:${y - sepUp}pt; width:832pt; height:1pt; background:${C.line};"></div>
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
  <div style="position:absolute; left:64pt; top:444pt; width:200pt;"><p class="kick" style="color:${C.acc};">${p.kicker || ''}</p></div>
  ${p.logos.map((g, i) => `
  ${g.src ? `<div style="position:absolute; left:${280 + i * 210}pt; top:440pt; width:200pt; height:30pt;"><img src="../assets/${g.src}" style="width:19pt; height:19pt; opacity:0.85;" alt=""></div>` : ''}
  <div style="position:absolute; left:${280 + i * 210 + (g.src ? 27 : 0)}pt; top:${g.src ? 444 : 440}pt; width:180pt;"><p style="font-size:13pt; color:${C.mut};">${g.text ? `<span style="color:${C.ink};">${g.text}</span>　` : ''}${g.name}</p></div>`).join('')}` : '';

        const footer = (p.footer && !p.logos) ? `
  <div style="position:absolute; left:64pt; top:432pt; width:832pt; height:1pt; background:${C.acc};"></div>
  <div style="position:absolute; left:64pt; top:448pt; width:832pt;" data-pptx-merge="true">
    ${p.kicker ? `<p class="kick" style="color:${C.acc};">${p.kicker}</p>` : ''}
    <p style="font-size:17pt; font-weight:500; line-height:1.5; color:${C.ink}; margin-top:${p.kicker ? 6 : 0}pt;">${p.footer}</p>
  </div>` : '';

        const diaTop = areaBot + 16;
        // figure（HTML，原生可編輯）優先於 diagram（PNG）
        const dia = hasFig ? `
  <div style="position:absolute; left:64pt; top:${diaTop - 12}pt; width:832pt; height:1pt; background:${C.line};"></div>` +
          (p.figure ? ctx.figure(p.figure, { x: 64, y: diaTop + 4, w: 812, C: FC })
            : t.fit(ctx, p.diagram, { top: diaTop, bottom: diaTop + DIA_H, maxW: 812 })) : '';

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
    <p style="font-size:15pt; font-weight:700; letter-spacing:0.03em; color:${C.acc};">${nt.k}</p>
    <p style="font-size:15pt; font-weight:300; line-height:1.5; color:${C.mut}; margin-top:6pt;">${nt.v}</p>
  </div>`).join('');
        const body = p.figure
          ? ctx.figure(p.figure, { x: 120, y: 222, w: 720, C: FC })   // 可用高度 186pt
          : p.diagram
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
    <p class="${mono(s.no)}" style="font-size:28pt; font-weight:500; line-height:1; color:${C.acc};">${s.no}</p>
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
    <p style="font-size:15pt; font-weight:700; letter-spacing:0.03em; color:${C.acc};">${b.label}</p>
    ${b.items.map((s) => `<p style="font-size:15pt; font-weight:300; line-height:1.5; color:${C.mut}; margin-top:7pt;">${s}</p>`).join('')}
  </div>`).join('');
          return t.head(p, ctx) + t.title(p) + t.img(ctx, p.diagram, 140, 168, 680) + cols + t.axis(ctx);
        }
        const gapY = Math.min(92, Math.floor((488 - 222) / Math.max(1, p.blocks.length)));
        const blocks = p.blocks.map((b, i) => `
  <div style="position:absolute; left:64pt; top:${222 + i * gapY}pt; width:832pt; height:1pt; background:${C.line};"></div>
  <div style="position:absolute; left:64pt; top:${236 + i * gapY}pt; width:224pt;"><p style="font-size:15.5pt; font-weight:700; letter-spacing:0.03em; line-height:1.4; color:${C.acc};">${b.label}</p></div>
  <div style="position:absolute; left:300pt; top:${232 + i * gapY}pt; width:596pt;" data-pptx-merge="true">
    ${b.items.map((s, j) => `<p style="font-size:16.5pt; font-weight:${j === 0 ? 500 : 300}; line-height:1.55; color:${j === 0 ? C.ink : C.mut}; margin-top:${j ? 6 : 0}pt;">${s}</p>`).join('')}
  </div>`).join('');
        return t.head(p, ctx) + t.title(p) + blocks + t.axis(ctx);
      }

      case 'turn': {
        // lead 佔兩行時整組欄位往下讓，否則分隔線會壓到第二行（640pt / 15pt ≈ 42 全形字一行）
        const dy = tw(p.lead) > 42 ? 22 : 0;
        const gy = dy ? 30 : 34;
        const side = (d, x, on) => `
  <div style="position:absolute; left:${x}pt; top:${196 + dy}pt; width:396pt; height:3pt; background:${on ? C.acc : C.off};"></div>
  <div style="position:absolute; left:${x}pt; top:${210 + dy}pt; width:396pt;"><p style="font-size:17pt; font-weight:700; color:${on ? C.acc : C.dim};">${d.label}</p></div>
  <div style="position:absolute; left:${x}pt; top:${238 + dy}pt; width:396pt;" data-pptx-merge="true">
    <p style="font-size:70pt; font-weight:900; line-height:1; color:${on ? C.acc : C.off}; font-variant-numeric:tabular-nums;">${d.score}${d.unit ? `<span style="font-size:24pt; font-weight:400;">&nbsp;${d.unit}</span>` : ''}</p>
    ${d.note ? `<p class="lbl" style="margin-top:10pt;">${d.note}</p>` : ''}
  </div>
  ${(d.items || []).map((s, i) => `
  <div style="position:absolute; left:${x}pt; top:${372 + dy + i * gy}pt; width:396pt;">
    <p style="font-size:15pt; font-weight:300; line-height:1.4; color:${on ? C.ink : C.mut};">${s}</p>
  </div>`).join('')}`;
        const band = p.sources ? `
  <div style="position:absolute; left:64pt; top:474pt; width:832pt; height:1pt; background:${C.line};"></div>
  <div style="position:absolute; left:64pt; top:486pt; width:400pt;"><p class="kick">${p.sourcesLabel || ''}</p></div>
  ${p.sources.map((s, i) => `
  ${s.src ? `<div style="position:absolute; left:${500 + i * 120}pt; top:486pt; width:19pt; height:19pt;"><img src="../assets/${s.src}" style="width:16pt; height:16pt; opacity:0.8;" alt=""></div>` : ''}
  <div style="position:absolute; left:${500 + i * 120 + (s.src ? 24 : 0)}pt; top:488pt; width:96pt;"><p style="font-size:12pt; color:${C.dim};">${s.name}</p></div>`).join('')}` : '';
        return t.head(p, ctx) + t.head0(p) +
          side(p.before, 64, false) + side(p.after, 500, true) + `
  <div style="position:absolute; left:470pt; top:${250 + dy}pt; width:20pt; height:2pt; background:${C.rule};"></div>` +
          // 有來源帶時底部已被佔用，沒有的話補上敘事軸，維持每頁一致
          (band || t.axis(ctx));
      }

      case 'closing': {
        // 行距由可用高度反推：PPTX 要求文字框離底邊 ≥0.5"，5 條就得收緊
        const an = (p.actions || []).length;
        const aY = an > 4 ? 352 : 370;
        const aG = Math.min(34, Math.floor((492 - aY - 24) / Math.max(1, an - 1)));
        const acts = (p.actions || []).map((s, i) => `
  <div style="position:absolute; left:64pt; top:${aY + i * aG}pt; width:52pt;"><p class="mono no">${String(i + 1).padStart(2, '0')}</p></div>
  <div style="position:absolute; left:116pt; top:${aY - 2 + i * aG}pt; width:780pt;"><p style="font-size:${an > 4 ? 15.5 : 17}pt; font-weight:300; line-height:1.4; color:${C.mut};">${s}</p></div>`).join('');
        return t.head(p, ctx) + t.title(p) + `
  <div style="position:absolute; left:64pt; top:196pt; width:832pt; height:3pt; background:${C.acc};"></div>
  <div style="position:absolute; left:64pt; top:214pt; width:832pt;" data-pptx-merge="true">
    ${p.keyLabel ? `<p class="kick" style="color:${C.acc};">${p.keyLabel}</p>` : ''}
    <p style="font-size:30pt; font-weight:900; line-height:1.35; color:${C.ink}; margin-top:12pt;">${p.key}</p>
  </div>
  <div style="position:absolute; left:64pt; top:${an > 4 ? 314 : 330}pt; width:832pt; height:1pt; background:${C.line};"></div>
  ${p.actionLabel ? `<div style="position:absolute; left:64pt; top:${an > 4 ? 326 : 344}pt; width:300pt;"><p class="kick">${p.actionLabel}</p></div>` : ''}` + acts + t.axis(ctx);
      }

      // ── table：資料矩陣。cols 給欄頭與相對寬度，rows 是二維陣列 ──
      // grade:true 時 A/B/C 儲存格畫成色塊；emph 指定要加粗的欄；on 列出要上強調色的值
      case 'table': {
        const cols = p.cols || [], rows = p.rows || [], on = p.on || [];
        const X0 = 64, TOTAL = 832;
        const sum = cols.reduce((a, c) => a + (c.w || 1), 0);
        const ws = cols.map((c) => (c.w || 1) / sum * TOTAL);
        const xs = []; let acc = X0;
        for (const w of ws) { xs.push(acc); acc += w; }
        // 行距由可用高度反推；13 列時約 10.5pt，3 列時封頂在 13pt，不寫死
        // 起點要看 lead 實際佔幾行，不能只看標題寬度——lead 換行時表頭會被壓到。
        // 行數一律問 leadLines()，它跟 leadW() 是同一個來源；這裡自己再算一次
        // 就會跟實際欄寬脫鉤，表格依「假的行數」下移。
        const top = p.lead ? t.leadTop(p) + 26 * leadLines(p.lead) + 26 : 148;
        const bot = p.note ? 458 : 492;
        const headH = 22;
        // 上限 60 而非 46：三、四列的表格若卡在 46，版心會空掉一大片；
        // 十列以上的表格本來就遠低於上限，不受影響
        const rowH = Math.min(60, (bot - top - headH) / Math.max(1, rows.length));
        const fs = +Math.max(9.5, Math.min(13, rowH * 0.46)).toFixed(1);

        const head = cols.map((c, i) => `
  <div style="position:absolute; left:${xs[i].toFixed(1)}pt; top:${top}pt; width:${(ws[i] - 10).toFixed(1)}pt;"><p style="font-size:9.5pt; font-weight:500; letter-spacing:0.05em; line-height:1.3; color:${C.dim}; text-align:${c.align || 'left'};">${c.k}</p></div>`).join('') + `
  <div style="position:absolute; left:${X0}pt; top:${top + headH - 4}pt; width:${TOTAL}pt; height:1.5pt; background:${C.rule};"></div>`;

        const body = rows.map((r, ri) => {
          const y = top + headH + ri * rowH;
          const ty = (y + (rowH - fs * 1.4) / 2).toFixed(1);
          const band = p.grade
            ? (ri ? `<div style="position:absolute; left:${X0}pt; top:${y.toFixed(1)}pt; width:${TOTAL}pt; height:1pt; background:${C.line};"></div>` : '')
            : (ri % 2 ? `<div style="position:absolute; left:${X0}pt; top:${y.toFixed(1)}pt; width:${TOTAL}pt; height:${rowH.toFixed(1)}pt; background:#E7E8E5;"></div>` : '');
          const cells = r.map((v, ci) => {
            const cw = ws[ci], cx = xs[ci], al = cols[ci].align || 'left';
            if (p.grade && /^[ABC]$/.test(v)) {
              const bg = v === 'A' ? C.acc : (v === 'B' ? '#DDDFDB' : '');
              const fg = v === 'A' ? '#FFFFFF' : (v === 'B' ? C.ink : C.off);
              const cwc = Math.min(cw - 14, 52), cxc = cx + (cw - 10 - cwc) / 2;
              return (bg ? `
  <div style="position:absolute; left:${cxc.toFixed(1)}pt; top:${(y + 2.5).toFixed(1)}pt; width:${cwc.toFixed(1)}pt; height:${(rowH - 5).toFixed(1)}pt; background:${bg};"></div>` : '') + `
  <div style="position:absolute; left:${cxc.toFixed(1)}pt; top:${ty}pt; width:${cwc.toFixed(1)}pt;"><p class="mono" style="font-size:${fs}pt; font-weight:700; line-height:1.4; color:${fg}; text-align:center;">${v}</p></div>`;
            }
            const hot = on.includes(v);
            const bold = ci === 0 || ci === p.emph || hot;
            return `
  <div style="position:absolute; left:${cx.toFixed(1)}pt; top:${ci === 0 ? (y + (rowH - (fs + 1) * 1.4) / 2).toFixed(1) : ty}pt; width:${(cw - 10).toFixed(1)}pt;"><p style="font-size:${ci === 0 ? fs + 1 : fs}pt; font-weight:${bold ? 700 : 300}; line-height:1.4; color:${hot ? C.acc : (ci === 0 ? C.ink : C.mut)}; text-align:${al};">${v}</p></div>`;
          }).join('');
          return band + cells;
        }).join('');

        const note = p.note ? `
  <div style="position:absolute; left:${X0}pt; top:466pt; width:${TOTAL}pt; height:1pt; background:${C.line};"></div>
  ${p.noteLabel ? `<div style="position:absolute; left:${X0}pt; top:476pt; width:${TOTAL}pt;"><p class="kick" style="color:${C.acc};">${p.noteLabel}</p></div>` : ''}
  <div style="position:absolute; left:${X0}pt; top:${p.noteLabel ? 494 : 480}pt; width:${TOTAL}pt;"><p style="font-size:10.5pt; font-weight:300; line-height:1.35; color:${C.mut};">${p.note}</p></div>` : '';

        return t.head(p, ctx) + t.title(p) + head + body + (note || t.axis(ctx));
      }
    }
    return '';
  },
};
