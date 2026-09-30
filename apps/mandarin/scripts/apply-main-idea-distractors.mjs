#!/usr/bin/env node
/**
 * 把「抓重點」的誘答草稿寫進課次 JSON 的 main_idea.distractors。
 *
 * 誘答是新撰寫的內容（非出版社文字），仍比照 REWRITE-GUIDE.md 以 draft 落地，
 * 待教師核准後才會出現在學生端。
 *
 *   node scripts/apply-main-idea-distractors.mjs --source <drafts.json> [--dry-run]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const dryRun = args.includes('--dry-run');
const source = opt('source');
if (!source || !existsSync(source)) { console.error('需要 --source <drafts.json>'); process.exit(1); }

const drafts = JSON.parse(readFileSync(source, 'utf8'));
const dataRoot = fileURLToPath(new URL('../public/data/', import.meta.url));

let written = 0;
for (const [volume, lessons] of Object.entries(drafts)) {
  for (const [lessonNo, pair] of Object.entries(lessons)) {
    const file = join(dataRoot, volume, `lesson${String(lessonNo).padStart(2, '0')}.json`);
    if (!existsSync(file)) { console.error(`略過：找不到 ${file}`); continue; }
    const lesson = JSON.parse(readFileSync(file, 'utf8'));
    const mainIdea = lesson.main_idea;
    if (!mainIdea || !mainIdea.gist) { console.error(`略過：${lesson.lesson_id} 沒有主旨`); continue; }

    const [vague, offtopic] = pair;
    for (const text of [vague, offtopic]) {
      if (!text || text === mainIdea.gist) {
        console.error(`中止：${lesson.lesson_id} 誘答不可為空或與正解相同`);
        process.exit(1);
      }
    }

    // 已核准的誘答不覆蓋（比照 apply_rewrites.py 的慣例）。
    const existing = new Map((mainIdea.distractors || []).map((d) => [d.type, d]));
    const next = [
      { type: 'vague', text: vague },
      { type: 'offtopic', text: offtopic },
    ].map(({ type, text }) => {
      const prev = existing.get(type);
      if (prev && (prev.status === 'approved' || prev.status === 'rejected')) return prev;
      return { id: `main_idea_distractor:${lesson.lesson_id}:${type}`, type, text, status: 'draft' };
    });

    mainIdea.distractors = next;
    if (!dryRun) writeFileSync(file, `${JSON.stringify(lesson, null, 2)}\n`, 'utf8');
    written += 1;
  }
}
console.log(`${dryRun ? '試跑' : '完成'}：${written} 課寫入誘答（每課 2 筆，status=draft）`);
