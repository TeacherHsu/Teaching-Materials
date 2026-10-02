// 「看提示」按鈕：學生不必先答錯，就能逐層要提示。
//
// 背景：提示原本只綁在答錯上。支持層答錯一次就揭曉（零錯誤學習），
// 所以最需要鷹架的學生一層提示都拿不到；標準層答錯兩次揭曉，第 2 層永遠跳過。
import assert from 'node:assert/strict';
import { FakeElement, installFakeDom } from './fake-dom.mjs';

installFakeDom();
document.body = new FakeElement('body');
window.matchMedia = () => ({ matches: true });
// 不先讀 globalThis.localStorage：Node 內建的那個一讀就會印警告
const store = new Map();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
});

const { ChoiceQuiz } = await import('../src/components/ChoiceQuiz.js');
const { startMistakeContext, allMistakes } = await import('../src/utils/mistakes.js');
// 錯題只在有課次脈絡時才收（真實頁面由 ModulePage 開啟），測試要自己開
startMistakeContext('115AG9X01', 'reading');

function find(node, pred) {
  if (pred(node)) return node;
  for (const child of node.children || []) {
    const hit = find(child, pred);
    if (hit) return hit;
  }
  return null;
}
const text = (n) => (n.textContent || '').trim();

const fired = [];
const extra = new FakeElement('div');
extra.hidden = true;
const item = {
  stem: '老朋友用什麼招待詩人？',
  options: ['家常飯菜', '山珍海味', '新鮮水果', '一盆菊花'],
  answer: '家常飯菜',
  extra,
  hints: [
    { text: '第一層：去哪裡找' },
    { text: '第二層：句子線索', on: () => { fired.push(2); extra.hidden = false; } },
    { text: '第三層：螢光筆', on: () => fired.push(3) },
  ],
};

const root = ChoiceQuiz({ items: [item], wrongLimit: 1, onBack() {} });
const hintButton = () => find(root, (n) => String(n.tagName).toLowerCase() === 'button' && /^看提示/.test(text(n)));

assert.ok(hintButton(), '有分層提示的題目要出現「看提示」按鈕');
assert.match(text(hintButton()), /1／3/);

hintButton().dispatch('click');
assert.ok(find(root, (n) => /第一層：去哪裡找/.test(text(n)) ), '第 1 層提示要顯示');
assert.deepEqual(fired, [], '第 1 層只給文字，不開面板');

hintButton().dispatch('click');
assert.deepEqual(fired, [2], '第 2 層要執行動作（打開證據面板）');
assert.equal(extra.hidden, false);

hintButton().dispatch('click');
assert.deepEqual(fired, [2, 3], '第 3 層要畫螢光筆');
assert.equal(hintButton().hidden, true, '三層用完按鈕要收起來');

// 支持層 wrongLimit=1 也不受影響：用完提示再作答，答對但不算第一次就答對
const answer = find(root, (n) => String(n.tagName).toLowerCase() === 'button' && text(n) === '家常飯菜');
answer.dispatch('click');
assert.equal(allMistakes().length, 1, '用過提示才答對，要收進錯題盒之後再練');

// 一般題目（沒有分層提示）不出現這顆按鈕
const plain = ChoiceQuiz({ items: [{ stem: 'x', options: ['a', 'b'], answer: 'a', hints: ['想一想'] }], onBack() {} });
assert.equal(find(plain, (n) => String(n.tagName).toLowerCase() === 'button' && /^看提示/.test(text(n))), null, '一般題目不出現看提示');

console.log('✅ 看提示：三層可主動逐層取用、用完收起、用過提示不算獨立答對、一般題目不受影響');
