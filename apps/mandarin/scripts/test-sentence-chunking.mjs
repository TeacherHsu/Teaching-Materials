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
    required: ['這個書包容量很大，', '背起來', '不費力。'],
    forbidden: ['背', '起來', '不費', '力。'],
  },
  {
    sentence: '他寫作業慢吞吞，媽媽在旁邊等好久。',
    required: ['寫作業', '慢吞吞，'],
    forbidden: ['寫', '作業'],
  },
  {
    sentence: '認真練習後，跑步的時間縮短了不少。',
    required: ['認真練習後，', '跑步的時間'],
    forbidden: ['認真', '練習後，', '跑步的', '時間'],
  },
  {
    sentence: '弟弟一會兒站著，一會兒坐著，靜不下來。',
    required: ['一會兒', '靜不下來。'],
    forbidden: ['一會', '兒站著', '靜', '不下來。'],
  },
  {
    sentence: '這本故事書內容有趣，而且插圖很精美。',
    required: ['這本故事書', '內容有趣，', '插圖很精美。'],
    forbidden: ['故事', '書', '內容', '有趣，'],
  },
  {
    sentence: '因為我提早準備，所以今天沒有遲到。',
    required: ['提早準備，', '今天沒有遲到。'],
    forbidden: ['提早', '準備，', '今天', '沒有', '遲到。'],
  },
  {
    sentence: '服務人員熱情地接待每一位進門的客人。',
    required: ['服務人員', '熱情地', '每一位', '進門的客人。'],
    forbidden: ['進', '門的', '客人。'],
  },
  {
    sentence: '暖暖的被窩裡，弟弟很快睡著了。',
    required: ['暖暖的', '被窩裡，', '很快睡著了。'],
    forbidden: ['暖', '暖的'],
  },
];

for (const { sentence, required, forbidden } of cases) {
  const chunks = splitSentenceIntoChunks(sentence);
  for (const phrase of required) assert.ok(chunks.includes(phrase), `${sentence} 應保留詞塊「${phrase}」：${JSON.stringify(chunks)}`);
  for (const phrase of forbidden) assert.ok(!chunks.includes(phrase), `${sentence} 不應產生不合理詞塊「${phrase}」：${JSON.stringify(chunks)}`);
  assert.equal(chunks.join(''), sentence, `詞塊重新串接後應等於原句：${sentence}`);
}

console.log('PASS: 句型詞塊保留固定語、助詞與語意單位，不再以每兩字硬切。');
