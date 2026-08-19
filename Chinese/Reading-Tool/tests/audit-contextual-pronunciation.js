'use strict';

const fs = require('fs');
const path = require('path');
const rules = require('../pronunciation-rules.js');

const lessonDir = process.argv[2] || path.join(__dirname, '..', 'lessons');
const files = fs.readdirSync(lessonDir).filter(name => name.endsWith('.json')).sort();
const problems = [];
let targetCount = 0;
let classifierCount = 0;
let yiHuiErCount = 0;
let affectedLessons = 0;

for (const file of files) {
    const fullPath = path.join(lessonDir, file);
    const lesson = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const text = String(lesson.text || '');
    const expected = rules.expectedContextualReadings(text);
    const entries = Object.entries(expected);
    if (entries.length) affectedLessons++;

    for (const [rawIndex, expectedZhuyin] of entries) {
        const index = Number(rawIndex);
        targetCount++;
        if (text[index] === '個') classifierCount++;
        if (text.slice(index, index + 3) === '一會兒') yiHuiErCount++;

        const override = lesson.overrides && lesson.overrides[rawIndex];
        if (!override) {
            problems.push(`${file}:${rawIndex} missing override`);
            continue;
        }
        if (override.char !== text[index]) {
            problems.push(`${file}:${rawIndex} char mismatch ${override.char} != ${text[index]}`);
        }
        if (override.zhuyin !== expectedZhuyin) {
            problems.push(`${file}:${rawIndex} ${text[index]} expected ${expectedZhuyin}, got ${override.zhuyin}`);
        }
    }
}

if (problems.length) {
    console.error(`CONTEXTUAL PRONUNCIATION AUDIT FAILED: ${problems.length}`);
    problems.slice(0, 100).forEach(problem => console.error(problem));
    process.exit(1);
}

console.log(`CONTEXTUAL PRONUNCIATION AUDIT PASSED: ${files.length} lessons`);
console.log(`AFFECTED LESSONS: ${affectedLessons}`);
console.log(`TARGET OVERRIDES: ${targetCount}`);
console.log(`CLASSIFIER 個: ${classifierCount}`);
console.log(`一會兒 OCCURRENCES: ${yiHuiErCount}`);
