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
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const volume = opt('volume');
const lessonNo = opt('lesson');
const source = opt('source');
const dryRun = args.includes('--dry-run');
if (!source || !existsSync(source)) {
  console.error('需要 --source <drafts.json>；--volume／--lesson 可省略（省略時套用全站符合的字）');
  process.exit(1);
}

const drafts = JSON.parse(readFileSync(source, 'utf8'));
const dataRoot = fileURLToPath(new URL('../public/data/', import.meta.url));

/** 同一個字可能在多冊出現，一次全部套用；已核准或退回者不覆蓋。 */
function applyToLesson(path) {
  const lesson = JSON.parse(readFileSync(path, 'utf8'));
  let applied = 0;
  for (const c of lesson.characters || []) {
    const draft = drafts[c.char];
    if (!draft) continue;
    if (c.etymology && (c.etymology.status === 'approved' || c.etymology.status === 'rejected')) continue;
    c.etymology = {
      structure: draft.structure,
      components: draft.components || [],
      story: draft.story,
      source: draft.source,
      status: 'draft',
    };
    applied += 1;
  }
  if (applied && !dryRun) writeFileSync(path, `${JSON.stringify(lesson, null, 2)}\n`, 'utf8');
  return applied;
}

const volumes = volume ? [volume] : readdirSync(dataRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory() && /^115AG\d/.test(e.name)).map((e) => e.name);
let total = 0;
const perVolume = {};
for (const v of volumes) {
  perVolume[v] = 0;
  const files = lessonNo
    ? [`lesson${String(lessonNo).padStart(2, '0')}.json`]
    : readdirSync(join(dataRoot, v)).filter((n) => /^lesson\d+\.json$/.test(n));
  for (const f of files) {
    const n = applyToLesson(join(dataRoot, v, f));
    perVolume[v] += n;
    total += n;
  }
}
console.log(`${dryRun ? '試跑' : '完成'}：寫入 ${total} 筆字源（draft）${JSON.stringify(perVolume)}`);
