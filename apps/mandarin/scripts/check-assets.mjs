// 公開資產容量閘門：避免批次加入圖片後超過 GitHub Pages 可維護範圍。
// - 單張圖片：最多 300 KiB
// - 單課圖片：最多 4 MiB
// - public/assets：600 MiB 警告，700 MiB 失敗
// - 公開網站不接受未壓縮的 PNG/JPEG/GIF 圖片；請先轉成 WebP 或 AVIF。
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = join(fileURLToPath(new URL('.', import.meta.url)));
const projectDir = join(__dirname, '..');
const assetsDir = join(__dirname, '..', 'public', 'assets');
const dataDir = join(__dirname, '..', 'public', 'data');
const IMAGE_EXTENSIONS = new Set(['.webp', '.avif']);
const LEGACY_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif']);
const MAX_IMAGE_BYTES = 300 * 1024;
const MAX_LESSON_BYTES = 4 * 1024 * 1024;
const WARN_TOTAL_BYTES = 600 * 1024 * 1024;
const FAIL_TOTAL_BYTES = 700 * 1024 * 1024;

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) files.push(...walk(full));
    else files.push({ path: full, bytes: stat.size });
  }
  return files;
}

const allFiles = walk(assetsDir);
const imageFiles = allFiles.filter(({ path }) => IMAGE_EXTENSIONS.has(extname(path).toLowerCase()));
const legacyFiles = allFiles.filter(({ path }) => LEGACY_IMAGE_EXTENSIONS.has(extname(path).toLowerCase()));
const totalBytes = allFiles.reduce((sum, file) => sum + file.bytes, 0);
const lessonBytes = new Map();
let failed = false;

function walkJson(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) files.push(...walkJson(full));
    else if (entry.endsWith('.json') && entry !== 'course-index.json') files.push(full);
  }
  return files;
}

function collectImageRefs(value, out = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectImageRefs(item, out);
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key === 'image' && typeof child === 'string' && child.trim()) out.push(child);
      else collectImageRefs(child, out);
    }
  }
  return out;
}

for (const file of allFiles) {
  const rel = relative(assetsDir, file.path).split(sep);
  const lesson = rel.length >= 2 ? `${rel[0]}/${rel[1]}` : rel[0];
  lessonBytes.set(lesson, (lessonBytes.get(lesson) || 0) + file.bytes);
}

for (const file of imageFiles) {
  if (file.bytes > MAX_IMAGE_BYTES) {
    failed = true;
    console.error(`[FAIL] 單張圖片超過 300 KiB：${relative(assetsDir, file.path)}（${Math.round(file.bytes / 1024)} KiB）`);
  }
}

for (const [lesson, bytes] of lessonBytes) {
  if (bytes > MAX_LESSON_BYTES) {
    failed = true;
    console.error(`[FAIL] 單課資產超過 4 MiB：${lesson}（${(bytes / 1024 / 1024).toFixed(2)} MiB）`);
  }
}

if (legacyFiles.length > 0) {
  failed = true;
  for (const file of legacyFiles) {
    console.error(`[FAIL] 公開資產仍有未壓縮圖片：${relative(assetsDir, file.path)}；請轉成 WebP 或 AVIF`);
  }
}

for (const lessonFile of walkJson(dataDir)) {
  const lesson = JSON.parse(readFileSync(lessonFile, 'utf-8'));
  const code = lesson.volume?.code;
  const lessonNo = String(lesson.lesson_no || '').padStart(2, '0');
  if (!code || !lessonNo) continue;
  const lessonRoot = join(assetsDir, code, `lesson${lessonNo}`);
  for (const ref of collectImageRefs(lesson)) {
    const target = ref.startsWith('/assets/')
      ? join(projectDir, 'public', ref.slice(1))
      : join(lessonRoot, ref);
    if (!existsSync(target)) {
      failed = true;
      console.error(`[FAIL] 圖片資料找不到檔案：${relative(projectDir, lessonFile)} → ${ref}`);
    }
  }
}

if (totalBytes >= FAIL_TOTAL_BYTES) {
  failed = true;
  console.error(`[FAIL] public/assets 已達 ${(totalBytes / 1024 / 1024).toFixed(2)} MiB，超過 700 MiB 閘門`);
} else if (totalBytes >= WARN_TOTAL_BYTES) {
  console.warn(`[WARN] public/assets 已達 ${(totalBytes / 1024 / 1024).toFixed(2)} MiB，接近 GitHub Pages 1 GiB 上限，請停止新增原尺寸圖片`);
}

if (failed) {
  console.error('\ncheck-assets 未通過。');
  process.exit(1);
}

console.log(`check-assets 通過：${allFiles.length} 個資產、${imageFiles.length} 張 WebP/AVIF；總計 ${(totalBytes / 1024 / 1024).toFixed(2)} MiB。`);
