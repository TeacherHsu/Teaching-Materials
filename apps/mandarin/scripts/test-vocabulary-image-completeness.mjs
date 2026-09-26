import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = fileURLToPath(new URL('.', import.meta.url));
const projectDir = join(scriptsDir, '..');
const dataRoot = join(projectDir, 'public', 'data');
const targetVolumes = new Set(['115AG3H', '115AG6H']);
const failures = [];
let wordsChecked = 0;

for (const volume of readdirSync(dataRoot)) {
  if (!targetVolumes.has(volume)) continue;
  const volumeDir = join(dataRoot, volume);
  for (const filename of readdirSync(volumeDir).filter(name => /^lesson\d+\.json$/.test(name))) {
    const lessonPath = join(volumeDir, filename);
    const lesson = JSON.parse(readFileSync(lessonPath, 'utf8'));
    for (const item of lesson.words || []) {
      wordsChecked += 1;
      const ref = typeof item.image === 'string' ? item.image.trim() : '';
      const target = ref.startsWith('/assets/')
        ? join(projectDir, 'public', ref.slice(1))
        : '';
      if (!ref || !existsSync(target)) {
        failures.push(`${lesson.lesson_id}:${item.word || '(未命名)'}`);
      }
    }
  }
}

if (failures.length) {
  console.error(`FAIL: ${failures.length} 個語詞缺少有效圖片：${failures.join('、')}`);
  process.exit(1);
}

console.log(`PASS: G3A／G6A 語詞圖片完整，共檢查 ${wordsChecked} 個語詞。`);
