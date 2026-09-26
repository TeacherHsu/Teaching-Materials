// 驗證修辭題幹會把官方資料中的關鍵字標記轉成有色文字，且朗讀文字不含資料標記。
import assert from 'node:assert/strict';
import { installFakeDom } from './fake-dom.mjs';
import { splitRhetoricExample, stripRhetoricMarkup, buildRhetoricActivity } from '../src/activities/rhetoric.js';

const segments = splitRhetoricExample('甲﹁乙﹂丙「丁」戊『己』');
assert.deepEqual(segments, [
  { text: '甲', highlighted: false },
  { text: '乙', highlighted: true },
  { text: '丙', highlighted: false },
  { text: '丁', highlighted: true },
  { text: '戊', highlighted: false },
  { text: '己', highlighted: true },
]);
assert.equal(stripRhetoricMarkup('甲﹁乙﹂丙「丁」戊『己』'), '甲乙丙丁戊己');

installFakeDom();
const root = buildRhetoricActivity(
  {
    rhetoric: [
      { id: 'r1', figure: '轉化', example: '甲﹁關鍵﹂乙', child_note: '說明一', status: 'ready' },
      { id: 'r2', figure: '譬喻', example: '普通句二', child_note: '說明二', status: 'ready' },
      { id: 'r3', figure: '映襯', example: '普通句三', child_note: '說明三', status: 'ready' },
    ],
  },
  () => {},
);
const stem = root.find((node) => node.hasClass('quiz-stem'));
assert.equal(stem.textContent, '這句話用了什麼修辭？「甲關鍵乙」');
assert.equal(stem.find((node) => node.hasClass('rhetoric-highlight')).textContent, '關鍵');

console.log('PASS: 修辭題幹會隱藏官方標記、保留朗讀純文字，並將關鍵字套用變色元素。');
