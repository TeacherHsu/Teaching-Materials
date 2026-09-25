// 驗證所有選擇題共用的選項洗牌契約：
// 1. 不改動原題庫陣列；2. 保留所有選項；3. ChoiceQuiz 題面不沿用資料原順序。
// 用法：node scripts/test-option-shuffle.mjs
import assert from 'node:assert/strict';
import { installFakeDom } from './fake-dom.mjs';
import { shuffle } from '../src/utils/shuffle.js';

const original = ['甲', '乙', '丙', '丁'];
const shuffled = shuffle(original, () => 0);
assert.notDeepEqual(shuffled, original, '受控亂數下選項不應保留原順序');
assert.deepEqual([...shuffled].sort(), [...original].sort(), '洗牌不可遺失或重複選項');
assert.deepEqual(original, ['甲', '乙', '丙', '丁'], '洗牌不可改動題庫原陣列');

installFakeDom();
const { ChoiceQuiz } = await import('../src/components/ChoiceQuiz.js');
const previousRandom = Math.random;
Math.random = () => 0;
try {
  const root = ChoiceQuiz({
    items: [{ stem: '請選出正確答案', options: original, answer: '甲' }],
  });
  const buttons = root.findAll((node) => node.tagName === 'button' && node.hasClass('quiz-option'));
  assert.deepEqual(
    buttons.map((button) => button.textContent),
    shuffled,
    'ChoiceQuiz 應使用洗牌後的選項順序呈現題面',
  );
} finally {
  Math.random = previousRandom;
}

console.log('PASS: 共用選項洗牌保留內容、避免固定順序，ChoiceQuiz 題面已套用。');
