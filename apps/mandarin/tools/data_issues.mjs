#!/usr/bin/env node
// 全站列出標注時發現的「資料疑義」題目（reading_questions[].data_issue）。
// 待審頁一次只看一課，這支是給教師／開發者一次看完全站用的。
// 疑義一律人工裁定，所以這支只報告，不改任何檔案。
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = new URL('../public/data/', import.meta.url).pathname;

function* lessonFiles() {
  for (const dir of readdirSync(DATA_DIR).sort()) {
    if (dir.startsWith('_')) continue;
    let entries;
    try {
      entries = readdirSync(join(DATA_DIR, dir));
    } catch {
      continue; // 不是目錄
    }
    for (const f of entries.sort()) {
      if (f.startsWith('lesson') && f.endsWith('.json')) yield join(DATA_DIR, dir, f);
    }
  }
}

let count = 0;
let lessons = 0;
for (const file of lessonFiles()) {
  const lesson = JSON.parse(readFileSync(file, 'utf8'));
  const flagged = (lesson.reading_questions || []).filter((q) => q.data_issue);
  if (flagged.length === 0 && !lesson.reading_issue && !lesson.summary_issue) continue;
  lessons += 1;
  const n = flagged.length + (lesson.reading_issue ? 1 : 0) + (lesson.summary_issue ? 1 : 0);
  console.log(`\n${lesson.lesson_id}　第 ${lesson.lesson_no} 課〈${lesson.title}〉　${n} 筆`);
  console.log(`  待審頁：#/review/${lesson.lesson_id}?preview=1`);
  if (lesson.reading_issue) {
    count += 1;
    console.log('  ─ 【課次層級】本課課文');
    console.log(`    疑義：${lesson.reading_issue}`);
  }
  if (lesson.summary_issue) {
    count += 1;
    console.log('  ─ 【課次層級】本課段落大意');
    console.log(`    疑義：${lesson.summary_issue}`);
  }
  for (const q of flagged) {
    count += 1;
    console.log(`  ─ ${q.stem}`);
    console.log(`    現有答案：${q.answer}　選項：${(q.options || []).join('、')}`);
    console.log(`    疑義：${q.data_issue}`);
  }
}

console.log(count === 0 ? '\n✅ 全站沒有待裁定的資料疑義' : `\n共 ${count} 筆疑義，分布在 ${lessons} 課，需要教師對照課本裁定`);
