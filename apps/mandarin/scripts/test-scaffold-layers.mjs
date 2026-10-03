// 各題型的三層提示（CF 2026-10-03：生字、句型、讀懂課文等題型沒有對應鷹架）。
// 依最少到最多提示法：1 策略 → 2 縮小範圍（劃掉選項＋部分線索）→ 3 示範。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FakeElement, installFakeDom } from './fake-dom.mjs';

installFakeDom();
document.body = new FakeElement('body');
window.matchMedia = () => ({ matches: false });
const store = new Map();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
});

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lesson = JSON.parse(fs.readFileSync(path.join(root, 'public/data/115AG4K/lesson03.json'), 'utf8'));

const { pronunciationHints, buildPronunciationItems } = await import('../src/activities/pronunciationQuestions.js');
const { radicalHints } = await import('../src/activities/characters.js');
const { vocabularyHints } = await import('../src/activities/vocabulary.js');
const { buildConnectiveItems } = await import('../src/activities/sentencePractice.js');
const { buildParagraphItems, buildClassifyItems } = await import('../src/activities/reading.js');

function checkLayers(name, hints, answer) {
  assert.equal(hints.length, 3, `${name}：要三層`);
  hints.forEach((h, i) => {
    assert.ok(h.text && h.text.trim(), `${name} 第 ${i + 1} 層要有文字`);
    assert.ok(!h.text.includes(answer), `${name} 第 ${i + 1} 層直接寫出答案「${answer}」：${h.text}`);
  });
  assert.ok(hints[1].eliminate !== undefined, `${name}：第 2 層要能縮小範圍`);
}

// 生字讀音、部首、語詞
const ch = { char: '社', zhuyin: 'ㄕㄜˋ', radical: '⽰', examples: ['報社', '社區'] };
const ph = pronunciationHints(ch, 3);
checkLayers('生字讀音', ph, ch.zhuyin);
assert.match(ph[0].text, /報社/, '第 1 層從已知語詞找讀音');
assert.equal(ph[2].speak, undefined, '第 3 層不念出語詞（念出來等於給答案）');
assert.match(ph[2].text, /聲/, '第 3 層給聲調線索');
assert.equal(pronunciationHints(ch, 2)[1].eliminate, 0, '只剩兩個選項時不劃，免得直接變答案');
checkLayers('部首', radicalHints(ch, [ch, { char: '祝', radical: '⽰' }], 3), ch.radical);
assert.match(radicalHints(ch, [ch, { char: '祝', radical: '⽰' }], 3)[2].text, /祝/, '第 3 層列同部首的字');
checkLayers('語詞', vocabularyHints({ word: '邀約', meaning: '邀請、約請。' }, 3), '邀約');

// 句型：選關聯詞
const [conn] = buildConnectiveItems({ lesson_id: 'X', sentence_patterns: [{ id: 'p', structure: '雖然……可是……', examples_status: 'approved',
  examples: ['雖然題目很難可是我會一步一步練習', '雖然下雨可是我們照常上課'] }] }, 3, (a) => a);
checkLayers('選關聯詞', conn.hints, conn.answer);
assert.match(conn.hints[2].text, /照常上課/, '第 3 層給同句型的另一個例句');

// 讀懂課文：一段一段讀、分類
const paras = [
  { paragraph_no: 1, structure_block: '起因', summary: 'A 段', text_spots: [{ para: 1, sentences: [0] }] },
  { paragraph_no: 2, structure_block: '經過', summary: 'B 段', text_spots: [{ para: 1, sentences: [1] }] },
  { paragraph_no: 3, structure_block: '結果', summary: 'C 段', text_spots: [{ para: 1, sentences: [2] }] },
];
const items = buildParagraphItems('X', paras, 3, (_id, sp) => ['開頭第一句。後面', '第二段。', '第三段。'][sp[0].sentences[0]], (a) => a);
checkLayers('一段一段讀', items[0].hints, items[0].answer);
assert.match(items[1].hints[1].text, /經過/, '第 2 層說出屬於哪一部分');
assert.match(items[0].hints[2].text, /開頭第一句。/, '第 3 層指出段落的第一句');
const cls = buildClassifyItems({ categories: ['甲', '乙', '丙'], items: [{ text: 'a1', answer: '甲' }, { text: 'a2', answer: '甲' }] }, (a) => a);
checkLayers('分類', cls[0].hints, cls[0].answer);
assert.match(cls[0].hints[2].text, /a2/, '第 3 層給同類的例子');

