// 10 大項自繪 inline SVG 圖示（線條一致：2px 描邊，viewBox 0 0 24 24）。
// 不用 emoji、不抓外部圖。顏色一律用 currentColor，由外層容器設 color。
// 對照 docs：moduleRegistry.js 的 MODULE_REGISTRY 逐項指定 icon key。

const wrap = (paths) =>
  `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const MODULE_ICONS = {
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
  // 課文地圖：路徑節點圖
  structure_map: wrap(
    '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="13" r="2"/><circle cx="12" cy="20" r="2"/><path d="M6.6 7.4L10.4 11.6M17.4 7.4L13.6 11.6M12 15v3"/>',
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
};

// 狀態徽章圖示
export const STATUS_ICONS = {
  done: wrap('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>'),
  lock: wrap('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  arrow: wrap('<path d="M5 12h13M13 6l6 6l-6 6"/>'),
  star: wrap('<path d="M12 3.5l2.2 4.6l5 .7l-3.6 3.6l.9 5l-4.5-2.4l-4.5 2.4l.9-5l-3.6-3.6l5-.7Z"/>'),
};

export function moduleIconMarkup(key) {
  return MODULE_ICONS[key] || STATUS_ICONS.star;
}
