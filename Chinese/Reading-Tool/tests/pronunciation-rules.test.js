'use strict';

const assert = require('node:assert/strict');
const rules = require('../pronunciation-rules.js');

assert.equal(rules.pinyinSyllableToZhuyin('yin1'), 'ㄧㄣ');
assert.equal(rules.pinyinSyllableToZhuyin('ye3'), 'ㄧㄝˇ');
assert.equal(rules.pinyinSyllableToZhuyin('shi2'), 'ㄕˊ');
assert.equal(rules.pinyinSyllableToZhuyin('zhi4'), 'ㄓˋ');
assert.equal(rules.pinyinSyllableToZhuyin('wen2'), 'ㄨㄣˊ');
assert.equal(rules.pinyinSyllableToZhuyin('jue2'), 'ㄐㄩㄝˊ');
assert.equal(rules.pinyinSyllableToZhuyin('xi0'), '˙ㄒㄧ');

function analyze(text, known = {}) {
    const readings = Array.from(text, (_, index) => known[index] || 'ㄗ');
    return rules.apply(text, readings);
}

function expectReading(text, index, expected, known = {}) {
    const result = analyze(text, known);
    assert.equal(result.readings[index], expected, `${text}[${index}]`);
}

expectReading('不但', 0, 'ㄅㄨˊ', { 1: 'ㄉㄢˋ' });
expectReading('不好', 0, 'ㄅㄨˋ', { 1: 'ㄏㄠˇ' });
expectReading('一樣', 0, 'ㄧˊ', { 1: 'ㄧㄤˋ' });
expectReading('一張', 0, 'ㄧˋ', { 1: 'ㄓㄤ' });
expectReading('第一課', 1, 'ㄧ');
expectReading('二○一二年', 2, 'ㄧ');
expectReading('看一看', 1, 'ㄧˊ', { 2: 'ㄎㄢˋ' });
expectReading('秋千一下子', 2, 'ㄧˊ', { 3: 'ㄒㄧㄚˋ' });
expectReading('誰來了', 0, 'ㄕㄟˊ');
expectReading('媽媽', 1, '˙ㄇㄚ');
expectReading('你和我', 1, 'ㄏㄢˋ');
expectReading('和尚', 0, 'ㄏㄜˊ');
expectReading('暖和', 1, '˙ㄏㄨㄛ');
expectReading('看著我', 1, '˙ㄓㄜ');
expectReading('著名作家', 0, 'ㄓㄨˋ');
expectReading('睡不著覺', 2, 'ㄓㄠˊ');
expectReading('睡不著覺', 3, 'ㄐㄧㄠˋ');
expectReading('灰塵附著在表面', 3, 'ㄓㄨㄛˊ');
expectReading('跑得快', 1, '˙ㄉㄜ');
expectReading('得到獎品', 0, 'ㄉㄜˊ');
expectReading('不得少於', 1, 'ㄉㄜˊ');
expectReading('得出結論', 0, 'ㄉㄜˊ');
expectReading('禁不得委屈', 2, '˙ㄉㄜ');
expectReading('我得走了', 1, 'ㄉㄟˇ');
expectReading('音樂課', 1, 'ㄩㄝˋ');
expectReading('種樹的人', 0, 'ㄓㄨㄥˋ');
expectReading('一行人', 1, 'ㄏㄤˊ');
expectReading('還給同學', 0, 'ㄏㄨㄢˊ');
expectReading('場圃', 0, 'ㄔㄤˊ');
expectReading('喔喔啼', 0, 'ㄨㄛˋ');
expectReading('喔喔啼', 1, 'ㄨㄛˋ');
expectReading('休息', 1, 'ㄒㄧˊ');

const missingCandidate = rules.apply('他行嗎', ['ㄊㄚ', '', '˙ㄇㄚ']);
assert.equal(missingCandidate.reviewItems.some(item => item.char === '行'), true);
const conjunction = analyze('你和我');
assert.equal(conjunction.reviewItems.some(item => item.char === '和'), false);

console.log(`PRONUNCIATION RULE TESTS PASSED: ${rules.VERSION}`);
