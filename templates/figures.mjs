// figures.mjs — 圖解，但畫在 HTML 裡而不是 SVG 裡。
//
// 跟 diagrams.mjs 的差別，只有一句話：
//
//   diagrams.mjs  SVG → 3x PNG → <img>   圖在 PPTX 裡是一張不可編輯的圖片
//   figures.mjs   直接寫 HTML             圖在 PPTX 裡是一堆原生物件，可拖拉、可改字
//
// 之所以做得到，是因為 export_deck_pptx 本來就逐元素翻譯 DOM：
//   有背景／邊框的 <div>  → PowerPoint 矩形
//   細長的 <div>          → 一條線
//   <p>                   → 真的文字框
// 只要圖只用得到方塊、直線、文字，就沒有理由先轉成 PNG。
//
// ⚠ 什麼時候該回頭用 diagrams.mjs：真的需要曲線、波形、任意 SVG path。
//   那些 HTML 畫不出來，只能接受圖是圖片。箭頭三角形也算——
//   這裡的作法是不畫箭頭，方向靠標籤與左→右的版面順序表達。
//
// ── 介面 ────────────────────────────────────────────────────
// 每個 figure 是一個函式，收 { x, y, w, C }，回傳絕對定位的 HTML 片段：
//   x, y  由 theme 決定（各 theme 的圖框位置不同）
//   w     實際欄寬。內部座標請依「自然寬度」等比縮放，才能三套 theme 通用
//   C     theme 的調色盤，欄位固定為
//         { acc, accSoft, ink, mut, dim, line, soft, paper }
//         用它上色，不要在這裡寫死品牌色——否則換 theme 不會跟著換
//
// ── 可用高度（超過就會壓到頁尾的 notes／footer，而溢出檢查抓不到）────
//   flow    頁：A 186pt ／ B 210pt ／ C 216pt
//   bullets 頁（diagramOnly + footer）：約 200pt
// 設計時抓 ≤ 180pt 最安全。

const pt = (n) => `${(+n).toFixed(1)}pt`;

// 純視覺方塊：只有背景／邊框，不裝文字（文字用 txt 另外疊上去）。
// 這是 Path A 規則 3——背景／邊框只能寫在 div 上，不能寫在文字標籤上。
export const box = (x, y, w, h, { fill = 'transparent', border = null, bw = 1.2 } = {}) =>
  `<div style="position:absolute; left:${pt(x)}; top:${pt(y)}; width:${pt(w)}; height:${pt(h)}; background:${fill};${border ? ` border:${bw}pt solid ${border};` : ''}"></div>`;

// 文字：一律包在 <p> 裡（Path A 規則 1）。
// 同一框多行時掛 data-pptx-merge，匯出才會合併成單一文字框而不是散成好幾個。
export const txt = (x, y, w, lines, align = 'left') =>
  `<div style="position:absolute; left:${pt(x)}; top:${pt(y)}; width:${pt(w)};" data-pptx-merge="true">${lines
    .map((l) => `<p style="font-size:${(+l.s).toFixed(1)}pt; font-weight:${l.w || 400}; line-height:1.3; color:${l.c}; text-align:${align};${l.ls ? ` letter-spacing:${l.ls};` : ''}${l.mt ? ` margin-top:${pt(l.mt)};` : ''}">${l.t}</p>`)
    .join('')}</div>`;

// 等比縮放的座標工具：內部一律用「自然寬度」的座標寫，交給它換算。
// 字級也跟著縮，但收到 0.9 就打住——再小就低於現場投影看得見的下限。
export const scale = (x, y, w, natural) => {
  const S = w / natural;
  return {
    S,
    X: (n) => x + n * S,
    W: (n) => n * S,
    Y: (n) => y + n,
    f: (n) => Math.max(9.5, n * Math.max(0.9, S)),
  };
};

