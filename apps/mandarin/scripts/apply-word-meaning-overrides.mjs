#!/usr/bin/env node
/**
 * 套用教師核准的「語詞解釋短版」。
 *
 * 官方語詞解釋有些是整段辭典條目（四上「埃及」161 字），語詞卡和複習遊戲讀不完。
 * 短版由教師逐則核准後記在 tools/word-meaning-overrides/<冊別>.json；這支把它寫進課次資料，
 * 原文保留在 meaning_original。可重跑：重新匯入課次後再跑一次就會補回來。
 *
 *   node scripts/apply-word-meaning-overrides.mjs          # 只報告
 *   node scripts/apply-word-meaning-overrides.mjs --write  # 實際改寫
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dataRoot = fileURLToPath(new URL('../public/data/', import.meta.url));
const overrideRoot = fileURLToPath(new URL('../tools/word-meaning-overrides/', import.meta.url));
const write = process.argv.includes('--write');
let changed = 0;
let missing = 0;

for (const name of readdirSync(overrideRoot).filter((f) => f.endsWith('.json'))) {
  const set = JSON.parse(readFileSync(join(overrideRoot, name), 'utf8'));
  const byLesson = new Map();
  for (const item of set.items) byLesson.set(item.lesson, [...(byLesson.get(item.lesson) || []), item]);
  for (const [lessonNo, items] of byLesson) {
    const path = join(dataRoot, set.volume, `lesson${String(lessonNo).padStart(2, '0')}.json`);
    const data = JSON.parse(readFileSync(path, 'utf8'));
    let touched = false;
    for (const item of items) {
      const word = (data.words || []).find((w) => w.word === item.word);
      if (!word) { console.error(`  [找不到語詞] ${set.volume} 第 ${lessonNo} 課 ${item.word}`); missing += 1; continue; }
      if (word.meaning === item.meaning) continue;
      console.log(`  ${set.volume} 第 ${lessonNo} 課 ${item.word}：${[...word.meaning].length} 字 → ${[...item.meaning].length} 字`);
      word.meaning_original = word.meaning_original || word.meaning;
      word.meaning = item.meaning;
      word.meaning_approved_by = set.approved_by;
      word.meaning_approved_on = set.approved_on;
      changed += 1;
      touched = true;
    }
    if (touched && write) writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
  }
}
console.log(`${write ? '已改寫' : '需要改寫'} ${changed} 則語詞解釋；找不到 ${missing} 則。`);
if (missing) process.exit(1);
