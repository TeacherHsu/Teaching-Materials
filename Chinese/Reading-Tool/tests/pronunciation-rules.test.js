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
assert.equal(rules.VERSION, '1.7.0');

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
// 一二三聲前變調 ㄧˋ，依教育部《國語辭典簡編本》的「(變)」欄。
expectReading('一張圖', 0, 'ㄧˋ', { 1: 'ㄓㄤ' });
expectReading('有一天', 1, 'ㄧˋ', { 2: 'ㄊㄧㄢ' });
expectReading('心裡一涼', 2, 'ㄧˋ', { 3: 'ㄌㄧㄤˊ' });
expectReading('數一數', 1, 'ㄧˋ', { 2: 'ㄕㄨˇ' });
expectReading('一半', 0, 'ㄧˊ', { 1: 'ㄅㄢˋ' });
expectReading('一起走', 0, 'ㄧˋ', { 1: 'ㄑㄧˇ' });
// 一百、一千、一萬是數量倍數，仍變調；序數與數字序列保留本調。
expectReading('一百三十', 0, 'ㄧˋ', { 1: 'ㄅㄞˇ' });
expectReading('第一課', 1, 'ㄧ');
expectReading('一二一', 0, 'ㄧ');
expectReading('三分之一', 3, 'ㄧ');
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
// 動詞「種」以結構判斷，作物名不必逐一列舉。
expectReading('種高麗菜', 0, 'ㄓㄨㄥˋ');
expectReading('種空心菜', 0, 'ㄓㄨㄥˋ');
expectReading('種下希望', 0, 'ㄓㄨㄥˋ');
expectReading('菜種好了', 1, 'ㄓㄨㄥˋ');
// 數量／指示詞前件是量詞，訊號強過「種＋作物」。
expectReading('三種花', 1, 'ㄓㄨㄥˇ');
expectReading('這種高麗菜', 1, 'ㄓㄨㄥˇ');
expectReading('多種語言', 1, 'ㄓㄨㄥˇ');
expectReading('種種困難', 0, 'ㄓㄨㄥˇ');
expectReading('種種困難', 1, 'ㄓㄨㄥˇ');
expectReading('人種歧視', 1, 'ㄓㄨㄥˇ');
expectReading('播種季節', 1, 'ㄓㄨㄥˇ');
expectReading('品種改良', 1, 'ㄓㄨㄥˇ');
expectReading('有種孤零零的感覺', 1, 'ㄓㄨㄥˇ');
expectReading('一行人', 1, 'ㄏㄤˊ');
expectReading('還給同學', 0, 'ㄏㄨㄢˊ');
// 「還」預設副詞義 ㄏㄞˊ，歸還義才讀 ㄏㄨㄢˊ。
expectReading('還可以保存', 0, 'ㄏㄞˊ');
expectReading('他還在水裡', 1, 'ㄏㄞˊ');
expectReading('還記得剛才', 0, 'ㄏㄞˊ');
expectReading('把錢歸還', 3, 'ㄏㄨㄢˊ');
expectReading('以牙還牙', 2, 'ㄏㄨㄢˊ');
// 「為」預設介詞義 ㄨㄟˋ，動詞與判斷義讀 ㄨㄟˊ。
expectReading('因為下雨', 1, 'ㄨㄟˋ');
expectReading('為了你', 0, 'ㄨㄟˋ');
expectReading('為什麼', 0, 'ㄨㄟˋ');
expectReading('我認為對', 2, 'ㄨㄟˊ');
expectReading('成為老師', 1, 'ㄨㄟˊ');
expectReading('被稱為杏壇', 2, 'ㄨㄟˊ');
expectReading('可以為師矣', 2, 'ㄨㄟˊ');
expectReading('何者為善', 2, 'ㄨㄟˊ');
// 「得」：助動詞要在謂語開頭，補語與固定輕聲詞不得誤判。
expectReading('得意的說', 0, 'ㄉㄜˊ');
expectReading('懂得分辨', 1, '˙ㄉㄜ');
expectReading('值得珍惜', 1, '˙ㄉㄜ');
expectReading('自己做得到', 3, '˙ㄉㄜ');
expectReading('難過得想哭', 2, '˙ㄉㄜ');
expectReading('記得有一天', 1, '˙ㄉㄜ');
expectReading('這得靠你', 1, 'ㄉㄟˇ');
expectReading('我得走快點', 1, 'ㄉㄟˇ');
expectReading('場圃', 0, 'ㄔㄤˊ');
expectReading('喔喔啼', 0, 'ㄨㄛˋ');
expectReading('喔喔啼', 1, 'ㄨㄛˋ');
expectReading('休息', 1, 'ㄒㄧˊ');
expectReading('我們', 1, '˙ㄇㄣ');
expectReading('你們看', 1, '˙ㄇㄣ');
expectReading('同學們也來了', 2, '˙ㄇㄣ');
expectReading('人們有心', 1, '˙ㄇㄣ');
expectReading('圖們江', 1, 'ㄇㄣˊ');
expectReading('孩子', 1, '˙ㄗ');
// CF 2026-09-02 裁定：「兒子」依課堂讀法標輕聲，不採教育部辭典的 ㄗˇ。
expectReading('兒子', 1, '˙ㄗ');
// CF 2026-09-02 裁定：辭典首列 ㄗˇ 的兩讀詞，依課堂讀法標輕聲。
expectReading('好日子', 2, '˙ㄗ');
expectReading('我的鼻子', 3, '˙ㄗ');
expectReading('吃瓜子', 2, '˙ㄗ');
expectReading('我的孫子', 3, '˙ㄗ');
expectReading('我的兒子', 3, '˙ㄗ');
expectReading('桌子上', 1, '˙ㄗ');
expectReading('一下子就好', 2, '˙ㄗ');
expectReading('伸長脖子', 3, '˙ㄗ');
expectReading('孔子說', 1, 'ㄗˇ');
expectReading('子曰：', 0, 'ㄗˇ');
expectReading('小種子沒有腳', 2, 'ㄗˇ');
expectReading('學子', 1, 'ㄗˇ');
expectReading('愛玉子', 2, 'ㄗˇ');
expectReading('女子也有機會', 1, 'ㄗˇ');
expectReading('妻子說', 1, 'ㄗˇ');
expectReading('美麗的彩虹', 1, 'ㄌㄧˋ');
expectReading('愛麗絲', 1, 'ㄌㄧˋ');
expectReading('香榭麗舍大道', 2, 'ㄌㄧˋ');
expectReading('絢麗的雷射', 1, 'ㄌㄧˋ');
// 教育部《重編國語辭典修訂本》2021：高麗菜 ㄍㄠ ㄌㄧˋ ㄘㄞˋ，與高麗(ㄌㄧˊ)不同。
expectReading('高麗菜', 1, 'ㄌㄧˋ');
expectReading('種高麗菜的人', 2, 'ㄌㄧˋ');
expectReading('高麗參', 1, 'ㄌㄧˊ');
expectReading('高麗時代', 1, 'ㄌㄧˊ');
expectReading('高句麗', 2, 'ㄌㄧˊ');
expectReading('什麼', 1, '˙ㄇㄜ');
expectReading('怎麼辦', 1, '˙ㄇㄜ');
expectReading('你開心嗎？', 3, '˙ㄇㄚ');
expectReading('嗎啡', 0, 'ㄇㄚˇ');
expectReading('我問妳', 2, 'ㄋㄧˇ');
expectReading('於是', 0, 'ㄩˊ');
expectReading('孔子對於學', 3, 'ㄩˊ');
expectReading('只想看', 0, 'ㄓˇ');
expectReading('有幾個', 1, 'ㄐㄧˇ');
expectReading('幾乎全對', 0, 'ㄐㄧ');
expectReading('到處都是', 1, 'ㄔㄨˋ');
expectReading('大自然處處充滿', 3, 'ㄔㄨˋ');
expectReading('待人處事', 2, 'ㄔㄨˇ');
expectReading('材料處理過', 2, 'ㄔㄨˇ');
expectReading('不利的處境', 3, 'ㄔㄨˇ');
expectReading('吃飯時間', 3, 'ㄐㄧㄢ');
expectReading('門中間', 2, 'ㄐㄧㄢ');
expectReading('間隔開來', 0, 'ㄐㄧㄢˋ');
expectReading('挑撥離間', 3, 'ㄐㄧㄢˋ');
expectReading('許達三', 0, 'ㄒㄩˇ');
expectReading('也許可以', 1, 'ㄒㄩˇ');
expectReading('許許', 0, 'ㄏㄨˇ');
expectReading('每個人', 1, '˙ㄍㄜ');
expectReading('一個城市', 1, '˙ㄍㄜ');
expectReading('一個城市', 0, 'ㄧˊ', { 1: 'ㄍㄜˋ' });
expectReading('這個目標', 1, '˙ㄍㄜ');
expectReading('個人', 0, 'ㄍㄜˋ', { 0: 'ㄍㄜˋ' });
expectReading('個性', 0, 'ㄍㄜˋ', { 0: 'ㄍㄜˋ' });
expectReading('一會兒', 0, 'ㄧˋ');
expectReading('一會兒', 1, 'ㄏㄨㄟˇ');
expectReading('一會兒', 2, 'ㄦ');
expectReading('用盡', 1, 'ㄐㄧㄣˋ');
expectReading('盡力', 0, 'ㄐㄧㄣˋ');
expectReading('盡情', 0, 'ㄐㄧㄣˋ');
expectReading('盡頭', 0, 'ㄐㄧㄣˋ');
expectReading('想盡辦法', 1, 'ㄐㄧㄣˋ');

