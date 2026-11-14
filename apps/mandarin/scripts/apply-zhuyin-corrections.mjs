#!/usr/bin/env node
/**
 * 套用教師核准的生字／語詞讀音更正（tools/zhuyin-corrections.json）。
 *
 * 各冊來源的讀音有一批不是臺灣讀法（暫 ㄗㄢˋ、熟 ㄕㄨˊ、垃圾 ㄌㄚ ㄐㄧ），
 * CF 2026-11-15 裁定依教育部《國語辭典簡編本》更正。每筆都記 from／to：
 * 現值等於 from 才改，已經是 to 就略過，兩者都不是就停下來給人看（代表來源又變了）。
 * 可重跑：重新匯入課次後再跑一次就會補回來。
 *
 *   node scripts/apply-zhuyin-corrections.mjs          # 只報告
 *   node scripts/apply-zhuyin-corrections.mjs --write  # 實際改寫
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dataRoot = fileURLToPath(new URL('../public/data/', import.meta.url));
const set = JSON.parse(readFileSync(new URL('../tools/zhuyin-corrections.json', import.meta.url), 'utf8'));
const write = process.argv.includes('--write');
const files = new Map();
const load = (volume, lesson) => {
  const path = join(dataRoot, volume, `lesson${String(lesson).padStart(2, '0')}.json`);
  if (!files.has(path)) files.set(path, { data: JSON.parse(readFileSync(path, 'utf8')), touched: false });
  return files.get(path);
};
let changed = 0;
let problems = 0;

const fix = (kind, list, key, item) => {
  const file = load(item.volume, item.lesson);
  const target = (file.data[list] || []).find((entry) => entry[key] === item[key]);
  const label = `${item.volume} 第 ${item.lesson} 課 ${kind}「${item[key]}」`;
  if (!target) { console.error(`  [找不到] ${label}`); problems += 1; return; }
  if (target.zhuyin === item.to) return;
  if (target.zhuyin !== item.from) {
    console.error(`  [現值不符] ${label} 現在是 ${target.zhuyin}，清單記的是 ${item.from} → ${item.to}`);
    problems += 1;
    return;
  }
  console.log(`  ${label} ${item.from} → ${item.to}`);
  target.zhuyin = item.to;
  file.touched = true;
  changed += 1;
};

for (const item of set.characters) fix('生字', 'characters', 'char', item);
for (const item of set.words) fix('語詞', 'words', 'word', item);
if (write) for (const [path, file] of files) if (file.touched) writeFileSync(path, `${JSON.stringify(file.data, null, 2)}\n`);
console.log(`${write ? '已改寫' : '需要改寫'} ${changed} 筆讀音；有問題 ${problems} 筆。`);
if (problems) process.exit(1);
