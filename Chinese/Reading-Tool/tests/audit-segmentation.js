'use strict';

const fs = require('fs');
const path = require('path');
const rules = require('../segmentation-rules.js');

const lessonDir = process.argv[2] || path.join(__dirname, '..', 'lessons');
const files = fs.readdirSync(lessonDir).filter(name => name.endsWith('.json')).sort();
const problems = [];
let wordRangeCount = 0;
let sentenceProbeCount = 0;

for (const file of files) {
    const lesson = JSON.parse(fs.readFileSync(path.join(lessonDir, file), 'utf8'));
    const text = String(lesson.text || '');
    const ranges = rules.buildWordRanges(text);
    wordRangeCount += ranges.length;

    ranges.forEach((range, rangeIndex) => {
        const token = text.slice(range.s, range.e + 1);
        if (range.s < 0 || range.e < range.s || range.e >= text.length) {
            problems.push(`${file}: invalid word range ${rangeIndex}`);
        }
        if (Array.from(token).some(rules.isWordSeparator)) {
            problems.push(`${file}: word crosses separator at range ${rangeIndex}: ${JSON.stringify(token)}`);
        }
        if (rangeIndex > 0 && ranges[rangeIndex - 1].e >= range.s) {
            problems.push(`${file}: overlapping word ranges ${rangeIndex - 1}/${rangeIndex}`);
        }
    });

    for (let index = 0; index < text.length; index++) {
        const char = text[index];
        if (!/[\u3400-\u9fff\uf900-\ufaff]/.test(char)) continue;

        const containingWords = ranges.filter(range => index >= range.s && index <= range.e);
        if (containingWords.length !== 1) {
            problems.push(`${file}: character ${index} ${char} belongs to ${containingWords.length} word ranges`);
        }

        const sentence = rules.getSentenceRange(text, index);
        sentenceProbeCount++;
        if (!sentence || index < sentence.s || index > sentence.e) {
            problems.push(`${file}: character ${index} ${char} has invalid sentence range`);
            continue;
        }
        const inside = text.slice(sentence.s, sentence.e);
        if (Array.from(inside).some(rules.isSentenceBreak)) {
            problems.push(`${file}: sentence for character ${index} crosses a break`);
        }
    }
}

if (problems.length) {
    console.error(`SEGMENTATION AUDIT FAILED: ${problems.length}`);
    problems.slice(0, 100).forEach(problem => console.error(problem));
    process.exit(1);
}

console.log(`SEGMENTATION AUDIT PASSED: ${files.length} lessons`);
console.log(`WORD RANGES: ${wordRangeCount}`);
console.log(`SENTENCE PROBES: ${sentenceProbeCount}`);
