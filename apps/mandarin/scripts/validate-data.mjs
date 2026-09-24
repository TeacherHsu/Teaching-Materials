// 驗證所有課程資料是否符合 schema。新增一課後跑這支即可確認格式正確。
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const ajv = new Ajv({ allErrors: true, strict: false });
const courseIndexSchema = JSON.parse(readFileSync(join(root, 'schema/course-index.schema.json'), 'utf-8'));
const lessonSchema = JSON.parse(readFileSync(join(root, 'schema/lesson.schema.json'), 'utf-8'));

const validateCourseIndex = ajv.compile(courseIndexSchema);
const validateLesson = ajv.compile(lessonSchema);

let failed = false;

function findLessonFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    if (entry === '_fixtures') continue; // fixture 資料不受課次 schema 拘束
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...findLessonFiles(full));
    } else if (entry.endsWith('.json') && entry !== 'course-index.json') {
      results.push(full);
    }
  }
  return results;
}

const courseIndexPath = join(root, 'public/data/course-index.json');
const courseIndex = JSON.parse(readFileSync(courseIndexPath, 'utf-8'));
if (!validateCourseIndex(courseIndex)) {
  failed = true;
  console.error(`[FAIL] ${courseIndexPath}`);
  for (const err of validateCourseIndex.errors) {
    console.error(`  ${err.instancePath} ${err.message}`);
  }
} else {
  console.log(`[OK] ${courseIndexPath}`);
}

const dataDir = join(root, 'public/data');
const lessonFiles = findLessonFiles(dataDir);
for (const file of lessonFiles) {
  const data = JSON.parse(readFileSync(file, 'utf-8'));
  if (!validateLesson(data)) {
    failed = true;
    console.error(`[FAIL] ${file}`);
    for (const err of validateLesson.errors) {
      console.error(`  ${err.instancePath} ${err.message}`);
    }
  } else {
    console.log(`[OK] ${file}`);
  }
}

// 交叉檢查：course-index 指到的 lesson 檔都要存在且能載入
function walkLessons(ci) {
  const out = [];
  for (const grade of ci.grades) {
    for (const volume of grade.volumes) {
      for (const unit of volume.units) {
        for (const lesson of unit.lessons) out.push(lesson);
      }
    }
  }
  return out;
}
for (const lesson of walkLessons(courseIndex)) {
  const p = join(root, 'public', lesson.data);
  try {
    statSync(p);
    console.log(`[OK] course-index → ${lesson.data} 存在`);
  } catch {
    failed = true;
    console.error(`[FAIL] course-index 指到不存在的檔案：${lesson.data}`);
  }
}

if (failed) {
  console.error('\n驗證失敗。');
  process.exit(1);
} else {
  console.log(`\n驗證通過：${lessonFiles.length} 份課次資料、1 份課程索引。`);
}
