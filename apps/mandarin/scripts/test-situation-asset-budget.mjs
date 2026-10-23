// 課文情境探索素材容量預算（CF 2026-10-24）：每課資料夾合計 ≤ 4 MB、單一圖檔 ≤ 300 KB。
// 目的：避免 GitHub repo 與 Pages 隨插畫修改不斷膨脹；超標時請先重新壓縮或略縮尺寸再提交。
import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../public/assets/situation/', import.meta.url).pathname;
const LESSON_LIMIT = 4 * 1024 * 1024;
const FILE_LIMIT = 300 * 1024;

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const problems = [];
let lessons = 0;
let files = 0;
for (const lesson of readdirSync(ROOT, { withFileTypes: true }).filter(e => e.isDirectory())) {
  lessons++;
  let total = 0;
  for (const file of walk(join(ROOT, lesson.name))) {
    const size = statSync(file).size;
    total += size;
    if (/\.(webp|png|jpe?g)$/i.test(file)) {
      files++;
      if (size > FILE_LIMIT) problems.push(`${file.slice(ROOT.length)}: ${(size / 1024).toFixed(0)} KB > 300 KB`);
    }
  }
  if (total > LESSON_LIMIT) problems.push(`${lesson.name}: ${(total / 1024 / 1024).toFixed(2)} MB > 4 MB`);
}

assert.ok(lessons > 0, 'situation asset folders found');
assert.deepEqual(problems, [], `素材超出容量預算：\n${problems.join('\n')}`);
console.log(`PASS: situation asset budget — ${lessons} lessons ≤ 4 MB, ${files} images ≤ 300 KB`);
