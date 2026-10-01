// 驗證 src/utils/chunk.js：平均分組不超過上限、不留孤兒組、
// 省略 max 時跟著鷹架設定走。
// 用法：node scripts/test-chunk-balanced.mjs
import assert from 'node:assert/strict';

const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  },
};

const { balanced, chunkRounds } = await import('../src/utils/chunk.js');
const { setScaffoldLevel, SCAFFOLD_LEVELS } = await import('../src/utils/deviceSettings.js');

const sizes = (groups) => groups.map((g) => g.length);
const items = (n) => Array.from({ length: n }, (_, i) => i);

// ── 1. 平均分配，且永遠不超過上限 ──────────────────
assert.deepEqual(sizes(balanced(items(15), 5)), [5, 5, 5]);
assert.deepEqual(sizes(balanced(items(15), 6)), [5, 5, 5], '15 題上限 6 → 5/5/5，不是 6/6/3');
assert.deepEqual(sizes(balanced(items(7), 3)), [3, 2, 2], '7 題上限 3 → 3/2/2，不是 3/3/1');
assert.deepEqual(sizes(balanced(items(4), 5)), [4]);
assert.deepEqual(sizes(balanced(items(1), 3)), [1]);
assert.deepEqual(balanced([], 5), []);

// 窮舉：1~60 題 × 上限 1~8，不可超過上限、總數要守恆、不可有空組
for (let n = 1; n <= 60; n += 1) {
  for (let cap = 1; cap <= 8; cap += 1) {
    const groups = balanced(items(n), cap);
    const lens = sizes(groups);
    assert.ok(lens.every((l) => l <= cap), `${n} 題上限 ${cap}：有一組是 ${Math.max(...lens)} 題，超過上限`);
    assert.ok(lens.every((l) => l >= 1), `${n} 題上限 ${cap}：出現空組`);
    assert.equal(lens.reduce((a, b) => a + b, 0), n, `${n} 題上限 ${cap}：題目總數對不上`);
    assert.equal(groups.flat().length, new Set(groups.flat()).size, '不可重複或遺漏');
    // 各組題數最多差 1（這就是「平均」的定義）
    assert.ok(Math.max(...lens) - Math.min(...lens) <= 1,
      `${n} 題上限 ${cap}：組間差距 ${Math.max(...lens) - Math.min(...lens)}，不夠平均`);
    // 組數要是最少的
    assert.equal(groups.length, Math.ceil(n / cap), `${n} 題上限 ${cap}：組數不是最少`);
  }
}

// 不可動到原陣列
const original = items(7);
balanced(original, 3);
assert.equal(original.length, 7, '不該改到傳進來的陣列');

// ── 2. 省略 max 時跟著鷹架設定 ─────────────────────
for (const [key, level] of Object.entries(SCAFFOLD_LEVELS)) {
  setScaffoldLevel(key);
  const groups = chunkRounds(items(12));
  assert.ok(groups.every((g) => g.length <= level.roundSize),
    `${key}：每輪不該超過 roundSize ${level.roundSize}，實際 ${sizes(groups)}`);
  assert.equal(groups.flat().length, 12);
}

// 支持層一輪 3 題：12 題應該是 3/3/3/3
setScaffoldLevel('support');
assert.deepEqual(sizes(chunkRounds(items(12))), [3, 3, 3, 3]);
// 標準層一輪 5 題：12 題 → 4/4/4（平均，不是 5/5/2）
setScaffoldLevel('standard');
assert.deepEqual(sizes(chunkRounds(items(12))), [4, 4, 4]);

// ── 3. 明確指定 max 時以它為準 ─────────────────────
setScaffoldLevel('support');
assert.deepEqual(sizes(chunkRounds(items(6), { max: 3 })), [3, 3]);
assert.deepEqual(sizes(chunkRounds(items(5), { max: 2 })), [2, 2, 1]);

console.log('✅ chunk：平均分組（1–60 題 × 上限 1–8 窮舉）、不超上限、不留孤兒組、跟隨鷹架設定');
