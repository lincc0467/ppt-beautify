// content.js — 內容模型：整份簡報只有這一個真相來源。
//
// 換掉這個檔＝換一份新簡報。三套 theme 讀同一份，所以比較的是設計不是文案。
// 版面數字（座標、行距）全在 theme 裡由可用高度反推，這裡只放「說什麼」。
//
// ⚠️ 這份是範本，內容是示範用的空殼。實際改版時整份重寫，
//    但保留 DECK / CHAPTERS / PAGES 三個 export 名稱與各頁型的欄位結構。

export const DECK = {
  // index 標題與 PPTX 檔名參考
  title: '簡報改版示範',
  // 封面左上的英文／代號小標（A 版用等寬字排，全大寫效果最好）
  kicker: 'DECK REDESIGN',
  // 場合與規格，出現在封面右上
  occasion: '內部分享',
  meta: '9 頁 · 約 20 分鐘',
  // 一句話母題（B 版封面左欄）。說出「這份內容的形狀是什麼」
  motif: '一份內容，\n三種設計邏輯',
  // 迴圈帶文字：內容若有「結果回饋到起點」的結構才填，沒有就刪掉這行，
  // 三套 theme 都會自動不畫那條帶子（不要為了畫而畫）
  loopLabel: '驗收結果回饋至內容模型',
  // C 版封面下半的步驟帶；沒填就退回用 CHAPTERS
  steps: [
    { no: '01', name: '拆解\n原檔' },
    { no: '02', name: '建立\n內容模型' },
    { no: '03', name: '長出\n設計語言' },
    { no: '04', name: '生成\n與驗收' },
  ],
  // A 版封面的敘事波形：level 0（低點）～100（高點），hero 標出情緒最高點
  arc: [
    { label: '現況', level: 30 },
    { label: '拆解', level: 40 },
    { label: '重構', level: 55 },
    { label: '低谷', level: 15, dim: true },
    { label: '翻盤', level: 95, hero: true },
  ],
  lang: 'zh-Hant',
};

// 章節：頁面用 ch 欄位指到 id。C 版會依序給每章一個顏色（也可自帶 color）
export const CHAPTERS = [
  { id: 'c1', no: '01', name: '問題',   blurb: '原檔壞在哪裡' },
  { id: 'c2', no: '02', name: '方法',   blurb: '內容模型與<br>設計系統分離' },
  { id: 'c3', no: '03', name: '案例',   blurb: '一次未達標<br>與一次翻盤' },
  { id: 'c4', no: '04', name: '收束',   blurb: '驗收標準與<br>交付格式' },
];

