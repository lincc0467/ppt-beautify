// 方向 B ·「暖白編輯部」— 暖白紙感 + 襯線標題 + 左右分欄
// form 來源：把簡報當一份印刷刊物編排。左窄欄放章節與頁碼，右寬欄是正文版心。
// 紀律：全頁只有一處高飽和色（clay），其餘靠字重與留白分層。
//
// 改色只改 C；封面的場合／母題字串來自 content.js 的 DECK，不要寫死在這裡。

const C = {
  bg: '#F0EEE6', card: '#FAF9F5', bd: '#E3DFD4', ink: '#141413',
  body: '#5C574E', mut: '#645E52', faint: '#7D7568', hair: '#DCD8CC',
  clay: '#D97757', claySoft: '#B5866E',
};

const br = (s) => String(s ?? '').replace(/\n/g, '<br>');
const SER = `"Noto Serif TC","PMingLiU",serif`;

// 標題寬度：全形算 1、半形算 0.5。用字元數當寬度會把「(量尺 Score@K)」誤判成超長，
// 讓 lead 白白下移一階、而條列起點沒跟著移，第二行就會壓到第一列。
const tw = (s) => [...String(s ?? '')].reduce(
  (a, c) => a + (/[⺀-鿿　-〿＀-｠￠-￦]/.test(c) ? 1 : 0.5), 0);

