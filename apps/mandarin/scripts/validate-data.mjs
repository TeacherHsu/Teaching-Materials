// 驗證所有課程資料是否符合 schema。新增一課後跑這支即可確認格式正確。
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { isAllowedLinkUrl } from '../src/config/linkDomains.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const ajv = new Ajv({ allErrors: true, strict: false });
const courseIndexSchema = JSON.parse(readFileSync(join(root, 'schema/course-index.schema.json'), 'utf-8'));
const lessonSchema = JSON.parse(readFileSync(join(root, 'schema/lesson.schema.json'), 'utf-8'));
// 課文密文封包不是課次資料，用自己的 schema 驗（確保迭代次數夠、manifest 不含課文）。
const readingsSchema = JSON.parse(readFileSync(join(root, 'schema/readings-envelope.schema.json'), 'utf-8'));
const READINGS_FILE = 'readings.enc.json';

const validateCourseIndex = ajv.compile(courseIndexSchema);
const validateLesson = ajv.compile(lessonSchema);
const validateReadings = ajv.compile(readingsSchema);

let failed = false;
const readingFiles = [];

function findLessonFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    // 底線開頭的目錄不是課次資料（_fixtures 測試夾具、_index 衍生索引、_preview 預覽輸出）
    if (entry.startsWith('_')) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...findLessonFiles(full));
    } else if (entry === READINGS_FILE) {
      readingFiles.push(join(dir, entry));
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

// 課文密文封包：除了 schema，再確認 manifest 區沒有夾帶明碼課文。
// 這一條守的是版權界線（sped-os ADR-0034），不只是格式正確性。
for (const file of readingFiles) {
  const raw = readFileSync(file, 'utf-8');
  const data = JSON.parse(raw);
  if (!validateReadings(data)) {
    failed = true;
    console.error(`[FAIL] ${file}`);
    for (const err of validateReadings.errors) {
      console.error(`  ${err.instancePath} ${err.message}`);
    }
    continue;
  }
  const manifestOnly = JSON.stringify({ ...data, data: '', salt: '', iv: '' });
  const leaked = manifestOnly.match(/[\u3400-\u9fff]{2,}/g);
  if (leaked) {
    failed = true;
    console.error(`[FAIL] ${file} 的 manifest 區出現漢字（疑似夾帶明碼課文）：${leaked.slice(0, 5)}`);
    continue;
  }
  console.log(`[OK] ${file}（${data.lessons.length} 課密文、PBKDF2 ${data.iter} 次、無明碼）`);
}
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
    for (const ext of data.extensions || []) {
      if (!isAllowedLinkUrl(ext.url)) {
        failed = true;
        console.error(`[FAIL] ${file} extensions「${ext.title || ext.id}」網址不在白名單或非 https：${ext.url}`);
      }
    }
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
