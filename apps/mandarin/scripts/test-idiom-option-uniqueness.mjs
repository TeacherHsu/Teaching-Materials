// 驗證生字變成語第一關的候選字不會因不同成語共用同一個 related_char 而重複。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const { pickDistractors } = await import('../src/components/IdiomBuilder.js');
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = path.join(appRoot, 'public', 'data', '115AG1H');

let checked = 0;
for (const fileName of fs.readdirSync(dataRoot).filter((name) => /^lesson\d+\.json$/u.test(name))) {
  const data = JSON.parse(fs.readFileSync(path.join(dataRoot, fileName), 'utf8'));
  const usable = (data.idioms || []).filter((item) => item.related_char && item.idiom.includes(item.related_char));
  for (const target of usable) {
    const distractors = pickDistractors(
      usable,
      target.id,
      2,
      (item) => item.related_char,
      target.related_char,
    );
    const labels = [target.related_char, ...distractors.map((item) => item.related_char)];
    assert.equal(new Set(labels).size, labels.length, `${fileName}「${target.idiom}」候選字重複：${labels.join('、')}`);
    assert.equal(distractors.length, 2, `${fileName}「${target.idiom}」不足 2 個不同干擾字`);
    checked += 1;
  }
}

assert.ok(checked > 0, '沒有找到可檢查的 G1A 成語題');
console.log(`PASS: 已檢查 ${checked} 題 G1A 生字變成語，候選字均不重複。`);