// ── 示範一：判斷分支 ──────────────────────────────────────────
// 「輸入 → 判斷 → 兩個結果」是技術簡報最常見的圖形。
// 連接線用直角折線；YES / NO 標在分支線正上方，不要塞進框跟框的縫隙裡（會貼框）。
const branch = ({ x, y, w = 720, C }, d) => {
  const { X, W, Y, f } = scale(x, y, w, 720);
  const C2 = 226, C2W = 176, TRUNK = 432, C3 = 474, C3W = 246;
  const line = (dx, dy, len, vertical) => (vertical
    ? box(X(dx), Y(dy), 1.5, len, { fill: C.line })
    : box(X(dx), Y(dy), W(len), 1.5, { fill: C.line }));

  const card = (dx, dy, bw2, head, sub, style) => box(X(dx), Y(dy), W(bw2), 58, {
    fill: style === 'on' ? C.acc : (style === 'soft' ? C.soft : C.paper),
    border: style === 'plain' ? C.line : null,
  }) + txt(X(dx) + W(16), Y(dy) + 10, W(bw2) - W(28), [
    { t: head, s: f(12.5), w: 700, c: style === 'on' ? C.paper : C.ink },
    { t: sub, s: f(11), c: style === 'on' ? C.paper : C.dim, mt: 5 },
  ]);

  return [
    txt(X(0), Y(0), W(200), [{ t: d.causeLabel, s: f(10), w: 700, c: C.dim, ls: '0.16em' }]),
    txt(X(C2), Y(0), W(200), [{ t: d.testLabel, s: f(10), w: 700, c: C.dim, ls: '0.16em' }]),
    txt(X(C3), Y(0), W(200), [{ t: d.outLabel, s: f(10), w: 700, c: C.dim, ls: '0.16em' }]),

    card(0, 20, 196, d.causes[0].k, d.causes[0].v, 'soft'),
    card(0, 90, 196, d.causes[1].k, d.causes[1].v, 'soft'),
    line(196, 41, 30, false),

    box(X(C2), Y(20), W(C2W), 42, { fill: C.ink }),
    txt(X(C2), Y(33), W(C2W), [{ t: d.input, s: f(12.5), w: 700, c: C.paper }], 'center'),
    line(C2 + C2W / 2, 62, 20, true),
    box(X(C2), Y(82), W(C2W), 52, { fill: C.paper, border: C.acc, bw: 1.6 }),
    txt(X(C2), Y(100), W(C2W), [{ t: d.test, s: f(13), w: 700, c: C.acc }], 'center'),

    line(C2 + C2W, 108, TRUNK - (C2 + C2W), false),
    line(TRUNK, 49, 70, true),
    line(TRUNK, 49, C3 - TRUNK, false),
    line(TRUNK, 119, C3 - TRUNK, false),
    txt(X(TRUNK), Y(33), W(C3 - TRUNK), [{ t: 'YES', s: f(9.8), w: 700, c: C.acc }], 'center'),
    txt(X(TRUNK), Y(103), W(C3 - TRUNK), [{ t: 'NO', s: f(9.8), w: 700, c: C.dim }], 'center'),

    card(C3, 20, C3W, d.yes.k, d.yes.v, 'on'),
    card(C3, 90, C3W, d.no.k, d.no.v, 'plain'),
  ].join('');
};

// ── 示範二：兩軌對照 ──────────────────────────────────────────
// 「改版前 / 改版後」沿同一條時間軸走，差別在某個時點之後才顯現。
// marker 標出那個時點；兩軌的差異就落在它右邊，一眼可見。
const tracks = ({ x, y, w = 720, C }, d) => {
  const { X, W, Y, f } = scale(x, y, w, 720);
  const X0 = 64, SEG = d.seg || [170, 220, 266];
  const at = (i) => X0 + SEG.slice(0, i).reduce((a, b) => a + b, 0);

  const row = (dy, label, cells, note, hot) => [
    txt(X(0), Y(dy) + 10, W(56), [{ t: label, s: f(12.5), w: 700, c: hot ? C.acc : C.mut }]),
    ...cells.map((cell, i) => box(X(at(i)), Y(dy), W(SEG[i]) - 2, 34, { fill: cell.on ? C.acc : (cell.mid ? C.accSoft : C.soft) })
      + txt(X(at(i)), Y(dy) + 9, W(SEG[i]) - 2,
        [{ t: cell.t, s: f(12.5), w: 700, c: cell.on || cell.mid ? C.paper : C.mut }], 'center')),
    txt(X(X0), Y(dy) + 40, W(720 - X0), [{ t: note, s: f(11), c: hot ? C.acc : C.dim }]),
  ].join('');

  return [
    box(X(at(2) - 1), Y(18), 1.5, 120, { fill: C.dim }),
    txt(X(at(2) - 90), Y(0), W(180), [{ t: d.marker, s: f(10), w: 700, c: C.dim, ls: '0.16em' }], 'center'),
    row(24, d.before.label, d.before.cells, d.before.note, false),
    row(86, d.after.label, d.after.cells, d.after.note, true),
  ].join('');
};

// key 對應 content.js 頁面的 figure 欄位。實際改版時整份換掉。
export const FIGURES = {
  'demo-branch': (o) => branch(o, {
    causeLabel: '兩種成因', testLabel: '判定', outLabel: '結果',
    causes: [{ k: '成因一', v: '其實不該觸發' }, { k: '成因二', v: '確實該觸發' }],
    input: '偵測到事件', test: '條件成立？',
    yes: { k: '忽略', v: '新版新增的分支' },
    no: { k: '照舊處理', v: '維持原本的行為' },
  }),
  'demo-tracks': (o) => tracks(o, {
    marker: '轉折點',
    before: {
      label: '舊版',
      cells: [{ t: '狀態 A' }, { t: '狀態 B', mid: true }, { t: '狀態 B', mid: true }],
      note: '轉折之後沒有跟著回復，卡在降級狀態',
    },
    after: {
      label: '新版',
      cells: [{ t: '狀態 A' }, { t: '狀態 B', mid: true }, { t: '狀態 A', on: true }],
      note: '轉折之後同步更新，回到原本的狀態',
    },
  }),
};
