import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FIRST_PERSON_LESSON as config, getFirstPersonLesson, clueRefs } from '../src/data/firstPersonLesson.js';
import { freshProgress, restoreProgress, canAnswer, answerScene, readProgress, saveProgress } from '../src/activities/firstPersonCore.js';

const lesson = JSON.parse(readFileSync(new URL('../public/data/115AG3H/lesson04.json', import.meta.url), 'utf8'));
assert.equal(getFirstPersonLesson('115AG3H01'), null, '其他課次不開放試作');
assert.equal(config.scenes.length, 4);
assert.equal(config.scenes[1].question.kind, '理解心情');
assert.ok(config.scenes[1].question.extraEvidence.some((r) => r.para === 2 && r.sentences.includes(5)), '慌張的理解題須有直接描述心情的原句證據');
assert.ok(config.scenes.every((s) => s.experience.action && s.experience.reflection), '每場都要有觀察動作和反思任務');
const state = freshProgress(config);
for (const [index, scene] of config.scenes.entries()) {
  const current = state.scenes[index];
  assert.equal(answerScene(scene, current, scene.question.answer), null, '還沒閱讀不能答題');
  assert.equal(new Set(scene.question.options).size, 3);
  assert.equal(scene.question.why.length, scene.question.options.length);
  assert.equal(scene.question.hints.length, 3);
  for (const clue of scene.clues) {
    const refs = clueRefs(clue, scene, lesson);
    assert.ok(refs.length);
    for (const r of refs) {
      assert.ok(r.para >= 1 && r.para <= 4);
      assert.equal(r.sha.length, r.sentences.length, '每句均有雜湊，避免課文改版畫錯句');
    }
    current.found.push(clue.id);
  }
  assert.ok(canAnswer(scene, current));
  for (let option = 0; option < scene.question.options.length; option++) {
    if (option === scene.question.answer) continue;
    const result = answerScene(scene, current, option);
    assert.equal(result.correct, false);
    assert.ok(result.feedback);
    assert.equal(current.done, false);
    assert.equal(current.found.length, scene.clues.length, '答錯不能重置已讀線索');
  }
  assert.equal(answerScene(scene, current, -1), null);
  assert.equal(answerScene(scene, current, scene.question.answer).correct, true);
  assert.equal(answerScene(scene, current, scene.question.answer), null, '完成後不能重複計答');
}
assert.ok(state.scenes.every((s) => s.done));
const corrupt = restoreProgress(config, { version: config.version, current: 99, scenes: [{ done: false }, { done: true, found: ['pot', 'ladle'] }] });
assert.equal(corrupt.current, 0);
assert.equal(corrupt.scenes[1].done, false, '不信任跳過前關的存檔');
assert.deepEqual(restoreProgress(config, { ...state, version: -1 }), freshProgress(config));
assert.deepEqual(readProgress(config, { getItem() { throw new Error('blocked'); } }), freshProgress(config));
assert.equal(saveProgress(config, state, { setItem() { throw new Error('full'); } }), false);
let stored;
assert.equal(saveProgress(config, state, { setItem(k, v) { stored = v; } }), true);
assert.deepEqual(readProgress(config, { getItem() { return stored; } }), state);
console.log('✅ 第一人稱探索：教材引用、逐題錯因、提示、順序與存檔容錯通過');
