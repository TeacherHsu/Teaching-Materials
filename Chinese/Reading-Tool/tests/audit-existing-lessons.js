'use strict';

const fs = require('node:fs');
const path = require('node:path');
const rules = require('../pronunciation-rules.js');

const [lessonsDir, correctionsPath] = process.argv.slice(2);
if (!lessonsDir || !correctionsPath) {
    console.error('usage: node audit-existing-lessons.js <lessons-dir> <corrections.json>');
    process.exit(2);
}

const corrections = JSON.parse(fs.readFileSync(correctionsPath, 'utf8'));
const lessonCache = new Map();
const failures = [];

function lesson(id) {
    if (!lessonCache.has(id)) {
        const data = JSON.parse(fs.readFileSync(path.join(lessonsDir, `${id}.json`), 'utf8'));
        lessonCache.set(id, data);
    }
    return lessonCache.get(id);
}

for (const correction of corrections) {
    const data = lesson(correction.lesson_id);
    const base = Array.from(data.text, (_, index) => data.overrides[String(index)]?.zhuyin || '');
    base[correction.index] = 'ㄘㄨㄛˋ';
    const result = rules.apply(data.text, base);
    if (result.readings[correction.index] !== correction.zhuyin) {
        failures.push({
            lesson_id: correction.lesson_id,
            index: correction.index,
            char: correction.char,
            expected: correction.zhuyin,
            actual: result.readings[correction.index],
            reason: correction.reason,
        });
    }
    const expectedPhoneChar = correction.phoneChar
        ?? rules.speechHomophoneFor(correction.char, correction.zhuyin);
    if (expectedPhoneChar
        && data.overrides[String(correction.index)]?.phoneChar !== expectedPhoneChar) {
        failures.push({
            lesson_id: correction.lesson_id,
            index: correction.index,
            char: correction.char,
            expectedPhoneChar,
            actualPhoneChar: data.overrides[String(correction.index)]?.phoneChar || '',
            reason: correction.reason,
        });
    }
}

if (failures.length) {
    console.error(`EXPERIENCE AUDIT FAILED: ${failures.length}/${corrections.length}`);
    console.error(JSON.stringify(failures.slice(0, 50), null, 2));
    process.exit(1);
}

console.log(`EXPERIENCE AUDIT PASSED: ${corrections.length}/${corrections.length} corrections reproduced`);
console.log(`LESSONS COVERED: ${lessonCache.size}`);
