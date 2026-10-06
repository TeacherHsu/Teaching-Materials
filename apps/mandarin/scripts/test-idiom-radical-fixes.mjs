// 2026-10-06 CF 回報的兩個問題：成語重複字要留兩格；部首題用字的部件當選項
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { installFakeDom } from './fake-dom.mjs';
installFakeDom();
const { buildIdiomBuilderActivity } = await import('../src/components/IdiomBuilder.js');
const { componentRadicalOptions } = await import('../src/activities/characters.js');
const lesson = JSON.parse(fs.readFileSync(new URL('../public/data/115AG6H/lesson06.json', import.meta.url)));
const seen = new Set();
for (let k = 0; k < 80; k++) {
  buildIdiomBuilderActivity(lesson, () => {}).findAll((n) => n.hasClass?.('idiom-builder__idiom-line'))
    .forEach((l) => seen.add(l.textContent.replace(/\s+/g, '')));
}
assert.ok(seen.has('成語：＿＿而談'), `侃侃而談要呈現＿＿而談，實際：${[...seen].join('、')}`);
assert.ok(seen.has('成語：扭扭＿＿'), '扭扭捏捏要呈現扭扭＿＿');
for (const line of seen) assert.equal([...line.replace('成語：', '')].length, 4, `成語要四個字（含空格）：${line}`);
const parts = JSON.parse(fs.readFileSync(new URL('../public/data/_index/hanzi/115AG6H.json', import.meta.url)));
const r = componentRadicalOptions({ char: '初', radical: '衣' }, parts);
assert.deepEqual(r.options.map((o) => o.label).sort(), ['刀', '衤（衣）'].sort());
assert.equal(r.answerId, 'part:衤');
console.log('✅ 成語重複字兩格；部首題用部件當選項');
