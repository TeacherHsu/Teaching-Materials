#!/usr/bin/env node
/**
 * 把 structure_tree 的段落大意由 draft 核准為 approved。
 *
 * 依 tools/dabutie/REWRITE-GUIDE.md，核准是教師的權責，不是改寫作業能自行決定的。
 * 本腳本只在教師明確指示時執行，並把核准者與日期寫進資料，留下可追溯的紀錄。
 *
 *   node scripts/approve-structure-gists.mjs --volume 115AG6H --by CF --on 2026-09-30
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const volume = opt('volume');
const by = opt('by');
const on = opt('on');
if (!volume || !by || !on) { console.error('需要 --volume、--by、--on'); process.exit(1); }

const dir = join(fileURLToPath(new URL('../public/data/', import.meta.url)), volume);
let approved = 0;
let lessons = 0;

function walk(nodes) {
  for (const node of nodes || []) {
    for (const segment of node.segments || []) {
      if (segment.status === 'draft' && segment.gist) {
        segment.status = 'approved';
        segment.approved_by = by;
        segment.approved_on = on;
        approved += 1;
      }
    }
    walk(node.children);
  }
}

for (const filename of readdirSync(dir).filter((n) => /^lesson\d+\.json$/.test(n))) {
  const path = join(dir, filename);
  const lesson = JSON.parse(readFileSync(path, 'utf8'));
  if (!lesson.structure_tree) continue;
  const before = approved;
  walk(lesson.structure_tree.nodes);
  if (approved > before) { writeFileSync(path, `${JSON.stringify(lesson, null, 2)}\n`, 'utf8'); lessons += 1; }
}
console.log(`核准 ${approved} 筆段落大意（${lessons} 課），核准者 ${by}，日期 ${on}。`);
