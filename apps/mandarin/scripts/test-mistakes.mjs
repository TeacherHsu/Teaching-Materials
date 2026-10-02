// 驗證 src/utils/mistakes.js：Leitner 間隔、連對四次就學會、答錯歸零、
// 提早一小時到期、上限 300、DOM 題幹不會被寫進 localStorage。
// 用法：node scripts/test-mistakes.mjs
import assert from 'node:assert/strict';

const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  },
};

const M = await import('../src/utils/mistakes.js');
const DAY = 86400000;
const HOUR = 3600000;
const KEY = 'mandarin:mistakes:v1';

const item = (n) => ({
  id: `q${n}`,
  stem: `第 ${n} 題：「ㄅ」的注音是？`,
  options: ['甲', '乙', '丙'],
  answer: '甲',
  explanation: `說明 ${n}`,
  hints: [`提示 ${n}`],
});

function reset() {
  store.clear();
  M.startMistakeContext('115AG2H01', 'characters');
}

// ── 1. 沒有 context 時安靜忽略 ─────────────────────
store.clear();
M.endMistakeContext();
assert.equal(M.noteMistake(item(1)), false, '沒有 context 不該記錄');
assert.equal(M.allMistakes().length, 0);

// ── 2. 記錄與去重 ─────────────────────────────────
reset();
assert.equal(M.noteMistake(item(1)), true);
assert.equal(M.allMistakes().length, 1);
M.noteMistake(item(1)); // 同一題再錯
assert.equal(M.allMistakes().length, 1, '同一題不該重複建立');
assert.equal(M.allMistakes()[0].wrongCount, 2);
M.noteMistake(item(2));
assert.equal(M.allMistakes().length, 2);

// 不同課／不同大項視為不同題
M.startMistakeContext('115AG2H02', 'characters');
M.noteMistake(item(1));
assert.equal(M.allMistakes().length, 3, '不同課應該是不同題');
assert.equal(M.allMistakes('115AG2H01').length, 2, '依課次篩選');

// ── 3. 不可序列化的欄位要被擋掉 ────────────────────
reset();
const withDom = {
  ...item(9),
  stemContent: { nodeType: 1, tagName: 'DIV' }, // 假 DOM 元素
  extra: { nodeType: 1 },
};
M.noteMistake(withDom);
const raw = store.get(KEY);
assert.ok(!raw.includes('nodeType'), 'DOM 元素不該被寫進 localStorage');
assert.ok(!raw.includes('stemContent'), 'stemContent 不該被存');
const snap = M.allMistakes()[0].snap;
assert.deepEqual(Object.keys(snap).filter((k) => snap[k] !== undefined).sort(),
  ['answer', 'explanation', 'hints', 'options', 'stem']);

// ── 4. 沒有選項／答案的題型不收 ────────────────────
reset();
assert.equal(M.noteMistake({ stem: '排順序', options: [] }), false);
assert.equal(M.noteMistake({ stem: '造句', answer: '' }), false);
assert.equal(M.noteMistake(null), false);
assert.equal(M.allMistakes().length, 0);

// ── 5. Leitner：連對四次就學會 ─────────────────────
reset();
M.noteMistake(item(1));
const id = M.allMistakes()[0].id;
let now = Date.now();

assert.equal(M.dueCount(null, now), 1, '剛記錄就該到期');

// 第 1 次答對 → box 1 → 隔 1 天（提早一小時）
assert.equal(M.gradeMistake(id, true, now), 'advanced');
let m = M.allMistakes()[0];
assert.equal(m.box, 1);
assert.equal(m.due, now + 1 * DAY - HOUR, '第 1 格應排 1 天後再提早一小時');
assert.equal(M.dueCount(null, now), 0, '還沒到期不該出現');
assert.equal(M.dueCount(null, now + DAY), 1, '隔天應該出現');
assert.equal(M.daysUntilNextDue(null, now), 1);

// 第 2 次答對 → box 2 → 隔 3 天
now += DAY;
assert.equal(M.gradeMistake(id, true, now), 'advanced');
m = M.allMistakes()[0];
assert.equal(m.box, 2);
assert.equal(m.due, now + 3 * DAY - HOUR);

// 第 3 次答對 → box 3 → 隔 7 天
now += 3 * DAY;
assert.equal(M.gradeMistake(id, true, now), 'advanced');
assert.equal(M.allMistakes()[0].box, 3);
assert.equal(M.allMistakes()[0].due, now + 7 * DAY - HOUR);

