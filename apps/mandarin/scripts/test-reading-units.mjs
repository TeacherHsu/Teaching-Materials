// 驗證課文的分句：不可掉字、注音與朗讀用字要跟著切、句子不可長到念不完。
//
// 這支守的是朗讀挑戰的前提——一句一句念，句子就得切得對。
// 曾經踩過的兩個坑都寫成斷言：
//   1. 只在「詞的邊界」切句 → 長課文的詞邊界符標的是整段，切出 500 字的一句。
//   2. 丟掉只有標點的「句」 → 10 課掉字。
// 用法：node scripts/test-reading-units.mjs
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ENC = fileURLToPath(new URL('../public/data/readings.enc.json', import.meta.url));
if (!existsSync(ENC)) {
  console.log('⚠ 找不到 readings.enc.json，跳過（這台電腦沒有 mandarin-work）');
  process.exit(0);
}

globalThis.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
globalThis.atob = (s) => Buffer.from(s, 'base64').toString('binary');
globalThis.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
const envelope = JSON.parse(readFileSync(ENC, 'utf8'));
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => envelope });

const K = await import('../src/utils/classroomKey.js');
const { classroomPassword } = await import('./classroom-password.mjs');
if (!classroomPassword()) { console.log('⏭  沒有教室密碼，略過'); process.exit(0); }
await K.unlockWithPassword(classroomPassword());
const { splitSentences, groupByParagraph } = await import('../src/utils/readingUnits.js');

// 朗讀一句的長度上限。超過這個長度，這群學生一口氣念不完，
// 而且語音辨識的結果也會難以對齊。
const MAX_SENTENCE = 50;

let lessons = 0;
let sentences = 0;
let longest = 0;

for (const lessonId of envelope.lessons) {
  const reading = K.getReading(lessonId);
  assert.ok(reading, `${lessonId} 應該解得開`);
  lessons += 1;

  const list = splitSentences(reading.paras);
  assert.ok(list.length > 0, `${lessonId} 應該切得出句子`);

  // ── 不可掉字 ──────────────────────────────────
  const original = reading.paras.flat(2).map((t) => t[0]).join('');
  assert.equal(list.map((s) => s.text).join(''), original,
    `${lessonId} 切句後的字串必須和原文完全一致（不可掉字或重複）`);

  for (const sentence of list) {
    sentences += 1;
    longest = Math.max(longest, [...sentence.text].length);
    assert.ok(sentence.text.trim(), `${lessonId} 不可有空句`);
    assert.ok([...sentence.text].length <= MAX_SENTENCE,
      `${lessonId} 有一句 ${[...sentence.text].length} 字，超過 ${MAX_SENTENCE}：${sentence.text.slice(0, 30)}…`);
    assert.ok(typeof sentence.paraIndex === 'number');

    // ── 注音與朗讀用字要跟著切 ───────────────────
    let tokenText = '';
    for (const [text, zhuyin, say] of sentence.tokens) {
      tokenText += text;
      assert.equal(zhuyin.split(' ').length, [...text].length,
        `${lessonId} 注音格數要和字數一致：${JSON.stringify([text, zhuyin])}`);
      if (say !== null) {
        assert.equal([...say].length, [...text].length,
          `${lessonId} 朗讀用字長度要和字數一致：${JSON.stringify([text, say])}`);
      }
    }
    assert.equal(tokenText, sentence.text, `${lessonId} 詞串起來要等於句子文字`);
  }

  // ── 併段：不可掉字、段數要對 ───────────────────
  const paragraphs = groupByParagraph(list);
  assert.equal(paragraphs.map((p) => p.text).join(''), original,
    `${lessonId} 併段後也不可掉字`);
  assert.equal(paragraphs.length, new Set(list.map((s) => s.paraIndex)).size,
    `${lessonId} 段數要等於不同 paraIndex 的數量`);
  for (const para of paragraphs) {
    assert.ok(para.sentences.length >= 1);
    assert.equal(para.sentences.map((s) => s.text).join(''), para.text);
  }
}

// ── 回歸：詞內部有句號也要切得開 ───────────────────
const proseLike = [[[['第一句話。第二句話。第三句話。', '  '.repeat(0) + Array(15).fill('ㄅ').join(' '), null]]]];
const chars = '第一句話。第二句話。第三句話。';
const tokens = [[chars, [...chars].map(() => 'ㄅㄨ').join(' '), null]];
const split = splitSentences([[tokens]]);
assert.equal(split.length, 3, `一個 token 裡有三句就要切成三句，實際 ${split.length}`);
assert.deepEqual(split.map((s) => s.text), ['第一句話。', '第二句話。', '第三句話。']);

