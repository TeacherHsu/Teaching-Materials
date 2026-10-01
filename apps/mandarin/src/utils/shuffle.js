// 決定性（seeded）洗牌工具，供「排序題」使用：
// 需要保證初始呈現順序「一定被打亂」（不等於正解、且至少 2 個位置不同），
// 同時同一份內容每次產生同一個順序（好測試、好除錯）。

/** 用字串內容算出一個穩定的整數 seed（不需要密碼學強度，只求可重現）。 */
function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32：簡單、可重現的偽隨機數產生器。 */
function mulberry32(seed) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fisherYates(arr, rand) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * 一般選項洗牌：不改動原陣列，預設每次以 Math.random 重新排列。
 * 可傳入測試用 random 函式，讓回歸測試不必依賴真實隨機結果。
 * @param {Array} items
 * @param {() => number} [random]
 * @returns {Array}
 */
export function shuffle(items, random = Math.random) {
  // 這裡**不可以**加「如果結果和輸入完全相同就交換前兩個」那種修正。
  // 它會讓小 n 的分布嚴重偏斜，而且正好打在支持層：
  //   2 選項 → Fisher-Yates 有 1/2 機率得到原序，全部被改成交換，
  //            結果變成「永遠交換」，正解 100% 固定在第二個位置，
  //            學生只要學會「選下面那個」就全對。
  //   3 選項 → 第一位 16.9%／第二位 49.7%／第三位 33.4%（理想各 33.3%）
  // 「保證和原順序不同」是排序題的需求（不能一開始就顯示正解順序），
  // 那是 shuffleDiffering 的職責，不是一般選項洗牌的。
  return fisherYates(items, random);
}

function countDiffPositions(a, b) {
  let count = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) count += 1;
  }
  return count;
}

/**
 * 回傳一個保證與原始順序不同（且至少 2 個位置不同）的洗牌結果。
 * seed 預設由 items 內容算出，相同內容每次呼叫得到相同結果。
 * @param {Array} items 正解順序
 * @param {string|number} [seed]
 * @returns {Array}
 */
export function shuffleDiffering(items, seed) {
  if (items.length < 2) return [...items];
  const minDiff = Math.min(2, items.length);
  const baseSeed = seed !== undefined ? String(seed) : items.join('|');
  let attemptSeed = hashSeed(baseSeed);
  let result = items;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const rand = mulberry32(attemptSeed + attempt);
    result = fisherYates(items, rand);
    if (countDiffPositions(result, items) >= minDiff) return result;
  }
  // 保底：理論上不會走到這裡（items.length>=2 時交換前兩個必定至少 2 個位置不同）
  result = [...items];
  [result[0], result[1]] = [result[1], result[0]];
  return result;
}