// 第 4 次答對 → 學會，移除
now += 7 * DAY;
assert.equal(M.gradeMistake(id, true, now), 'learned');
assert.equal(M.allMistakes().length, 0, '學會的題目要從盒子裡消失');
assert.equal(M.gradeMistake(id, true, now), 'missing', '已移除的題目再評分應回 missing');

// ── 6. 答錯歸零 ───────────────────────────────────
reset();
M.noteMistake(item(1));
const id2 = M.allMistakes()[0].id;
let t = Date.now();
M.gradeMistake(id2, true, t);
M.gradeMistake(id2, true, t + DAY);
assert.equal(M.allMistakes()[0].box, 2, '先升到第 2 格');
assert.equal(M.gradeMistake(id2, false, t + DAY), 'reset');
const after = M.allMistakes()[0];
assert.equal(after.box, 0, '答錯要退回第 0 格');
assert.equal(after.due, t + DAY, '答錯要立刻到期');
assert.equal(after.wrongCount, 2);

// ── 7. 「提早一小時」真的讓隔天同一節課會出現 ───────
// 情境：週一 10:00 答錯並答對一次 → 排週二 09:00 到期，
// 所以週二 10:00 的同一節課看得到；若沒提早，週二 10:00 剛好邊界。
reset();
M.noteMistake(item(1));
const id3 = M.allMistakes()[0].id;
const mon10 = new Date('2026-10-05T10:00:00+08:00').getTime();
M.gradeMistake(id3, true, mon10);
const tue09 = new Date('2026-10-06T09:00:00+08:00').getTime();
assert.equal(M.dueCount(null, tue09), 1, '隔天早上 9 點就該到期（提早一小時的用意）');

// ── 8. 上限 300 ──────────────────────────────────
reset();
for (let i = 0; i < 310; i += 1) M.noteMistake(item(i));
assert.equal(M.allMistakes().length, 300, '超過上限要砍最舊的');
assert.ok(!M.allMistakes().some((x) => x.snap.stem.includes('第 0 題')), '最舊的應被砍掉');
assert.ok(M.allMistakes().some((x) => x.snap.stem.includes('第 309 題')), '最新的要留著');

// ── 9. 還原成題目物件 ─────────────────────────────
reset();
M.noteMistake(item(7));
const quizItem = M.toQuizItem(M.allMistakes()[0]);
assert.equal(quizItem.stem, item(7).stem);
assert.deepEqual(quizItem.options, item(7).options);
assert.equal(quizItem.answer, '甲');
assert.equal(quizItem.explanation, '說明 7');
assert.deepEqual(quizItem.hints, ['提示 7']);
assert.ok(quizItem._mistakeId, '要帶 _mistakeId 才能把結果寫回盒子');

// ── 10. 清空 ─────────────────────────────────────
M.clearMistakes();
assert.equal(M.allMistakes().length, 0);

// ── 11. localStorage 壞掉時不該炸 ──────────────────
globalThis.window.localStorage.getItem = () => '{ 壞掉的 JSON';
assert.deepEqual(M.allMistakes(), [], '讀到壞資料應回空陣列');
globalThis.window.localStorage.getItem = () => JSON.stringify({ not: 'an array' });
assert.deepEqual(M.allMistakes(), [], '讀到非陣列應回空陣列');
globalThis.window.localStorage.getItem = () => { throw new Error('私密瀏覽'); };
assert.deepEqual(M.allMistakes(), []);
globalThis.window.localStorage.setItem = () => { throw new Error('配額滿'); };
globalThis.window.localStorage.getItem = () => null;
M.startMistakeContext('115AG2H01', 'characters');
assert.doesNotThrow(() => M.noteMistake(item(1)), '寫不進去也不能影響作答');

console.log('✅ mistakes：Leitner 0/1/3/7 天、連對 4 次學會、答錯歸零、提早一小時到期、上限 300、DOM 不入庫、壞資料不炸');

// ── 錯題範圍：以冊為單位，不跨年級（CF 2026-10-03：同一台平板不同年級共用）
{
  const { inScope } = await import('../src/utils/mistakes.js');
  assert.equal(inScope('115AG6H11', '115AG6H'), true, '同一冊的課要算進來');
  assert.equal(inScope('115AG2H03', '115AG6H'), false, '別的年級不能混進來');
  assert.equal(inScope('115AG6H11', '115AG6H11'), true);
  assert.equal(inScope('115AG6H12', '115AG6H11'), false, '給課次代號就只取那一課');
  assert.equal(inScope('115AG6H11', undefined), true, '不給範圍＝全部（教師頁用）');
  assert.equal(inScope(undefined, '115AG6H'), false);
  console.log('✅ 錯題範圍以冊為單位');
}
