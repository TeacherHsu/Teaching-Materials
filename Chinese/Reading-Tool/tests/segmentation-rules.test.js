'use strict';

const assert = require('assert');
const rules = require('../segmentation-rules.js');

const wordsFor = (text, ranges) => ranges.map(range => text.slice(range.s, range.e + 1));

assert.strictEqual(rules.VERSION, '1.0.0');

const contextualText = '我們一起向前走。';
const contextualRanges = rules.buildWordRanges(contextualText);
const contextualWords = wordsFor(contextualText, contextualRanges);
assert(contextualWords.includes('我們'), '應辨識「我們」');
assert(contextualWords.includes('一起'), '應辨識「一起」');
assert(!contextualWords.some(word => /[。]/.test(word)), '標點不得成為詞');

const boundedText = '|老師給我們小雲朵卡片|，|大家一起分享|。';
const boundedRanges = rules.buildWordRanges(boundedText);
const firstBoundaryEnd = boundedText.indexOf('|', 1);
assert(boundedRanges.filter(range => range.s > 0 && range.e < firstBoundaryEnd).length > 1, '|...| 內仍須依語境斷詞');
assert(!boundedRanges.some(range => boundedText.slice(range.s, range.e + 1).includes('|')), '詞不得跨越 | 邊界');

const sentenceText = '第一段很長，第二段。\n第三段沒有句號';
assert.deepStrictEqual(
    rules.getSentenceRange(sentenceText, sentenceText.indexOf('一')),
    { s: 0, e: sentenceText.indexOf('，') },
    '中文逗號應結束短句'
);
const secondStart = sentenceText.indexOf('第', 1);
assert.deepStrictEqual(
    rules.getSentenceRange(sentenceText, secondStart),
    { s: secondStart, e: sentenceText.indexOf('。') },
    '中文句號應結束短句'
);
const thirdStart = sentenceText.lastIndexOf('第');
assert.deepStrictEqual(
    rules.getSentenceRange(sentenceText, thirdStart),
    { s: thirdStart, e: sentenceText.length - 1 },
    '無句號段落應在段落結束處停止'
);

const asciiText = '先停,再走.真的嗎?好!';
for (const mark of [',', '.', '?', '!']) {
    assert(rules.isSentenceBreak(mark), `半形 ${mark} 應視為斷句`);
}

const fallbackText = '沒有語境切詞功能';
const fallbackWords = wordsFor(fallbackText, rules.buildWordRanges(fallbackText, { segmenter: null }));
assert.deepStrictEqual(fallbackWords, fallbackText.split(''), '舊瀏覽器不得把整句誤當成一詞');

console.log(`SEGMENTATION RULE TESTS PASSED: ${rules.VERSION}`);
