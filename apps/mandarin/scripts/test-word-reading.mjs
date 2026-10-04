// 念讀字詞：出題（生字＋語詞、注音對得上才出）、判讀（不比聲調、任一候選念對就算）
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { installFakeDom } from './fake-dom.mjs';
installFakeDom();
const W = await import('../src/activities/wordReading.js');
const RS = await import('../src/utils/readingScore.js');
RS.setCharReadings({ 湯: ['ㄊㄤ'], 糖: ['ㄊㄤˊ'], 招: ['ㄓㄠ'], 手: ['ㄕㄡˇ'] });

const lesson = JSON.parse(fs.readFileSync(new URL('../public/data/115AG4K/lesson02.json', import.meta.url)));
const { chars, words } = W.readingItems(lesson);
assert.ok(chars.length >= 3 && words.length >= 3, '生字、語詞都有題目');
assert.ok(words.every((w) => w.expected.length === [...w.text].length), '語詞每個字都有對應注音');
assert.equal(W.canStartWordReading(lesson), true);

const tang = [{ char: '湯', zhuyin: 'ㄊㄤ' }];
assert.equal(W.judge(tang, ['湯']), true);
assert.equal(W.judge(tang, ['糖']), true, '不比聲調：念成同音不同調的字也算對');
assert.equal(W.judge(tang, ['好', '湯']), true, '任一辨識候選念對就算對');
assert.equal(W.judge(tang, ['手']), false);
assert.equal(W.judge([{ char: '招', zhuyin: 'ㄓㄠ' }, { char: '手', zhuyin: 'ㄕㄡˇ' }], ['招']), false, '語詞漏念一個字不算對');
console.log('✅ 念讀字詞：出題與判讀規則');

// 答錯後的修正流程（第二版審查 A6）：自己改一次 → 聽示範跟讀 → 自己再念；結果分開記
{
  const act = W.buildWordReadingActivity(lesson, () => {});
  const buttons = () => { const out = []; const walk = (n) => { if (n.tagName === 'BUTTON' || n.tagName === 'button') out.push(n); (n.children || []).forEach(walk); }; walk(act); return out; };
  const press = (label) => {
    const b = buttons().find((x) => x.textContent.trim() === label);
    assert.ok(b, `找不到按鈕「${label}」，目前：${buttons().map((x) => x.textContent.trim()).join('／')}`);
    b.dispatch('click');
  };
  press('再練習');                 // 第一次念錯：還能自己改
  assert.ok(buttons().some((b) => b.textContent.trim() === '先聽一次'), '第一次錯後要有明顯的「先聽一次」');
  press('再練習');                 // 第二次錯：進入示範跟讀
  press('跟著念了');
  press('自己念對了');             // 跟讀後自己再念對
  assert.ok(act.textContent.includes('念對了') || act.textContent.includes('做到了') || act.textContent.includes('有進步'), '跟讀後自己念對要有稱讚');
  assert.ok(buttons().some((b) => b.textContent.trim() === '下一個'));
}
console.log('✅ 念讀字詞：答錯後的示範、跟讀、自己再念');
