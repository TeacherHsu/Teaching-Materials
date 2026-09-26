// 驗證 G6A 第 5 課形似字組與官方「字形辨別」資料一致，避免非形似字混入選項。
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const lessonPath = fileURLToPath(new URL('../public/data/115AG6H/lesson05.json', import.meta.url));
const lesson = JSON.parse(readFileSync(lessonPath, 'utf8'));
const actual = (lesson.lookalikes || []).map((group) => group.chars.map((item) => item.char));
const expected = [
  ['擰', '檸', '嚀', '濘'],
  ['噪', '燥', '操', '躁'],
  ['庶', '蔗', '遮'],
  ['賢', '資', '質', '貿', '賀'],
  ['陶', '淘'],
  ['隱', '穩'],
  ['批', '疵', '庇'],
  ['戴', '載', '截', '裁', '栽'],
];

assert.deepEqual(actual, expected, 'G6A 第 5 課形似字選項應與官方字形辨別資料一致');
for (const group of lesson.lookalikes) {
  assert.ok(group.chars.length >= 2, `${group.id} 至少需要兩個形似字`);
  assert.equal(new Set(group.chars.map((item) => item.char)).size, group.chars.length, `${group.id} 不可有重複字`);
  for (const item of group.chars) {
    assert.ok(item.char && item.example, `${group.id} 每個字都要有例詞`);
  }
}

console.log('PASS: G6A 第 5 課 8 組形似字選項已與官方資料校正，沒有非形似字混入。');
