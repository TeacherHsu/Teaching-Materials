'use strict';

const fs = require('node:fs');
const path = require('node:path');
const rules = require('../pronunciation-rules.js');

const lessonsDir = process.argv[2];
if (!lessonsDir) {
    console.error('usage: node audit-high-risk.js <lessons-dir>');
    process.exit(2);
}

const findings = [];
for (const name of fs.readdirSync(lessonsDir).filter(name => name.endsWith('.json')).sort()) {
    const lesson = JSON.parse(fs.readFileSync(path.join(lessonsDir, name), 'utf8'));
    const base = Array.from(lesson.text, (_, index) => lesson.overrides[String(index)]?.zhuyin || '');
    const result = rules.apply(lesson.text, base);
    result.reviewItems.forEach(item => findings.push({ lesson_id: lesson.lesson_id, ...item }));
}

const byChar = {};
findings.forEach(item => { byChar[item.char] = (byChar[item.char] || 0) + 1; });
console.log(`HIGH-RISK REVIEW ITEMS: ${findings.length}`);
console.log(JSON.stringify(byChar, null, 2));
console.log(JSON.stringify(findings.slice(0, 100), null, 2));
