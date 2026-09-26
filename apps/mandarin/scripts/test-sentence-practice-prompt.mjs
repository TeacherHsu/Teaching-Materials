import assert from 'node:assert/strict';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const { buildSentencePracticeActivity } = await import('../src/activities/sentencePractice.js');

const root = buildSentencePracticeActivity(
  {
    sentence_patterns: [
      {
        id: 'pattern-1',
        structure: '形容詞＋名詞',
        examples_status: 'approved',
        examples: ['美味的甜點'],
        example_parts: [['美味的', '甜點']],
      },
    ],
  },
  () => {},
);
const stem = root.find((node) => node.hasClass('quiz-stem'));
assert.equal(stem.textContent, '請把下面的詞語排成一句通順的句子');
assert.doesNotMatch(stem.textContent, /句型：/);

console.log('PASS: 句子重組題幹不再顯示多餘的「句型：」資訊。');
