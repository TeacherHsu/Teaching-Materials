// 回歸檢查：形似字題目的每個選項都必須屬於已核對的字形群組。
// approved manifest 是官方題庫核對後的衍生基準，不放入官方原始教材。
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const appRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dataRoot = resolve(appRoot, 'public/data');
const manifestPath = resolve(appRoot, 'docs/lookalike-approved-groups.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

function readLesson(code, lessonNo) {
  const file = resolve(dataRoot, code, `lesson${String(lessonNo).padStart(2, '0')}.json`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

function groupKey(chars) {
  return chars.join('|');
}

function normalizeExpected(groups) {
  return groups.map((group) => group.map(String));
}

let checkedLessons = 0;
let checkedGroups = 0;
let checkedOptions = 0;

for (const [code, lessons] of Object.entries(manifest.grades)) {
  for (const lessonKey of Object.keys(lessons).sort()) {
    const lessonNo = Number(lessonKey.replace('lesson', ''));
    const lesson = readLesson(code, lessonNo);
    const actualGroups = (lesson.lookalikes || []).map((group) => group.chars || []);
    const expectedGroups = normalizeExpected(lessons[lessonKey] || []);
    assert.deepEqual(
      actualGroups.map((group) => group.map((item) => item.char)),
      expectedGroups,
      `${code}/${lessonKey} 的形似字選項與核對基準不一致`,
    );

    for (const [groupIndex, group] of actualGroups.entries()) {
      const targetChar = lesson.lookalikes?.[groupIndex]?.answer;
      assert.ok(group.length >= 2, `${code}/${lessonKey} 第${groupIndex + 1}組至少需要兩個選項`);
      const chars = group.map((item) => item.char);
      assert.equal(new Set(chars).size, chars.length, `${code}/${lessonKey} 第${groupIndex + 1}組不可重複字`);
      for (const item of group) {
        assert.match(String(item.char), /^\p{Script=Han}$/u, `${code}/${lessonKey} 有非單一漢字選項`);
        // 一年級官方題庫只為正確字提供例詞，干擾字是形似字選項；
        // 若干擾字有例詞仍需自洽，但不要求工作流臆造例詞。
        if (item.char === targetChar || item.example) {
          assert.ok(item.example?.includes(item.char), `${code}/${lessonKey}「${item.char}」例詞沒有包含本字`);
        }
        checkedOptions += 1;
      }
      checkedGroups += 1;
    }
    checkedLessons += 1;
  }
}

console.log(`PASS: 形似字核對 ${checkedLessons} 課、${checkedGroups} 組、${checkedOptions} 個選項；沒有未核准字形混入。`);
