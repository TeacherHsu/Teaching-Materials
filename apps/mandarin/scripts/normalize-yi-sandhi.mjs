#!/usr/bin/env node
/**
 * 把語詞注音裡的「一」統一成語流變調標注（一般 ㄧˋ ㄅㄢ、一瞬間 ㄧˊ ㄕㄨㄣˋ ㄐㄧㄢ）。
 *
 * 辭典（簡編本）給的是本調，各冊來源有的標變調、有的標本調，同一冊裡也不一致。
 * 規則依 sped-os ADR-0028（CF 裁定：四聲前 ㄧˊ、一二三聲前 ㄧˋ，序數與詞尾維持本調），
 * 實作在 src/utils/zhuyin.js 的 applyYiSandhi。個別語詞要維持本調時，
 * 加進 tools/word-zhuyin-exceptions.json 的 yi_base_tone。
 *
 *   node scripts/normalize-yi-sandhi.mjs          # 只報告
 *   node scripts/normalize-yi-sandhi.mjs --write  # 實際改寫
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyYiSandhi } from '../src/utils/zhuyin.js';

const dataRoot = fileURLToPath(new URL('../public/data/', import.meta.url));
const exceptions = new Set(JSON.parse(readFileSync(new URL('../tools/word-zhuyin-exceptions.json', import.meta.url), 'utf8')).yi_base_tone);
const write = process.argv.includes('--write');
let changed = 0;

for (const volume of readdirSync(dataRoot)) {
  const dir = join(dataRoot, volume);
  if (volume.startsWith('_') || !statSync(dir).isDirectory()) continue;
  for (const name of readdirSync(dir).filter((f) => /^lesson\d+\.json$/.test(f))) {
    const path = join(dir, name);
    const data = JSON.parse(readFileSync(path, 'utf8'));
    let touched = false;
    for (const item of data.words || []) {
      if (typeof item.zhuyin !== 'string' || exceptions.has(item.word)) continue;
      const fixed = applyYiSandhi(item.word, item.zhuyin);
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
console.log(`${write ? '已改寫' : '需要改寫'} ${changed} 筆「一」的變調。`);
if (!write && changed) console.log('加上 --write 才會寫入。');
