// 驗證生字卡與語詞解釋卡頁面都顯示多音字注音提醒。
import assert from 'node:assert/strict';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const { buildCharactersActivity } = await import('../src/activities/characters.js');
const { buildVocabularyActivity } = await import('../src/activities/vocabulary.js');
const { PRONUNCIATION_NOTICE_TEXT } = await import('../src/components/PronunciationNotice.js');

const charactersRoot = buildCharactersActivity({
  characters: [{ char: '行', radical: '行', stroke_count: 6, examples: ['行走'], status: 'ready' }],
  quiz: [],
  extensions: [],
}, () => {});
const vocabularyRoot = buildVocabularyActivity({
  words: [{ word: '銀行', meaning: '辦理存款、提款等業務的地方。', status: 'ready' }],
}, () => {});

assert.ok(charactersRoot.textContent.includes(PRONUNCIATION_NOTICE_TEXT), '生字卡頁面缺少多音字提醒');
assert.ok(vocabularyRoot.textContent.includes(PRONUNCIATION_NOTICE_TEXT), '語詞解釋卡頁面缺少多音字提醒');

console.log('PASS: 生字卡與語詞解釋卡都顯示「以課本與課文標示為準」的多音字提醒。');
