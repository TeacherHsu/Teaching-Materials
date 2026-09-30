#!/usr/bin/env node
/**
 * 把「漢字說故事」動畫對照表寫進 characters[].videos。
 *
 * 只寫**整個字**的影片（CF 指定先不處理部首，這樣對應關係單純、不會張冠李戴）：
 * 影片標題的字與生字完全相同才配對。來源頻道為中華語文知識庫（CF 指定可信任）。
 *
 *   node scripts/apply-character-videos.mjs --source <map.json> [--dry-run]
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const source = opt('source');
const dryRun = args.includes('--dry-run');
if (!source || !existsSync(source)) { console.error('需要 --source <map.json>'); process.exit(1); }

const map = JSON.parse(readFileSync(source, 'utf8'));
const dataRoot = fileURLToPath(new URL('../public/data/', import.meta.url));
let applied = 0;
const perVolume = {};

for (const volume of readdirSync(dataRoot, { withFileTypes: true }).filter((e) => e.isDirectory() && /^115AG\d/.test(e.name))) {
  perVolume[volume.name] = 0;
  for (const filename of readdirSync(join(dataRoot, volume.name)).filter((n) => /^lesson\d+\.json$/.test(n))) {
    const path = join(dataRoot, volume.name, filename);
    const lesson = JSON.parse(readFileSync(path, 'utf8'));
    let touched = false;
    for (const c of lesson.characters || []) {
      const hit = map[c.char];
      if (!hit) continue;
      const entry = {
        title: hit.title,
        url: `https://www.youtube.com/watch?v=${hit.id}`,
        source: '中華語文知識庫',
      };
      const existing = (c.videos || []).filter((v) => v.url !== entry.url);
      c.videos = [...existing, entry];
      applied += 1;
      perVolume[volume.name] += 1;
      touched = true;
    }
    if (touched && !dryRun) writeFileSync(path, `${JSON.stringify(lesson, null, 2)}\n`, 'utf8');
  }
}
console.log(`${dryRun ? '試跑' : '完成'}：${applied} 個生字配到影片 ${JSON.stringify(perVolume)}`);
