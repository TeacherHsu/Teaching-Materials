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

test('一上題庫：7 課、讀音與字數相符、造詞只用教過的字', () => {
  const w = {}; new Function('window', fs.readFileSync(path.join(__dirname, '../data/G1A.js'), 'utf8'))(w);
  const g1 = w.READ_ALOUD_DATA.G1A;
  assert.strictEqual(g1.lessons.length, 7);
  const taught = new Set(); const words = new Set();
  for (const L of g1.lessons) {
    L.chars.forEach((c) => taught.add(c.t)); L.words.forEach((x) => words.add(x.t));
    for (const it of [...L.chars, ...L.words]) {
      assert.strictEqual(it.z.length, [...it.t].length, it.t);
      if (it.ex) {
        assert.ok(it.ex.length >= 2 && it.ex.includes(it.t), it.ex);
        assert.strictEqual(it.exz[it.ex.indexOf(it.t)], it.z[0], `${it.t}／${it.ex}`);
        assert.ok(words.has(it.ex) || [...it.ex].every((ch) => taught.has(ch)), `${it.t}／${it.ex}`);
      }
    }
  }
  assert.strictEqual(makeGrader(g1)(g1.lessons[0].words[0], ['一起']), 3);
});

test('四上題庫：6 課、每課 15 個生字、讀音與字數相符、語詞不含符號', () => {
  const w = {}; new Function('window', fs.readFileSync(path.join(__dirname, '../data/G4A2.js'), 'utf8'))(w);
  const g4 = w.READ_ALOUD_DATA.G4A2;
  assert.strictEqual(g4.lessons.length, 6);
  for (const L of g4.lessons) {
    assert.strictEqual(L.chars.length, 15, `第${L.no}課生字`);
    for (const it of [...L.chars, ...L.words]) {
      assert.match(it.t, /^[\u3400-\u9fff]+$/, it.t);
      assert.strictEqual(it.z.length, [...it.t].length, it.t);
      for (const s of it.z) assert.match(s, /^˙?[ㄅ-ㄩ]{1,3}[ˊˇˋ]?$/, `${it.t} ${s}`);
      if (it.ex) assert.strictEqual(it.exz[it.ex.indexOf(it.t)], it.z[0], `${it.t}／${it.ex}`);
    }
  }
  const tower = g4.lessons.flatMap((L) => L.words).find((x) => x.t === '東京晴空塔');
  assert.strictEqual(makeGrader(g4)(tower, ['東京晴空塔']), 3);
});
