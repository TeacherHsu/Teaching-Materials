// 驗證「成語填句子」使用真正的語境句，不會退回泛用說明句。
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dataRoot = new URL('../public/data/', import.meta.url);
const rootPath = decodeURIComponent(dataRoot.pathname).replace(/^\/(\w):/, '$1:');

function lessonFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return lessonFiles(full);
    return entry.name.startsWith('lesson') && entry.name.endsWith('.json') ? [full] : [];
  });
}

const genericStem = '遇到生活中的相關情況時，可以用';
let checked = 0;
for (const file of lessonFiles(rootPath)) {
  const lesson = JSON.parse(readFileSync(file, 'utf8'));
  for (const item of lesson.idiom_sentences || []) {
    const idiom = (lesson.idioms || []).find((entry) => entry.id === item.idiom_id);
    if (!idiom || item.status !== 'approved') continue;
    checked += 1;
    assert.ok(item.rewritten, `${file}: ${item.id} 缺少成語例句`);
    assert.ok(!item.rewritten.includes(genericStem), `${file}: ${item.id} 仍使用泛用說明句`);
    assert.ok(item.rewritten.includes(idiom.idiom), `${file}: ${item.id} 例句未包含成語「${idiom.idiom}」`);
    const context = item.rewritten.replace(idiom.idiom, '');
    assert.ok(context.replace(/[，。！？、；：「」（）\s]/g, '').length >= 4, `${file}: ${item.id} 缺少足夠語境`);
  }
}

assert.ok(checked > 0, '沒有找到可檢查的核准成語例句');
console.log(`PASS: ${checked} 筆核准成語例句皆為具體語境句，未使用泛用說明題幹。`);
