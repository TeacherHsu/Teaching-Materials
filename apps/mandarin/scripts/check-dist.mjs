// Build 後掃描 dist/，確認：
// 1. 沒有以 '/' 開頭的絕對資源路徑（會在子路徑部署時斷掉）
// 2. 沒有外部 http(s) 資源（零外部連線要求；教育百科外連是使用者主動點擊的
//    <a href>，不算「載入時資源」，因此只檢查 <script src>/<link href>/<img src> 等資源標籤）
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
const files = walk(distDir).filter((f) => ['.html', '.js', '.css'].includes(extname(f)));

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
  console.log(`check-dist 通過：檢查了 ${files.length} 個檔案，沒有絕對路徑或外部資源標籤。`);
}
