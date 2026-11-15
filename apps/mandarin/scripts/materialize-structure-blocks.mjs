#!/usr/bin/env node
/**
 * 產生「例句拆積木」的題目資料（sentence_patterns[].structure_blocks）。
 *
 * 練習句子第一頁原本是「句型標題 ↔ 說明文字」配對，考的是讀說明，不是語句結構
 * （CF 2026-11-15）。改成把核准例句的語塊放進句型的格子。語塊界線由
 * src/utils/structureBlocks.js 從結構字串和例句算出來，但自動對位會有切歪的，
 * 所以不在瀏覽器裡現算：這支把結果寫進資料，切歪的列在
 * tools/structure-blocks-review.json 排除。重新匯入課次後重跑即可。
 *
 *   node scripts/materialize-structure-blocks.mjs          # 只報告
 *   node scripts/materialize-structure-blocks.mjs --write  # 實際改寫
 *   node scripts/materialize-structure-blocks.mjs --table  # 印出檢查用對照表（markdown）
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { alignPattern, frameText } from '../src/utils/structureBlocks.js';

const dataRoot = fileURLToPath(new URL('../public/data/', import.meta.url));
const review = JSON.parse(readFileSync(new URL('../tools/structure-blocks-review.json', import.meta.url), 'utf8'));
const write = process.argv.includes('--write');
const table = process.argv.includes('--table');
const usedRules = new Set();
const excluded = (volume, lessonNo, patternId, index) => review.exclude.some((rule) => {
  const [v, l, suffix, i] = rule.split('|');
  const hit = v === volume && Number(l) === lessonNo && patternId.endsWith(`:${suffix}`) && (i === undefined || Number(i) === index);
  if (hit) usedRules.add(rule);
  return hit;
});

let total = 0;
let lessonsWith = 0;
let lessons = 0;
const rows = [];
for (const volume of readdirSync(dataRoot)) {
  const dir = join(dataRoot, volume);
  if (volume.startsWith('_') || !statSync(dir).isDirectory()) continue;
  for (const name of readdirSync(dir).filter((f) => /^lesson\d+\.json$/.test(f)).sort()) {
    const path = join(dir, name);
    const data = JSON.parse(readFileSync(path, 'utf8'));
    const before = JSON.stringify(data);
    let count = 0;
    for (const pattern of data.sentence_patterns || []) {
      const usable = ['ready', 'approved'].includes(pattern.status) && pattern.examples_status === 'approved';
      const blocks = usable
        ? alignPattern(pattern).filter((b) => !excluded(volume, data.lesson_no, pattern.id, b.example_index))
          .map((b) => ({ example_index: b.example_index, frame: b.frame }))
        : [];
      if (blocks.length) {
        pattern.structure_blocks = blocks;
        count += blocks.length;
        for (const b of blocks) {
          rows.push(`| ${volume} | ${data.lesson_no} | ${frameText(b.frame)} | ${pattern.examples[b.example_index]} | ${b.frame.filter((t) => t.type === 'slot').map((t) => `${t.label}＝${t.text}`).join('；')} |`);
        }
      } else delete pattern.structure_blocks;
    }
    lessons += 1;
    if (count) lessonsWith += 1;
    total += count;
    if (write && JSON.stringify(data) !== before) writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
  }
}
if (table) {
  console.log('| 冊 | 課 | 句型框架 | 例句 | 格子＝語塊 |\n|---|---|---|---|---|');
  console.log(rows.join('\n'));
} else {
  const unused = review.exclude.filter((rule) => !usedRules.has(rule));
  for (const rule of unused) console.error(`  [排除規則沒有對到任何題目] ${rule}`);
  console.log(`${write ? '已寫入' : '可產生'} ${total} 題拆積木；${lessonsWith}／${lessons} 課有題目。`);
  if (unused.length) process.exit(1);
}
