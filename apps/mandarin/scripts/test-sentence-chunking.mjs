import assert from 'node:assert/strict';
import { splitSentenceIntoChunks } from '../src/activities/sentencePractice.js';

const cases = [
  {
    sentence: '妹妹的心情一會兒開心，一會兒難過。',
    required: ['一會兒', '一會兒'],
    forbidden: ['一會', '兒開心', '一會', '兒難過'],
  },
  {
    sentence: '我不只要掃地，還要排椅子。',
    required: ['不只要', '還要', '排椅子。'],
    forbidden: ['不', '只要'],
  },
  {
    sentence: '因為天空下起大雨，所以運動會延期了。',
    required: ['天空下起大雨，', '所以', '延期了。'],
    forbidden: ['天空下', '起', '了。'],
  },
  {
    sentence: '這個書包容量很大，而且背起來不費力。',
    required: ['書包容量很大，', '背起來', '不費力。'],
    forbidden: ['背', '起來', '不費', '力。'],
  },
];

for (const { sentence, required, forbidden } of cases) {
  const chunks = splitSentenceIntoChunks(sentence);
  for (const phrase of required) assert.ok(chunks.includes(phrase), `${sentence} 應保留詞塊「${phrase}」：${JSON.stringify(chunks)}`);
  for (const phrase of forbidden) assert.ok(!chunks.includes(phrase), `${sentence} 不應產生不合理詞塊「${phrase}」：${JSON.stringify(chunks)}`);
  assert.equal(chunks.join(''), sentence, `詞塊重新串接後應等於原句：${sentence}`);
}

console.log('PASS: 句型詞塊保留固定語、助詞與語意單位，不再以每兩字硬切。');
