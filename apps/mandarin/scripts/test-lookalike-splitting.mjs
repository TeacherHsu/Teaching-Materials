// 驗證形似字每個例詞各自成題，避免同組另一個完整例詞洩漏答案。
// 用法：node scripts/test-lookalike-splitting.mjs
import assert from 'node:assert/strict';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const { buildLookalikeQuestionItems } = await import('../src/activities/lookalikes.js');

const items = buildLookalikeQuestionItems({
  lookalikes: [{
    id: 'g1',
    status: 'ready',
    chars: [
      { char: '便', example: '便服、便條' },
      { char: '使', example: '天使、使命' },
    ],
  }],
});

const 使Items = items.filter((item) => item.answer === '使');
assert.deepEqual(
  使Items.map((item) => item.stem),
  ['「天＿」，空格裡應該填哪一個字？', '「＿命」，空格裡應該填哪一個字？'],
  '「天使、使命」應拆成兩個獨立填空題',
);
assert.deepEqual(
  使Items.map((item) => item.explanation),
  ['正確答案是「使」：天使', '正確答案是「使」：使命'],
  '每題解答只應對應目前這一個例詞',
);
assert.ok(
  使Items.every((item) => !item.stem.includes('天使') && !item.stem.includes('使命')),
  '題幹不可露出完整答案例詞',
);

console.log('PASS: 形似字例詞已逐詞拆題，題幹不會露出同組另一個完整答案。');
