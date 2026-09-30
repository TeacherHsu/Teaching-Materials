#!/usr/bin/env node
/**
 * 把教育百科抓到的語詞注音寫進課次資料。
 *
 * 多讀音的消歧判準：**用該課已核准的生字注音**。
 * 生字的 zhuyin 已逐字對過教育百科並經教師確認，是站內最可靠的依據；
 * 例如「牠」在三上生字表是 ㄊㄚ，辭典另給的 ㄊㄨㄛ 就不該採用。
 * 消歧不了的（生字表沒有該字、或候選都相符）一律留空，交給教師，
 * 不猜——讀音以教師裁定優先。
 *
 *   node scripts/apply-word-zhuyin.mjs --volume 115AG3H [--dry-run]
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { splitSyllables, syllablesMatchWord } from '../src/utils/zhuyin.js';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const volume = opt('volume');
const dryRun = args.includes('--dry-run');
if (!volume) { console.error('需要 --volume'); process.exit(1); }

const fetched = join(homedir(), 'mandarin-work', volume, 'reports', 'word-zhuyin-fetched.json');
if (!existsSync(fetched)) { console.error(`找不到抓取結果：${fetched}`); process.exit(1); }
const results = new Map(JSON.parse(readFileSync(fetched, 'utf8')).map((r) => [r.id, r]));

const dataRoot = fileURLToPath(new URL('../public/data/', import.meta.url));
const stats = { applied: 0, disambiguated: 0, leftBlank: 0, notFound: 0 };
const leftovers = [];

for (const filename of readdirSync(join(dataRoot, volume)).filter((n) => /^lesson\d+\.json$/.test(n))) {
  const path = join(dataRoot, volume, filename);
  const lesson = JSON.parse(readFileSync(path, 'utf8'));
  const charReadings = new Map((lesson.characters || []).filter((c) => c.zhuyin).map((c) => [c.char, c.zhuyin]));
  let touched = false;

  for (const w of lesson.words || []) {
    if (w.zhuyin) continue;
    const found = results.get(w.id);
    if (!found) continue;
    let readings = found.readings || [];

    if (readings.length === 0) { stats.notFound += 1; leftovers.push([lesson.lesson_id, w.word, '查不到']); continue; }

    if (readings.length > 1) {
      // 用該課生字的已核准讀音挑出一致的那個
      const consistent = readings.filter((r) => {
        const syllables = splitSyllables(r);
        return [...w.word].every((ch, i) => !charReadings.has(ch) || charReadings.get(ch) === syllables[i]);
      });
      if (consistent.length === 1) { readings = consistent; stats.disambiguated += 1; }
      else {
        stats.leftBlank += 1;
        leftovers.push([lesson.lesson_id, w.word, `多讀音待裁定：${readings.join(' ／ ')}`]);
        continue;
      }
    }

    const zhuyin = readings[0];
    if (!syllablesMatchWord(w.word, zhuyin)) {
      stats.leftBlank += 1;
      leftovers.push([lesson.lesson_id, w.word, `音節數對不上：${zhuyin}`]);
      continue;
    }
    w.zhuyin = zhuyin;
    w.zhuyin_source = found.url;
    stats.applied += 1;
    touched = true;
  }
  if (touched && !dryRun) writeFileSync(path, `${JSON.stringify(lesson, null, 2)}\n`, 'utf8');
}

console.log(`${volume}：寫入 ${stats.applied} 筆（其中 ${stats.disambiguated} 筆靠生字讀音消歧）`);
console.log(`  待教師裁定 ${stats.leftBlank} 筆、查不到 ${stats.notFound} 筆`);
if (leftovers.length) {
  console.log('  ' + leftovers.slice(0, 6).map((l) => `${l[1]}（${l[2]}）`).join('、') + (leftovers.length > 6 ? ' …' : ''));
}
