'use strict';

const fs = require('node:fs');
const path = require('node:path');
const rules = require('../pronunciation-rules.js');

const [lessonsDir, correctionsPath] = process.argv.slice(2);
if (!lessonsDir) {
    console.error('usage: node apply-tts-homophones.js <lessons-dir> [corrections.json]');
    process.exit(2);
}

let lessonChanges = 0;
let correctionChanges = 0;

for (const file of fs.readdirSync(lessonsDir).filter(name => name.endsWith('.json')).sort()) {
    const fullPath = path.join(lessonsDir, file);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(raw);
    const newline = raw.includes('\r\n') ? '\r\n' : '\n';
    const targets = [];
    for (const [index, override] of Object.entries(data.overrides || {})) {
        const expected = rules.speechHomophoneFor(override.char, override.zhuyin);
        if (expected && override.phoneChar !== expected) targets.push({ index, override, expected });
    }
    let output = raw;
    for (const { index, override, expected } of targets) {
        const escapedIndex = index.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const blockPattern = new RegExp(`    "${escapedIndex}": \\{[\\s\\S]*?${newline}    \\}`);
        const replacement = [
            `    "${index}": {`,
            `      "char": ${JSON.stringify(override.char)},`,
            `      "zhuyin": ${JSON.stringify(override.zhuyin)},`,
            `      "phoneChar": ${JSON.stringify(expected)}`,
            `    }`,
        ].join(newline);
        if (!blockPattern.test(output)) throw new Error(`override block not found: ${file}[${index}]`);
        output = output.replace(blockPattern, replacement);
        lessonChanges++;
    }
    if (output !== raw) fs.writeFileSync(fullPath, output, 'utf8');
}

if (correctionsPath) {
    const corrections = JSON.parse(fs.readFileSync(correctionsPath, 'utf8'));
    for (const correction of corrections) {
        const expected = rules.speechHomophoneFor(correction.char, correction.zhuyin);
        if (!expected || correction.phoneChar === expected) continue;
        correction.phoneChar = expected;
        correctionChanges++;
    }
    fs.writeFileSync(correctionsPath, `${JSON.stringify(corrections, null, 2)}\n`, 'utf8');
}

console.log(`UPDATED LESSON TTS FIELDS: ${lessonChanges}`);
if (correctionsPath) console.log(`UPDATED CORRECTION TTS FIELDS: ${correctionChanges}`);
