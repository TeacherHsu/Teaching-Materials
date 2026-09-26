import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readText = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8');
const readJson = (relative) => JSON.parse(readText(relative));

const courseIndex = readJson('../public/data/course-index.json');
const modulePage = readText('../src/pages/ModulePage.js');
const sentencePractice = readText('../src/activities/sentencePractice.js');
const sentenceBuilder = readText('../src/components/SentenceBuilder.js');

assert.match(
  modulePage,
  /sentence_practice:\s*buildSentencePracticeActivity/u,
  'ModulePage 應將所有版本的 sentence_practice 導向共用活動入口',
);
assert.match(
  sentencePractice,
  /import\s*\{\s*SentenceOrdering\s*\}\s*from\s*['"]\.\.\/components\/SentenceOrdering\.js['"]/u,
  '句型練習應使用共用 SentenceOrdering 元件',
);
assert.match(sentencePractice, /SentenceOrdering\(\{/u, '句型練習應建立共用句子排序活動');
assert.match(
  sentenceBuilder,
  /import\s*\{\s*SentenceOrdering\s*\}\s*from\s*['"]\.\/SentenceOrdering\.js['"]/u,
  '仿寫選填也應沿用共用 SentenceOrdering 互動引擎',
);

const rows = [];
for (const grade of courseIndex.grades || []) {
  for (const volume of grade.volumes || []) {
    for (const unit of volume.units || []) {
      for (const lesson of unit.lessons || []) {
        const data = readJson(`../public/${lesson.data}`);
        assert.equal(
          data.modules?.sentence_practice?.activity,
          'sentence-practice',
          `${lesson.lesson_id} 的句型練習應使用共用 sentence-practice 活動入口`,
        );
        rows.push({ code: volume.code, lessonId: lesson.lesson_id });
      }
    }
  }
}

assert.ok(rows.length > 0, 'course-index 應至少有一個可檢查的句型練習課次');
const versions = [...new Set(rows.map(({ code }) => code))];
console.log(`PASS: ${versions.join('、')} 共 ${rows.length} 課的句型練習均導向共用互動引擎。`);
