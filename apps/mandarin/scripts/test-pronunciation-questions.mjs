// 看字選音題由生字資料產生：答案必須在選項內、選項互異且皆為注音。
// 這正是舊 quiz 資料失敗的地方（442 題中 332 題答案不在選項內）。
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPronunciationItems, isQuizzableCharacter } from '../src/activities/pronunciationQuestions.js';

const SINGLE_BOPOMOFO = /^[ㄅ-ㄩ]+[ˊˇˋ˙]?$/u;
const root = fileURLToPath(new URL('../public/data/', import.meta.url));

let items = 0;
const perVolume = {};
for (const volume of readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory() && /^115AG\d/.test(e.name))) {
  perVolume[volume.name] = 0;
  for (const filename of readdirSync(join(root, volume.name)).filter((n) => /^lesson\d+\.json$/.test(n))) {
    const lesson = JSON.parse(readFileSync(join(root, volume.name, filename), 'utf8'));
    const characters = lesson.characters || [];
    const byChar = new Map(characters.map((c) => [c.char, c]));
    for (const item of buildPronunciationItems(characters, characters)) {
      items += 1;
      perVolume[volume.name] += 1;
      assert.ok(item.options.includes(item.answer), `${lesson.lesson_id} ${item.character}: answer must be among the options`);
      assert.equal(item.options.length, 3, `${lesson.lesson_id} ${item.character}: three options`);
      assert.equal(new Set(item.options).size, 3, `${lesson.lesson_id} ${item.character}: options must differ`);
      assert.ok(item.options.every((o) => SINGLE_BOPOMOFO.test(o)), `${lesson.lesson_id} ${item.character}: every option is a reading`);
      assert.equal(item.answer, byChar.get(item.character).zhuyin, `${lesson.lesson_id} ${item.character}: answer comes from the character record`);
      assert.ok(item.explanation.includes(item.answer), `${lesson.lesson_id} ${item.character}: explanation states the reading`);
      assert.ok(item.stem.includes(item.character), `${lesson.lesson_id} ${item.character}: stem names the character`);
    }
  }
}

// 沒有教育百科來源或非單一音節的字不得出題
assert.equal(isQuizzableCharacter({ char: '一', zhuyin: 'ㄧ', pedia_url: '' }), false, 'a reading without a source is not quizzable');
assert.equal(isQuizzableCharacter({ char: '一', zhuyin: 'ㄅㄨˋㄒㄧㄥˊ', pedia_url: 'https://pedia.cloud.edu.tw/Entry/Detail?title=x' }), false, 'multi-syllable readings are not quizzable');

for (const [volume, count] of Object.entries(perVolume)) {
  assert.ok(count > 0, `${volume} must offer pronunciation questions`);
}
console.log(`PASS: ${items} pronunciation questions across ${Object.keys(perVolume).length} volumes — ${JSON.stringify(perVolume)}`);
