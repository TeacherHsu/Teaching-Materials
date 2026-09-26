import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FakeElement, installFakeDom } from './fake-dom.mjs';

installFakeDom();
document.body = new FakeElement('body');
window.matchMedia = () => ({ matches: true });

const { SentenceOrdering } = await import('../src/components/SentenceOrdering.js');
const styles = readFileSync(new URL('../src/styles/components.css', import.meta.url), 'utf8');
assert.match(
  styles,
  /\.sentence-chip--correct,[\s\S]*?background:\s*#b9e6c8;[\s\S]*?color:\s*#000;[\s\S]*?opacity:\s*1;/u,
  '正確詞塊應是綠底黑字，且不受 disabled 透明度影響',
);
assert.match(
  styles,
  /\.sentence-chip--incorrect\s*\{[\s\S]*?background:\s*#f7c6c2;[\s\S]*?color:\s*#000;/u,
  '錯誤詞塊應是紅底黑字',
);

const ordering = SentenceOrdering({
  prompt: '請把下面的詞語排成一句通順的句子',
  parts: ['甲', '乙', '丙'],
  solution: ['甲', '乙', '丙'],
});

const sentenceChips = () => ordering.findAll(
  (node) => node.tagName === 'button' && node.hasClass('sentence-chip'),
);
const bankChip = (word) => sentenceChips().find(
  (node) => node.textContent === word && node.getAttribute('aria-pressed') === 'false',
);
const checkButton = () => ordering.find(
  (node) => node.tagName === 'button' && node.textContent.trim() === '檢查答案',
);

// 故意排成 乙、甲、丙：只有第 3 個詞塊位置正確。
for (const word of ['乙', '甲', '丙']) {
  const chip = bankChip(word);
  assert.ok(chip, `應找到候選詞塊「${word}」`);
  chip.dispatch('click');
}
checkButton().dispatch('click');

const slots = ordering.find((node) => node.hasClass('sentence-slots'));
assert.ok(slots, '判錯後應保留句子序位區');

const correctChip = slots.find(
  (node) => node.tagName === 'button' && node.textContent === '丙' && node.hasClass('sentence-chip--correct'),
);
assert.ok(correctChip, '位置正確的詞塊應留在原位並套用綠色正確樣式');
assert.equal(correctChip.disabled, true, '位置正確的詞塊應鎖定，避免被再次移動');

const emptyTargets = slots.findAll(
  (node) => node.tagName === 'button' && node.hasClass('sentence-ordering__slot-target'),
);
assert.equal(emptyTargets.length, 2, '錯誤詞塊退回後應留下兩個可放置空位');

const incorrectChips = ordering.findAll(
  (node) => node.tagName === 'button' && node.hasClass('sentence-chip--incorrect'),
);
assert.equal(incorrectChips.length, 2, '只有位置錯誤的兩個詞塊應退回候選區');
for (const chip of incorrectChips) {
  assert.equal(chip.getAttribute('draggable'), 'true', `錯誤詞塊「${chip.textContent}」應可再次拖曳`);
  assert.equal(chip.getAttribute('aria-pressed'), 'false', `錯誤詞塊「${chip.textContent}」應回到候選區`);
}

const status = ordering.find((node) => node.getAttribute('role') === 'status');
assert.match(status.textContent, /退回候選區/u, '判錯提示應說明錯誤詞塊已退回候選區');

// 候選區仍可拖曳回正確序位，確認部分判錯不會迫使學生全部重排。
for (const [word, targetIndex] of [['乙', 1], ['甲', 0]]) {
  const chip = bankChip(word);
  assert.ok(chip, `錯誤詞塊「${word}」應可再次選取或拖曳`);
  const target = slots.find(
    (node) => node.tagName === 'button'
      && node.hasClass('sentence-ordering__slot-target')
      && node.getAttribute('data-slot-index') === String(targetIndex),
  );
  assert.ok(target, `應有第 ${targetIndex + 1} 個可放置空位`);
  chip.dispatch('dragstart');
  target.dispatch('drop');
}
checkButton().dispatch('click');
assert.equal(ordering.find((node) => node.hasClass('sentence-slots')), null, '重新排對後應進入完成畫面');

console.log('PASS: SentenceOrdering 部分判錯、正確詞塊鎖定、錯誤詞塊退回與再次作答契約通過。');
