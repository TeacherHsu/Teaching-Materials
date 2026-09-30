#!/usr/bin/env node
/**
 * 把字源由 draft 核准為 approved（教師權責，本腳本只在教師明確指示時執行）。
 *   node scripts/approve-etymology.mjs --volume 115AG4K --by CF --on 2026-10-01
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const by = opt('by'); const on = opt('on'); const only = opt('volume');
if (!by || !on) { console.error('需要 --by 與 --on'); process.exit(1); }

const root = fileURLToPath(new URL('../public/data/', import.meta.url));
let approved = 0;
for (const volume of readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory() && /^115AG\d/.test(e.name))) {
  if (only && volume.name !== only) continue;
  for (const filename of readdirSync(join(root, volume.name)).filter((n) => /^lesson\d+\.json$/.test(n))) {
    const path = join(root, volume.name, filename);
    const lesson = JSON.parse(readFileSync(path, 'utf8'));
    let touched = false;
    for (const c of lesson.characters || []) {
      const e = c.etymology;
      if (e && e.status === 'draft' && e.story) {
        e.status = 'approved'; e.approved_by = by; e.approved_on = on; approved += 1; touched = true;
      }
    }
    if (touched) writeFileSync(path, `${JSON.stringify(lesson, null, 2)}\n`, 'utf8');
  }
}
console.log(`核准 ${approved} 個字的字源，核准者 ${by}，日期 ${on}。`);
