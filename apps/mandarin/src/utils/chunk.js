// 把一串題目切成好幾輪，供「一輪幾題，可再來一輪」的模組共用。
//
// 每一輪的題數上限預設跟著這台載具的鷹架設定（支持層 3 題、標準／挑戰層 5 題），
// 呼叫端只有在這一站本來就需要不同節奏時才明確指定（例如造句一次 1–3 題）。
//
// 分組方式：先算要分幾輪，再**平均分配**。
//   15 題、上限 5 → 5／5／5（不是 5／5／5 之外還多一組）
//    7 題、上限 3 → 3／2／2（不是 3／3／1）
// 舊版的做法是「切滿上限，尾數不足就併入前一組」，那會讓最後一組**超過上限**
// （7 題上限 3 → 3／4），支持層設 3 題卻出現 4 題的一輪，等於設定沒生效。
// 平均分配同時解決兩件事：不超過上限，也不會留下只有一兩題的孤兒組。
import { getScaffoldLevel } from './deviceSettings.js';

/**
 * 平均分組：每組不超過 size，組數最少，各組題數盡量平均。
 * @param {Array} items
 * @param {number} size 每組上限
 * @returns {Array<Array>}
 */
export function balanced(items, size) {
  const list = [...items];
  if (list.length === 0) return [];
  const cap = Math.max(1, Math.floor(size) || 1);
  const groups = Math.ceil(list.length / cap);
  const base = Math.floor(list.length / groups);
  const extra = list.length % groups;
  const out = [];
  let at = 0;
  for (let i = 0; i < groups; i += 1) {
    const take = base + (i < extra ? 1 : 0);
    out.push(list.slice(at, at + take));
    at += take;
  }
  return out;
}

/**
 * @param {Array} items
 * @param {{min?: number, max?: number}} [opts]
 *   max：每輪題數上限。省略時用這台載具的鷹架設定（roundSize）。
 *   min：保留給舊呼叫端，平均分組之後已經不會產生孤兒組，所以不再需要；
 *        仍然接受這個參數是為了不用一次改掉所有呼叫端。
 * @returns {Array<Array>}
 */
export function chunkRounds(items, { max } = {}) {
  const cap = Number.isFinite(max) && max > 0 ? max : getScaffoldLevel().roundSize;
  return balanced(items, cap);
}
