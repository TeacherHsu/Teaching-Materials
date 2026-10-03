// 驗證鷹架等級的新欄位與「個別調整」：
//   wrongLimit：支持層答錯一次就揭曉（近似零錯誤學習）
//   autoRead：支持層預設自動念題
//   個別調整：null＝跟隨等級；手調過的項目切等級不會被蓋掉
// 用法：node scripts/test-scaffold-overrides.mjs
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

const D = await import('../src/utils/deviceSettings.js');

// ── 1. 三層的新欄位 ───────────────────────────────
assert.equal(D.SCAFFOLD_LEVELS.support.wrongLimit, 2, '支持層也先給提示、再錯才揭曉（AGENTS.md 底線）');
assert.equal(D.SCAFFOLD_LEVELS.standard.wrongLimit, 2);
assert.equal(D.SCAFFOLD_LEVELS.challenge.wrongLimit, 2);
assert.equal(D.SCAFFOLD_LEVELS.support.autoRead, true, '支持層預設自動念題');
assert.equal(D.SCAFFOLD_LEVELS.standard.autoRead, false);
assert.equal(D.SCAFFOLD_LEVELS.challenge.autoRead, false);
for (const [key, level] of Object.entries(D.SCAFFOLD_LEVELS)) {
  assert.ok(level.roundSize >= 1, `${key} 要有 roundSize`);
  assert.ok(level.optionCount >= 2, `${key} 要有 optionCount`);
  assert.ok(typeof level.note === 'string' && level.note, `${key} 要有說明文字`);
}

// ── 2. 個別調整：null＝跟隨等級 ────────────────────
store.clear();
assert.equal(D.getOverride('autoRead'), null, '預設沒有個別設定');
D.setScaffoldLevel('support');
assert.equal(D.getScaffoldLevel().autoRead, true, '跟隨支持層 → 開');
D.setScaffoldLevel('standard');
assert.equal(D.getScaffoldLevel().autoRead, false, '跟隨標準層 → 關');

// ── 3. 手調之後，切等級不該被蓋掉 ───────────────────
D.setOverride('autoRead', true);           // 標準層手動打開
assert.equal(D.getOverride('autoRead'), true);
assert.equal(D.getScaffoldLevel().autoRead, true);
D.setScaffoldLevel('challenge');
assert.equal(D.getScaffoldLevel().autoRead, true, '切到挑戰層仍維持教師手調的「開」');
D.setScaffoldLevel('support');
assert.equal(D.getScaffoldLevel().autoRead, true);

// 手動關掉也一樣要守住（支持層預設是開，教師關掉就該維持關）
D.setOverride('autoRead', false);
D.setScaffoldLevel('support');
assert.equal(D.getScaffoldLevel().autoRead, false, '支持層預設開，但教師關掉就維持關');

// ── 4. 明確恢復「跟隨等級」 ────────────────────────
D.setOverride('autoRead', null);
assert.equal(D.getOverride('autoRead'), null);
assert.equal(D.getScaffoldLevel().autoRead, true, '恢復跟隨後，支持層又變回開');

// ── 5. 不在白名單的項目不可被覆寫 ──────────────────
assert.equal(D.setOverride('optionCount', 99), false, 'optionCount 不開放個別覆寫');
assert.equal(D.getScaffoldLevel().optionCount, D.SCAFFOLD_LEVELS.support.optionCount);
assert.equal(D.getOverride('optionCount'), null);

// ── 6. ChoiceQuiz 真的照 wrongLimit 行動 ───────────
const { ChoiceQuiz } = await import('../src/components/ChoiceQuiz.js');
const makeItem = () => ({ stem: '題', options: ['對', '錯甲', '錯乙'], answer: '對', hints: ['提示'] });

function firstWrongThen(root) {
  const opt = (t) => root.find((n) => n.tagName === 'button' && n.textContent.trim() === t);
  opt('錯甲').dispatch('click');
  return {
    揭曉了: Boolean(root.find((n) => n.hasClass?.('quiz-option--correct'))),
    有提示: Boolean(root.find((n) => n.hasClass?.('hint-panel'))),
  };
}

store.clear();
D.setScaffoldLevel('support');            // wrongLimit 2（2026-10-03 起）
let r = firstWrongThen(ChoiceQuiz({ items: [makeItem()], optionCount: 3, onBack() {}, onComplete() {} }));
assert.equal(r.揭曉了, false, '支持層：第一次答錯先給提示，不揭曉');
assert.equal(r.有提示, true, '支持層：第一次答錯要給提示');

D.setScaffoldLevel('standard');           // wrongLimit 2
r = firstWrongThen(ChoiceQuiz({ items: [makeItem()], optionCount: 3, onBack() {}, onComplete() {} }));
assert.equal(r.揭曉了, false, '標準層：第一次答錯不該揭曉');
assert.equal(r.有提示, true, '標準層：第一次答錯要給提示');

// 呼叫端覆寫（單課小考用）要蓋過教師設定
r = firstWrongThen(ChoiceQuiz({ items: [makeItem()], wrongLimit: 1, optionCount: 3, onBack() {}, onComplete() {} }));
assert.equal(r.揭曉了, true, '小考傳 wrongLimit:1 應蓋過教師設定');

console.log('✅ 鷹架：wrongLimit／autoRead 生效、切等級不蓋掉教師手調、白名單外不可覆寫、小考可強制覆寫');
