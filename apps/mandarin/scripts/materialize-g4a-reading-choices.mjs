/** Keep the official G4A reading-question options available to the shared graded quiz. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_ROOT = path.join(APP_ROOT, 'public', 'data', '115AG4K');
let changed = 0;

for (let lessonNo = 1; lessonNo <= 12; lessonNo += 1) {
  const file = path.join(DATA_ROOT, `lesson${String(lessonNo).padStart(2, '0')}.json`);
  const original = fs.readFileSync(file, 'utf8');
  const lesson = JSON.parse(original);
  for (const question of lesson.reading_questions || []) {
    if (!Array.isArray(question.options) || question.options.length < 2) continue;
    question.status = 'approved';
    question.source = '康軒官方教材來源整理（15 閱讀理解提問；保留官方選項）';
    changed += 1;
  }
  const next = `${JSON.stringify(lesson, null, 2)}\n`;
  if (next !== original) fs.writeFileSync(file, next, 'utf8');
}
console.log(`已保留 ${changed} 題官方選項；既有核定答案不會被此步驟清除。`);
