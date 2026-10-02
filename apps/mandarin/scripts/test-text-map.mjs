// 課文地圖（讀懂課文第一步）：段落大意 → 地圖格子。
// 三種資料型態都要對：四上有結構區塊＋段號、二上只有結構區塊、六上有段落範圍與子篇。
import assert from 'node:assert/strict';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const { buildTextMap } = await import('../src/activities/reading.js');

// 四上型：同一區塊的段落合成一格，段號接成範圍
const g4 = buildTextMap([
  { paragraph_no: 1, structure_block: '加入', summary: 'a。' },
  { paragraph_no: 2, structure_block: '加入', summary: 'b。' },
  { paragraph_no: 3, structure_block: '練習', summary: 'c。' },
]);
assert.deepEqual(g4.map((n) => [n.label, n.range]), [['加入', '第一～二段'], ['練習', '第三段']]);
assert.equal(g4[0].gists.join(''), 'a。b。');

// 二上型：沒有段號就不顯示範圍
const g2 = buildTextMap([{ structure_block: '起因', summary: 'x' }, { structure_block: '結果', summary: 'y' }]);
assert.deepEqual(g2.map((n) => n.range), ['', '']);

// 六上型：段落範圍可以到二十幾段；子篇不同就算區塊名稱一樣也不合併
const g6 = buildTextMap([
  { paragraph_no: 5, paragraph_span: [5, 15], summary: 'p' },
  { paragraph_no: 21, paragraph_span: [21, 23], summary: 'q' },
  { paragraph_no: 1, section: '觀樹', summary: 'r' },
  { paragraph_no: 1, section: '種樹', summary: 's' },
]);
assert.deepEqual(g6.map((n) => n.range), ['第五～十五段', '第二十一～二十三段', '第一段', '第一段']);
assert.deepEqual(g6.map((n) => n.section), ['', '', '觀樹', '種樹']);

console.log('✅ 課文地圖：區塊合併、段落範圍（含二十幾段）、子篇分開都正確');
