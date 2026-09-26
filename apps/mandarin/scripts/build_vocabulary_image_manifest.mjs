#!/usr/bin/env node
// 將私有生成圖暫存資料夾依「課次＋詞序」對回詞語，產出給補圖器使用的私有 manifest。
// 檔案只應留在私有工作區，不得複製到 public 或提交公開 repo。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const sourceDir = path.resolve(args.get('--source-dir') || '');
const dataDir = path.resolve(args.get('--data-dir') || '');
const output = path.resolve(args.get('--output') || '');
if (!sourceDir || !dataDir || !output || sourceDir === path.parse(process.cwd()).root) {
  throw new Error('用法：node scripts/build_vocabulary_image_manifest.mjs --source-dir <私有圖片資料夾> --data-dir <public/data/115AG4K> --output <私有manifest.json>');
}

const files = new Set(
  fs.readdirSync(sourceDir).filter((name) => /\.png$/i.test(name)),
);
const rows = [];
for (const filename of fs.readdirSync(dataDir).filter((name) => /^lesson\d+\.json$/.test(name)).sort()) {
  const lesson = JSON.parse(fs.readFileSync(path.join(dataDir, filename), 'utf8'));
  for (let index = 0; index < (lesson.words || []).length; index += 1) {
    const lessonNo = String(lesson.lesson_no).padStart(2, '0');
    const wordNo = String(index + 1).padStart(2, '0');
    const sourceName = `lesson${lessonNo}-${wordNo}.png`;
    if (!files.has(sourceName)) continue;
    rows.push({
      lesson_id: lesson.lesson_id,
      word: lesson.words[index].word,
      source: path.join(sourceDir, sourceName),
    });
  }
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
console.log(`[OK] 生成私有語詞圖片 manifest：${rows.length} 筆`);
