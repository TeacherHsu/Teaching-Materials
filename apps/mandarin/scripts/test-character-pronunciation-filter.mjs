import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPronunciationQuizItem, selectPronunciationQuizItems } from '../src/activities/pronunciationQuizFilter.js';

const root = fileURLToPath(new URL('../public/data/', import.meta.url));
const makeCharacter = (char, zhuyin = 'ㄉㄞˋ') => ({
  char,
  zhuyin,
  pedia_url: `https://pedia.cloud.edu.tw/Entry/Detail?title=${encodeURIComponent(char)}`,
});
const valid = {
  type: 'choice', status: 'ready', stem: '「待」的注音是？',
  options: ['ㄉㄞˋ', 'ㄌㄨˋ', 'ㄋㄧㄡˊ'], answer: 'ㄉㄞˋ',
};

assert.equal(isPronunciationQuizItem(valid, [makeCharacter('待')]), true);
assert.equal(isPronunciationQuizItem({ ...valid, stem: '「待」的部首是哪一個？' }, [makeCharacter('待')]), false);
assert.equal(isPronunciationQuizItem({ ...valid, answer: 'ㄉㄞ' }, [makeCharacter('待')]), false);
assert.equal(isPronunciationQuizItem({ ...valid, options: ['ㄉㄞˋ', 'ㄉㄞˋ', 'ㄌㄨˋ'] }, [makeCharacter('待')]), false);
assert.equal(isPronunciationQuizItem({ ...valid, options: ['ㄌㄨˋ', 'ㄋㄧㄡˊ', 'ㄔㄨㄢˊ'] }, [makeCharacter('待')]), false);
assert.equal(isPronunciationQuizItem({ ...valid, options: ['ㄉㄞˋ', '字義', 'ㄋㄧㄡˊ'] }, [makeCharacter('待')]), false);
assert.equal(isPronunciationQuizItem(valid, [{ char: '待', zhuyin: 'ㄉㄞˋ' }]), false);

let scannedLessons = 0;
let retainedItems = 0;
for (const volume of readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory() && /^115AG\d/.test(entry.name))) {
  const volumePath = join(root, volume.name);
  for (const filename of readdirSync(volumePath).filter((name) => /^lesson\d+\.json$/.test(name))) {
    const lesson = JSON.parse(readFileSync(join(volumePath, filename), 'utf8'));
    const selected = selectPronunciationQuizItems(lesson.quiz, lesson.characters || []);
    assert.ok(selected.every((item) => isPronunciationQuizItem(item, lesson.characters || [])), `${lesson.lesson_id}: invalid item leaked`);
    retainedItems += selected.length;
    scannedLessons += 1;
  }
}

assert.equal(scannedLessons, 55, 'the audit must cover all published grades and lessons');
assert.ok(retainedItems > 0, 'verified pronunciation questions should remain available');
console.log(`PASS: scanned ${scannedLessons} lessons; retained ${retainedItems} sourced pronunciation questions.`);
