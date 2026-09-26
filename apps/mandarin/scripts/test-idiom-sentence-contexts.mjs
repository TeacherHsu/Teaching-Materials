// 驗證「成語填句子」使用真正的語境句，不會退回泛用說明句。
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootPath = fileURLToPath(new URL('../public/data/', import.meta.url));

function lessonFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return lessonFiles(full);
    return entry.name.startsWith('lesson') && entry.name.endsWith('.json') ? [full] : [];
  });
}

const genericStem = '遇到生活中的相關情況時，可以用';
let checked = 0;
const coverage = new Map();
for (const file of lessonFiles(rootPath)) {
  const lesson = JSON.parse(readFileSync(file, 'utf8'));
  const volumeCode = lesson.volume?.code || 'unknown';
  const stats = coverage.get(volumeCode) || { lessons: 0, lessonsWithIdioms: 0, idioms: 0, noIdiomLessons: 0 };
  stats.lessons += 1;
  const idioms = lesson.idioms || [];
  const items = lesson.idiom_sentences || [];
  if (idioms.length === 0) {
    stats.noIdiomLessons += 1;
    assert.equal(items.length, 0, `${file}: 沒有成語資料卻存在成語填句子題目`);
    coverage.set(volumeCode, stats);
    continue;
  }
  stats.lessonsWithIdioms += 1;
  stats.idioms += idioms.length;
  const sentenceById = new Map(items.filter((item) => item.status === 'approved').map((item) => [item.idiom_id, item]));
  assert.equal(sentenceById.size, idioms.length, `${file}: 每個成語都應有一筆核准的填句子情境句`);
  for (const idiom of idioms) {
    const item = sentenceById.get(idiom.id);
    assert.ok(item, `${file}: 成語「${idiom.idiom}」缺少核准的填句子情境句`);
    checked += 1;
    assert.ok(item.rewritten, `${file}: ${item.id} 缺少成語例句`);
    assert.ok(!item.rewritten.includes(genericStem), `${file}: ${item.id} 仍使用泛用說明句`);
    assert.ok(item.rewritten.includes(idiom.idiom), `${file}: ${item.id} 例句未包含成語「${idiom.idiom}」`);
    const context = item.rewritten.replace(idiom.idiom, '');
    assert.ok(context.replace(/[，。！？、；：「」（）\s]/g, '').length >= 4, `${file}: ${item.id} 缺少足夠語境`);
  }
  for (const item of items) {
    assert.ok(idioms.some((idiom) => idiom.id === item.idiom_id), `${file}: ${item.id} 指向不存在的成語`);
  }
  coverage.set(volumeCode, stats);
}

assert.ok(checked > 0, '沒有找到可檢查的核准成語例句');
for (const [volumeCode, stats] of coverage) {
  const noIdiomNote = stats.noIdiomLessons ? `；${stats.noIdiomLessons} 課尚無成語資料，依規則不開放本模組` : '';
  console.log(`PASS: ${volumeCode} ${stats.lessons} 課，${stats.lessonsWithIdioms} 課有成語、${stats.idioms} 個成語皆有具體填句子情境句${noIdiomNote}`);
}
console.log(`PASS: 共檢查 ${checked} 筆成語填句子，未使用泛用說明題幹。`);
