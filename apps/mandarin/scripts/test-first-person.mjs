import assert from 'node:assert/strict';
import { operate } from '../src/activities/firstPersonInteraction.js';
import { readFileSync } from 'node:fs';
import { FIRST_PERSON_LESSON as config, getFirstPersonLesson, clueRefs } from '../src/data/firstPersonLesson.js';
import { freshProgress, restoreProgress, canAnswer, answerScene, readProgress, saveProgress } from '../src/activities/firstPersonCore.js';

const lesson = JSON.parse(readFileSync(new URL('../public/data/115AG3H/lesson04.json', import.meta.url), 'utf8'));
assert.equal(getFirstPersonLesson('115AG3H01'), null, '其他課次不開放試作');
assert.equal(config.scenes.length, 4);
assert.equal(config.version, 8);
const covered = new Set();
const distribution = [0, 0, 0];
const state = freshProgress(config);
for (const [index, scene] of config.scenes.entries()) {
  const current = state.scenes[index];
  for (const action of scene.operation.steps) assert.ok(operate(scene, current.operation, action));
  for (const clue of scene.clues) {
    for (const r of clueRefs(clue, scene, lesson)) {
      assert.equal(r.sha.length, r.sentences.length);
      r.sentences.forEach(n => covered.add(`${r.para}:${n}`));
    }
    current.found.push(clue.id);
  }
  assert.ok(canAnswer(scene, current));
  if (scene.stationType === 'story') { assert.equal(scene.questions.length, 0); current.done = true; continue; }
  assert.ok(scene.questions.length === 1);
  for (const q of scene.questions) {
    assert.ok(['擷取', '推論', '詮釋', '統整'].includes(q.pirls));
    assert.equal(q.why.length, q.options.length);
    assert.ok(q.why.every(Boolean));
    assert.equal(q.hints.length, 3);
    assert.ok(q.hints.every(Boolean));
    assert.ok(q.refs.length && q.explanation);
    for (const r of q.refs) assert.equal(r.sha.length, r.sentences.length);
    const sequence = Array.isArray(q.answer);
    if (!sequence) distribution[q.answer]++;
    const bad = sequence ? [...q.answer].reverse() : (q.answer + 1) % q.options.length;
    const oldFound = [...current.found];
    assert.equal(answerScene(scene, current, bad).correct, false);
    assert.deepEqual(current.found, oldFound);
    assert.equal(answerScene(scene, current, q.answer).correct, true);
  }
  assert.ok(current.done);
  assert.equal(answerScene(scene, current, 0), null);
}
assert.ok(state.scenes.every(s => s.done));
assert.equal(covered.size, 45);
// 每段全文站為完整連續索引；正式原文的句數另以本機密碼測試核對。
for (let para = 1; para <= 4; para++) {
 const r = config.scenes.find(s => s.act === para).clues[0].refs[0];
 assert.deepEqual(r.sentences, Array.from({ length: r.sentences.length }, (_, i) => i));
 assert.ok(r.sentences.every(n => covered.has(`${para}:${n}`)));
}
const corrupt = restoreProgress(config, { version: config.version, current: 99, scenes: [{ done: false }, { done: true, found: ['bell', 'wood'] }] });
assert.equal(corrupt.current, 0);
assert.equal(corrupt.scenes[1].done, false, '不信任跳過前關的存檔');
assert.deepEqual(restoreProgress(config, { ...state, version: -1 }), freshProgress(config));
assert.deepEqual(readProgress(config, { getItem() { throw new Error('blocked'); } }), freshProgress(config));
assert.equal(saveProgress(config, state, { setItem() { throw new Error('full'); } }), false);
let stored;
assert.equal(saveProgress(config, state, { setItem(k, v) { stored = v; } }), true);
assert.deepEqual(readProgress(config, { getItem() { return stored; } }), state);
console.log('✅ 第一人稱探索：教材引用、逐題錯因、提示、順序與存檔容錯通過');

// 正式教材只在記憶體解密，不輸出原句或密碼。
const { classroomPassword } = await import('./classroom-password.mjs');
if (!classroomPassword()) console.log('⏭ 缺正式教室密碼：略過逐句全文覆蓋與雜湊核對');
else {
  const { webcrypto, createHash } = await import('node:crypto');
  const { splitSentences } = await import('../src/utils/readingUnits.js');
  const env = JSON.parse(readFileSync(new URL('../public/data/readings.enc.json', import.meta.url)));
  const raw = await webcrypto.subtle.importKey('raw', new TextEncoder().encode(classroomPassword()), 'PBKDF2', false, ['deriveKey']);
  const key = await webcrypto.subtle.deriveKey({ name: 'PBKDF2', salt: Buffer.from(env.salt, 'base64'), iterations: env.iter, hash: 'SHA-256' }, raw, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const readings = JSON.parse(new TextDecoder().decode(await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(env.iv, 'base64') }, key, Buffer.from(env.data, 'base64'))));
  const units = splitSentences(readings[config.lessonId].paras);
  const counts = new Map(), hashes = new Map();
  for (const u of units) {
    const para = u.paraIndex + 1, n = counts.get(para) || 0;
    assert.ok(covered.has(`${para}:${n}`), '正式全文有未經過的句子');
    hashes.set(`${para}:${n}`, createHash('sha256').update(u.text).digest('hex').slice(0, 8)); counts.set(para, n + 1);
  }
  for (const s of config.scenes) {
    const refs = [...s.clues.flatMap(c => clueRefs(c, s, lesson)), ...s.questions.flatMap(q => q.refs), ...(s.act === 4 ? config.idiomRefs : [])];
    for (const r of refs) r.sentences.forEach((n, i) => assert.equal(r.sha[i], hashes.get(`${r.para}:${n}`), '索引或雜湊與正式教材不符'));
  }
  assert.equal(covered.size, units.length);
  console.log(`✅ 正式密文核對：全文 ${units.length} 句均有引用，所有題目依據雜湊一致`);
}
