#!/usr/bin/env node
/**
 * 把新編的語詞例句寫進課次資料（tools/word-example-drafts/<冊別>.json）。
 *
 * 語詞例句是新編內容，要教師審過才能給學生看：清單的 status 是 draft 時，
 * 例句以 example_status=draft 寫入（只有預覽模式看得到）；CF 核准後把清單的
 * status 改成 approved、補上 approved_by／approved_on 再跑一次，才會正式顯示。
 * 已經是 approved 的既有例句不會被草稿蓋掉。句子不含該語詞就停下來。
 *
 *   node scripts/apply-word-example-drafts.mjs          # 只報告
 *   node scripts/apply-word-example-drafts.mjs --write  # 實際改寫
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dataRoot = fileURLToPath(new URL('../public/data/', import.meta.url));
const draftRoot = fileURLToPath(new URL('../tools/word-example-drafts/', import.meta.url));
const write = process.argv.includes('--write');
let changed = 0;
let problems = 0;

for (const name of readdirSync(draftRoot).filter((f) => f.endsWith('.json'))) {
  const set = JSON.parse(readFileSync(join(draftRoot, name), 'utf8'));
  const status = set.status === 'approved' ? 'approved' : 'draft';
  const files = new Map();
  for (const item of set.items) {
    const path = join(dataRoot, set.volume, `lesson${String(item.lesson).padStart(2, '0')}.json`);
    if (!files.has(path)) files.set(path, { data: JSON.parse(readFileSync(path, 'utf8')), touched: false });
    const file = files.get(path);
    const word = (file.data.words || []).find((w) => w.word === item.word);
    const label = `${set.volume} 第 ${item.lesson} 課「${item.word}」`;
    if (!word) { console.error(`  [找不到語詞] ${label}`); problems += 1; continue; }
    if (!item.example.includes(item.word)) { console.error(`  [例句不含語詞] ${label}：${item.example}`); problems += 1; continue; }
    if (word.example_status === 'approved' && status !== 'approved') continue;
    if (word.example_sentence === item.example && word.example_status === status) continue;
    word.example_sentence = item.example;
    word.example_status = status;
    word.example_source = `original:${status}（${set.drafted_by}，${set.drafted_on}）`;
    if (status === 'approved') { word.example_approved_by = set.approved_by; word.example_approved_on = set.approved_on; }
    file.touched = true;
    changed += 1;
  }
  if (write) for (const [path, file] of files) if (file.touched) writeFileSync(path, `${JSON.stringify(file.data, null, 2)}\n`);
  console.log(`  ${set.volume}：${set.items.length} 則（${status}）`);
}
console.log(`${write ? '已改寫' : '需要改寫'} ${changed} 則例句；有問題 ${problems} 則。`);
if (problems) process.exit(1);
