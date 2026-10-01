// 驗證選項洗牌是均勻的——正解不可以偏向某個位置。
//
// 為什麼要有這支測試：原本的 shuffle() 有一段「如果結果和輸入完全相同，
// 就交換前兩個」的修正，導致
//   2 選項：正解 100% 固定在第二個位置（支持層！學生學會「選下面那個」就全對）
//   3 選項：第一位 16.9%／第二位 49.7%／第三位 33.4%
// 這正好打在最需要保護的那群學生身上。這支測試就是防止它被加回來。
//
// 「保證和原順序不同」是排序題的需求（不能一開始就顯示正解順序），
// 由 shuffleDiffering 負責，不屬於一般選項洗牌。
// 用法：node scripts/test-shuffle-uniformity.mjs
import assert from 'node:assert/strict';
import { shuffle, shuffleDiffering } from '../src/utils/shuffle.js';

const N = 60000;
// 允許的偏離：60000 次下每格的標準差約 0.18pt，1.5pt 遠在雜訊之外，
// 但不至於因為隨機波動而偶爾紅燈。
const TOLERANCE_PT = 1.5;

for (const optionCount of [2, 3, 4, 5]) {
  const items = ['正解', ...Array.from({ length: optionCount - 1 }, (_, i) => `干擾${i}`)];
  const positions = new Array(optionCount).fill(0);
  for (let i = 0; i < N; i += 1) {
    positions[shuffle(items).indexOf('正解')] += 1;
  }
  const ideal = 100 / optionCount;
  positions.forEach((count, index) => {
    const pct = (count / N) * 100;
    assert.ok(
      Math.abs(pct - ideal) < TOLERANCE_PT,
      `${optionCount} 選項：正解在第 ${index + 1} 位的機率 ${pct.toFixed(1)}%，`
      + `理想 ${ideal.toFixed(1)}%，偏離過大——選項洗牌有偏，學生可以靠位置猜答案`,
    );
  });
}

// 2 選項必須兩種順序都會出現（曾經永遠只出現一種）
const twoOptionResults = new Set();
for (let i = 0; i < 300; i += 1) twoOptionResults.add(shuffle(['甲', '乙']).join(''));
assert.equal(twoOptionResults.size, 2, '2 個選項時兩種順序都要出現，不可固定');

// 洗牌的基本契約
const original = ['甲', '乙', '丙', '丁'];
const out = shuffle(original);
assert.deepEqual([...out].sort(), [...original].sort(), '不可遺失或重複選項');
assert.deepEqual(original, ['甲', '乙', '丙', '丁'], '不可改動原陣列');
assert.deepEqual(shuffle([]), [], '空陣列不該炸');
assert.deepEqual(shuffle(['只有一個']), ['只有一個']);

// 排序題用的 shuffleDiffering 仍然必須保證和原順序不同——那是它的職責
for (const length of [2, 3, 4, 5, 8]) {
  const solution = Array.from({ length }, (_, i) => `詞${i}`);
  const scrambled = shuffleDiffering(solution);
  assert.notDeepEqual(scrambled, solution, `${length} 個詞塊：排序題不可一開始就顯示正解順序`);
  assert.deepEqual([...scrambled].sort(), [...solution].sort());
}

console.log(`✅ 選項洗牌均勻（2–5 選項各 ${N} 次，偏離 < ${TOLERANCE_PT}pt）；`
  + '2 選項不固定；shuffleDiffering 仍保證與正解順序不同');
