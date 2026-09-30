// 冊別層級 fail-closed：官方來源查核後確認無依據的冊別，整冊不得呈現課文地圖。
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isStructureSourceVerified, isApprovedStructureRole } from '../src/activities/structureMapRoles.js';

// 一上：官方 08課文結構表 只有課文句子，沒有結構角色；現有角色無來源依據。
assert.equal(isStructureSourceVerified('115AG1H01'), false, '115AG1H must stay withheld');
assert.equal(isStructureSourceVerified('115AG3H01'), true, '115AG3H is not on the unsourced list');
// 取不到冊別時不整批消失，交由角色白名單把關。
for (const id of ['', null, undefined, 'nonsense']) {
  assert.equal(isStructureSourceVerified(id), true, 'unknown ids fall back to the role whitelist');
}

const root = fileURLToPath(new URL('../public/data/', import.meta.url));
let g1Paragraphs = 0;
let g1Renderable = 0;
for (const filename of readdirSync(join(root, '115AG1H')).filter((n) => /^lesson\d+\.json$/.test(n))) {
  const lesson = JSON.parse(readFileSync(join(root, '115AG1H', filename), 'utf8'));
  for (const paragraph of lesson.paragraph_summary || []) {
    g1Paragraphs += 1;
    if (isStructureSourceVerified(lesson.lesson_id) && isApprovedStructureRole(paragraph.structure_role)) {
      g1Renderable += 1;
    }
  }
}
assert.ok(g1Paragraphs > 0, 'the first-grade volume should still carry paragraph summaries');
assert.equal(g1Renderable, 0, 'no first-grade paragraph may reach the structure map');
console.log(`PASS: 115AG1H withheld (${g1Paragraphs} paragraphs, 0 renderable).`);
