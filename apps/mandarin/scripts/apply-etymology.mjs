#!/usr/bin/env node
/**
 * 把字源草稿寫進課次資料的 characters[].etymology。
 *
 * 字源內容風險特別高：坊間與網路的說法很多是望文生義的「俗詞源」，
 * 教錯字源比不教更糟（學生會把錯的字形聯想記進去）。因此：
 * - 一律以《說文解字》等可查證來源撰寫，並在 source 欄標明出處
 * - 查不到可靠來源或說法有爭議的字就不寫，該字不會出現「字的故事」按鈕
 * - 全部以 draft 落地，教師核准後才會出現在學生端
 *
 *   node scripts/apply-etymology.mjs --volume 115AG4K --lesson 1 --source <drafts.json>
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const volume = opt('volume');
const lessonNo = opt('lesson');
const source = opt('source');
const dryRun = args.includes('--dry-run');
if (!volume || !lessonNo || !source || !existsSync(source)) {
  console.error('需要 --volume、--lesson、--source <drafts.json>');
  process.exit(1);
}

const drafts = JSON.parse(readFileSync(source, 'utf8'));
const file = join(fileURLToPath(new URL('../public/data/', import.meta.url)), volume, `lesson${String(lessonNo).padStart(2, '0')}.json`);
const lesson = JSON.parse(readFileSync(file, 'utf8'));

let applied = 0;
const missing = [];
for (const c of lesson.characters || []) {
  const draft = drafts[c.char];
  if (!draft) { missing.push(c.char); continue; }
  if (c.etymology && (c.etymology.status === 'approved' || c.etymology.status === 'rejected')) continue;
  c.etymology = {
    structure: draft.structure,
    components: draft.components || [],
    story: draft.story,
    source: draft.source,
    videos: draft.videos || [],
    status: 'draft',
  };
  applied += 1;
}

if (!dryRun) writeFileSync(file, `${JSON.stringify(lesson, null, 2)}\n`, 'utf8');
console.log(`${lesson.lesson_id}：寫入 ${applied} 個字的字源（draft）`);
if (missing.length) console.log(`  無字源（不會出現按鈕）：${missing.join('、')}`);
