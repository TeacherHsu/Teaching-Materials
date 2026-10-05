// 10 大項自繪 inline SVG 圖示（線條一致：2px 描邊，viewBox 0 0 24 24）。
// 不用 emoji、不抓外部圖。顏色一律用 currentColor，由外層容器設 color。
// 對照 docs：moduleRegistry.js 的 MODULE_REGISTRY 逐項指定 icon key。

const wrap = (paths) =>
  `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const MODULE_ICONS = {
  // 照樣造短語：兩塊詞塊接在一起
  phrase_builder: wrap(
    '<rect x="2.5" y="8" width="9" height="8" rx="1.5"/><rect x="12.5" y="8" width="9" height="8" rx="1.5"/><path d="M5.5 12h3M15.5 12h3"/>',
  ),
  // 認識生字：放大鏡＋字形方框
  characters: wrap(
    '<rect x="3" y="3" width="9" height="9" rx="1.5"/><path d="M6.5 6.5h2M6.5 9h2"/><circle cx="16.5" cy="16.5" r="4.5"/><path d="M19.8 19.8L22 22"/>',
  ),
  // 學會語詞：兩個字卡並排，中間箭頭連結
  vocabulary: wrap(
    '<rect x="2.5" y="7" width="7" height="10" rx="1.5"/><rect x="14.5" y="7" width="7" height="10" rx="1.5"/><path d="M10.5 12h3M12 10.5L13.5 12L12 13.5"/>',
  ),
  // 生字變成語：積木堆疊
  idiom_builder: wrap(
    '<rect x="3" y="14" width="6" height="6" rx="1"/><rect x="9.5" y="14" width="6" height="6" rx="1"/><rect x="16" y="14" width="5" height="6" rx="1"/><rect x="6" y="4" width="9" height="6" rx="1"/>',
  ),
  // 句型練習：句子條 + 齒輪組裝
  sentence_practice: wrap(
    '<path d="M3 7h13M3 12h9M3 17h13"/><circle cx="19" cy="12" r="3"/><path d="M19 8.5v1M19 14.5v1M22 12h-1M17 12h-1"/>',
  ),
  // 讀懂課文：翻開的書
  reading: wrap(
    '<path d="M12 5.5c-2-1.4-5-1.8-9-1V17c4-.8 7-.4 9 1c2-1.4 5-1.8 9-1V4.5c-4-.8-7-.4-9 1Z"/><path d="M12 5.5V18"/>',
  ),
  // 一字多義：一個字分岔出多個方向
  polysemy: wrap(
    '<circle cx="12" cy="7" r="3"/><path d="M12 10v3"/><path d="M12 13l-5 5M12 13l5 5M12 13v5"/>',
  ),
  // 注音高手：鍵盤
  zhuyin_typing: wrap(
    '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12"/>',
  ),
  // 抓重點：文件上標出重點的星號
  main_idea: wrap(
    '<path d="M6 3h9l4 4v14H6Z"/><path d="M14 3v5h5"/><path d="m12 11 1.2 2.5 2.8.4-2 2 .5 2.7-2.5-1.3-2.5 1.3.5-2.7-2-2 2.8-.4Z"/>',
  ),
  // 聽聽看：耳朵＋聲波
  listening: wrap(
    '<path d="M8 5a5 5 0 0 1 8 4c0 3-2 3.5-2 6a3 3 0 0 1-6 0"/><path d="M17 9c1.2.5 2 1.7 2 3.2c0 2.4-1.4 3-1.4 5.3"/>',
  ),
  // 修辭小偵探：放大鏡＋星（找出修辭手法）
  rhetoric: wrap(
    '<circle cx="10" cy="10" r="6.5"/><path d="M14.6 14.6L21 21"/><path d="M10 7.2l1 2.1l2.3.3l-1.7 1.6l.4 2.3L10 12.4l-2 1.1l.4-2.3l-1.7-1.6l2.3-.3Z"/>',
  ),
  // 舊字新詞：循環箭頭＋字
  review: wrap(
    '<path d="M4 12a8 8 0 0 1 14-5.3M4 12a8 8 0 0 0 14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
  ),
  // 一字多音：一個字＋音符（不同讀音）
  polyphones: wrap(
    '<circle cx="9" cy="12" r="6.5"/><path d="M9 9v6M7 10.5h4M7 13.5h4"/><path d="M17 6v9.5a2.5 2.5 0 1 1-1.2-2.1"/><circle cx="18.8" cy="17.5" r="1.7"/>',
  ),
  // 形似字：兩個相似方框＋放大鏡比對
  lookalikes: wrap(
    '<rect x="2.5" y="4" width="7.5" height="7.5" rx="1.2"/><rect x="12.5" y="4" width="7.5" height="7.5" rx="1.2"/><circle cx="9.5" cy="17.5" r="3.5"/><path d="M12.2 20.2L15 23"/>',
  ),
};

// 狀態徽章圖示
export const STATUS_ICONS = {
  done: wrap('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>'),
  lock: wrap('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  arrow: wrap('<path d="M5 12h13M13 6l6 6l-6 6"/>'),
  star: wrap('<path d="M12 3.5l2.2 4.6l5 .7l-3.6 3.6l.9 5l-4.5-2.4l-4.5 2.4l.9-5l-3.6-3.6l5-.7Z"/>'),
};

// 介面圖示：取代 emoji。
// 為什麼不用 emoji：每個平台的 emoji 長得不一樣（iPad 的 📖 和 Windows 的 📖
// 是兩套畫風），和自繪的大項圖示放在一起會像拼貼。而且 emoji 的細節多、
// 顏色雜，對視覺敏感的學生是干擾。這裡沿用同一套線條規格（2px 描邊、
// viewBox 0 0 24 24、currentColor），全站才是同一個視覺系統。
export const UI_ICONS = {
  // 課文點讀：攤開的書
  book: wrap('<path d="M12 6.5C10.5 5 8.5 4.5 4 4.5v13c4.5 0 6.5.5 8 2c1.5-1.5 3.5-2 8-2v-13c-4.5 0-6.5.5-8 2Z"/><path d="M12 6.5v13"/>'),
  // 朗讀挑戰：麥克風
  mic: wrap('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v3M9 21h6"/>'),
  // 錯題複習：循環箭頭
  redo: wrap('<path d="M3.5 12a8.5 8.5 0 0 1 14.5-6"/><path d="M18 3v3.5h-3.5"/><path d="M20.5 12a8.5 8.5 0 0 1-14.5 6"/><path d="M6 21v-3.5h3.5"/>'),
  // 單課小考：紙筆
  quiz: wrap('<path d="M5 3.5h9l5 5v12H5Z"/><path d="M14 3.5v5h5"/><path d="M8.5 13h7M8.5 16.5h4.5"/>'),
  // 自己寫一句話：鉛筆
  pencil: wrap('<path d="M4 20h4l10.5-10.5a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5Z"/><path d="M14 7.5l2.5 2.5"/>'),
  // 完成／看過了
  check: wrap('<path d="M4.5 12.5l5 5l10-11"/>'),
  // 送出之後
  sent: wrap('<path d="M4 11.5L20 4l-6 16l-3-6.5Z"/><path d="M11 13.5L20 4"/>'),
  // 慶祝（取代 🎉 🏅）
  award: wrap('<circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5L7 21l5-2.5L17 21l-1.5-7.5"/>'),
  // 字感訓練：目標
  target: wrap('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>'),
  // 空狀態：收件匣
  inbox: wrap('<path d="M3.5 13.5V18a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-4.5"/><path d="M3.5 13.5L6 5h12l2.5 8.5h-5a3 3 0 0 1-5 0Z"/>'),
};

/** 取 UI 圖示的 SVG 字串；沒有這個 key 時回空字串（不要顯示錯的圖）。 */
export function uiIconMarkup(key) {
  return UI_ICONS[key] || '';
}

// 大項插圖（Codex 生成，扁平化貼紙風，統一配色）。
// 有插圖的大項優先用插圖——比線性圖示更吸引學生，也更分得出彼此；
// 沒有插圖的退回原本的線性 SVG，不會開天窗。
const ILLUSTRATED = new Set([
  'characters', 'vocabulary', 'idiom_builder', 'sentence_practice', 'reading',
  'visual_search', 'lookalikes', 'polysemy', 'polyphones', 'listening',
  'rhetoric', 'zhuyin_typing', 'main_idea', 'review', 'word_reading',
]);

/** 插圖的網址；沒有這個大項的插圖時回 null。 */
export function moduleArtUrl(key, base = import.meta.env?.BASE_URL || '/') {
  if (!ILLUSTRATED.has(key)) return null;
  return `${String(base).replace(/\/$/, '')}/assets/icons/${key}.webp`;
}

export function moduleIconMarkup(key) {
  const url = moduleArtUrl(key);
  if (url) {
    // alt 留空：圖示旁邊一定有大項名稱的文字，重複念一次只是噪音
    return `<img src="${url}" alt="" width="48" height="48" loading="lazy" decoding="async">`;
  }
  return MODULE_ICONS[key] || STATUS_ICONS.star;
}
