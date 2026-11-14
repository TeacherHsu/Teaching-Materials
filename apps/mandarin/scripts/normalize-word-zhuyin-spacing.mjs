#!/usr/bin/env node
/**
 * 把「音節連寫」的語詞注音補上空格（ㄊㄞˋㄍㄨㄛˊ → ㄊㄞˋ ㄍㄨㄛˊ）。
 *
 * 康軒四上的語詞注音來源沒有空格，其他各冊都是一個音節一個空格。連寫的注音
 * 在語詞卡上擠成一串，下游工具（朗讀遊戲、複習遊戲）也得各自猜音節界線。
 * 這支只補空格、不改讀音；切出來的音節數和語詞字數對不上就不動，列出來給人看。
 *
 *   node scripts/normalize-word-zhuyin-spacing.mjs          # 只報告
 *   node scripts/normalize-word-zhuyin-spacing.mjs --write  # 實際改寫
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spaceWordZhuyin } from '../src/utils/zhuyin.js';

const dataRoot = fileURLToPath(new URL('../public/data/', import.meta.url));
const write = process.argv.includes('--write');
let changed = 0;
const skipped = [];

for (const volume of readdirSync(dataRoot)) {
  const dir = join(dataRoot, volume);
  if (volume.startsWith('_') || !statSync(dir).isDirectory()) continue;
  for (const name of readdirSync(dir).filter((f) => /^lesson\d+\.json$/.test(f))) {
    const path = join(dir, name);
    const data = JSON.parse(readFileSync(path, 'utf8'));
    let touched = false;
    for (const item of data.words || []) {
      if (typeof item.zhuyin !== 'string') continue;
      const fixed = spaceWordZhuyin(item.word, item.zhuyin);
      if (fixed === null) { skipped.push(`${volume}/${name} ${item.word} ${item.zhuyin}`); continue; }
      if (fixed !== item.zhuyin) {
        console.log(`  ${volume}/${name} ${item.word} ${item.zhuyin} → ${fixed}`);
        item.zhuyin = fixed;
        changed += 1;
        touched = true;
      }
    }
    if (touched && write) writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
  }
}
for (const line of skipped) console.log(`  [略過，音節數和字數對不上] ${line}`);
console.log(`${write ? '已改寫' : '需要改寫'} ${changed} 筆語詞注音；略過 ${skipped.length} 筆。`);
if (!write && changed) console.log('加上 --write 才會寫入。');
