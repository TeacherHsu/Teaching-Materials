// 驗證朗讀評分：不比聲調、同音字算對、念錯與漏字分得開、流暢度不給絕對分數，
// 以及成績不含辨識出來的文字（個資界線）。
// 用法：node scripts/test-reading-score.mjs
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  },
};

const S = await import('../src/utils/readingScore.js');
const R = await import('../src/utils/reciteRecords.js');

const INDEX = fileURLToPath(new URL('../public/data/_index/char-readings.json', import.meta.url));
if (existsSync(INDEX)) {
  S.setCharReadings(JSON.parse(readFileSync(INDEX, 'utf8')).chars);
}

// ── 1. 去聲調 ────────────────────────────────────
assert.equal(S.toneless('ㄏㄡˋ'), 'ㄏㄡ');
assert.equal(S.toneless('˙ㄌㄜ'), 'ㄌㄜ', '輕聲前置要去掉');
assert.equal(S.toneless('ㄌㄜ˙'), 'ㄌㄜ', '輕聲後置也要去掉');
assert.equal(S.toneless(''), '');
assert.equal(S.toneless(undefined), '');

// ── 2. 逐字對齊 ──────────────────────────────────
const expected = [
  { char: '害', zhuyin: 'ㄏㄞˋ' }, { char: '怕', zhuyin: 'ㄆㄚˋ' },
  { char: '的', zhuyin: '˙ㄉㄜ' }, { char: '時', zhuyin: 'ㄕˊ' },
  { char: '候', zhuyin: 'ㄏㄡˋ' },
];
const cases = [
  ['害怕的時候', 100, ['ok', 'ok', 'ok', 'ok', 'ok'], '完全正確'],
  ['害怕的時厚', 100, ['ok', 'ok', 'ok', 'ok', 'homophone'], '同音字要算對'],
  ['害怕時候', 80, ['ok', 'ok', 'missed', 'ok', 'ok'], '漏字'],
  ['害怕的時間', 80, ['ok', 'ok', 'ok', 'ok', 'wrong'], '念錯'],
  ['', 0, ['missed', 'missed', 'missed', 'missed', 'missed'], '完全沒念'],
  ['我害怕的時候了', 100, ['ok', 'ok', 'ok', 'ok', 'ok'], '多念的字不扣分'],
];
for (const [heard, accuracy, marks, label] of cases) {
  const r = S.scoreReading(expected, heard);
  assert.equal(r.accuracy, accuracy, `${label}：分數應為 ${accuracy}，實際 ${r.accuracy}`);
  assert.deepEqual(r.marks, marks, `${label}：標記不符`);
  assert.equal(r.total, 5);
}

// 聲調不同不扣分（同字就是 ok，不管課文標幾聲）
assert.equal(S.scoreReading([{ char: '好', zhuyin: 'ㄏㄠˇ' }], '好').accuracy, 100);

// 空題目不該炸
assert.deepEqual(S.scoreReading([], '隨便念'), { marks: [], heardFor: [], okCount: 0, total: 0, accuracy: 0 });

// ── 3. 標點不計分 ────────────────────────────────
const tokens = [['害怕的時候，', ['ㄏㄞˋ', 'ㄆㄚˋ', '˙ㄉㄜ', 'ㄕˊ', 'ㄏㄡˋ', ''].join(' '), null]];
const chars = S.scorableChars(tokens);
assert.equal(chars.length, 5, '標點不該算進要念的字');
assert.ok(!chars.some((c) => c.char === '，'));

// ── 4. 流暢度：不給絕對分數，只有數值與自我比較 ──────
const f = S.fluency(60, 30000);
assert.equal(f.charsPerMinute, 120, '60 字念 30 秒＝每分鐘 120 字');
assert.equal(S.fluency(0, 10000).charsPerMinute, null, '沒有字就沒有速度');
assert.equal(S.fluency(10, 500).charsPerMinute, null, '時間太短不計');
assert.equal(S.compareFluency(130, 100), 'faster');
assert.equal(S.compareFluency(80, 100), 'slower');
assert.equal(S.compareFluency(103, 100), 'similar');
assert.equal(S.compareFluency(120, null), 'first');
// fluency 不可以回傳任何形式的「分數」
assert.deepEqual(Object.keys(S.fluency(60, 30000)).sort(), ['charsPerMinute', 'seconds'],
  '流暢度只給數值，不給分數——給分數會讓學生把念快當目標');

// ── 5. 星星 ──────────────────────────────────────
assert.equal(S.accuracyStars(100), 3);
assert.equal(S.accuracyStars(90), 3);
assert.equal(S.accuracyStars(70), 2);
assert.equal(S.accuracyStars(40), 1);
assert.equal(S.accuracyStars(39), 0);

// ── 6. 成績：只留最高分 ──────────────────────────
store.clear();
R.saveRecite('L1', 0, { accuracy: 60, charsPerMinute: 90, total: 10 });
assert.equal(R.bestRecite('L1', 0).accuracy, 60);
R.saveRecite('L1', 0, { accuracy: 40, charsPerMinute: 200, total: 10 });
assert.equal(R.bestRecite('L1', 0).accuracy, 60, '念差了不該覆蓋最高分');
assert.equal(R.bestRecite('L1', 0).charsPerMinute, 90, '速度要跟著最高分那一次');
assert.equal(R.bestRecite('L1', 0).attempts, 2, '次數要累計');
R.saveRecite('L1', 0, { accuracy: 85, charsPerMinute: 110, total: 10 });
assert.equal(R.bestRecite('L1', 0).accuracy, 85);
assert.equal(R.bestRecite('L1', 0).attempts, 3);
assert.equal(R.bestRecite('L1', 9), null, '沒念過的段落回 null');
assert.equal(R.bestRecite('沒有這課', 0), null);
assert.equal(R.saveRecite('', 0, { accuracy: 50 }), false);
assert.equal(R.saveRecite('L1', -1, { accuracy: 50 }), false);

R.saveRecite('L1', 1, { accuracy: 95, charsPerMinute: 130, total: 8 });
const summary = R.reciteSummary('L1');
assert.equal(summary.units, 2);
assert.equal(summary.averageAccuracy, 90);
assert.equal(summary.averageCharsPerMinute, 120);
assert.deepEqual(R.reciteLessons(), ['L1']);

// ── 7. 個資界線：成績不可含辨識出來的文字 ────────────
const RAW = store.get('mandarin:recite:v1');
for (const word of ['害怕', '時候', '我叫', '小明']) {
  assert.ok(!RAW.includes(word), `朗讀成績不該存辨識出來的文字：${word}`);
}
// 只能有這些欄位
const entry = R.bestRecite('L1', 0);
assert.deepEqual(Object.keys(entry).sort(), ['accuracy', 'attempts', 'charsPerMinute', 'total']);

// ── 8. 壞資料不炸 ────────────────────────────────
R.clearRecite();
assert.equal(R.reciteSummary('L1'), null);
window.localStorage.getItem = () => '{壞掉的';
assert.equal(R.bestRecite('L1', 0), null);
window.localStorage.getItem = () => JSON.stringify([1, 2, 3]);
assert.equal(R.reciteSummary('L1'), null);
window.localStorage.getItem = () => { throw new Error('私密瀏覽'); };
assert.deepEqual(R.reciteLessons(), []);

console.log('✅ 朗讀評分：不比聲調、同音字算對、念錯與漏字分得開、標點不計分、'
  + '流暢度只給數值不給分數、成績只留最高分且不含辨識文字');
