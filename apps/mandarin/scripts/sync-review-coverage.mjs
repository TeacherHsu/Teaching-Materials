// 建立所有公開課次的「舊字新詞」跨課索引。
// review_words.by_lesson 是累積索引：每一課保留截至該課的生字，
// 前端再從同冊較早課次的完整 JSON 取出實際複習題目。
// 官方教材不在公開 repo；本工具只讀公開衍生資料，不新增或推測教材內容。
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const INDEX_PATH = path.join(PUBLIC_DIR, 'data', 'course-index.json');
const PUBLIC_STATUSES = new Set(['ready', 'approved']);

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function lessonFile(meta) {
  return path.join(PUBLIC_DIR, meta.data.replaceAll('/', path.sep));
}

function readyCharacters(lesson) {
  return (lesson.characters || [])
    .filter((item) => (item.status === 'ready' || !item.status) && item.char)
    .map((item) => item.char);
}

function readyWords(lesson) {
  return (lesson.words || []).filter(
    (item) => PUBLIC_STATUSES.has(item.status) && item.word && item.meaning,
  );
}

function candidateCount(previousLessons) {
  const charCount = previousLessons.flatMap((lesson) =>
    (lesson.characters || []).filter(
      (item) => (item.status === 'ready' || !item.status) && item.char && item.zhuyin,
    ),
  ).length;
  const wordCount = previousLessons.flatMap(readyWords).length;
  return charCount + wordCount;
}

function expectedReviewWords(volumeLessons, lessonNo) {
  const byLesson = {};
  for (const entry of volumeLessons) {
    if (entry.lesson.lesson_no > lessonNo) continue;
    byLesson[String(entry.lesson.lesson_no)] = readyCharacters(entry.lesson);
  }
  return { by_lesson: byLesson };
}

function expectedModule(previousLessons, lessonNo) {
  if (lessonNo === 1) {
    return { status: 'missing', note: '第 1 課沒有前課資料。' };
  }
  if (candidateCount(previousLessons) < 3) {
    return { status: 'missing', note: '前課可複習字詞不足 3 題。' };
  }
  return { status: 'available' };
}

function collectLessons(courseIndex) {
  const groups = new Map();
  for (const grade of courseIndex.grades || []) {
    for (const volume of grade.volumes || []) {
      const records = [];
      for (const unit of volume.units || []) {
        for (const meta of unit.lessons || []) {
          const lesson = readJson(lessonFile(meta));
          records.push({ meta, lesson });
        }
      }
      records.sort((a, b) => a.lesson.lesson_no - b.lesson.lesson_no);
      groups.set(volume.code, records);
    }
  }
  return groups;
}

function expectedForVolume(records, recordIndex) {
  const current = records[recordIndex].lesson;
  const previous = records.filter((record) => record.lesson.lesson_no < current.lesson_no);
  return {
    reviewWords: expectedReviewWords(
      records,
      current.lesson_no,
    ),
    module: expectedModule(
      previous.map((record) => record.lesson),
      current.lesson_no,
    ),
  };
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function auditReviewCoverage({ write = false } = {}) {
  const courseIndex = readJson(INDEX_PATH);
  const groups = collectLessons(courseIndex);
  const findings = [];
  let lessons = 0;
  let available = 0;

  for (const [volumeCode, records] of groups) {
    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      const { reviewWords, module } = expectedForVolume(records, index);
      const actualReview = record.lesson.review_words || {};
      const actualModule = record.lesson.modules?.review || {};
      const reviewMatches = sameJson(actualReview, reviewWords);
      const moduleMatches = actualModule.status === module.status
        && (module.status === 'available' ? !actualModule.note : actualModule.note === module.note);

      lessons += 1;
      if (module.status === 'available') available += 1;

      if (write) {
        record.lesson.review_words = reviewWords;
        if (record.lesson.modules?.review) {
          record.lesson.modules.review = {
            ...record.lesson.modules.review,
            ...module,
          };
          if (module.status === 'available') delete record.lesson.modules.review.note;
        }
        writeFileSync(lessonFile(record.meta), `${JSON.stringify(record.lesson, null, 2)}\n`, 'utf8');
      } else if (!reviewMatches || !moduleMatches) {
        findings.push({
          lesson_id: record.lesson.lesson_id,
          volumeCode,
          lesson_no: record.lesson.lesson_no,
          review: reviewMatches ? 'ok' : 'mismatch',
          module: moduleMatches ? 'ok' : 'mismatch',
        });
      }
    }
  }

  return { lessons, available, findings };
}

function main() {
  const write = process.argv.includes('--write');
  const result = auditReviewCoverage({ write });
  if (write) {
    console.log(`舊字新詞索引已同步：${result.lessons} 課，其中 ${result.available} 課具備前課複習資料。`);
    return;
  }
  if (result.findings.length > 0) {
    console.error(`舊字新詞稽核失敗：${result.findings.length} 課需要同步。`);
    for (const finding of result.findings) console.error(JSON.stringify(finding));
    process.exitCode = 1;
    return;
  }
  console.log(`舊字新詞稽核通過：${result.lessons} 課、${result.available} 課可開始。`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main();
}
