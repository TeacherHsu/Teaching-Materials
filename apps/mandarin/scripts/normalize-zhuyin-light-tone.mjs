#!/usr/bin/env node
/**
 * 把課次資料裡「後置的輕聲符號」搬到音節前面（ㄌㄜ˙ → ˙ㄌㄜ）。
 *
 * 台灣的注音寫法是輕聲符號前置。資料裡混進過後置寫法，學生會在語詞卡上
 * 看到錯的注音。這支是可重跑的修正，不是手改資料。
 *
 *   node scripts/normalize-zhuyin-light-tone.mjs          # 只報告
 *   node scripts/normalize-zhuyin-light-tone.mjs --write  # 實際改寫
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeZhuyin } from '../src/utils/zhuyin.js';

const dataRoot = fileURLToPath(new URL('../public/data/', import.meta.url));
const write = process.argv.includes('--write');
// 注音可能出現在好幾個地方，不是只有 words／characters。
const FIELDS = ['words', 'characters', 'idioms'];
const ZHUYIN_KEYS = ['zhuyin', 'dabutie_zhuyin'];
let changed = 0;
let files = 0;

for (const volume of readdirSync(dataRoot)) {
  const dir = join(dataRoot, volume);
  if (volume.startsWith('_') || !statSync(dir).isDirectory()) continue;
  for (const name of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const path = join(dir, name);
    const data = JSON.parse(readFileSync(path, 'utf8'));
    let touched = false;
    const fix = (item, label) => {
      for (const key of ZHUYIN_KEYS) {
        if (typeof item[key] !== 'string') continue;
        const fixed = normalizeZhuyin(item[key]);
        if (fixed !== item[key]) {
          console.log(`  ${volume}/${name} ${label}.${key} ${item[key]} → ${fixed}`);
          item[key] = fixed;
          changed += 1;
          touched = true;
        }
      }
    };
    for (const field of FIELDS) {
      for (const item of data[field] || []) {
        fix(item, `${field}「${item.word || item.char || item.idiom}」`);
      }
    }
    // 一字多音的每個讀音也要正規化
    for (const entry of data.polyphones || []) {
      for (const reading of entry.readings || []) {
        fix(reading, `polyphones「${entry.char || ''}」`);
      }
    }
    if (touched) {
      files += 1;
      if (write) writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    }
  }
}

console.log(`\n${changed} 筆、${files} 個檔案${write ? '已修正' : '需要修正（加 --write 實際改寫）'}`);
