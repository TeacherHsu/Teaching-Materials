// 生產 build 過濾：把 dist/data/<code>/lessonNN.json 中 status!=="approved"（且
// 非 "ready"）的改寫內容過濾掉。
//
// 規格 docs/specs/2026-09-25-mandarin-dabutie-importer.md §4：
// 「生產 build 過濾規則：status !== "approved" 的條目不進 build 輸出；
//  status==="ready"（直接公開類）視同可上線。若某模組過濾後題數 < 3，
//  modules.<key>.status 設為 "missing"」。
//
// 待審完整版（未過濾）**不得**進 dist/（會跟著 GitHub Pages 部署對外公開）。
// 只有 MANDARIN_BUILD_PREVIEW=1（由 `npm run build:preview` 設定）時，才把
// 完整版另外寫到 dist/ 之外的 dist-preview/data/_preview/，供本機
// `vite preview --outDir dist-preview` 核對用，該目錄不在 Pages workflow
// 部署範圍內。一般 `npm run build`（postbuild 觸發）不輸出任何 _preview。
//
// 跑在 `vite build` 之後（package.json postbuild），只處理課次資料，
// 不動 course-index.json／_fixtures（那些不含改寫欄位）。
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PREVIEW_BUILD = process.env.MANDARIN_BUILD_PREVIEW === '1';
// build:preview 用 --outDir dist-preview（見 package.json），此目錄不在
// Pages workflow 部署範圍內，因此可以安全地把完整（未過濾）版本放進
// <outDir>/data/_preview/，沿用前端既有的相對路徑抓取邏輯（main.js）。
const outDirName = process.env.MANDARIN_DIST_DIR || (PREVIEW_BUILD ? 'dist-preview' : 'dist');
const distDataDir = join(__dirname, '..', outDirName, 'data');
const previewDataDir = join(distDataDir, '_preview');

const PUBLIC_STATUSES = new Set(['ready', 'approved']);

function isPublic(status) {
  return PUBLIC_STATUSES.has(status);
}

function findLessonFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === '_fixtures' || entry === '_preview') continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...findLessonFiles(full));
    } else if (extname(full) === '.json' && entry !== 'course-index.json') {
      out.push(full);
    }
  }
  return out;
}

function filterLesson(lesson) {
  const l = JSON.parse(JSON.stringify(lesson));

  l.idiom_sentences = (l.idiom_sentences || []).filter((s) => isPublic(s.status));

  for (const p of l.sentence_patterns || []) {
    if (!isPublic(p.examples_status)) {
      p.examples = [];
      p.examples_status = 'todo_rewrite';
    }
  }

  l.paragraph_summary = (l.paragraph_summary || []).filter((p) => isPublic(p.status));

  if (l.main_idea && !isPublic(l.main_idea.status)) {
    l.main_idea = { ...l.main_idea, gist: null, theme: null, status: 'todo_rewrite' };
  }

  l.reading_questions = (l.reading_questions || []).filter((q) => isPublic(q.status));
  l.rhetoric = (l.rhetoric || []).filter((r) => isPublic(r.status));

  if (l.modules) {
    const readingCount = l.paragraph_summary.length >= 3 || l.reading_questions.length >= 1
      ? Math.max(l.paragraph_summary.length, l.reading_questions.length)
      : 0;
    if (l.modules.reading) {
      l.modules.reading = readingCount > 0
        ? { ...l.modules.reading, status: 'available' }
        : { label: l.modules.reading.label || '讀懂課文', status: 'missing', note: '教材審核中：改寫內容尚待教師核准' };
    }
    if (l.modules.rhetoric) {
      l.modules.rhetoric = l.rhetoric.length >= 3
        ? { ...l.modules.rhetoric, status: 'available' }
        : { label: l.modules.rhetoric.label || '修辭小偵探', status: 'missing', note: '教材審核中：改寫內容尚待教師核准' };
    }
  }

  return l;
}

function main() {
  let files;
  try {
    files = findLessonFiles(distDataDir);
  } catch (err) {
    console.log(`[跳過] ${distDataDir} 不存在（尚未 build？）：${err.message}`);
    return;
  }

  let filteredCount = 0;
  for (const file of files) {
    const raw = JSON.parse(readFileSync(file, 'utf-8'));
    if (!raw || typeof raw !== 'object' || !raw.lesson_id) continue; // 不是 lesson JSON，略過

    if (PREVIEW_BUILD) {
      const relPath = relative(distDataDir, file);
      const previewPath = join(previewDataDir, relPath);
      mkdirSync(dirname(previewPath), { recursive: true });
      writeFileSync(previewPath, JSON.stringify(raw, null, 2), 'utf-8');
    }

    const filtered = filterLesson(raw);
    writeFileSync(file, JSON.stringify(filtered, null, 2), 'utf-8');
    filteredCount += 1;
  }

  if (PREVIEW_BUILD) {
    console.log(`filter-build-data 完成：過濾 ${filteredCount} 份課次資料，完整版存於 ${previewDataDir}（不在 dist/ 內）。`);
  } else {
    console.log(`filter-build-data 完成：過濾 ${filteredCount} 份課次資料。生產 dist/ 不含 _preview。`);
  }
}

main();
