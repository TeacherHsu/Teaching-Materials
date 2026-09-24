// 生產 build 過濾：把 dist/data/<code>/lessonNN.json 中 status!=="approved"（且
// 非 "ready"）的改寫內容過濾掉，未過濾的完整版另存一份到
// dist/data/_preview/<code>/lessonNN.json 供 ?preview=1 待審模式讀取。
//
// 規格 docs/specs/2026-09-25-mandarin-dabutie-importer.md §4：
// 「生產 build 過濾規則：status !== "approved" 的條目不進 build 輸出；
//  status==="ready"（直接公開類）視同可上線。若某模組過濾後題數 < 3，
//  modules.<key>.status 設為 "missing"」。
//
// 跑在 `vite build` 之後（package.json postbuild），只處理課次資料，
// 不動 course-index.json／_fixtures（那些不含改寫欄位）。
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDataDir = join(__dirname, '..', 'dist', 'data');

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

    const relPath = relative(distDataDir, file);
    const previewPath = join(distDataDir, '_preview', relPath);
    mkdirSync(dirname(previewPath), { recursive: true });
    writeFileSync(previewPath, JSON.stringify(raw, null, 2), 'utf-8');

    const filtered = filterLesson(raw);
    writeFileSync(file, JSON.stringify(filtered, null, 2), 'utf-8');
    filteredCount += 1;
  }

  console.log(`filter-build-data 完成：過濾 ${filteredCount} 份課次資料，完整版存於 dist/data/_preview/。`);
}

main();
