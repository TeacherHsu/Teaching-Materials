// 差異化：同一份教材、不同鷹架厚度。題目內容不變，只改干擾項數量。
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const { SCAFFOLD_LEVELS, getScaffoldLevelKey, setScaffoldLevel, getScaffoldLevel } = await import('../src/utils/deviceSettings.js');
const { buildPronunciationItems } = await import('../src/activities/pronunciationQuestions.js');
const { makeTeacherChallenge, verifyTeacherChallenge } = await import('../src/utils/teacherGate.js');

// ---- 預設與防呆 ----
assert.equal(getScaffoldLevelKey(), 'standard', '預設為標準難度');
assert.equal(setScaffoldLevel('nonsense'), false, '不合法的層級不可寫入');
assert.equal(getScaffoldLevelKey(), 'standard', '寫入失敗後仍維持原設定');

// ---- 選項數確實隨層級改變，但題目本身不變 ----
const root = fileURLToPath(new URL('../public/data/115AG6H/lesson07.json', import.meta.url));
const lesson = JSON.parse(readFileSync(root, 'utf8'));
const seen = {};
for (const key of Object.keys(SCAFFOLD_LEVELS)) {
  setScaffoldLevel(key);
  const items = buildPronunciationItems(lesson.characters, lesson.characters);
  assert.ok(items.length > 0, `${key}: 應該要出得了題`);
  for (const item of items) {
    assert.equal(item.options.length, SCAFFOLD_LEVELS[key].optionCount, `${key}: 選項數應為 ${SCAFFOLD_LEVELS[key].optionCount}`);
    assert.ok(item.options.includes(item.answer), `${key}: 答案必須在選項內`);
    assert.equal(new Set(item.options).size, item.options.length, `${key}: 選項不可重複`);
  }
  seen[key] = items.map((i) => i.character).join(',');
}
assert.equal(seen.support, seen.standard, '不同層級出的是同一批字（同一份教材）');
assert.equal(seen.standard, seen.challenge, '不同層級出的是同一批字（同一份教材）');
assert.equal(getScaffoldLevel().optionCount, 4, 'getScaffoldLevel 反映目前設定');
setScaffoldLevel('standard');

// ---- 教師入口：兩位數 × 一位數，答對才放行（難度由 CF 指定）----
for (let i = 0; i < 50; i += 1) {
  const c = makeTeacherChallenge();
  assert.ok(c.a >= 13 && c.a <= 89, '被乘數是兩位數');
  assert.ok(c.b >= 3 && c.b <= 9, '乘數是一位數，且避開 1、2 這種等於沒擋的值');
  assert.notEqual(c.a % 10, 0, '避開整十的好算組合');
  assert.equal(c.answer, c.a * c.b);
  assert.equal(verifyTeacherChallenge(c, String(c.answer)), true);
  assert.equal(verifyTeacherChallenge(c, ` ${c.answer} `), true, '容許前後空白');
  assert.equal(verifyTeacherChallenge(c, String(c.answer + 1)), false);
  assert.equal(verifyTeacherChallenge(c, ''), false);
  assert.equal(verifyTeacherChallenge(c, 'abc'), false);
}
console.log('PASS: 三段鷹架厚度只改選項數不改題目；教師入口（兩位數 × 一位數）檢核正常。');
