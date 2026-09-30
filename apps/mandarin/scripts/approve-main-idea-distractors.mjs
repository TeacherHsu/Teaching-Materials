#!/usr/bin/env node
/**
 * 把「抓重點」的誘答由 draft 核准為 approved。
 *
 * 核准是教師的權責（tools/dabutie/REWRITE-GUIDE.md），本腳本只在教師明確指示
 * 時執行，並把核准者與日期寫進資料，留下可追溯的紀錄。
 *
 *   node scripts/approve-main-idea-distractors.mjs --by CF --on 2026-09-30
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const by = opt('by');
const on = opt('on');
const only = opt('volume');
if (!by || !on) { console.error('需要 --by 與 --on'); process.exit(1); }

const root = fileURLToPath(new URL('../public/data/', import.meta.url));
let approved = 0;
let lessons = 0;
for (const volume of readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory() && /^115AG\d/.test(e.name))) {
  if (only && volume.name !== only) continue;
  for (const filename of readdirSync(join(root, volume.name)).filter((n) => /^lesson\d+\.json$/.test(n))) {
    const path = join(root, volume.name, filename);
    const lesson = JSON.parse(readFileSync(path, 'utf8'));
    let touched = false;
    for (const d of (lesson.main_idea || {}).distractors || []) {
      if (d.status === 'draft' && d.text) {
        d.status = 'approved';
        d.approved_by = by;
        d.approved_on = on;
        approved += 1;
        touched = true;
      }
    }
    if (touched) { writeFileSync(path, `${JSON.stringify(lesson, null, 2)}\n`, 'utf8'); lessons += 1; }
  }
}
console.log(`核准 ${approved} 筆誘答（${lessons} 課），核准者 ${by}，日期 ${on}。`);
