// 驗證單課小考的題庫：各站都收得到題、同題不重複、輪抽涵蓋每一站、
// 題數依鷹架層級、不合格的題目（開放問答、選項不足、答案不在選項裡）進不來。
// 用法：node scripts/test-quiz-bank.mjs
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
window.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
window.matchMedia = () => ({ matches: false });

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const { collectQuizBank, pickQuizItems, toQuizItem, QUIZ_SIZE } =
  await import('../src/activities/quizBank.js');

const noShuffle = (a) => [...a];

// ── 1. 真資料：每一冊第 1 課都要收得到題 ────────────
const dataDir = path.join(ROOT, 'public', 'data');
const volumes = readdirSync(dataDir).filter((d) => /^\d{3}[A-Z]G\d[A-Z]$/.test(d));
assert.ok(volumes.length >= 4, `應該有多冊資料，實際 ${volumes.length}`);

let checked = 0;
for (const volume of volumes) {
  const file = path.join(dataDir, volume, 'lesson01.json');
  let lesson;
  try {
    lesson = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    continue;
  }
  checked += 1;
  const bank = collectQuizBank(lesson);
  const keys = Object.keys(bank);
  assert.ok(keys.length > 0, `${volume} lesson01 應該至少有一站收得到題`);

  for (const [moduleKey, items] of Object.entries(bank)) {
    // 每一題都要合格
    for (const item of items) {
      assert.ok(item.stem, `${volume}/${moduleKey} 題幹不可為空`);
      assert.ok(Array.isArray(item.options) && item.options.length >= 2,
        `${volume}/${moduleKey} 至少要兩個選項：${item.stem}`);
      assert.ok(item.options.every((o) => typeof o === 'string'),
        `${volume}/${moduleKey} 選項必須都是字串：${item.stem}`);
      assert.ok(item.options.includes(item.answer),
        `${volume}/${moduleKey} 答案必須在選項裡：${item.stem}`);
      assert.equal(item._moduleKey, moduleKey, '要標記來源大項');
    }
    // 同一站內不可有重複題（題幹＋答案）
    const keys2 = items.map((i) => `${i.stem}|${i.answer}`);
    assert.equal(new Set(keys2).size, keys2.length, `${volume}/${moduleKey} 有重複題`);
  }

  // 輪抽：題數正確、不重複、盡量每站都有
  for (const [level, size] of Object.entries(QUIZ_SIZE)) {
    const picked = pickQuizItems(bank, size);
    const expected = Math.min(size, Object.values(bank).reduce((n, a) => n + a.length, 0));
    assert.equal(picked.length, expected, `${volume} ${level} 應抽 ${expected} 題`);
    const ids = picked.map((i) => `${i.stem}|${i.answer}`);
    assert.equal(new Set(ids).size, ids.length, `${volume} ${level} 抽到重複題`);
    const covered = new Set(picked.map((i) => i._moduleKey));
    // 題數 >= 站數時，每一站都該被抽到
    if (size >= keys.length) {
      assert.equal(covered.size, keys.length,
        `${volume} ${level}：抽 ${size} 題卻只涵蓋 ${covered.size}/${keys.length} 站`);
    }
  }
}
assert.ok(checked >= 4, `應檢查多冊，實際 ${checked}`);

// ── 2. 不合格的題目要被擋掉 ────────────────────────
const bad = {
  lesson_id: 'TEST',
  reading_questions: [
    { id: 'r1', status: 'ready', stem: '開放問答', options: [], answer: '' },
    { id: 'r2', status: 'ready', stem: '選項只有一個', options: ['甲'], answer: '甲' },
    { id: 'r3', status: 'ready', stem: '答案不在選項裡', options: ['甲', '乙'], answer: '丙' },
    { id: 'r4', status: 'ready', stem: '正常題', options: ['甲', '乙'], answer: '甲' },
  ],
};
const badBank = collectQuizBank(bad);
assert.deepEqual(Object.keys(badBank), ['reading'], '只有 reading 該有題');
assert.equal(badBank.reading.length, 1, '只有正常題該通過');
assert.equal(badBank.reading[0].stem, '正常題');

// ── 3. 完全沒有可考內容時回空題庫（而不是炸掉）────
assert.deepEqual(collectQuizBank({ lesson_id: 'EMPTY' }), {});
assert.deepEqual(pickQuizItems({}, 12), []);

// ── 4. 輪抽是「一輪一題」而不是把一站抽乾 ───────────
const bank2 = {
  a: Array.from({ length: 10 }, (_, i) => ({ stem: `a${i}`, options: ['x', 'y'], answer: 'x', _moduleKey: 'a' })),
  b: [{ stem: 'b0', options: ['x', 'y'], answer: 'x', _moduleKey: 'b' }],
  c: [{ stem: 'c0', options: ['x', 'y'], answer: 'x', _moduleKey: 'c' }],
};
const picked2 = pickQuizItems(bank2, 3, noShuffle);
assert.deepEqual(new Set(picked2.map((i) => i._moduleKey)), new Set(['a', 'b', 'c']),
  '抽 3 題時三站各一題，不該被題多的 a 站佔滿');

// 要的比總數多時，全部給出來就好
const picked3 = pickQuizItems(bank2, 100, noShuffle);
assert.equal(picked3.length, 12);

// ── 5. toQuizItem 去掉 DOM 欄位 ───────────────────
const cleaned = toQuizItem({
  stem: '題', options: ['甲', '乙'], answer: '甲', _moduleKey: 'listening',
  extra: { nodeType: 1 }, stemContent: { nodeType: 1 },
});
assert.equal(cleaned.extra, undefined, 'extra（音檔列）不該進小考');
assert.equal(cleaned.stemContent, undefined, 'stemContent 不該進小考');
assert.equal(cleaned._moduleKey, 'listening', '來源大項要留著（結算表要用）');

console.log(`✅ quizBank：${checked} 冊實資料、各站題目合格、無重複、輪抽涵蓋每站、不合格題被擋、DOM 欄位不入考`);