export default {
  id: 'B',
  name: '暖白編輯部',
  desc: '暖白紙感 + 襯線標題 + 左右分欄，全頁只有一處高飽和色',
  fonts: `<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=Noto+Serif+TC:wght@400;500;600;700&display=swap" rel="stylesheet">`,

  css: `
  body { background:${C.bg}; font-family:"Noto Sans TC","Microsoft JhengHei",sans-serif; }
  .serif { font-family:${SER}; }
  .h2   { font-family:${SER}; font-size:30pt; font-weight:600; line-height:1.34; color:${C.ink}; }
  .lead { font-size:16.5pt; font-weight:300; line-height:1.65; color:${C.body}; }
  .kick { font-size:11pt; font-weight:500; letter-spacing:0.16em; color:${C.mut}; }
  .k    { font-family:${SER}; font-size:17.5pt; font-weight:600; line-height:1.4; color:${C.ink}; }
  .v    { font-size:14.5pt; font-weight:400; line-height:1.55; color:${C.body}; }
  .card { background:${C.card}; border:1pt solid ${C.bd}; border-radius:7pt; }
  .num  { font-family:${SER}; font-size:40pt; font-weight:600; line-height:1; color:${C.ink}; font-variant-numeric:tabular-nums; }
  .unit { font-size:12pt; font-weight:400; color:${C.mut}; }
  .lbl  { font-size:13.5pt; line-height:1.45; color:${C.mut}; }
  `,

  head(p, ctx) {
    const ch = ctx.chapterOf(p);
    return `
  ${ch ? `<div style="position:absolute; left:72pt; top:72pt; width:150pt;"><p class="kick">${ch.no} ${ch.name}</p></div>` : ''}
  ${p.stepNo ? `<div style="position:absolute; left:72pt; top:100pt; width:150pt;"><p style="font-size:11pt; line-height:1.6; color:${C.faint};">STEP ${p.stepNo}</p></div>` : ''}
  ${p.scene ? `<div style="position:absolute; left:72pt; top:${p.stepNo ? 124 : 100}pt; width:170pt;"><p style="font-size:11.5pt; font-weight:600; line-height:1.5; color:${C.clay};">${p.scene}</p></div>` : ''}
  <div style="position:absolute; left:72pt; top:452pt; width:150pt;"><p style="font-size:10pt; letter-spacing:0.14em; color:${C.faint};">${String(ctx.index).padStart(2, '0')} / ${ctx.total}</p></div>
  <div style="position:absolute; left:250pt; top:72pt; width:1pt; height:396pt; background:${C.hair};"></div>`;
  },

  leadTop(p) { return tw(p.title) > 16 ? 152 : 122; },

  title(p) {
    return `
  <div style="position:absolute; left:298pt; top:72pt; width:598pt;"><h2 class="h2">${br(p.title)}</h2></div>
  ${p.lead ? `<div style="position:absolute; left:298pt; top:${this.leadTop(p)}pt; width:560pt;"><p class="lead">${p.lead}</p></div>` : ''}`;
  },

  // frame：不透明底的圖加一圈細框收邊。邊框畫在墊底的 div 上（Path A 規則 3）
  img(ctx, name, x, y, w, frame = false) {
    const [nw, nh] = ctx.dsize(name);
    const h = +(w * nh / nw).toFixed(1);
    const tag = `<img src="${ctx.dsrc(name)}" style="position:absolute; left:${x}pt; top:${y}pt; width:${w}pt; height:${h}pt;" alt="">`;
    if (!frame) return tag;
    const pad = 6;
    return `<div style="position:absolute; left:${x - pad}pt; top:${y - pad}pt; width:${w + pad * 2}pt; height:${h + pad * 2}pt; background:#FFFFFF; border:1pt solid ${C.bd};"></div>` + tag;
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

  // 迴圈帶：沒有 loopLabel 就不畫（不是每份內容都是閉環結構）
  loop(ctx, p, y, accent) {
    const label = p.loopLabel || ctx.deck.loopLabel;
    if (!label) return '';
    const col = accent ? C.clay : C.hair;
    const txt = accent ? C.clay : C.faint;
    return `
  <div style="position:absolute; left:298pt; top:${y}pt; width:1pt; height:18pt; background:${col};"></div>
  <div style="position:absolute; left:895pt; top:${y}pt; width:1pt; height:18pt; background:${col};"></div>
  <div style="position:absolute; left:298pt; top:${y + 17}pt; width:598pt; height:1pt; background:${col};"></div>
  <div style="position:absolute; left:462pt; top:${y + 9}pt; width:270pt; height:17pt; background:${C.bg};">
    <p style="font-size:10pt; letter-spacing:0.1em; line-height:17pt; color:${txt}; text-align:center;">${label}</p>
  </div>`;
  },

  render(p, ctx) {
    const t = this;
    const D = ctx.deck || {};

    switch (p.type) {

      case 'cover': {
        // 欄寬依章節數反推，不寫死 4 欄——章節多一段就會被截掉
        const cn = Math.max(1, ctx.chapters.length), cgap = 12;
        const cw = Math.floor((598 - cgap * (cn - 1)) / cn);
        const chs = ctx.chapters.map((c, i) => `
  <div style="position:absolute; left:${298 + i * (cw + cgap)}pt; top:396pt; width:${cw}pt;" data-pptx-merge="true">
    <p style="font-size:10pt; letter-spacing:0.14em; color:${C.faint};">${c.no}</p>
    <p class="serif" style="font-size:14pt; font-weight:500; line-height:1.5; color:${C.ink}; margin-top:8pt;">${c.name}</p>
    ${c.blurb ? `<p style="font-size:11pt; line-height:1.55; color:${C.mut}; margin-top:4pt;">${br(c.blurb)}</p>` : ''}
  </div>`).join('');
        return `
  ${D.occasion ? `<div style="position:absolute; left:72pt; top:72pt; width:150pt;"><p class="kick">${D.occasion}</p></div>` : ''}
  ${D.meta ? `<div style="position:absolute; left:72pt; top:104pt; width:150pt;"><p style="font-size:11pt; letter-spacing:0.16em; color:${C.mut};">${D.meta}</p></div>` : ''}
  <div style="position:absolute; left:72pt; top:412pt; width:26pt; height:26pt; background:${C.clay};"></div>
  ${D.motif ? `<div style="position:absolute; left:72pt; top:452pt; width:150pt;"><p class="serif" style="font-size:13pt; font-weight:500; line-height:1.5; color:${C.ink};">${br(D.motif)}</p></div>` : ''}
  <div style="position:absolute; left:250pt; top:72pt; width:1pt; height:396pt; background:${C.hair};"></div>
  <div style="position:absolute; left:298pt; top:118pt; width:600pt;">
    <h1 class="serif" style="font-size:56pt; font-weight:600; line-height:1.26; color:${C.ink};">${p.title1}</h1>
    ${p.title2 ? `<h1 class="serif" style="font-size:56pt; font-weight:600; line-height:1.26; color:${C.ink};">${p.title2}</h1>` : ''}
  </div>
  ${p.sub ? `<div style="position:absolute; left:298pt; top:290pt; width:540pt;"><p style="font-size:17pt; font-weight:300; line-height:1.72; color:${C.body};">${p.sub}</p></div>` : ''}
  <div style="position:absolute; left:298pt; top:372pt; width:598pt; height:1pt; background:${C.hair};"></div>
  ${chs}`;
      }

      case 'bullets': {
        const hasBand = !!(p.logos || p.footer);
        const stats = p.stats || [];
        const bandTop = p.lead ? t.leadTop(p) + 74 : 160;
        const top = bandTop + (stats.length ? 92 : 0);   // 數字帶實高約 72pt，再留 20pt 給下一列的分隔線
        const start = p.startNo || 1;
        const n = p.items.length;

        // 有圖時：條目壓縮（≥4 條改雙欄），把剩下的高度全讓給圖
        const twoCol = !!p.diagram && !p.diagramOnly && n >= 4;
        // 行距不寫死：最後一列還要放得下 k + v
        const rowNeed = 48, listBottom = hasBand ? 396 : 484;
        const gap = p.diagram ? 46
          : Math.min(n >= 5 ? 56 : 68, Math.floor((listBottom - rowNeed - top) / Math.max(1, n - 1)));
        // 行距擠不下「k 疊 v」時改成左右並排——否則 v 會壓到下一列的 k。
        // 用內容實際折行後的高度判斷，不用 gap 的經驗閾值：k 或 v 一旦折行，
        // 看起來很寬鬆的 gap 也會不夠（分隔線畫在列起點上方 12pt，要一起算進去）。
        const vW0 = p.numbered ? 550 : 598;
        const nLines = (s, w, fs) => Math.max(1, Math.ceil(tw(s) / Math.max(8, Math.floor(w * 0.94 / fs))));
        const stackH = (it) => 17.5 * 1.4 * nLines(it.k, vW0, 17.5) + 5 + 14.5 * 1.55 * nLines(it.v, vW0, 14.5);
        const tight = !twoCol && !p.diagram && p.items.some((it) => stackH(it) > gap - 14);
        const kX = p.numbered ? 346 : 298;
        // 關鍵詞欄照「最長的 k」給寬，剩下的全讓給說明欄——
        // wideKey 是版面偏好，但空間不夠時說明折行的代價更大（會壓到下一列的分隔線）
        const kNeed = Math.max(...p.items.map((it) => tw(it.k))) * 13.5 * 1.15 + 12;   // 1.15：拉丁字母比 tw() 估的寬
        const kW = Math.min(p.wideKey || 190, 220, Math.ceil(kNeed));
        const vX = kX + kW + 16, vW = 896 - vX;
        // 分隔線畫在列起點上方，位置得看該列實際多高——
        // 列高吃滿 gap 時線會切進字裡，這種情況寧可不畫線（線是裝飾，字不是）
        const rowH = tight
          ? Math.max(13.5 * 1.4, ...p.items.map((it) => 12.5 * 1.5 * nLines(it.v, vW, 12.5)))
          : Math.max(...p.items.map(stackH));
        const sep = rowH <= gap - 14;
        const sepUp = Math.min(12, Math.max(4, (gap - rowH) / 2)).toFixed(1);

        // diagramOnly：圖已完整承載這些條目，B 版跟 A 版一樣不重列
        const shown = p.diagramOnly ? [] : p.items;

        const rows = shown.map((it, i) => {
          if (twoCol) {
            const col = i % 2, r = Math.floor(i / 2);
            const y = top + r * gap;
            return `
  ${col === 0 ? `<div style="position:absolute; left:298pt; top:${y - 12}pt; width:598pt; height:1pt; background:${C.hair};"></div>` : ''}
  <div style="position:absolute; left:${298 + col * 306}pt; top:${y}pt; width:290pt;" data-pptx-merge="true">
    <p class="k" style="font-size:15pt;">${it.k}</p>
    <p class="v" style="font-size:13pt; margin-top:4pt;">${it.v}</p>
  </div>`;
          }
          return `
  ${sep ? `<div style="position:absolute; left:298pt; top:${top + i * gap - sepUp}pt; width:598pt; height:1pt; background:${C.hair};"></div>` : ''}
  ${p.numbered ? `<div style="position:absolute; left:298pt; top:${top + i * gap + 2}pt; width:40pt;"><p class="serif" style="font-size:15pt; font-weight:600; color:${C.clay}; font-variant-numeric:tabular-nums;">${String(start + i).padStart(2, '0')}</p></div>` : ''}
  ${tight ? `
  <div style="position:absolute; left:${kX}pt; top:${top + i * gap}pt; width:${kW}pt;"><p class="k" style="font-size:13.5pt;">${it.k}</p></div>
  <div style="position:absolute; left:${vX}pt; top:${top + i * gap + 2}pt; width:${vW}pt;"><p class="v" style="font-size:12.5pt;">${it.v}</p></div>` : `
  <div style="position:absolute; left:${kX}pt; top:${top + i * gap}pt; width:${p.numbered ? 550 : 598}pt;" data-pptx-merge="true">
    <p class="k">${it.k}</p>
    <p class="v" style="margin-top:5pt;">${it.v}</p>
  </div>`}`;
        }).join('');

        const rowsH = (twoCol ? Math.ceil(shown.length / 2) : shown.length) * gap;
        const dia = p.diagram
          ? t.fit(ctx, p.diagram, {
            top: top + rowsH + (shown.length ? 12 : 0),
            bottom: hasBand ? 396 : 482,
            maxW: 598, cx: 597,
          })
          : '';

        const statBand = stats.map((s, i) => {
          const w = Math.floor(598 / stats.length);
          const x = 298 + i * w;
          return `
  <div style="position:absolute; left:${x}pt; top:${bandTop}pt; width:${w - 16}pt; height:1pt; background:${C.hair};"></div>
  <div style="position:absolute; left:${x}pt; top:${bandTop + 12}pt; width:${w - 16}pt;" data-pptx-merge="true">
    <p class="num" style="font-size:34pt; color:${s.hero ? C.clay : C.ink};">${s.value}${s.unit ? `<span class="unit">&nbsp;${s.unit}</span>` : ''}</p>
    <p class="lbl" style="margin-top:6pt;">${s.label}</p>
  </div>`;
        }).join('');

        const logos = p.logos ? `
  <div style="position:absolute; left:298pt; top:406pt; width:598pt; height:1pt; background:${C.hair};"></div>
  <div style="position:absolute; left:298pt; top:422pt; width:200pt;"><p class="kick" style="color:${C.clay};">${p.kicker || ''}</p></div>
  ${p.logos.map((g, i) => `
  <div class="card" style="position:absolute; left:${298 + i * 202}pt; top:446pt; width:190pt; height:38pt;"></div>
  ${g.src ? `<div style="position:absolute; left:${312 + i * 202}pt; top:456pt; width:18pt; height:18pt;"><img src="../assets/${g.src}" style="width:18pt; height:18pt;" alt=""></div>` : ''}
  <div style="position:absolute; left:${(g.src ? 338 : 312) + i * 202}pt; top:${g.src ? 458 : 452}pt; width:${g.src ? 140 : 166}pt;"><p style="font-size:11.5pt; line-height:1.4; color:${C.ink};">${g.text ? `<span style="font-weight:700;">${g.text}</span>　` : ''}${g.name}</p></div>`).join('')}` : '';

        const footer = (p.footer && !p.logos) ? `
  <div class="card" style="position:absolute; left:298pt; top:410pt; width:598pt; height:74pt; padding:18pt 22pt;" data-pptx-merge="true">
    ${p.kicker ? `<p class="kick" style="color:${C.clay};">${p.kicker}</p>` : ''}
    <p class="serif" style="font-size:16.5pt; font-weight:500; line-height:1.5; color:${C.ink}; margin-top:${p.kicker ? 8 : 0}pt;">${p.footer}</p>
  </div>` : '';

        return t.head(p, ctx) + t.title(p) + statBand + rows + dia + logos + footer;
      }

      case 'split': {
        // lead 佔兩行時卡片整組下移，否則導言第二行會壓到欄標題
        // （lead 欄寬 560pt、16.5pt，理論一行 34 字；取 31 留餘裕）
        const dy = p.lead && tw(p.lead) > 31 ? 26 : 0;
        const gy = dy ? 34 : 38;
        const col = (c, x, on) => `
  <div class="card" style="position:absolute; left:${x}pt; top:${170 + dy}pt; width:288pt; height:${298 - dy}pt; ${on ? `border-color:${C.clay};` : ''}"></div>
  <div style="position:absolute; left:${x + 22}pt; top:${190 + dy}pt; width:250pt;"><p class="serif" style="font-size:18pt; font-weight:600; color:${on ? C.clay : C.faint};">${c.label}</p></div>
  <div style="position:absolute; left:${x + 22}pt; top:${222 + dy}pt; width:244pt; height:1pt; background:${C.hair};"></div>
  ${c.items.map((s, i) => `
  <div style="position:absolute; left:${x + 22}pt; top:${238 + dy + i * gy}pt; width:250pt;">
    <p style="font-size:14.5pt; font-weight:${on ? 500 : 400}; line-height:1.4; color:${on ? C.ink : C.mut};">${s}</p>
  </div>`).join('')}`;
        return t.head(p, ctx) + t.title(p) + col(p.left, 298, false) + col(p.right, 608, true);
      }

      case 'flow': {
        // B 版的 flow 用卡片列；沒有 steps 而有 diagram 時退回貼圖
        if (!p.steps && p.diagram) {
          const notes = (p.notes || []).map((nt, i) => `
  <div style="position:absolute; left:${298 + i * 306}pt; top:400pt; width:290pt;" data-pptx-merge="true">
    <p class="kick" style="color:${C.clay};">${nt.k}</p>
    <p style="font-size:13pt; font-weight:300; line-height:1.55; color:${C.body}; margin-top:8pt;">${nt.v}</p>
  </div>`).join('');
          return t.head(p, ctx) + t.title(p) + t.img(ctx, p.diagram, 298, 176, 598) + notes;
        }
        const n = p.steps.length;
        const w = Math.floor((598 - 10 * (n - 1)) / n);
        const rows = p.steps.map((s, i) => `
  <div class="card" style="position:absolute; left:${298 + i * (w + 10)}pt; top:170pt; width:${w}pt; height:126pt; padding:16pt;" data-pptx-merge="true">
    <p style="font-size:10pt; letter-spacing:0.14em; color:${C.faint};">${String(i + 1).padStart(2, '0')}</p>
    <p class="serif" style="font-size:16pt; font-weight:600; line-height:1.35; color:${i === n - 1 ? C.clay : C.ink}; margin-top:10pt;">${s.label}</p>
    <p style="font-size:11pt; line-height:1.5; color:${C.mut}; margin-top:8pt;">${s.detail}</p>
  </div>
  ${i < n - 1 ? `<div style="position:absolute; left:${298 + i * (w + 10) + w + 2}pt; top:232pt; width:6pt; height:1pt; background:${C.faint};"></div>` : ''}`).join('');
        const notes = (p.notes || []).map((nt, i) => `
  <div style="position:absolute; left:${298 + i * 306}pt; top:378pt; width:290pt;" data-pptx-merge="true">
    <p class="kick" style="color:${C.clay};">${nt.k}</p>
    <p style="font-size:13pt; font-weight:300; line-height:1.55; color:${C.body}; margin-top:8pt;">${nt.v}</p>
  </div>`).join('');
        return t.head(p, ctx) + t.title(p) + rows + t.loop(ctx, p, 316, true) + notes;
      }

      case 'steps': {
        const n = p.steps.length;
        const w = Math.floor((598 - 9 * (n - 1)) / n);
        const cols = p.steps.map((s, i) => `
  <div class="card" style="position:absolute; left:${298 + i * (w + 9)}pt; top:200pt; width:${w}pt; height:170pt; padding:16pt;" data-pptx-merge="true">
    <p class="serif" style="font-size:22pt; font-weight:600; line-height:1; color:${C.clay}; font-variant-numeric:tabular-nums;">${s.no}</p>
    <p class="serif" style="font-size:14pt; font-weight:600; line-height:1.45; color:${C.ink}; margin-top:16pt;">${br(s.name)}</p>
  </div>`).join('');
        return t.head(p, ctx) + t.title(p) + cols + t.loop(ctx, p, 392, false);
      }

      case 'stat': {
        const hero = p.stats.find((s) => s.hero) || p.stats[0];
        const rest = p.stats.filter((s) => s !== hero);
        const cells = rest.map((s, i) => {
          const topRow = i < 2;
          const x = topRow ? 604 + i * 152 : 298 + (i - 2) * 121;
          const y = topRow ? 186 : 330;
          const w = topRow ? 140 : 113;
          return `
  <div class="card" style="position:absolute; left:${x}pt; top:${y}pt; width:${w}pt; height:${topRow ? 130 : 118}pt; padding:${topRow ? 20 : 14}pt;" data-pptx-merge="true">
    <p class="num" style="font-size:${s.text ? (topRow ? 26 : 20) : (topRow ? 40 : 30)}pt;">${s.value}${s.unit ? `<span class="unit" style="font-size:${topRow ? 12 : 10}pt;">&nbsp;${s.unit}</span>` : ''}</p>
    <p class="lbl" style="margin-top:${topRow ? 12 : 10}pt; font-size:${topRow ? 12 : 10.5}pt;">${s.label}</p>
  </div>`;
        }).join('');
        return t.head(p, ctx) + `
  <div style="position:absolute; left:298pt; top:72pt; width:598pt;"><h2 class="h2">${br(p.title || p.short)}</h2></div>
  <div class="card" style="position:absolute; left:298pt; top:186pt; width:286pt; height:130pt; padding:22pt 24pt;" data-pptx-merge="true">
    <p class="serif" style="font-size:64pt; font-weight:600; line-height:1; color:${C.clay}; font-variant-numeric:tabular-nums;">${hero.value}${hero.unit ? `<span style="font-family:'Noto Sans TC',sans-serif; font-size:16pt; font-weight:400; color:${C.claySoft};">&nbsp;${hero.unit}</span>` : ''}</p>
    <p class="lbl" style="margin-top:16pt;">${hero.label}</p>
  </div>` + cells;
      }

      case 'case': {
        const gapY = Math.min(96, Math.floor((470 - 186) / Math.max(1, p.blocks.length)));
        // 四塊以上時每塊只剩約 71pt，k 用 17.5pt 會折行而撞到下一條分隔線
        const many = p.blocks.length >= 4;
        const kFs = many ? 15.5 : 17.5, vFs = many ? 13.5 : 14.5;
        const blocks = p.blocks.map((b, i) => `
  <div style="position:absolute; left:298pt; top:${186 + i * gapY}pt; width:598pt; height:1pt; background:${C.hair};"></div>
  <div style="position:absolute; left:298pt; top:${202 + i * gapY}pt; width:130pt;"><p class="kick" style="color:${C.clay};">${b.label}</p></div>
  <div style="position:absolute; left:440pt; top:${196 + i * gapY}pt; width:456pt;" data-pptx-merge="true">
    ${b.items.map((s, j) => `<p class="${j === 0 ? 'k' : 'v'}" style="font-size:${j === 0 ? kFs : vFs}pt; margin-top:${j ? 7 : 0}pt;">${s}</p>`).join('')}
  </div>`).join('');
        return t.head(p, ctx) + t.title(p) + blocks;
      }

      case 'turn': {
        const side = (d, x, on) => `
  <div class="card" style="position:absolute; left:${x}pt; top:160pt; width:288pt; height:262pt; ${on ? `border-color:${C.clay};` : ''}"></div>
  <div style="position:absolute; left:${x + 22}pt; top:180pt; width:250pt;"><p class="kick" style="color:${on ? C.clay : C.faint};">${d.label}</p></div>
  <div style="position:absolute; left:${x + 22}pt; top:206pt; width:250pt;" data-pptx-merge="true">
    <p class="serif" style="font-size:62pt; font-weight:600; line-height:1; color:${on ? C.clay : C.faint}; font-variant-numeric:tabular-nums;">${d.score}${d.unit ? `<span style="font-family:'Noto Sans TC',sans-serif; font-size:18pt; font-weight:400;">&nbsp;${d.unit}</span>` : ''}</p>
    ${d.note ? `<p class="lbl" style="margin-top:10pt;">${d.note}</p>` : ''}
  </div>
  <div style="position:absolute; left:${x + 22}pt; top:314pt; width:244pt; height:1pt; background:${C.hair};"></div>
  ${(d.items || []).map((s, i) => `
  <div style="position:absolute; left:${x + 22}pt; top:${330 + i * 30}pt; width:250pt;">
    <p style="font-size:13.5pt; font-weight:400; line-height:1.4; color:${on ? C.ink : C.mut};">${s}</p>
  </div>`).join('')}`;
        const band = p.sources ? `
  <div style="position:absolute; left:298pt; top:440pt; width:160pt;"><p class="kick" style="color:${C.faint};">${p.sourcesLabel || ''}</p></div>
  ${p.sources.map((s, i) => `
  ${s.src ? `<div style="position:absolute; left:${420 + i * 130}pt; top:438pt; width:16pt; height:16pt;"><img src="../assets/${s.src}" style="width:16pt; height:16pt;" alt=""></div>` : ''}
  <div style="position:absolute; left:${(s.src ? 444 : 420) + i * 130}pt; top:440pt; width:106pt;"><p style="font-size:11pt; color:${C.mut};">${s.name}</p></div>`).join('')}` : '';
        return t.head(p, ctx) + t.title(p) + side(p.before, 298, false) + side(p.after, 608, true) + band;
      }

      case 'closing': {
        // 行距由可用高度反推：PPTX 要求文字框離底邊 ≥0.5"，5 條就得收緊。
        // 欄寬只有 556pt，長句子會折行——字級要跟著降到「全部塞得下」為止。
        const an = (p.actions || []).length;
        const aY = an > 4 ? 344 : 356;
        const aLines = (s, fs) => Math.max(1, Math.ceil(tw(s) / Math.max(8, Math.floor(556 / fs))));
        let aFs = 15, aG = 32;
        for (const fs of [15, 14, 13.5, 13]) {
          const need = Math.max(...(p.actions || ['']).map((s) => aLines(s, fs))) * fs * 1.45 + 9;
          aFs = fs; aG = Math.max(26, Math.round(need));
          if (aY + aG * an <= 492) break;
        }
        const acts = (p.actions || []).map((s, i) => `
  <div style="position:absolute; left:298pt; top:${aY + i * aG}pt; width:34pt;"><p class="serif" style="font-size:13pt; font-weight:600; color:${C.clay}; font-variant-numeric:tabular-nums;">${String(i + 1).padStart(2, '0')}</p></div>
  <div style="position:absolute; left:340pt; top:${aY - 2 + i * aG}pt; width:556pt;"><p style="font-size:${aFs}pt; font-weight:400; line-height:1.45; color:${C.body};">${s}</p></div>`).join('');
        return t.head(p, ctx) + t.title(p) + `
  <div class="card" style="position:absolute; left:298pt; top:150pt; width:598pt; height:118pt; padding:24pt 26pt;" data-pptx-merge="true">
    ${p.keyLabel ? `<p class="kick" style="color:${C.clay};">${p.keyLabel}</p>` : ''}
    <p class="serif" style="font-size:26pt; font-weight:600; line-height:1.4; color:${C.ink}; margin-top:12pt;">${p.key}</p>
  </div>
  <div style="position:absolute; left:298pt; top:310pt; width:598pt; height:1pt; background:${C.hair};"></div>
  ${p.actionLabel ? `<div style="position:absolute; left:298pt; top:324pt; width:300pt;"><p class="kick">${p.actionLabel}</p></div>` : ''}` + acts;
      }

      // ── table：資料矩陣。B 版走「跨頁大表」——放掉左窄欄，改滿版排 ──
      case 'table': {
        const cols = p.cols || [], rows = p.rows || [], on = p.on || [];
        const ch = ctx.chapterOf(p);
        const X0 = 72, TOTAL = 824;
        const sum = cols.reduce((a, c) => a + (c.w || 1), 0);
        const ws = cols.map((c) => (c.w || 1) / sum * TOTAL);
        const xs = []; let acc = X0;
        for (const w of ws) { xs.push(acc); acc += w; }
        const top = p.lead ? 192 : 152;
        const bot = p.note ? 458 : 492;
        const headH = 22;
        // 上限 60 而非 46：三、四列的表格若卡在 46，版心會空掉一大片；
        // 十列以上的表格本來就遠低於上限，不受影響
        const rowH = Math.min(60, (bot - top - headH) / Math.max(1, rows.length));
        const fs = +Math.max(9.5, Math.min(13, rowH * 0.46)).toFixed(1);

        const shell = `
  ${ch ? `<div style="position:absolute; left:${X0}pt; top:56pt; width:500pt;"><p class="kick">${ch.no} ${ch.name}</p></div>` : ''}
  <div style="position:absolute; left:${X0}pt; top:56pt; width:${TOTAL}pt; text-align:right;"><p style="font-size:10pt; letter-spacing:0.14em; color:${C.faint};">${String(ctx.index).padStart(2, '0')} / ${ctx.total}</p></div>
  <div style="position:absolute; left:${X0}pt; top:88pt; width:${TOTAL}pt;"><h2 class="h2">${br(p.title)}</h2></div>
  ${p.lead ? `<div style="position:absolute; left:${X0}pt; top:146pt; width:700pt;"><p class="lead" style="font-size:15pt;">${p.lead}</p></div>` : ''}`;

        const head = cols.map((c, i) => `
  <div style="position:absolute; left:${xs[i].toFixed(1)}pt; top:${top}pt; width:${(ws[i] - 10).toFixed(1)}pt;"><p style="font-size:9.5pt; font-weight:500; letter-spacing:0.05em; line-height:1.3; color:${C.faint}; text-align:${c.align || 'left'};">${c.k}</p></div>`).join('') + `
  <div style="position:absolute; left:${X0}pt; top:${top + headH - 4}pt; width:${TOTAL}pt; height:1.5pt; background:${C.ink};"></div>`;

        const body = rows.map((r, ri) => {
          const y = top + headH + ri * rowH;
          const ty = (y + (rowH - fs * 1.45) / 2).toFixed(1);
          const band = ri % 2
            ? `<div style="position:absolute; left:${X0}pt; top:${y.toFixed(1)}pt; width:${TOTAL}pt; height:${rowH.toFixed(1)}pt; background:${C.card};"></div>` : '';
          const cells = r.map((v, ci) => {
            const cw = ws[ci], cx = xs[ci], al = cols[ci].align || 'left';
            // B 版紀律：全頁只有一處高飽和色，所以 A 級用 clay 字＋底線，不填色塊
            if (p.grade && /^[ABC]$/.test(v)) {
              const fg = v === 'A' ? C.clay : (v === 'B' ? C.ink : C.faint);
              const cwc = Math.min(cw - 14, 52), cxc = cx + (cw - 10 - cwc) / 2;
              return `
  <div style="position:absolute; left:${cxc.toFixed(1)}pt; top:${ty}pt; width:${cwc.toFixed(1)}pt;"><p class="serif" style="font-size:${(fs + 1).toFixed(1)}pt; font-weight:${v === 'C' ? 400 : 700}; line-height:1.4; color:${fg}; text-align:center;">${v}</p></div>
  ${v === 'A' ? `<div style="position:absolute; left:${(cxc + cwc / 2 - 9).toFixed(1)}pt; top:${(y + rowH - 5).toFixed(1)}pt; width:18pt; height:2pt; background:${C.clay};"></div>` : ''}`;
            }
            const hot = on.includes(v);
            const bold = ci === 0 || ci === p.emph || hot;
            return `
  <div style="position:absolute; left:${cx.toFixed(1)}pt; top:${ty}pt; width:${(cw - 10).toFixed(1)}pt;"><p style="font-size:${fs}pt; font-weight:${bold ? 600 : 400}; line-height:1.4; color:${hot ? C.clay : (ci === 0 ? C.ink : C.mut)}; text-align:${al};">${v}</p></div>`;
          }).join('');
          return band + cells;
        }).join('');

        const note = p.note ? `
  <div style="position:absolute; left:${X0}pt; top:466pt; width:${TOTAL}pt; height:1pt; background:${C.hair};"></div>
  ${p.noteLabel ? `<div style="position:absolute; left:${X0}pt; top:476pt; width:${TOTAL}pt;"><p class="kick" style="color:${C.clay};">${p.noteLabel}</p></div>` : ''}
  <div style="position:absolute; left:${X0}pt; top:${p.noteLabel ? 494 : 480}pt; width:${TOTAL}pt;"><p style="font-size:10.5pt; font-weight:400; line-height:1.35; color:${C.mut};">${p.note}</p></div>` : '';

        return shell + head + body + note;
      }
    }
    return '';
  },
};
