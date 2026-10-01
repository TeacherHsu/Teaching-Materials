// 驗證 ChoiceQuiz 與錯題盒的整合：
//   第一次就答對 → 不進盒子（不該懲罰已經會的題目）
//   第一次答錯後答對 → 進盒子（和「正確率＝第一次答對率」同一判準）
//   兩次答錯被揭曉 → 進盒子
//   複習模式答對 → 升一格；複習模式答錯 → 歸零
// 用法：node scripts/test-mistake-capture.mjs
import assert from 'node:assert/strict';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const store = new Map();
window.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, v),
  removeItem: (k) => store.delete(k),
};
window.matchMedia = () => ({ matches: false });

const { ChoiceQuiz } = await import('../src/components/ChoiceQuiz.js');
const M = await import('../src/utils/mistakes.js');

const makeItem = (n) => ({
  id: `q${n}`,
  stem: `第 ${n} 題`,
  options: ['對的', '錯的甲', '錯的乙'],
  answer: '對的',
  explanation: '說明',
  hints: ['提示'],
});

function run(items) {
  const root = ChoiceQuiz({ items, onBack() {}, onComplete() {} });
  return {
    root,
    option: (label) =>
      root.find((n) => n.tagName === 'button' && n.textContent.trim() === label),
    next: () =>
      root.find(
        (n) => n.tagName === 'button' && /下一題|看結果|完成/.test(n.textContent),
      ),
  };
}

// ── 1. 第一次就答對 → 不進盒子 ─────────────────────
store.clear();
M.startMistakeContext('115AG2H01', 'characters');
let q = run([makeItem(1)]);
q.option('對的').dispatch('click');
assert.equal(M.allMistakes().length, 0, '第一次就答對不該進錯題盒');

// ── 2. 答錯一次再答對 → 進盒子 ─────────────────────
store.clear();
M.startMistakeContext('115AG2H01', 'characters');
q = run([makeItem(2)]);
q.option('錯的甲').dispatch('click');
assert.equal(M.allMistakes().length, 0, '還沒判定完不該先記');
q.option('對的').dispatch('click');
assert.equal(M.allMistakes().length, 1, '第一次沒答對就該進錯題盒');
assert.equal(M.allMistakes()[0].snap.stem, '第 2 題');
assert.equal(M.allMistakes()[0].moduleKey, 'characters');

// ── 3. 兩次答錯被揭曉 → 進盒子 ─────────────────────
store.clear();
M.startMistakeContext('115AG2H01', 'vocabulary');
q = run([makeItem(3)]);
q.option('錯的甲').dispatch('click');
q.option('錯的乙').dispatch('click');
assert.equal(M.allMistakes().length, 1, '被揭曉答案也要進錯題盒');
assert.equal(M.allMistakes()[0].moduleKey, 'vocabulary');

// ── 4. 複習模式：答對升一格，不會重複新增 ───────────
store.clear();
M.startMistakeContext('115AG2H01', 'characters');
M.noteMistake(makeItem(4));
assert.equal(M.allMistakes()[0].box, 0);
const reviewItem = M.toQuizItem(M.allMistakes()[0]);
q = run([reviewItem]);
q.option('對的').dispatch('click');
assert.equal(M.allMistakes().length, 1, '複習時不該又新增一題');
assert.equal(M.allMistakes()[0].box, 1, '複習答對要升一格');

// ── 5. 複習模式：答錯歸零 ─────────────────────────
const again = M.toQuizItem(M.allMistakes()[0]);
q = run([again]);
q.option('錯的甲').dispatch('click');
q.option('對的').dispatch('click'); // 第二次才對 → 不算 firstTry
assert.equal(M.allMistakes()[0].box, 0, '複習時第一次沒答對要退回第 0 格');
assert.equal(M.allMistakes().length, 1);

// ── 6. 沒有 context（例如舊測試直接建元件）不該炸 ────
store.clear();
M.endMistakeContext();
q = run([makeItem(6)]);
assert.doesNotThrow(() => {
  q.option('錯的甲').dispatch('click');
  q.option('對的').dispatch('click');
}, '沒有 context 時作答不該出錯');
assert.equal(M.allMistakes().length, 0);

console.log('✅ ChoiceQuiz×錯題盒：第一次答對不收、沒答對才收、被揭曉也收、複習升降格正確、無 context 不炸');
