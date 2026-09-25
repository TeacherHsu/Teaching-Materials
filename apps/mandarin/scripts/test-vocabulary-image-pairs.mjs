import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const lessonPath = path.join(here, '..', 'public', 'data', '115AG3H', 'lesson05.json');
const lesson = JSON.parse(fs.readFileSync(lessonPath, 'utf8'));
const words = new Map((lesson.words || []).map((entry) => [entry.word, entry]));

assert.equal(
  path.basename(words.get('夾子')?.image || ''),
  'l05-12.webp',
  '夾子應使用夾子圖片，而不是遮雨圖片',
);
assert.equal(
  path.basename(words.get('遮雨')?.image || ''),
  'l05-11.webp',
  '遮雨應使用雨傘圖片，而不是夾子圖片',
);

console.log('PASS: 第五課「夾子／遮雨」圖片與語詞配對正確。');
