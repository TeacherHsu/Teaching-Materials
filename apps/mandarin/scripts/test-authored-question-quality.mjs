// 原創閱讀題的命題品質（answer_source 以 authored: 開頭的題目）。
//
// 擋兩個命題常見的破綻：
// 1. 正解明顯最長——六上第一版 48 題有 43 題正解是唯一最長選項，
//    學生很快就會學到「挑最長的」，題目量到的是應試技巧不是理解。
// 2. 選項數不足——兩個選項猜中率 50%，六上舊題就是這樣。
// 另外要求每題都有證據與三層提示，否則鷹架接不上。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = path.join(appRoot, 'public', 'data');

let authored = 0;
let lengthCue = 0;
for (const volume of fs.readdirSync(dataRoot, { withFileTypes: true }).filter((e) => e.isDirectory() && /^115AG\d/.test(e.name))) {
  for (const filename of fs.readdirSync(path.join(dataRoot, volume.name)).filter((n) => /^lesson\d+\.json$/.test(n))) {
    const lesson = JSON.parse(fs.readFileSync(path.join(dataRoot, volume.name, filename), 'utf8'));
    for (const q of lesson.reading_questions || []) {
      if (!/^authored:/u.test(q.answer_source || '')) continue;
      authored += 1;
      const where = `${lesson.lesson_id} ${q.id}`;
      assert.equal(q.options.length, 4, `${where}: 原創題要有四個選項`);
      assert.ok(q.evidence?.length, `${where}: 原創題要標證據`);
      assert.equal(q.hints?.length, 3, `${where}: 原創題要有三層提示`);
      const lengths = q.options.map((o) => o.length);
      const others = q.options.filter((o) => o !== q.answer).map((o) => o.length);
      if (q.answer.length - Math.max(...others) >= 2) lengthCue += 1;
      assert.ok(lengths.every((n) => n > 0));
    }
  }
}

assert.ok(authored > 0, '應該有原創題可以檢查');
// 容許少數題正解本來就比較長，但不能成為規律
assert.ok(lengthCue / authored <= 0.1, `正解明顯最長的題目占 ${lengthCue}/${authored}，學生會學到「挑最長的」`);
console.log(`✅ 原創題品質：${authored} 題都有 4 個選項、證據與三層提示；正解明顯最長 ${lengthCue} 題`);
