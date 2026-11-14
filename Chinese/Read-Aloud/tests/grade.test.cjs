// node --test Chinese/Read-Aloud/tests/grade.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { makeGrader, groupSizes } = require('../read-aloud.js');

const src = fs.readFileSync(path.join(__dirname, '../data/G2A2.js'), 'utf8');
const win = {}; new Function('window', src)(win);
const data = win.READ_ALOUD_DATA.G2A2;
const grade = makeGrader(data);
const find = (kind, t) => data.lessons.flatMap((L) => L[kind]).find((x) => x.t === t);

test('題庫：6 課、每課 18 個生字、讀音與字數相符', () => {
  assert.strictEqual(data.lessons.length, 6);
  for (const L of data.lessons) {
    assert.strictEqual(L.chars.length, 18, `第${L.no}課生字`);
    for (const it of [...L.chars, ...L.words]) {
      assert.strictEqual(it.z.length, [...it.t].length, it.t);
      if (it.ex) { assert.ok(it.ex.includes(it.t)); assert.strictEqual(it.exz[it.ex.indexOf(it.t)], it.z[0], `${it.t}／${it.ex}`); }
      for (const s of [...it.z, ...(it.exz || [])]) assert.ok(s.replace(/[ˊˇˋ˙]/g, '') in data.homo, `${it.t} ${s}`);
    }
  }
});
test('念對：同字、同音字、不比聲調', () => {
  assert.strictEqual(grade(find('words', '香味'), ['香味']), 3);
  assert.strictEqual(grade(find('words', '香味'), ['我說香味。']), 3);
  assert.strictEqual(grade(find('words', '香味'), ['鄉位']), 3);       // 同音字
  assert.strictEqual(grade(find('chars', '樣'), ['養']), 3);           // 聲調不同也算
  assert.strictEqual(grade(find('chars', '樣'), ['不一樣的樣']), 3);
  assert.strictEqual(grade(find('words', '蝦子'), ['蝦子']), 3);       // 輕聲
});
test('很接近：念對一半、或容易混淆的音', () => {
  assert.strictEqual(grade(find('words', '香味'), ['香水']), 2);
  assert.strictEqual(grade(find('chars', '紙'), ['子']), 2);           // ㄓ／ㄗ
  assert.strictEqual(grade(find('words', '異口同聲'), ['一口']), 2);
});
test('有開口但不像、沒聽到字', () => {
  assert.strictEqual(grade(find('words', '香味'), ['蘋果']), 1);
  assert.strictEqual(grade(find('chars', '樣'), ['狗']), 1);
  assert.strictEqual(grade(find('chars', '樣'), ['', 'ok']), 0);
});
test('多個候選取最好的', () => {
  assert.strictEqual(grade(find('words', '活動'), ['或懂', '活動']), 3);
});
test('分組：每顆蛋約 3 題，不留 1 題的尾巴', () => {
  assert.deepStrictEqual(groupSizes(18, 3), [3, 3, 3, 3, 3, 3]);
  assert.deepStrictEqual(groupSizes(14, 3), [3, 3, 3, 3, 2]);
  assert.deepStrictEqual(groupSizes(16, 3), [4, 3, 3, 3, 3]);
  assert.deepStrictEqual(groupSizes(20, 3), [3, 3, 3, 3, 3, 3, 2]);
  assert.deepStrictEqual(groupSizes(1, 3), [1]);
  for (let n = 1; n <= 40; n += 1) assert.strictEqual(groupSizes(n, 3).reduce((a, b) => a + b, 0), n);
});
