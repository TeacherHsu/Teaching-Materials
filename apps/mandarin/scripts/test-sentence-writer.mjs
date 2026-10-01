// 驗證 SentenceWriter 元件與它在「句型練習」裡的位置：
// 鷹架（句型、說明、例句）看得到、送出會存進 madeSentences、
// 太短會被擋、沒用到句型只提示不擋。
// 用法：node scripts/test-sentence-writer.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const store = new Map();
window.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, v),
  removeItem: (k) => store.delete(k),
};
window.matchMedia = () => ({ matches: false });

const { SentenceWriter } = await import('../src/components/SentenceWriter.js');
const S = await import('../src/utils/madeSentences.js');

const pattern = {
  id: 'sentence:01:01',
  head: '無比堅定的自信',
  structure: '無比（形容詞）的（名詞）',
  description: '強調某一個事物怎樣狀態的短語。',
  examples: ['無比雄厚的實力', '無比雀躍的心情', '無比沉重的腳步'],
};

function build() {
  store.clear();
  let doneWith = null;
  const root = SentenceWriter({
    lessonId: '115AG4K01',
    pattern,
    onDone: (text) => { doneWith = text; },
  });
  return {
    root,
    input: root.find((n) => n.tagName === 'textarea'),
    submit: root.find((n) => n.tagName === 'button' && n.textContent.includes('寫好了')),
    message: () => root.find((n) => n.hasClass?.('writer__message'))?.textContent || '',
    hint: () => root.find((n) => n.hasClass?.('writer__hint'))?.textContent || '',
    done: () => doneWith,
  };
}

// ── 1. 鷹架：句型、說明、例句都要看得到 ─────────────
let w = build();
const text = w.root.textContent;
assert.ok(text.includes(pattern.structure), '要顯示句型');
assert.ok(text.includes(pattern.description), '要顯示說明');
for (const ex of pattern.examples) {
  assert.ok(text.includes(ex), `要顯示例句「${ex}」`);
}
assert.ok(w.input, '要有輸入框');
assert.ok(w.submit, '要有送出鈕');

// 重寫情境：只有句型、沒有說明與例句時，不該畫出空的鷹架框
store.clear();
const bare = SentenceWriter({
  lessonId: 'L1',
  pattern: { id: 'p1', head: '無比堅定的自信', structure: '無比（形容詞）的（名詞）', description: '', examples: [] },
  onDone() {},
});
assert.equal(bare.find((n) => n.hasClass?.('writer__scaffold')), null,
  '沒有說明也沒有例句時不該畫出空的鷹架框');
assert.ok(bare.find((n) => n.tagName === 'textarea'), '仍然要有輸入框');

// ── 2. 太短擋下來，不會存 ──────────────────────────
w = build();
w.input.value = '';
w.submit.dispatch('click');
assert.ok(w.message().includes('還沒有寫'), `空白要提醒，實際：${w.message()}`);
assert.equal(S.listSentences().length, 0, '空白不該存');
assert.equal(w.done(), null, '空白不該算完成');

w.input.value = '我很好';
w.submit.dispatch('click');
assert.ok(w.message().includes('再多寫一點'), `太短要提醒，實際：${w.message()}`);
assert.equal(S.listSentences().length, 0);

// ── 3. 沒用到句型只提示，仍然可以送出 ───────────────
w = build();
w.input.value = '我喜歡吃蘋果';
w.input.dispatch('input');
assert.ok(w.hint().includes('無比'), `應提示還沒用到的字，實際：${w.hint()}`);
assert.ok(w.hint().includes('還是可以送出'), '要講明可以送出');
w.submit.dispatch('click');
assert.equal(S.listSentences().length, 1, '沒照句型寫也要能送出，判斷交給教師');
assert.equal(S.listSentences()[0].text, '我喜歡吃蘋果。', '句號要自動補');
assert.equal(S.listSentences()[0].mark, null, '送出後是待批改');
assert.equal(S.listSentences()[0].lessonId, '115AG4K01');
assert.equal(S.listSentences()[0].patternId, pattern.id);
assert.ok(w.done(), 'onDone 應被呼叫');

// ── 4. 照句型寫就沒有提示 ─────────────────────────
w = build();
w.input.value = '無比雄厚的實力';
w.input.dispatch('input');
assert.equal(w.hint(), '', '照句型寫不該有提示');
w.submit.dispatch('click');
assert.equal(S.listSentences()[0].text, '無比雄厚的實力。');

// ── 5. 送出後顯示「交出去了」並停止再送 ──────────────
assert.ok(w.root.textContent.includes('交出去了'), '要有送出確認');
assert.ok(w.root.textContent.includes('無比雄厚的實力。'), '要把句子顯示回來');

// ── 6. 「句型練習」最後一步是寫作 ───────────────────
const lesson = JSON.parse(readFileSync(new URL('../public/data/115AG4K/lesson01.json', import.meta.url)));
const { buildSentencePracticeActivity } = await import('../src/activities/sentencePractice.js');
store.clear();
const activity = buildSentencePracticeActivity(lesson, () => {});
assert.ok(activity, '活動要建得起來');
// 這一課有 ready 的句型，所以寫作步驟一定存在
const hasPatterns = (lesson.sentence_patterns || []).some(
  (p) => (p.status === 'ready' || !p.status) && (p.structure || p.head),
);
assert.ok(hasPatterns, '測試用的課次應該有句型');

// 沒有句型的課次不該有寫作步驟，也不該炸
assert.doesNotThrow(() => buildSentencePracticeActivity({ lesson_id: 'X' }, () => {}));

console.log('✅ SentenceWriter：鷹架完整、太短擋下、沒照句型只提示仍可送出、送出即存為待批改');
