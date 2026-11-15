#!/usr/bin/env node
/**
 * 套用教師核准的「語詞解釋短版」。
 *
 * 官方語詞解釋有些是整段辭典條目（四上「埃及」161 字），語詞卡和複習遊戲讀不完。
 * 短版由教師逐則核准後記在 tools/word-meaning-overrides/<冊別>.json（語詞 items、成語 idioms）；這支把它寫進課次資料，
 * 原文保留在 meaning_original。可重跑：重新匯入課次後再跑一次就會補回來。
 *
 * 另有一條全冊通則（CF 2026-11-15 裁定）：分 ⑴⑵ 多義的解釋一律只留第 ⑴ 義。
 * 核准清單裡有的語詞以清單為準，通則只處理清單沒列到的。
 *
 *   node scripts/apply-word-meaning-overrides.mjs          # 只報告
 *   node scripts/apply-word-meaning-overrides.mjs --write  # 實際改寫
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
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
  // 成語解釋短版（同一份清單的 idioms）：寫進 definition，原文留在 definition_original
  for (const item of set.idioms || []) {
    const path = join(dataRoot, set.volume, `lesson${String(item.lesson).padStart(2, '0')}.json`);
    const data = JSON.parse(readFileSync(path, 'utf8'));
    const idiom = (data.idioms || []).find((entry) => entry.idiom === item.idiom);
    if (!idiom) { console.error(`  [找不到成語] ${set.volume} 第 ${item.lesson} 課 ${item.idiom}`); missing += 1; continue; }
    if (idiom.definition === item.definition) continue;
    console.log(`  ${set.volume} 第 ${item.lesson} 課 ${item.idiom}：${[...idiom.definition].length} 字 → ${[...item.definition].length} 字`);
    idiom.definition_original = idiom.definition_original || idiom.definition;
    idiom.definition = item.definition;
    idiom.definition_approved_by = set.approved_by;
    idiom.definition_approved_on = set.idioms_approved_on || set.approved_on;
    changed += 1;
    if (write) writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
  }
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
      word.meaning_approved_on = item.approved_on || set.approved_on;
      changed += 1;
      touched = true;
    }
    if (touched && write) writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
  }
}
// 通則：多義解釋只留第 ⑴ 義
const firstSense = (meaning) => {
  const m = /^⑴([^⑵]+)⑵/u.exec(String(meaning || ''));
  return m ? m[1].trim() : null;
};
for (const volume of readdirSync(dataRoot)) {
  const dir = join(dataRoot, volume);
  if (volume.startsWith('_') || !statSync(dir).isDirectory()) continue;
  for (const name of readdirSync(dir).filter((f) => /^lesson\d+\.json$/.test(f))) {
    const path = join(dir, name);
    const data = JSON.parse(readFileSync(path, 'utf8'));
    let touched = false;
    for (const word of data.words || []) {
      const short = firstSense(word.meaning);
      if (!short) continue;
      console.log(`  ${volume}/${name} ${word.word}：只留第一義「${short}」`);
      word.meaning_original = word.meaning_original || word.meaning;
      word.meaning = short;
      word.meaning_approved_by = 'CF';
      word.meaning_approved_on = '2026-11-15';
      changed += 1;
      touched = true;
    }
    if (touched && write) writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
  }
}
console.log(`${write ? '已改寫' : '需要改寫'} ${changed} 則語詞解釋；找不到 ${missing} 則。`);
if (missing) process.exit(1);
