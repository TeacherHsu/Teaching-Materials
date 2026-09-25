// 驗證「學會語詞」第 1 步（看圖）改成每組 5 張、保留步驟進度但不顯示組別進度、有下一組按鈕，
// 而不是一次全部（44+ 張）攤開成文字牆。無新依賴，純 Node（用 scripts/fake-dom.mjs 的 DOM stub）。
// 用法：node scripts/test-vocabulary-flip-chunking.mjs
import assert from 'node:assert/strict';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const { buildVocabularyActivity } = await import('../src/activities/vocabulary.js');

const WORD_COUNT = 44;
const words = Array.from({ length: WORD_COUNT }, (_, i) => ({
  id: `w${i}`,
  word: `詞${i}`,
  meaning: `意思${i}`,
  status: 'ready',
}));

const lesson = { words };
let backCalled = false;
const container = buildVocabularyActivity(lesson, () => {
  backCalled = true;
});

// card-grid 底下直接子元素數量 = 這一組顯示的字卡數
function gridChildCount() {
  const grid = container.find((n) => n.hasClass('card-grid'));
  assert.ok(grid, '應該有 .card-grid');
  return grid.children.length;
}

function bannerText() {
  const banner = container.find((n) => n.hasClass('task-banner__label'));
  return banner.textContent;
}

const expectedRounds = Math.ceil(WORD_COUNT / 5);
let round = 1;
let totalShown = 0;

while (true) {
  const count = gridChildCount();
  assert.ok(count >= 1 && count <= 5, `每組應該 1–5 張，實際 ${count}`);
  totalShown += count;
  const banner = bannerText();
  assert.ok(
    banner.includes('第 1 步／共 3 步') && !/第\s*\d+\s*組\s*[／/]\s*共\s*\d+\s*組/.test(banner),
    `banner 應保留步驟進度且不顯示組別進度，實際：${banner}`,
  );

  const nextBtn = container.find((n) => n.tagName === 'button' && /下一組|繼續|完成/.test(n.textContent));
  assert.ok(nextBtn, '應該有下一組／繼續／完成按鈕');
  if (round === expectedRounds) break;
  nextBtn.dispatch('click');
  round += 1;
}

assert.equal(round, expectedRounds, `最後一組應該是第 ${expectedRounds} 組`);
assert.equal(totalShown, WORD_COUNT, `所有分組加總應該等於總字數 ${WORD_COUNT}，實際 ${totalShown}`);

console.log(`PASS: 44 個語詞被分成 ${expectedRounds} 組（每組 <=5 張），banner 保留步驟進度且隱藏組別文字。`);
