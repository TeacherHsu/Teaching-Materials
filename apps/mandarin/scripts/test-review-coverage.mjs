// 全年級「舊字新詞」回歸測試：索引、模組狀態與實際跨課題目必須一致。
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReviewQuizItems, pickReviewRound } from '../src/activities/review.js';
import { findModuleEntry, getModuleStatus } from '../src/activities/moduleRegistry.js';
import { auditReviewCoverage } from './sync-review-coverage.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

async function main() {
  const audit = auditReviewCoverage();
  assert.deepEqual(audit.findings, [], '公開課次的舊字新詞索引或狀態未同步');

  const index = JSON.parse(await readFile(path.join(PUBLIC_DIR, 'data/course-index.json'), 'utf8'));
  let lessonCount = 0;
  let availableCount = 0;
  for (const grade of index.grades || []) {
    for (const volume of grade.volumes || []) {
      const lessons = [];
      for (const unit of volume.units || []) {
        for (const meta of unit.lessons || []) {
          const lesson = JSON.parse(await readFile(path.join(PUBLIC_DIR, meta.data), 'utf8'));
          lessons.push(lesson);
        }
      }
      lessons.sort((a, b) => a.lesson_no - b.lesson_no);
      for (const lesson of lessons) {
        const previous = lessons.filter((item) => item.lesson_no < lesson.lesson_no);
        const entry = findModuleEntry('review');
        const status = getModuleStatus(lesson, entry).code;
        lessonCount += 1;
        if (lesson.lesson_no === 1) {
          assert.equal(status, 'locked', `${lesson.lesson_id} 第 1 課應鎖住舊字新詞`);
          continue;
        }
        const items = buildReviewQuizItems(previous);
        const round = pickReviewRound(previous);
        assert.ok(items.length >= 3, `${lesson.lesson_id} 前課題目不足 3 題：${items.length}`);
        assert.ok(round.length >= 3 && round.length <= 5, `${lesson.lesson_id} 題組應為 3–5 題`);
        assert.equal(status, 'available', `${lesson.lesson_id} 應顯示可以開始，實際為 ${status}`);
        availableCount += 1;
      }
    }
  }
  console.log(`PASS: 舊字新詞全面稽核通過（${lessonCount} 課、${availableCount} 課可開始）。`);
}

main().catch((error) => {
  console.error('[FAIL]', error);
  process.exit(1);
});
