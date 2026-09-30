#!/usr/bin/env node
/**
 * 把「課文結構表」判讀結果寫進課次 JSON 的 structure_tree。
 *
 * 來源是 repo 外的判讀檔（見 docs/specs/2026-09-30-structure-map-redesign.md），
 * 預設 ~/mandarin-work/<冊別>/reports/structure-verified.json。
 *
 * 只寫入「結構標籤＋段落分組」——依規格 §3.1，官方段落大意屬出版社文字，
 * 必須走 rewrite-queue 改寫核准後才公開，本腳本一律不寫入原文。
 *
 *   node scripts/apply-structure-tree.mjs --volume 115AG6H [--dry-run]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : null; };
const volume = opt('volume');
const dryRun = args.includes('--dry-run');
if (!volume) { console.error('需要 --volume，例如 --volume 115AG6H'); process.exit(1); }

const source = opt('source') || join(homedir(), 'mandarin-work', volume, 'reports', 'structure-verified.json');
if (!existsSync(source)) { console.error(`找不到判讀檔：${source}`); process.exit(1); }

const dataRoot = fileURLToPath(new URL('../public/data/', import.meta.url));
const verified = JSON.parse(readFileSync(source, 'utf8'));

let written = 0;
for (const entry of verified) {
  const file = join(dataRoot, volume, `lesson${String(entry.lesson).padStart(2, '0')}.json`);
  if (!existsSync(file)) { console.error(`略過：找不到 ${file}`); continue; }
  const lesson = JSON.parse(readFileSync(file, 'utf8'));

  // 官方結構表只有佔位說明、無實質內容的課次不建樹（判讀檔標 excluded）。
  if (entry.excluded) {
    if (lesson.structure_tree) { delete lesson.structure_tree; if (!dryRun) writeFileSync(file, `${JSON.stringify(lesson, null, 2)}\n`, 'utf8'); }
    console.log(`[排除] L${String(entry.lesson).padStart(2, '0')} ${entry.title} — ${entry.exclusion_reason}`);
    continue;
  }

  if (lesson.title !== entry.title) {
    console.error(`中止：L${entry.lesson} 課名不符（資料「${lesson.title}」vs 判讀「${entry.title}」）`);
    process.exit(1);
  }

  lesson.structure_tree = {
    source: entry.source_file,
    verified_on: '2026-09-30',
    task_type: entry.task_type,
    note: entry.note || undefined,
    // 每個段落群組是一個 segment，各自帶一筆大意。
    // gist 一律留空、status 為 todo_rewrite：官方內容敘述須先經
    // rewrite-queue 改寫並由教師核准（規格 §3.1），本腳本不寫入原文。
    nodes: entry.sections.map((section, index) => ({
      order: index + 1,
      label: section.label,
      segments: (section.segments || []).map((segment) => ({
        gist_id: segment.gist_id,
        paragraphs: segment.paragraphs,
        gist: null,
        status: 'todo_rewrite',
      })),
      children: [],
    })),
  };

  if (!dryRun) writeFileSync(file, `${JSON.stringify(lesson, null, 2)}\n`, 'utf8');
  written += 1;
  const groups = entry.sections.reduce((n, s) => n + s.paragraph_groups.length, 0);
  console.log(`${dryRun ? '[dry]' : '[寫入]'} L${String(entry.lesson).padStart(2, '0')} ${entry.title} — ${entry.sections.length} 節點 / ${groups} 段落群組 (${entry.task_type})`);
}
console.log(`\n${dryRun ? '試跑' : '完成'}：${written} 課；來源 ${source}`);
