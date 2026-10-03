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