// ── 回歸：只有標點的尾段要併進上一句，不可丟掉 ───────
const withTail = splitSentences([[[['他說：「好。', [...'他說：「好。'].map(() => 'ㄅㄨ').join(' '), null], ['」', 'ㄅㄨ', null]]]]);
assert.equal(withTail.map((s) => s.text).join(''), '他說：「好。」', '只有標點的尾巴不可被丟掉');

// ── 回歸：行尾要斷句（無標點的詩）───────────────────
const poem = [[
  [['風吹過山頭', [...'風吹過山頭'].map(() => 'ㄅㄨ').join(' '), null]],
  [['雲停在天邊', [...'雲停在天邊'].map(() => 'ㄅㄨ').join(' '), null]],
]];
assert.deepEqual(splitSentences(poem).map((s) => s.text), ['風吹過山頭', '雲停在天邊'],
  '沒有標點的詩要在行尾斷句');

console.log(`✅ 分句：${lessons} 課 ${sentences} 句，最長 ${longest} 字（上限 ${MAX_SENTENCE}）、`
  + '零掉字、注音與朗讀用字對位正確、併段一致');

// ── 語境斷詞（讀詞模式）────────────────────────────
// 資料裡的 `|` 標的不是詞（低年級標短語、長課文標整段），所以讀詞不能用它。
const { segmentWords } = await import('../src/utils/readingUnits.js');
const seg = (t) => segmentWords(t).map((w) => w.text);
assert.deepEqual(seg('害怕的時候，'), ['害怕', '的', '時候', '，'], '要依語境斷詞，不是整句一個單位');
assert.deepEqual(seg('一會兒打雷，'), ['一會兒', '打雷', '，'], '「一會兒」要當成一個詞');
assert.deepEqual(seg(''), []);
// 範圍要能還原原文、不重疊不遺漏
for (const text of ['心裡颳起冷冷的風，', '回外公家度假時，阿姨帶著我們一家人散步。']) {
  const ranges = segmentWords(text);
  let at = 0;
  for (const r of ranges) {
    assert.ok(r.start >= at, `斷詞範圍不可重疊：${text}`);
    assert.equal(text.slice(r.start, r.end), r.text, '範圍要對得上原文');
    at = r.end;
  }
  // 去掉空白後要能完整還原
  assert.equal(ranges.map((r) => r.text).join(''), text.replace(/\s/g, ''), `斷詞不可掉字：${text}`);
}
console.log('✅ 語境斷詞：依語意切詞、範圍不重疊、不掉字');

// ── 朗讀粒度（CF 2026-10-02）────────────────────────
// 低組念到逗號或 20 字、中組念到句號、高組一整段；每種都有字數上限，
// 沒有上限的話散文會出現 1200 字的一「段」，挑戰層的學生也念不完。
const { groupByUnit } = await import('../src/utils/readingUnits.js');
const CAPS = { clause: 20, sentence: 45, paragraph: 90 };
let unitTotal = 0;
for (const lessonId of envelope.lessons) {
  const list = splitSentences(K.getReading(lessonId).paras);
  const original = list.map((s) => s.text).join('');
  for (const [unit, cap] of Object.entries(CAPS)) {
    const grouped = groupByUnit(list, unit);
    unitTotal += grouped.length;
    assert.equal(grouped.map((g) => g.text).join(''), original,
      `${lessonId} ${unit}：重組後不可掉字`);
    for (const g of grouped) {
      assert.ok([...g.text].length <= cap,
        `${lessonId} ${unit}：有一段 ${[...g.text].length} 字，超過上限 ${cap}：${g.text.slice(0, 24)}…`);
      for (const [text, zhuyin] of g.tokens) {
        assert.equal(zhuyin.split(' ').length, [...text].length,
          `${lessonId} ${unit}：注音對位要跟著切`);
      }
    }
  }
}
// 粒度要真的不同：段數 clause > sentence >= paragraph
const sample = splitSentences(K.getReading(envelope.lessons[0]).paras);
assert.ok(groupByUnit(sample, 'clause').length >= groupByUnit(sample, 'sentence').length,
  'clause 應該切得比 sentence 細');
assert.ok(groupByUnit(sample, 'sentence').length >= groupByUnit(sample, 'paragraph').length,
  'sentence 應該切得比 paragraph 細');
console.log(`✅ 朗讀粒度：3 種共 ${unitTotal} 段，零掉字、都不超過上限、注音對位正確`);
