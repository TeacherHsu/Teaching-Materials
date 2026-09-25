// 星星計分規則（1–3 顆）。單一位置定義，供 ModulePage／測試共用。
//
// 資料來源：src/utils/scoreSession.js 彙總同一個大項作答期間的
// { total, firstTryCount, revealedCount }：
//   total          — 這個大項總共判定了幾題／幾回合
//   firstTryCount  — 其中「第一次作答就自己答對」的題數（沒看提示、沒被揭曉）
//   revealedCount  — 其中「用盡重試、最後被系統揭曉正解」的題數（不是自己答對）
//
// 規則（由嚴到寬）：
//   3 顆星：全部題目都是第一次作答就答對（firstTryCount === total，且沒有被揭曉的）。
//   2 顆星：沒有任何一題被揭曉正解（revealedCount === 0），但至少有一題是
//           「答錯過一次、看提示後才答對」——代表理解了但不夠熟練。
//   1 顆星：至少有一題被揭曉正解（revealedCount > 0）——代表這題最後沒有
//           自己答對，仍完成了活動，給予完成的鼓勵星，但不到 2 顆。
//   0 顆星：total === 0（這個大項沒有任何可判定的題目，例如純瀏覽步驟），
//           不計入星星，也不會覆蓋既有最佳成績。
export function computeModuleStars({ total, firstTryCount, revealedCount }) {
  if (!total || total <= 0) return 0;
  if (revealedCount > 0) return 1;
  if (firstTryCount >= total) return 3;
  return 2;
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