// ChoiceQuiz 劃掉選項：正解永遠留著
const { ChoiceQuiz } = await import('../src/components/ChoiceQuiz.js');
const find = (n, p) => (p(n) ? n : (n.children || []).reduce((acc, c) => acc || find(c, p), null));
const findAll = (n, p, out = []) => { if (p(n)) out.push(n); (n.children || []).forEach((c) => findAll(c, p, out)); return out; };
for (let t = 0; t < 30; t += 1) {
  const quiz = ChoiceQuiz({ items: [{ stem: 's', options: ['對', '錯一', '錯二', '錯三'], answer: '對',
    hints: [{ text: '一' }, { text: '二', eliminate: 2 }, { text: '三' }] }], optionCount: 4, onBack() {} });
  const btn = () => find(quiz, (n) => String(n.tagName).toLowerCase() === 'button' && /^看提示/.test(n.textContent || ''));
  btn().dispatch('click'); btn().dispatch('click');
  const opts = findAll(quiz, (n) => n.hasClass && n.hasClass('quiz-option'));
  const gone = opts.filter((o) => o.hasClass('quiz-option--eliminated'));
  assert.equal(gone.length, 2, '第 2 層劃掉兩個');
  assert.ok(!gone.some((o) => o.textContent.trim() === '對'), '正解永遠不會被劃掉');
}

// 排句子：第 1 次給策略，第 2 次起標亮下一塊
const { SentenceOrdering } = await import('../src/components/SentenceOrdering.js');
const so = SentenceOrdering({ prompt: '排排看', parts: ['雖然', '下雨', '可是', '照常上課'], solution: ['雖然', '下雨', '可是', '照常上課'], hint: '先找關聯詞「雖然」' });
const hb = () => find(so, (n) => String(n.tagName).toLowerCase() === 'button' && n.textContent === '看提示');
hb().dispatch('click');
assert.match(so.textContent, /先找關聯詞「雖然」/);
hb().dispatch('click');
const lit = findAll(so, (n) => n.hasClass && n.hasClass('sentence-chip--hinted'));
assert.equal(lit.length, 1);
assert.equal(lit[0].textContent, '雖然', '標亮的是第 1 格該放的詞塊');

// 真實資料：四上 L03 的讀音題都帶三層
for (const it of buildPronunciationItems(lesson.characters, lesson.characters, 3)) checkLayers(`四上L03「${it.character}」`, it.hints, it.answer);
console.log('✅ 三層鷹架：生字讀音、部首、語詞、選關聯詞、一段一段讀、分類都有三層；不寫出答案；劃選項不劃正解；排句子逐塊標亮');

// 選項數跟著鷹架層：正解一定留著；fixedOptions 不裁；刪選項至少留一個錯的
const { trimOptions } = await import('../src/components/ChoiceQuiz.js');
for (let t = 0; t < 30; t += 1) {
  const two = trimOptions({ options: ['對', '錯一', '錯二', '錯三'], answer: '對' }, 2);
  assert.equal(two.length, 2); assert.ok(two.includes('對'), '裁選項不能裁掉正解');
}
assert.equal(trimOptions({ options: ['是', '不是', '不一定'], answer: '是', fixedOptions: true }, 2).length, 3);
const tiny = ChoiceQuiz({ items: [{ stem: 's', options: ['對', '錯'], answer: '對', hints: [{ text: '一', eliminate: 2 }] }], onBack() {} });
find(tiny, (n) => String(n.tagName).toLowerCase() === 'button' && /^看提示/.test(n.textContent || '')).dispatch('click');
assert.equal(findAll(tiny, (n) => n.hasClass && n.hasClass('quiz-option--eliminated')).length, 0, '只剩兩個選項時不能刪到只剩正解');
console.log('✅ 選項數依鷹架層裁切、刪選項不洩答案');
