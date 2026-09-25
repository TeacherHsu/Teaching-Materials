// 驗證星星計分規則、「最佳成績不重複累加」、localStorage 不可用時不壞。
// 用法：node scripts/test-star-scoring.mjs
import assert from 'node:assert/strict';
import { computeModuleStars, starsMarkup } from '../src/utils/scoring.js';
import { startScoreSession, recordOutcome, endScoreSession } from '../src/utils/scoreSession.js';

// ---- computeModuleStars 規則 ----
assert.equal(computeModuleStars({ total: 0, firstTryCount: 0, revealedCount: 0 }), 0, '沒有題目應該是 0 顆星');
assert.equal(
  computeModuleStars({ total: 3, firstTryCount: 3, revealedCount: 0 }),
  3,
  '全部第一次就答對 → 3 顆星',
);
assert.equal(
  computeModuleStars({ total: 3, firstTryCount: 2, revealedCount: 0 }),
  2,
  '沒有被揭曉，但至少一題靠提示才答對 → 2 顆星',
);
assert.equal(
  computeModuleStars({ total: 3, firstTryCount: 1, revealedCount: 1 }),
  1,
  '至少一題被揭曉正解 → 1 顆星（即使其他題答對）',
);
assert.equal(
  computeModuleStars({ total: 5, firstTryCount: 0, revealedCount: 5 }),
  1,
  '全部被揭曉，仍完成活動 → 給 1 顆鼓勵星，不是 0',
);

// ---- scoreSession：跨多個元件（同一大項內多輪）彙總 ----
startScoreSession();
recordOutcome({ firstTry: true, revealed: false });
recordOutcome({ firstTry: true, revealed: false });
recordOutcome({ firstTry: false, revealed: true });
const meta = endScoreSession();
assert.deepEqual(meta, { total: 3, firstTryCount: 2, revealedCount: 1 });
assert.equal(computeModuleStars(meta), 1);

// 沒有 startScoreSession 就呼叫 recordOutcome：安靜忽略，不丟例外
assert.doesNotThrow(() => recordOutcome({ firstTry: true, revealed: false }));
const emptyMeta = endScoreSession();
assert.deepEqual(emptyMeta, { total: 0, firstTryCount: 0, revealedCount: 0 });

// ---- starsMarkup：文字替代（aria-label），不是只靠顏色 ----
const markup2of3 = starsMarkup({ earned: 2, max: 3 });
assert.match(markup2of3, /aria-label="3 顆星中得到 2 顆"/);
assert.equal((markup2of3.match(/fill="currentColor"/g) || []).length, 2, '應該有 2 顆填滿的星星');
assert.equal((markup2of3.match(/fill="none"/g) || []).length, 1, '應該有 1 顆外框（空）的星星');

console.log('computeModuleStars / scoreSession / starsMarkup：全部通過');

// ---- storage.js：saveModuleStars「最佳成績」不重複累加，localStorage 不可用時不壞 ----
// storage.js 內部用 window.localStorage，在 Node 環境要先用 fake-dom 的
// localStorage stub 模擬瀏覽器環境（沿用 scripts/fake-dom.mjs 的 window stub）。
import { installFakeDom } from './fake-dom.mjs';
installFakeDom();

const { saveModuleStars, getModuleStars, getLessonStars, isModuleComplete } = await import('../src/utils/storage.js');

const lessonId = 'test-lesson-1';

// 第一次拿 2 顆星
let r = saveModuleStars(lessonId, 'characters', 2);
assert.equal(r.stars, 2);
assert.equal(r.isNewRecord, true);
assert.equal(getModuleStars(lessonId, 'characters'), 2);
assert.equal(isModuleComplete(lessonId, 'characters'), true);

// 重玩拿到比較低的分數（1 顆）：最佳成績仍是 2，不會被蓋掉、也不會累加
r = saveModuleStars(lessonId, 'characters', 1);
assert.equal(r.stars, 2, '重玩分數較低時，最佳成績應維持 2');
assert.equal(r.isNewRecord, false);
assert.equal(getModuleStars(lessonId, 'characters'), 2);

// 重玩拿到比較高的分數（3 顆）：最佳成績更新為 3，且是新紀錄
r = saveModuleStars(lessonId, 'characters', 3);
assert.equal(r.stars, 3);
assert.equal(r.isNewRecord, true);
assert.equal(getModuleStars(lessonId, 'characters'), 3);

// 多個大項各自累加成整課星星（不會互相污染）
saveModuleStars(lessonId, 'vocabulary', 2);
assert.equal(getLessonStars(lessonId, ['characters', 'vocabulary', 'reading']), 5, '3+2+0（reading 沒玩過）＝ 5');

// localStorage 不可用（例如無痕模式拋例外）：saveModuleStars 不應該壞掉，
// 回傳這次的分數但不視為新紀錄；getModuleStars 讀不到時視為 0，不影響操作。
const original = globalThis.window.localStorage;
globalThis.window.localStorage = {
  getItem() {
    throw new Error('storage disabled');
  },
  setItem() {
    throw new Error('storage disabled');
  },
};
assert.doesNotThrow(() => {
  const broken = saveModuleStars('broken-lesson', 'characters', 3);
  assert.equal(broken.saved, false);
  assert.equal(broken.stars, 3);
  assert.equal(broken.isNewRecord, false);
});
assert.equal(getModuleStars('broken-lesson', 'characters'), 0, '讀不到時當 0');
globalThis.window.localStorage = original;

console.log('storage.js saveModuleStars／getModuleStars／getLessonStars：全部通過');