// ── 頁面 ──────────────────────────────────────────────────
// 共通選填欄位：
//   ch        章節 id；封面等不屬於任何章的頁面留 null
//   short     概覽牆上的短標籤（沒填就用 title）
//   stepNo    頁首顯示 STEP n
//   diagram   diagrams.mjs 的 key，以 <img> 嵌入
export const PAGES = [

  // ── cover：整份只有一頁。title2 與 sub 可省略 ──
  {
    type: 'cover', ch: null,
    title1: '把純文字簡報',
    title2: '重新設計一次',
    sub: '內容模型與設計系統分離，一份內容可以生成多套版面，並導出可編輯 PPTX',
  },

  // ── bullets：最常用的頁型。k 是關鍵詞、v 是說明 ──
  // 選填：lead / numbered / startNo / wideKey / footer / kicker / logos
  //       diagram（圖放條列下方）、diagramOnly（圖已說完，不再重列條目）
  {
    type: 'bullets', ch: 'c1',
    title: '純文字簡報壞在哪裡',
    lead: '不是不好看的問題。是資訊層級全靠字級大小承載，聽眾找不到重點在哪',
    items: [
      { k: '層級靠 emoji', v: '跨系統字形不一致，投影時破圖；而且是 AI slop 的典型特徵' },
      { k: '數字被埋在句子裡', v: '最有說服力的資產寫成內文，等於沒說' },
      { k: '每頁同權重', v: '沒有高低起伏，聽眾不知道哪頁該醒過來' },
      { k: '版面寫死行距', v: '行數一變就疊字，改一個字要重排整頁' },
    ],
    footer: '重點：層級應該由排版與色彩承載，不是由字級大小承載。',
    kicker: '判準',
  },

  // ── split：左右對照。tone 不影響版面，右欄一律是「被推薦的那一邊」 ──
  {
    type: 'split', ch: 'c1',
    title: '兩種做法的差別',
    left:  { label: '手刻每一頁', items: ['改一個字要重排', '版面不一致', '換設計＝全部重做', '無法批量產出'] },
    right: { label: '內容模型 × 設計系統', items: ['改內容只改一個檔', '版面由規則保證一致', '換設計＝換一個 theme', '一份內容多套版面'] },
  },

  // ── steps：橫向步驟條。no 短、name 可用 \n 斷行 ──
  {
    type: 'steps', ch: 'c2',
    title: '四個步驟',
    lead: '每一步都有明確的產出物，不做完不進下一步',
    steps: [
      { no: '01', name: '拆解原檔\n成大綱' },
      { no: '02', name: '寫成\n內容模型' },
      { no: '03', name: '長出\n設計語言' },
      { no: '04', name: '生成\n並驗收' },
    ],
  },

  // ── flow：帶說明的流程卡；A 版若給 diagram 則以圖為主角 ──
  {
    type: 'flow', ch: 'c2',
    title: '生成鏈',
    lead: '每一環都可重跑，中途改內容不必回頭重做前面',
    steps: [
      { label: '內容模型', detail: 'content.js 一份真相來源' },
      { label: '設計主題', detail: 'themes/*.js 各自的視覺邏輯' },
      { label: 'HTML deck', detail: '每頁一個獨立檔案' },
      { label: '可編輯 PPTX', detail: '文字都是真的文字框' },
    ],
    notes: [
      { k: '為什麼分離', v: '換設計不必動內容，換內容不必動設計。這是整套做法唯一的核心。' },
      { k: '為什麼要驗收', v: '溢出＝PPTX 匯出必定失敗，所以驗收是必經步驟不是加分項。' },
    ],
  },

  // ── figure：HTML 圖解當主角。匯出 PPTX 後圖是原生物件，不是圖片 ──
  // 跟 diagram 的差別只有一句：diagram 走 SVG→PNG（不可編輯），figure 走 HTML（可編輯）。
  // 只有方塊、直線、文字的圖一律用 figure；需要曲線才退回 diagram。
  {
    type: 'flow', ch: 'c2',
    title: '判斷分支',
    lead: '同一個事件有兩種成因，只有一種該觸發後續動作',
    figure: 'demo-branch',
    notes: [
      { k: '圖為什麼是主角', v: '這頁的內容是一個分支結構，純文字寫不出「哪一支走哪裡」。' },
      { k: '為什麼不用 diagram', v: '這張圖只有方塊、線與文字，用 HTML 畫就好，匯出後還能改字。' },
    ],
  },

  // ── case：左標籤右內容的區塊。第一行自動加粗 ──
  {
    type: 'case', ch: 'c3',
    title: '案例：一次改版',
    lead: '20 頁純文字 deck，三週內重做完成',
    blocks: [
      { label: '原始狀態', items: ['20 頁全純文字條列', '零圖片、零圖表、零資料視覺化'] },
      { label: '處理方式', items: ['文案在地化並砍冗字', '不砍資訊，只砍字'] },
      { label: '產出', items: ['3 套設計方向 × 20 頁', '13 張自繪圖解，可編輯 PPTX'] },
    ],
  },

  // ── turn：全場情緒最高點。左右各一個大數字，右邊是翻盤後 ──
  {
    type: 'turn', ch: 'c3',
    title: '未達標到翻盤',
    lead: '第一輪版面全數溢出，匯出 PPTX 全部失敗',
    before: {
      label: '第一輪', score: '0', unit: '/ 20',
      note: '20 頁全部匯出失敗',
      items: ['版面寫死行距', '文字直接放在 div 裡', '用了 CSS 漸層'],
    },
    after: {
      label: '第二輪', score: '20', unit: '/ 20',
      note: '全數通過，文字可編輯',
      items: ['行距由可用高度反推', '文字一律包在 p / h*', '漸層改用純色色塊'],
    },
    sourcesLabel: '改進來源',
    // sources 可省略；有 src 時檔案要放在專案的 assets/ 底下
    sources: [{ name: 'Path A 約束清單' }, { name: '版面體檢報告' }],
  },

  // ── stat：把數字提煉成視覺主角。hero 標出最重要那個；group 供 C 版分類上色 ──
  {
    type: 'stat', ch: 'c3', short: '成果數字',
    title: '成果',
    lead: '示意數字，用途為說明版面',
    stats: [
      { value: '20', unit: '頁', label: '重新設計的頁數', group: '規模', hero: true },
      { value: '3',  unit: '套', label: '設計方向',       group: '規模' },
      { value: '13', unit: '張', label: '自繪圖解',       group: '產出' },
      { value: '100', unit: '%', label: '匯出成功率',     group: '品質' },
    ],
  },

  // ── closing：一句關鍵洞見 + 行動清單 ──
  {
    type: 'closing', ch: 'c4',
    title: '總結',
    keyLabel: '關鍵洞見',
    key: '簡報的層級不該由字級承載，該由結構承載',
    actionLabel: '接下來',
    actions: [
      '把原檔拆成大綱，先確認資訊有沒有被砍掉',
      '寫內容模型時就決定每頁的視覺主角是誰',
      '每次改動都跑一次版面體檢，溢出就不交件',
    ],
  },
];