assert.deepEqual(rules.expectedContextualReadings('每個人一會兒盡力'), {
    1: '˙ㄍㄜ',
    3: 'ㄧˋ',
    4: 'ㄏㄨㄟˇ',
    5: 'ㄦ',
    6: 'ㄐㄧㄣˋ',
});
assert.deepEqual(rules.expectedSpeechOverrides('一會兒'), {
    0: '義',
    1: '毀',
    2: 'ㄦ',
});
assert.deepEqual(analyze('一會兒').speechOverrides, {
    0: '義',
    1: '毀',
    2: 'ㄦ',
});
assert.equal(rules.speechHomophoneFor('和', 'ㄏㄢˋ'), '漢');
assert.equal(rules.speechHomophoneFor('盡', 'ㄐㄧㄣˋ'), '進');
assert.equal(rules.speechHomophoneFor('不', 'ㄅㄨˊ'), '轐');
assert.deepEqual(analyze('小花和小星', {
    0: 'ㄒㄧㄠˇ', 1: 'ㄏㄨㄚ', 2: 'ㄏㄢˋ', 3: 'ㄒㄧㄠˇ', 4: 'ㄒㄧㄥ',
}).speechOverrides, { 2: '漢' });
assert.deepEqual(analyze('用盡', { 0: 'ㄩㄥˋ', 1: 'ㄐㄧㄣˋ' }).speechOverrides, { 1: '進' });

const missingCandidate = rules.apply('他行嗎', ['ㄊㄚ', '', '˙ㄇㄚ']);
assert.equal(missingCandidate.reviewItems.some(item => item.char === '行'), true);
const conjunction = analyze('你和我');
assert.equal(conjunction.reviewItems.some(item => item.char === '和'), false);

console.log(`PRONUNCIATION RULE TESTS PASSED: ${rules.VERSION}`);
