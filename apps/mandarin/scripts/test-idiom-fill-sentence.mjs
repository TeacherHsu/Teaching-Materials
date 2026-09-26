// 驗證「成語填句子」會把點選的成語直接填入句子中的括號。
import assert from 'node:assert/strict';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const { buildIdiomBuilderActivity } = await import('../src/components/IdiomBuilder.js');

const idioms = [
  { id: 'i1', idiom: '滄海桑田', definition: '比喻世事無常，變化很快。' },
  { id: 'i2', idiom: '康莊大道', definition: '比喻平坦寬廣的大路。' },
  { id: 'i3', idiom: '殷鑑不遠', definition: '前人的教訓就在眼前。' },
];
const lesson = {
  lesson_id: 'test-idiom-fill',
  lesson_no: 10,
  volume: { code: '115AG6H' },
  // 不提供 related_char，讓測試直接進入第二關「成語填句子」。
  idioms,
  idiom_sentences: [
    { id: 's1', idiom_id: 'i1', rewritten: '多年後回到故鄉，眼前的變化真是滄海桑田。', status: 'approved' },
    { id: 's2', idiom_id: 'i2', rewritten: '只要肯努力學習，未來就能走上康莊大道。', status: 'approved' },
    { id: 's3', idiom_id: 'i3', rewritten: '那場事故才剛發生，殷鑑不遠，大家應該提高警覺。', status: 'approved' },
  ],
};

const root = buildIdiomBuilderActivity(lesson, () => {});
const sentence = root.find((node) => node.hasClass?.('quiz-stem'));
assert.ok(sentence, '應該顯示成語填句子的句子');
assert.ok(sentence.textContent.includes('（　　）'), '未作答時應顯示句子中的括號空格');
assert.equal(root.find((node) => node.hasClass?.('drag-to-slot__slot-row')), null, '不應再產生句子外的獨立答案框');
assert.equal(
  root.find((node) => node.hasClass?.('drag-to-slot__instruction')).textContent,
  '點選正確成語，會直接填入句中的括號；也可以拖曳到括號。',
  '成語填句子應顯示直接填入句中括號的操作說明',
);

const firstChip = root.findAll((node) => node.hasClass?.('drag-to-slot__option-chip'))
  .find((node) => node.textContent === '滄海桑田');
assert.ok(firstChip, '應該找到「滄海桑田」候選成語');
firstChip.dispatch('click');
assert.ok(sentence.textContent.includes('（滄海桑田）'), '點選成語後應直接填入句子括號');
assert.ok(!sentence.textContent.includes('？'), '句子填空不應顯示問號');

const inlineSlot = root.find((node) => node.hasClass?.('drag-to-slot__inline-slot'));
inlineSlot.dispatch('click');
assert.ok(sentence.textContent.includes('（　　）'), '點一下句中括號應能清除已填入的成語');

console.log('PASS: 成語填句子會把點選成語填入句中括號，不再使用獨立問號答案框。');
