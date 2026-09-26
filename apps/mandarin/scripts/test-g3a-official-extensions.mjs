import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data', '115AG3H');
const publicStatuses = new Set(['ready', 'approved']);
const expectedPolyphoneLessons = new Set([8, 9, 10]);

let totals = { polysemy: 0, polyphones: 0, listening: 0, rhetoric: 0 };

for (let lessonNo = 7; lessonNo <= 12; lessonNo += 1) {
  const file = join(root, `lesson${String(lessonNo).padStart(2, '0')}.json`);
  const lesson = JSON.parse(readFileSync(file, 'utf8'));
  for (const key of Object.keys(totals)) {
    const items = (lesson[key] || []).filter((item) => publicStatuses.has(item.status));
    totals[key] += items.length;
    for (const item of items) {
      assert.ok(!JSON.stringify(item).match(/[A-Z]:\\Users\\|C:\\/), `${file} ${key} 含私有絕對路徑`);
      assert.match(item.source || '', /^115G3A／翰林官方教材（/, `${file} ${key} 缺少官方來源標籤`);
    }
  }

  assert.ok((lesson.polysemy || []).filter((item) => publicStatuses.has(item.status)).length >= 3, `${file} 一字多義不足三題`);
  assert.ok((lesson.listening || []).filter((item) => publicStatuses.has(item.status)).length >= 3, `${file} 聽聽看不足三題`);
  const rhetoric = (lesson.rhetoric || []).filter((item) => publicStatuses.has(item.status));
  assert.ok(rhetoric.length >= 3, `${file} 修辭不足三題`);
  for (const item of rhetoric) assert.match(item.example, /﹁[^﹂]+﹂/, `${file} ${item.id} 缺少官方關鍵字標記`);

  const polyphones = (lesson.polyphones || []).filter((item) => publicStatuses.has(item.status));
  if (expectedPolyphoneLessons.has(lessonNo)) {
    assert.ok(polyphones.length > 0, `${file} 官方有多音字卻沒有公開資料`);
    for (const item of polyphones) {
      const readings = (item.readings || []).filter((reading) => reading.zhuyin && reading.senses?.some((sense) => sense.examples?.length));
      assert.ok(new Set(readings.map((reading) => reading.zhuyin)).size >= 2, `${file} ${item.char} 多音讀音不足兩個`);
    }
  } else {
    assert.equal(polyphones.length, 0, `${file} 官方未列多音字卻有公開多音題`);
    assert.match(lesson.modules?.polyphones?.note || '', /未列/, `${file} 未列多音字課次應說明原因`);
  }
}

console.log(`PASS: G3A L07-L12 官方延伸模組檢查通過（一字多義 ${totals.polysemy}、一字多音 ${totals.polyphones}、聽聽看 ${totals.listening}、修辭 ${totals.rhetoric}）。`);
