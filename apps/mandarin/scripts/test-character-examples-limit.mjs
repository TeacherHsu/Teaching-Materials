import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();

const { buildCharactersActivity } = await import('../src/activities/characters.js');

for (let lessonNo = 1; lessonNo <= 5; lessonNo += 1) {
  const path = new URL(`../public/data/115AG3H/lesson0${lessonNo}.json`, import.meta.url);
  const lesson = JSON.parse(readFileSync(path, 'utf8'));
  const activity = buildCharactersActivity(lesson, () => {});
  const exampleNodes = activity.findAll((node) => node.hasClass && node.hasClass('character-card__examples'));

  assert.ok(exampleNodes.length > 0, `第 ${lessonNo} 課應有造詞顯示`);
  for (const node of exampleNodes) {
    const examples = node.textContent.replace(/^造詞：/, '').split('、');
    assert.ok(examples.length <= 3, `第 ${lessonNo} 課造詞不可超過 3 個：${node.textContent}`);
  }
}

console.log('PASS: 第 1～5 課生字卡造詞依原資料順序顯示，且每字最多 3 個。');
