(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.ReadingSegmentationRules = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const VERSION = '1.0.0';
    const SENTENCE_BREAK_RE = /[，,。.!！？?\r\n]/;
    const RUN_BREAK_RE = /[|\r\n]/;
    const WORD_SEPARATOR_RE = /[|，,。.!！？?、；;：:「」『』（）()［］\[\]【】〈〉《》\s]/;
    const HAN_RE = /[\u3400-\u9fff\uf900-\ufaff]/;

    function isSentenceBreak(char) {
        return typeof char === 'string' && SENTENCE_BREAK_RE.test(char);
    }

    function isWordSeparator(char) {
        return typeof char === 'string' && WORD_SEPARATOR_RE.test(char);
    }

    function createDefaultSegmenter() {
        if (typeof Intl === 'undefined' || typeof Intl.Segmenter !== 'function') return null;
        return new Intl.Segmenter('zh-TW', { granularity: 'word' });
    }

    function addFallbackRanges(chars, start, end, ranges) {
        let latinStart = null;
        const flushLatin = (last) => {
            if (latinStart !== null && last >= latinStart) ranges.push({ s: latinStart, e: last });
            latinStart = null;
        };

        for (let index = start; index <= end; index++) {
            const char = chars[index];
            if (isWordSeparator(char)) {
                flushLatin(index - 1);
            } else if (HAN_RE.test(char)) {
                flushLatin(index - 1);
                // 舊瀏覽器沒有語境斷詞能力時，以單字安全降級，避免把整句誤當成一詞。
                ranges.push({ s: index, e: index });
            } else if (latinStart === null) {
                latinStart = index;
            }
        }
        flushLatin(end);
    }

    function buildWordRanges(inputText, options) {
        const text = String(inputText ?? '');
        const chars = text.split('');
        const ranges = [];
        const suppliedSegmenter = options && Object.prototype.hasOwnProperty.call(options, 'segmenter');
        const segmenter = suppliedSegmenter ? options.segmenter : createDefaultSegmenter();

        const addSegmentedRun = (start, end) => {
            if (end < start) return;
            const run = chars.slice(start, end + 1).join('');

            if (!segmenter || typeof segmenter.segment !== 'function') {
                addFallbackRanges(chars, start, end, ranges);
                return;
            }

            let offset = 0;
            for (const part of segmenter.segment(run)) {
                const partText = String(part.segment ?? '');
                const relativeStart = Number.isInteger(part.index) ? part.index : offset;
                const partStart = start + relativeStart;
                const partEnd = partStart + partText.length - 1;
                if (part.isWordLike && partText && !Array.from(partText).some(isWordSeparator)) {
                    ranges.push({ s: partStart, e: partEnd });
                }
                offset = relativeStart + partText.length;
            }
        };

        let runStart = 0;
        for (let index = 0; index <= chars.length; index++) {
            if (index === chars.length || RUN_BREAK_RE.test(chars[index])) {
                addSegmentedRun(runStart, index - 1);
                runStart = index + 1;
            }
        }

        return ranges;
    }

    function getWordRange(inputText, wordRanges, index) {
        const text = String(inputText ?? '');
        const chars = text.split('');
        if (!Number.isInteger(index) || index < 0 || index >= chars.length || isWordSeparator(chars[index])) return null;
        const hit = (Array.isArray(wordRanges) ? wordRanges : []).find(range => index >= range.s && index <= range.e);
        // 找不到語境詞界時只讀當字，不回退成整段文字。
        return hit ? { s: hit.s, e: hit.e } : { s: index, e: index };
    }

    function getSentenceRange(inputText, index) {
        const text = String(inputText ?? '');
        const chars = text.split('');
        if (!Number.isInteger(index) || index < 0 || index >= chars.length || isSentenceBreak(chars[index])) return null;

        let start = index;
        let end = index;
        while (start > 0 && !isSentenceBreak(chars[start - 1])) start--;
        while (end < chars.length - 1 && !isSentenceBreak(chars[end])) end++;
        return { s: start, e: end };
    }

    return Object.freeze({
        VERSION,
        buildWordRanges,
        getSentenceRange,
        getWordRange,
        isSentenceBreak,
        isWordSeparator,
    });
});
