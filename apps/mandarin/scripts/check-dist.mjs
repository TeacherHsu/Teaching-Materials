// Build 後掃描 dist/，確認：
// 1. 沒有以 '/' 開頭的絕對資源路徑（會在子路徑部署時斷掉）
// 2. 沒有外部 http(s) 資源（零外部連線要求；教育百科外連是使用者主動點擊的
//    <a href>，不算「載入時資源」，因此只檢查 <script src>/<link href>/<img src> 等資源標籤）
// 3. dist 內不得有 _preview 目錄，或任何 status: draft/todo_rewrite 的資料
//    （草稿內容絕不可跟著部署到公開 GitHub Pages，見規格 B）
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

let failed = false;
const allFiles = walk(distDir);

// --- 3. _preview 目錄 / draft・todo_rewrite 狀態不得進 dist ---
for (const file of allFiles) {
  const rel = file.slice(distDir.length + 1);
  if (rel.split('/').includes('_preview')) {
    failed = true;
    console.error(`[FAIL] dist 內不得有 _preview：${rel}`);
  }
}

// 草稿「原文/改寫文字」不得留在 dist；但 filter-build-data.mjs 對未核准內容
// 會保留一個 status: todo_rewrite 標記＋把內容清空（examples:[]／gist:null／
// theme:null）用來告訴前端「教材審核中」，這種空殼標記本身不算外洩，只有
// 標記旁還帶著非空文字內容時才算外洩。
const DRAFT_STATUSES = new Set(['draft', 'todo_rewrite']);
const CONTENT_KEYS = [
  'summary', 'gist', 'theme', 'stem', 'example', 'examples',
  'answer_hint', 'original', 'sentence', 'sentences', 'text', 'rewritten',
];

function hasLeakedContent(obj) {
  return CONTENT_KEYS.some((k) => {
    if (!(k in obj)) return false;
    const v = obj[k];
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'string') return v.trim() !== '';
    return true;
  });
}

function findDraftStatuses(value, path, hits) {
  if (Array.isArray(value)) {
    value.forEach((v, i) => findDraftStatuses(v, `${path}[${i}]`, hits));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if ((k === 'status' || k.endsWith('_status')) && DRAFT_STATUSES.has(v) && hasLeakedContent(value)) {
        hits.push(`${path}.${k}=${v}（附帶非空內容：${CONTENT_KEYS.filter((ck) => ck in value && value[ck] != null && !(Array.isArray(value[ck]) && value[ck].length === 0) && !(typeof value[ck] === 'string' && value[ck].trim() === '')).join(',')}）`);
      }
      findDraftStatuses(v, `${path}.${k}`, hits);
    }
  }
}

for (const file of allFiles.filter((f) => extname(f) === '.json')) {
  let data;
  try {
    data = JSON.parse(readFileSync(file, 'utf-8'));
  } catch {
    continue;
  }
  const hits = [];
  findDraftStatuses(data, '$', hits);
  if (hits.length) {
    failed = true;
    const rel = file.slice(distDir.length + 1);
    console.error(`[FAIL] ${rel} 含未核准（draft/todo_rewrite）狀態，不得進 dist：${hits.join(', ')}`);
  }
}

const files = allFiles.filter((f) => ['.html', '.js', '.css'].includes(extname(f)));

const ABSOLUTE_RESOURCE_RE = /(?:src|href)=["']\/(?!\/)/g;
const EXTERNAL_RESOURCE_TAG_RE = /<(?:script|link|img)[^>]+(?:src|href)=["']https?:\/\//g;

for (const file of files) {
  const text = readFileSync(file, 'utf-8');
  const absHits = text.match(ABSOLUTE_RESOURCE_RE);
  if (absHits) {
    failed = true;
    console.error(`[FAIL] ${file} 含以 / 開頭的絕對資源路徑：${absHits.join(', ')}`);
  }
  if (file.endsWith('.html')) {
    const extHits = text.match(EXTERNAL_RESOURCE_TAG_RE);
    if (extHits) {
      failed = true;
      console.error(`[FAIL] ${file} 含外部資源標籤：${extHits.join(', ')}`);
    }
  }
}

if (failed) {
  console.error('\ncheck-dist 未通過。');
  process.exit(1);
} else {
  console.log(`check-dist 通過：檢查了 ${files.length} 個檔案，沒有絕對路徑或外部資源標籤，dist 內無 _preview／draft 資料。`);
}
