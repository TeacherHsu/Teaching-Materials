import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canStartPolyphones } from '../src/activities/polyphones.js';
import { findModuleEntry, getModuleStatus } from '../src/activities/moduleRegistry.js';

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_ROOT = path.join(APP_ROOT, 'public', 'data', '115AG1H');
const entry = findModuleEntry('polyphones');
const failures = [];
let checked = 0;

for (let lessonNo = 1; lessonNo <= 7; lessonNo += 1) {
  const file = path.join(DATA_ROOT, `lesson${String(lessonNo).padStart(2, '0')}.json`);
  const lesson = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (lesson.modules?.polyphones?.status !== 'available') continue;
  checked += 1;
  if (!canStartPolyphones(lesson)) {
    failures.push(`${lesson.lesson_id}: 標記 available，但學生頁沒有兩筆可作答讀音`);
  }
  const moduleStatus = getModuleStatus(lesson, entry);
  if (moduleStatus.code !== 'available') {
    failures.push(`${lesson.lesson_id}: 標記 available，但課次首頁顯示「${moduleStatus.text}」`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`PASS：${checked} 個標記 available 的一上課次，均可在學生頁開始一字多音練習。`);
