// 驗證「讀懂課文」段落排序題的初始呈現順序一定被打亂：
//   1. shuffleDiffering() 本身：對多組不同輸入，結果都不等於原順序、且至少 2 個位置不同，
//      同一份輸入重複呼叫得到相同結果（seeded，可重現）。
//   2. 整合到 buildReadingActivity()：段落大意的「詞塊」初始呈現順序（bank）
//      不等於正解順序（sorted by para_no）。
// 無新依賴，純 Node（fake-dom stub 只給整合測試用）。
// 用法：node scripts/test-reading-paragraph-shuffle.mjs
import assert from 'node:assert/strict';
import { shuffleDiffering } from '../src/utils/shuffle.js';
import { installFakeDom } from './fake-dom.mjs';

function countDiff(a, b) {
  let n = 0;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) n += 1;
  return n;
}

// --- 1. 單元測試：shuffleDiffering ---
const samples = [
  ['第一段大意', '第二段大意', '第三段大意'],
  ['甲', '乙', '丙', '丁'],
  ['段落A講的是主角出場', '段落B講的是發生的事情', '段落C講的是結果', '段落D講的是啟示'],
];

for (const original of samples) {
  const shuffled = shuffleDiffering(original);
  assert.notDeepEqual(shuffled, original, `不應該等於原順序：${JSON.stringify(original)}`);
  const diff = countDiff(shuffled, original);
  assert.ok(diff >= 2, `至少要有 2 個位置不同，實際 ${diff}：${JSON.stringify(shuffled)}`);
  assert.deepEqual([...shuffled].sort(), [...original].sort(), '洗牌後元素集合應該不變');

  // seeded：同樣輸入重複呼叫要得到同一個結果。
  const again = shuffleDiffering(original);
  assert.deepEqual(again, shuffled, '相同輸入應該得到相同（可重現）的洗牌結果');
}

// 長度 < 2 的邊界情況：原樣返回，不應該丟例外。
assert.deepEqual(shuffleDiffering(['只有一段']), ['只有一段']);
assert.deepEqual(shuffleDiffering([]), []);

console.log('PASS (1/2): shuffleDiffering 對多組輸入都保證打亂（不等於正解、至少 2 個位置不同）且可重現。');

// --- 2. 整合測試：buildReadingActivity 的段落排序初始順序 ---
installFakeDom();
const { buildReadingActivity } = await import('../src/activities/reading.js');

const paragraphs = [
  { para_no: 1, summary: '主角在公園散步，發現了一隻小狗。', status: 'ready' },
  { para_no: 2, summary: '主角把小狗帶回家，細心照顧牠。', status: 'ready' },
  { para_no: 3, summary: '小狗漸漸長大，成為主角最好的朋友。', status: 'ready' },
  { para_no: 4, summary: '主角學會了負責任，也更懂得關心別人。', status: 'ready' },
];
const correctOrder = paragraphs.map((p) => p.summary);

const lesson = { paragraph_summary: paragraphs, reading_questions: [] };
const container = buildReadingActivity(lesson, () => {});

const chips = container.findAll((n) => n.hasClass && n.hasClass('sentence-chip') && n.tagName === 'button');
const bankOrder = chips.map((c) => c.textContent);

assert.equal(bankOrder.length, correctOrder.length, '詞塊數量應該等於段落數');
assert.notDeepEqual(bankOrder, correctOrder, '初始呈現順序不應該等於正解順序');
const diff2 = countDiff(bankOrder, correctOrder);
assert.ok(diff2 >= 2, `初始呈現順序至少要有 2 個位置和正解不同，實際 ${diff2}`);

console.log('PASS (2/2): buildReadingActivity 段落排序初始順序確實被打亂，不等於正解。');
