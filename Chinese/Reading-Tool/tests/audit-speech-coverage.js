'use strict';
// 2026-09-30: 守住「顯示注音正確、念出來卻是別的音」這個長期問題。
// 課文檔把每個字的注音寫死，但語音合成讀的是原字；若某字的注音不是該字的
// 預設讀音，就必須有讀音備註（同音字），否則畫面對、聲音錯。
// 這支稽核在 CI 與交付前跑，確保 lessons/ 沒有新的缺口。

const fs = require('node:fs');
const path = require('node:path');
const rules = require('../pronunciation-rules.js');

const lessonsDir = process.argv[2] || path.join(__dirname, '..', 'lessons');
const missing = [];
const gaps = new Map();
let totalChars = 0;

for (const file of fs.readdirSync(lessonsDir).filter(name => name.endsWith('.json'))) {
    const data = JSON.parse(fs.readFileSync(path.join(lessonsDir, file), 'utf8'));
    for (const [index, entry] of Object.entries(data.overrides || {})) {
        if (!entry || !entry.char || !entry.zhuyin) continue;
        totalChars++;
        const zhuyin = rules.normalizeZhuyin(entry.zhuyin);
        const expected = rules.speechHomophoneFor(entry.char, zhuyin);
        if (expected && (entry.phoneChar || '') !== expected) {
            missing.push(`${file}[${index}] ${entry.char}|${zhuyin} 應有讀音備註「${expected}」，實際為「${entry.phoneChar || '(無)'}」`);
        }
        if (rules.speechHomophoneGapFor(entry.char, zhuyin) && !entry.phoneChar) {
            const key = `${entry.char}|${zhuyin}`;
            gaps.set(key, (gaps.get(key) || 0) + 1);
        }
    }
}

if (missing.length) {
    console.error(`SPEECH COVERAGE AUDIT FAILED: ${missing.length} 處缺少讀音備註`);
    missing.slice(0, 40).forEach(line => console.error('  ' + line));
    if (missing.length > 40) console.error(`  ...另有 ${missing.length - 40} 處`);
    process.exit(1);
}

console.log(`SPEECH COVERAGE AUDIT PASSED: ${totalChars} 字，讀音備註無缺口`);
if (gaps.size) {
    // 這些不是失敗：教育部辭典裡找不到可用的單音同音字，只能交由教師判斷。
    const total = [...gaps.values()].reduce((sum, n) => sum + n, 0);
    console.log(`  註：另有 ${total} 字次無同音字可指定，需教師留意：`);
    [...gaps.entries()].sort((a, b) => b[1] - a[1])
        .forEach(([key, n]) => console.log(`    ${key} x${n}`));
}
