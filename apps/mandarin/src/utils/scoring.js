// 星星計分規則（1–3 顆）。單一位置定義，供 ModulePage／測試共用。
//
// 資料來源：src/utils/scoreSession.js 彙總同一個大項作答期間的
//   { total, firstTryCount, revealedCount }
//
// 設計取向：**精熟導向（mastery goal），不是表現導向。**
// 舊規則是「全部第一次就答對才給 3 顆星」，等於只要用過提示就永遠拿不到滿星——
// 站上唯一的獎勵訊號和唯一的鷹架機制互相對立。對閱讀困難、學障學生而言，
// 滿星會變成結構性拿不到的東西（習得無助的配方），而能力好的學生則學會
// 「不要點提示」，鷹架因此失效。
// 現行規則獎勵「最後有沒有自己學會」，用不用提示不扣分；
// 「一次就對」改以額外徽章呈現（見 firstTryBadge），仍保留追求精熟的動機。
//
// 規則：
//   3 顆星：每一題最後都自己答對（可以重試、可以看提示），沒有任何一題被揭曉。
//   2 顆星：至多一題被系統揭曉正解。
//   1 顆星：兩題以上被揭曉，仍完成活動，給予完成的鼓勵星。
//   0 顆星：total === 0（純瀏覽步驟），不計入也不覆蓋既有最佳成績。
export function computeModuleStars({ total, revealedCount }) {
  if (!total || total <= 0) return 0;
  if (!revealedCount) return 3;
  if (revealedCount <= 1) return 2;
  return 1;
}

/**
 * 「一次就對」徽章：不影響星數，只是給行有餘力的學生一個額外目標。
 * @param {{total:number, firstTryCount:number}} session
 */
export function firstTryBadge({ total, firstTryCount }) {
  if (!total || total <= 0) return null;
  if (firstTryCount >= total) return { label: '全部一次就對', level: 'gold' };
  if (firstTryCount >= Math.ceil(total / 2)) return { label: '一半以上一次就對', level: 'silver' };
  return null;
}

const STAR_ICON_FILLED = `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M12 3.5l2.2 4.6l5 .7l-3.6 3.6l.9 5l-4.5-2.4l-4.5 2.4l.9-5l-3.6-3.6l5-.7Z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
const STAR_ICON_EMPTY = `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M12 3.5l2.2 4.6l5 .7l-3.6 3.6l.9 5l-4.5-2.4l-4.5 2.4l.9-5l-3.6-3.6l5-.7Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;

/**
 * 產生「N 顆星中的 M 顆」星星列的 HTML（供 h(..., {html}) 使用）。
 * 不只靠顏色：得到的星是填滿圖形、沒得到的是外框圖形，並附文字 aria-label。
 * @param {{earned:number, max?:number, size?:'sm'|'md'}} opts
 */
export function starsMarkup({ earned, max = 3, size = 'md' }) {
  const safeEarned = Math.max(0, Math.min(max, earned));
  const stars = Array.from({ length: max }, (_, i) => (i < safeEarned ? STAR_ICON_FILLED : STAR_ICON_EMPTY)).join('');
  const sizeClass = size === 'sm' ? ' star-row--sm' : '';
  return `<span class="star-row${sizeClass}" role="img" aria-label="${max} 顆星中得到 ${safeEarned} 顆">${stars}</span>`;
}
