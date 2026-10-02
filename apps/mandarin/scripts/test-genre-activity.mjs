// 依文體的第三步：說明文分類、詩句解碼。
import assert from 'node:assert/strict';
import { installFakeDom } from './fake-dom.mjs';

installFakeDom();
const { buildClassifyItems, buildDecodePairs } = await import('../src/activities/reading.js');

// 分類：答案一定在選項裡、不在分類裡的細節不出題
const items = buildClassifyItems({
  categories: ['蚊子', '蓮葉', '草原鵰'],
  items: [{ text: '六根小針', answer: '蚊子' }, { text: '亂入', answer: '不存在' }],
}, (a) => a);
assert.equal(items.length, 1, '答案不在分類裡的細節要丟掉');
assert.deepEqual(items[0].options, ['蚊子', '蓮葉', '草原鵰']);
assert.equal(items[0].answer, '蚊子');

// 詩句解碼：從密文取（這裡用假的 resolve），沒標點的詩行之間要留空
const fakeText = { '1:1': '風揚起池水的漣漪', '1:2': '我遇見皺巴巴的自己', '2:2': '故人具雞黍，', '2:3': '邀我至田家。' };
const resolve = (_id, [spot]) => fakeText[`${spot.para}:${spot.sentences[0]}`] || null;
const pairs = buildDecodePairs('X', { pairs: [
  { line: { para: 1, sentences: [1, 2] }, meaning: '倒影歪歪的' },
  { line: { para: 2, sentences: [2, 3] }, meaning: '請我去作客' },
] }, resolve);
assert.equal(pairs[0].left, '風揚起池水的漣漪　我遇見皺巴巴的自己', '現代詩行之間留全形空白');
assert.equal(pairs[1].left, '故人具雞黍，邀我至田家', '有標點就直接接，句尾標點拿掉');

// 沒解鎖（取不到原文）就整組不出，不顯示半套
assert.deepEqual(buildDecodePairs('X', { pairs: [{ line: { para: 9, sentences: [0] }, meaning: 'x' }] }, resolve), []);
console.log('✅ 依文體活動：分類答案必在選項內；詩句解碼詩行分隔正確、沒解鎖就不出現');
