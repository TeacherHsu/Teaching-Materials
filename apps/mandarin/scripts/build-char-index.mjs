#!/usr/bin/env node
/**
 * 產生 public/data/char-index.json：注音打字「選字」階段的候選字來源。
 *
 * 內容是本站自己的語料統計（五冊的生字與語詞用字），不引入外部字表——
 * 這樣候選的干擾字一定是學生看過或將要學到的字，不會冒出沒學過的生字。
 *
 *   node scripts/build-char-index.mjs
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitSyllables, syllablesMatchWord } from '../src/utils/zhuyin.js';

const dataRoot = fileURLToPath(new URL('../public/data/', import.meta.url));
const freq = new Map();
const readings = new Map();   // char -> Set(注音)

function bump(char) {
  if (!char || !/[一-鿿]/.test(char)) return;
  freq.set(char, (freq.get(char) || 0) + 1);
}

function addReading(char, zhuyin) {
  if (!char || !zhuyin) return;
  if (!readings.has(char)) readings.set(char, new Set());
  readings.get(char).add(zhuyin);
}

for (const volume of readdirSync(dataRoot, { withFileTypes: true }).filter((e) => e.isDirectory() && /^115AG\d/.test(e.name))) {
  for (const filename of readdirSync(join(dataRoot, volume.name)).filter((n) => /^lesson\d+\.json$/.test(n))) {
    const lesson = JSON.parse(readFileSync(join(dataRoot, volume.name, filename), 'utf8'));
    for (const c of lesson.characters || []) {
      bump(c.char);
      addReading(c.char, c.zhuyin);
    }
    for (const w of lesson.words || []) {
      for (const ch of String(w.word || '')) bump(ch);
      if (w.zhuyin && syllablesMatchWord(w.word, w.zhuyin)) {
        const syllables = splitSyllables(w.zhuyin);
        [...String(w.word)].forEach((ch, i) => addReading(ch, syllables[i]));
      }
    }
  }
}

mkdirSync(join(dataRoot, '_index'), { recursive: true });

const chars = {};
for (const [char, count] of [...freq.entries()].sort((a, b) => b[1] - a[1])) {
  const zhuyin = [...(readings.get(char) || [])].filter(Boolean);
  if (zhuyin.length === 0) continue;   // 沒有讀音的字不能當同音干擾項
  chars[char] = { f: count, z: zhuyin };
}

const out = { generatedFrom: '115AG1H/2H/3H/4K/6H 的生字與語詞', count: Object.keys(chars).length, chars };
writeFileSync(join(dataRoot, '_index', 'char-index.json'), `${JSON.stringify(out)}\n`, 'utf8');
console.log(`char-index.json：${out.count} 個字（含讀音）`);
