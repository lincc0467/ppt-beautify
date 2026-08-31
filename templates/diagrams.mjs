// diagrams.mjs — 圖解的向量原始檔。改圖改這裡，然後重跑 render_diagrams.mjs。
//
// 為什麼要繞這一圈：可編輯 PPTX 的 Path A 硬約束禁用複雜 SVG，但簡報需要圖解。
// 折衷是「圖以真 SVG 撰寫 → 渲染成 3x PNG → 投影片用 <img> 嵌入」。
// 結果：頁面文字在 PPTX 裡仍可編輯，圖是不可編輯的圖片；向量原始檔留在這裡。
//
// 硬性規定：
//   1. 每張圖都要有 viewBox="0 0 w h"（單位當 pt 用）——build.mjs 靠它等比縮放
//   2. 尺寸依用途：整頁主角約 720×300、條列下方的輔圖約 812×200、對照用約 380×150
//   3. 字型鏈與投影片一致（Noto Sans TC），字級 ≥ 11pt，否則 3x 縮小後看不清
//   4. 不要在圖裡重複投影片已經寫過的文字——圖是替代文字的，不是配文字的
//
// 這份範本只放兩張示範圖。實際改版時整份換掉，key 對應 content.js 的 diagram 欄位。

const FONT = `font-family="Noto Sans TC, Microsoft JhengHei, sans-serif"`;
const INK = '#14161A', MUT = '#4F5358', LINE = '#BFC3BE', ACC = '#D4501A';

// ── 四節點閉環：內容若有「執行 → 檢查 → 修正 → 再執行」的結構就用這張 ──
const loop = (nodes) => {
  const W = 720, H = 260, r = 96, cx = W / 2, cy = H / 2 + 6;
  const pt = (i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / nodes.length;
    return [cx + Math.cos(a) * r * 2.4, cy + Math.sin(a) * r * 0.78];
  };
  const boxes = nodes.map((n, i) => {
    const [x, y] = pt(i);
    const on = i === 0;
    return `
    <rect x="${x - 78}" y="${y - 24}" width="156" height="48" fill="${on ? ACC : '#FFFFFF'}" stroke="${on ? ACC : LINE}" stroke-width="1.5"/>
    <text x="${x}" y="${y + 5}" ${FONT} font-size="15" font-weight="700" fill="${on ? '#FFFFFF' : INK}" text-anchor="middle">${n}</text>`;
  }).join('');
  const arcs = nodes.map((_, i) => {
    const [x1, y1] = pt(i), [x2, y2] = pt((i + 1) % nodes.length);
    return `<path d="M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 + (y1 === y2 ? 46 : 0)} ${x2} ${y2}" fill="none" stroke="${LINE}" stroke-width="1.5" stroke-dasharray="4 4"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${arcs}${boxes}</svg>`;
};

// ── 扇出再收攏：任務分解 → 各個擊破 → 整合 ──
const fanout = (n = 4) => {
  const W = 720, H = 200;
  const legs = Array.from({ length: n }, (_, i) => {
    const y = 40 + i * ((H - 80) / (n - 1));
    return `
    <path d="M 170 ${H / 2} C 230 ${H / 2} 230 ${y} 290 ${y}" fill="none" stroke="${LINE}" stroke-width="1.5"/>
    <rect x="290" y="${y - 15}" width="140" height="30" fill="#FFFFFF" stroke="${LINE}" stroke-width="1.5"/>
    <text x="360" y="${y + 5}" ${FONT} font-size="13" fill="${MUT}" text-anchor="middle">子任務 ${i + 1}</text>
    <path d="M 430 ${y} C 490 ${y} 490 ${H / 2} 550 ${H / 2}" fill="none" stroke="${LINE}" stroke-width="1.5"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
    ${legs}
    <rect x="20" y="${H / 2 - 24}" width="150" height="48" fill="${INK}"/>
    <text x="95" y="${H / 2 + 5}" ${FONT} font-size="15" font-weight="700" fill="#FFFFFF" text-anchor="middle">複雜任務</text>
    <rect x="550" y="${H / 2 - 24}" width="150" height="48" fill="${ACC}"/>
    <text x="625" y="${H / 2 + 5}" ${FONT} font-size="15" font-weight="700" fill="#FFFFFF" text-anchor="middle">整合輸出</text>
  </svg>`;
};

export const DIAGRAMS = {
  'agent-loop': loop(['執行', '監控', '驗證', '調整']),
  'fan-out': fanout(4),
};
